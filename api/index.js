import { readFile } from 'node:fs/promises';

const template = readFile(new URL('../lib/homepage.html', import.meta.url), 'utf8');

export function createHomepageHandler({ getSiteKey = () => process.env.TURNSTILE_SITE_KEY || '' } = {}) {
  return async function homepage(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const key = getSiteKey();
    const safeKey = /^[A-Za-z0-9_-]{3,128}$/.test(key) ? key : '';
    const html = (await template).replaceAll('__TURNSTILE_SITE_KEY__', safeKey);
    return new Response(request.method === 'HEAD' ? null : html, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    } });
  };
}

export default { fetch: createHomepageHandler() };
