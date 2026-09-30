import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { POST } from './lib/message.mjs';
import { createYoutubeHandler } from './lib/youtube.mjs';

const publicRoot = path.resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const maxBodyBytes = 6000;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.html': 'text/html; charset=utf-8',
};

function validateOrigin(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('PUBLIC_ORIGIN must be a full URL such as https://your-domain.com'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('PUBLIC_ORIGIN must contain only the scheme and hostname, with an optional port');
  }
  return parsed.origin;
}

async function readBody(req) {
  if (Number(req.headers['content-length'] || 0) > maxBodyBytes) {
    req.resume();
    throw Object.assign(new Error('Your message is too long.'), { status: 413 });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      req.resume();
      throw Object.assign(new Error('Your message is too long.'), { status: 413 });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function sendResponse(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

function sendJson(res, status, data, extraHeaders = {}) {
  const bytes = Buffer.from(JSON.stringify(data));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': bytes.length,
    ...extraHeaders,
  });
  res.end(bytes);
}

export function createSiteServer({
  origin = process.env.PUBLIC_ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
  siteKey = process.env.TURNSTILE_SITE_KEY || '',
  secretKey = process.env.TURNSTILE_SECRET_KEY || '',
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  const publicOrigin = validateOrigin(origin);
  const safeSiteKey = /^[A-Za-z0-9_-]{3,128}$/.test(siteKey) ? siteKey : '';
  const youtube = createYoutubeHandler({ fetchImpl, now });
  const template = readFile(new URL('./lib/homepage.html', import.meta.url), 'utf8');

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    try {
      const target = new URL(req.url || '/', publicOrigin);
      const pathname = target.pathname;
      if (pathname === '/api/message') {
        if (req.method !== 'POST') return sendJson(res, 405, { status: 'error', message: 'Use POST for this endpoint.' }, { Allow: 'POST' });
        const body = await readBody(req);
        const headers = new Headers();
        for (const [name, value] of Object.entries(req.headers)) {
          if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
        headers.delete('transfer-encoding');
        headers.set('content-length', String(body.length));
        const request = new Request(`${publicOrigin}/api/message`, { method: 'POST', headers, body });
        return await sendResponse(res, await POST(request, { secretKey, fetchImpl }));
      }
      if (pathname === '/api/youtube') {
        if (req.method !== 'GET') return sendJson(res, 405, { status: 'error', message: 'Use GET for this endpoint.' }, { Allow: 'GET' });
        return await sendResponse(res, await youtube());
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        return sendJson(res, 405, { status: 'error', message: 'Method not allowed.' }, { Allow: 'GET, HEAD' });
      }
      if (pathname === '/healthz') {
        if (req.method === 'HEAD') { res.writeHead(200); return res.end(); }
        return sendJson(res, 200, { status: 'ok' });
      }
      if (pathname === '/' || pathname === '/index.html') {
        const html = (await template).replaceAll('__TURNSTILE_SITE_KEY__', safeSiteKey);
        res.writeHead(200, {
          'Content-Type': mimeTypes['.html'],
          'Cache-Control': 'no-store',
          'Content-Length': Buffer.byteLength(html),
        });
        return res.end(req.method === 'HEAD' ? undefined : html);
      }

      let decodedPath;
      try { decodedPath = decodeURIComponent(pathname); } catch { return sendJson(res, 400, { status: 'error', message: 'Invalid URL.' }); }
      if (decodedPath.includes('\0') || decodedPath.includes('\\') ||
          decodedPath.split('/').some(part => part.startsWith('.'))) {
        return sendJson(res, 404, { status: 'error', message: 'Not found.' });
      }
      const candidate = path.resolve(publicRoot, `.${decodedPath}`);
      if (!candidate.startsWith(`${publicRoot}${path.sep}`)) return sendJson(res, 404, { status: 'error', message: 'Not found.' });
      let filename;
      let info;
      try {
        filename = await realpath(candidate);
        if (!filename.startsWith(`${publicRoot}${path.sep}`)) throw new Error('Outside public directory');
        info = await stat(filename);
        if (!info.isFile()) throw new Error('Not a file');
      } catch {
        return sendJson(res, 404, { status: 'error', message: 'Not found.' });
      }
      res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': 'public, max-age=3600',
      });
      if (req.method === 'HEAD') return res.end();
      await pipeline(createReadStream(filename), res);
    } catch (error) {
      if (!res.headersSent) sendJson(res, error.status || 500, {
        status: 'error',
        message: error.status ? error.message : 'The server could not complete the request. Please try again later.',
      });
      else res.destroy();
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  const host = process.env.HOST || '0.0.0.0';
  const server = createSiteServer();
  server.listen(port, host, () => console.log(`Chamika rj website listening on port ${port}`));
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => {
      const timer = setTimeout(() => process.exit(1), 10_000);
      timer.unref();
      server.close(() => process.exit(0));
    });
  }
}
