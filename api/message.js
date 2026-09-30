import { POST } from '../lib/message.mjs';

const maxBytes = 6000;
const error = (message, status, extraHeaders = {}) => Response.json({ status: 'error', message }, {
  status, headers: { 'Cache-Control': 'private, no-store', ...extraHeaders },
});

export function createMessageHandler({
  getSecretKey = () => process.env.TURNSTILE_SECRET_KEY || '',
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function message(request) {
    if (request.method !== 'POST') return error('Use POST for this endpoint.', 405, { Allow: 'POST' });
    if (request.headers.get('origin') !== new URL(request.url).origin) {
      return error('Please use the contact form on this site.', 403);
    }
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return error('Please check the form and try again.', 415);
    }
    if (Number(request.headers.get('content-length') || 0) > maxBytes) {
      return error('Your message is too long.', 413);
    }

    const chunks = [];
    let size = 0;
    try {
      if (request.body) {
        const reader = request.body.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > maxBytes) {
              await reader.cancel();
              return error('Your message is too long.', 413);
            }
            chunks.push(Buffer.from(value));
          }
        } finally { reader.releaseLock(); }
      }
    } catch {
      return error('Please check the form and try again.', 400);
    }
    const body = Buffer.concat(chunks);
    const headers = new Headers(request.headers);
    headers.set('content-length', String(body.byteLength));
    headers.delete('transfer-encoding');
    const boundedRequest = new Request(request.url, { method: 'POST', headers, body });
    return POST(boundedRequest, { secretKey: getSecretKey(), fetchImpl });
  };
}

export default { fetch: createMessageHandler() };
