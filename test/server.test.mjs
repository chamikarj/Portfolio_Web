import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createSiteServer } from '../local-server.mjs';

const origin = 'https://portfolio.example';
const siteKey = 'test-public-key';
const secretKey = 'test-private-key';
const xml = await readFile(new URL('./fixtures/youtube-feed.xml', import.meta.url), 'utf8');
const data = { name: 'Test Visitor', email: 'visitor@example.net', message: 'A useful test message.', turnstileToken: 'test-token' };

async function start(t, fetchImpl, overrides = {}) {
  const server = createSiteServer({ origin, siteKey, secretKey, fetchImpl, ...overrides });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

function rawRequest(base, urlPath, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const url = new URL(base);
    const request = http.request({
      hostname: url.hostname,
      port: url.port,
      path: urlPath,
      method,
      headers: body ? { Origin: origin, 'Content-Type': 'application/json' } : {},
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    request.on('error', reject);
    request.end(body);
  });
}

function message(base, overrides = {}, originHeader = origin) {
  return fetch(`${base}/api/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: originHeader },
    body: JSON.stringify({ ...data, ...overrides }),
  });
}

test('standalone page serves every local image, stylesheet and script', async t => {
  const base = await start(t, async () => { throw new Error('Unexpected upstream request'); });
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  const html = await response.text();
  assert.match(html, /data-sitekey="test-public-key"/);
  assert.doesNotMatch(html, /__TURNSTILE_SITE_KEY__|_next|test-private-key/);
  assert.match(html, /© 2026 Chamika\.rj/);
  const localAssets = new Set([...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map(match => match[1]).filter(value => !value.startsWith('http')));
  assert.ok(localAssets.size >= 14);
  for (const asset of localAssets) {
    const resource = await fetch(new URL(asset, `${base}/`));
    assert.equal(resource.status, 200, asset);
    assert.ok(Number(resource.headers.get('content-length')) > 0, asset);
    await resource.arrayBuffer();
  }
  const head = await fetch(`${base}/portrait-cutout.png`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  assert.ok(Number(head.headers.get('content-length')) > 10000);
});

test('configuration is injected safely; server files are not public', async t => {
  const base = await start(t, async () => { throw new Error('Unexpected upstream request'); }, { siteKey: '"><script>bad</script>' });
  const html = await (await fetch(base)).text();
  assert.match(html, /data-sitekey=""/);
  assert.doesNotMatch(html, /<script>bad/);
  for (const pathname of ['/.env', '/.env.example', '/server.mjs', '/lib/message.mjs', '/package.json', '/%2e%2e%2f.env', '/%2eenv', '/%5c..%5c.env']) {
    const response = await rawRequest(base, pathname);
    assert.equal(response.status, 404, pathname);
    assert.doesNotMatch(response.body, /test-private-key/);
  }
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.equal((await fetch(`${base}/api/message`)).status, 405);
  assert.equal((await fetch(`${base}/api/youtube`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/missing`)).status, 404);
});

test('invalid form requests never reach verification or Google', async t => {
  let requests = 0;
  const base = await start(t, async () => { requests++; throw new Error('Unexpected upstream request'); });
  assert.equal((await message(base, {}, 'https://other.example')).status, 403);
  assert.equal((await message(base, { turnstileToken: '' })).status, 403);
  assert.equal((await message(base, { email: 'invalid' })).status, 400);
  assert.equal((await message(base, { message: 'short' })).status, 400);
  const invalidJson = await fetch(`${base}/api/message`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(invalidJson.status, 400);
  const contentType = await fetch(`${base}/api/message`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'text/plain' }, body: '{}',
  });
  assert.equal(contentType.status, 415);
  const large = await rawRequest(base, '/api/message', 'POST', JSON.stringify({ ...data, message: 'x'.repeat(7000) }));
  assert.equal(large.status, 413);
  assert.equal(requests, 0);
});

test('missing server secret disables submission', async t => {
  let requests = 0;
  const base = await start(t, async () => { requests++; }, { secretKey: '' });
  assert.equal((await message(base)).status, 503);
  assert.equal(requests, 0);
});

test('failed verification, wrong action or hostname prevents Google submission', async t => {
  let result = { success: false, action: 'contact_message', hostname: 'portfolio.example' };
  let requests = 0;
  const base = await start(t, async (url, options) => {
    requests++;
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(options.body.get('secret'), secretKey);
    assert.equal(options.body.get('response'), 'test-token');
    return Response.json(result);
  });
  assert.equal((await message(base)).status, 403);
  result = { success: true, action: 'other', hostname: 'portfolio.example' };
  assert.equal((await message(base)).status, 403);
  result = { success: true, action: 'contact_message', hostname: 'other.example' };
  assert.equal((await message(base)).status, 403);
  assert.equal(requests, 3);
});

test('verified form maps all three fields and confirms delivery', async t => {
  const calls = [];
  const base = await start(t, async (url, options) => {
    calls.push({ url, options });
    if (url.includes('siteverify')) return Response.json({ success: true, action: 'contact_message', hostname: 'portfolio.example' });
    assert.equal(url, 'https://docs.google.com/forms/d/e/1FAIpQLSdkFOkY9ZJxecKDsEwKtx6etwk7qfvrall_nb6pefGxyCmdeQ/formResponse');
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('entry.574980307'), data.name);
    assert.equal(options.body.get('entry.1334678765'), data.email);
    assert.equal(options.body.get('entry.1588902554'), data.message);
    return new Response('<html>Your response has been recorded</html>');
  });
  const response = await message(base);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'sent' });
  assert.equal(calls.length, 2);
});

test('verification outages and unconfirmed Google delivery are not reported as sent', async t => {
  let outage = true;
  const base = await start(t, async url => {
    if (url.includes('siteverify')) {
      if (outage) throw new Error('Unavailable');
      return Response.json({ success: true, action: 'contact_message', hostname: 'portfolio.example' });
    }
    return new Response('<html>Form unavailable</html>');
  });
  assert.equal((await message(base)).status, 502);
  outage = false;
  const response = await message(base);
  assert.equal(response.status, 502);
  assert.equal((await response.json()).status, 'error');
});

test('YouTube endpoint returns current feed and reuses the server cache', async t => {
  let requests = 0;
  const base = await start(t, async url => {
    requests++;
    assert.equal(url, 'https://www.youtube.com/feeds/videos.xml?channel_id=UCu3cfIi88PH2qwY4GvOgR4Q');
    return new Response(xml);
  });
  const first = await (await fetch(`${base}/api/youtube`)).json();
  assert.equal(first.videos.length, 11);
  assert.equal(first.videos[0].id, '25hRdX37Kww');
  assert.equal(first.stale, false);
  const second = await (await fetch(`${base}/api/youtube`)).json();
  assert.deepEqual(second, first);
  assert.equal(requests, 1);
});

test('invalid public origin is rejected on startup', () => {
  for (const invalid of ['bad', 'https://portfolio.example/path', 'https://user:pass@portfolio.example', 'ftp://portfolio.example']) {
    assert.throws(() => createSiteServer({ origin: invalid }), /PUBLIC_ORIGIN/);
  }
});
