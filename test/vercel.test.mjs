import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import homepageDefault, { createHomepageHandler } from '../api/index.js';
import messageDefault, { createMessageHandler } from '../api/message.js';
import uploadsDefault, { createUploadsHandler } from '../api/youtube.js';

const origin = 'https://custom.example';
const fields = { name: 'Visitor', email: 'visitor@example.net', message: 'A useful opportunity to discuss.', turnstileToken: 'test-token' };
const xml = await readFile(new URL('./fixtures/youtube-feed.xml', import.meta.url), 'utf8');

function request(values = {}, options = {}) {
  return new Request(`${origin}/api/message`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify({ ...fields, ...values }),
  });
}

test('Vercel entrypoints expose standard fetch handlers and include the private template', async () => {
  for (const entry of [homepageDefault, messageDefault, uploadsDefault]) assert.equal(typeof entry.fetch, 'function');
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(config.outputDirectory, 'public');
  assert.ok(config.rewrites.some(r => r.source === '/' && r.destination === '/api/index'));
  await access(new URL(`../${config.functions['api/index.js'].includeFiles}`, import.meta.url));
  await access(new URL(`../${config.functions['api/youtube.js'].includeFiles}`, import.meta.url));
  await assert.rejects(access(new URL('../public/index.html', import.meta.url)));
});

test('homepage injects the public key and supports HEAD with no HTML body', async () => {
  const handler = createHomepageHandler({ getSiteKey: () => 'test-public-key' });
  const response = await handler(new Request(origin));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const html = await response.text();
  assert.match(html, /data-sitekey="test-public-key"/);
  assert.match(html, /Chamika\.rj/);
  assert.doesNotMatch(html, /__TURNSTILE_SITE_KEY__|TURNSTILE_SECRET_KEY/);
  assert.equal((await handler(new Request(origin, { method: 'HEAD' }))).body, null);
  assert.equal((await handler(new Request(origin, { method: 'POST' }))).status, 405);
  const unsafe = createHomepageHandler({ getSiteKey: () => '"><script>bad</script>' });
  assert.match(await (await unsafe(new Request(origin))).text(), /data-sitekey=""/);
});

test('Vercel form verifies the actual custom hostname before submitting all fields', async () => {
  let verificationCalls = 0;
  let formCalls = 0;
  const handler = createMessageHandler({ getSecretKey: () => 'test-private-key', fetchImpl: async (url, options) => {
    if (url.includes('siteverify')) {
      verificationCalls++;
      assert.equal(options.body.get('secret'), 'test-private-key');
      assert.equal(options.body.get('response'), fields.turnstileToken);
      return Response.json({ success: true, action: 'contact_message', hostname: 'custom.example' });
    }
    formCalls++;
    assert.equal(options.body.get('entry.574980307'), fields.name);
    assert.equal(options.body.get('entry.1334678765'), fields.email);
    assert.equal(options.body.get('entry.1588902554'), fields.message);
    return new Response('Your response has been recorded');
  } });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'sent' });
  assert.equal(verificationCalls, 1);
  assert.equal(formCalls, 1);
});

test('invalid Vercel submissions do not call external services', async () => {
  let calls = 0;
  const handler = createMessageHandler({ getSecretKey: () => 'test-private-key', fetchImpl: async () => { calls++; throw new Error('Unexpected'); } });
  assert.equal((await handler(request({}, { headers: { Origin: 'https://other.example' } }))).status, 403);
  assert.equal((await handler(request({ turnstileToken: '' }))).status, 403);
  assert.equal((await handler(request({ email: 'invalid' }))).status, 400);
  assert.equal((await handler(new Request(`${origin}/api/message`))).status, 405);
  const bytes = new TextEncoder().encode(JSON.stringify({ ...fields, message: 'x'.repeat(7000) }));
  const stream = new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } });
  const oversized = new Request(`${origin}/api/message`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: stream, duplex: 'half',
  });
  assert.equal((await handler(oversized)).status, 413);
  assert.equal(calls, 0);
});

test('wrong Turnstile hostname is rejected on a Vercel custom domain', async () => {
  let calls = 0;
  const handler = createMessageHandler({ getSecretKey: () => 'test-private-key', fetchImpl: async url => {
    calls++;
    assert.ok(url.includes('siteverify'));
    return Response.json({ success: true, action: 'contact_message', hostname: 'other.example' });
  } });
  assert.equal((await handler(request())).status, 403);
  assert.equal(calls, 1);
});

test('Vercel uploads function reads the channel feed and keeps the cache', async () => {
  let calls = 0;
  const handler = createUploadsHandler({ fetchImpl: async () => { calls++; return new Response(xml); } });
  const req = new Request(`${origin}/api/youtube`);
  const first = await (await handler(req)).json();
  assert.equal(first.stale, false);
  assert.equal(first.videos.length, 11);
  assert.equal(first.videos[0].id, '25hRdX37Kww');
  assert.deepEqual(await (await handler(req)).json(), first);
  assert.equal(calls, 1);
  assert.equal((await handler(new Request(req.url, { method: 'POST' }))).status, 405);
});

test('Vercel uploads function falls back when YouTube is temporarily unavailable', async () => {
  const handler = createUploadsHandler({ fetchImpl: async () => { throw new Error('Offline'); } });
  const response = await handler(new Request(`${origin}/api/youtube`));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.stale, true);
  assert.equal(body.videos.length, 11);
});
