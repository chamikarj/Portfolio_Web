import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createYoutubeHandler } from '../lib/youtube.mjs';
import { parseYouTubeFeed } from '../lib/youtube-feed.mjs';

const xml = await readFile(new URL('./fixtures/youtube-feed.xml', import.meta.url), 'utf8');

test('feed parser keeps channel entries ordered newest first', () => {
  const videos = parseYouTubeFeed(xml);
  assert.equal(videos.length, 11);
  assert.equal(videos[0].id, '25hRdX37Kww');
  assert.match(videos[0].title, /Windows 11/);
  for (let index = 1; index < videos.length; index++) {
    assert.ok(Date.parse(videos[index - 1].published) >= Date.parse(videos[index].published));
  }
  assert.throws(() => parseYouTubeFeed('<html>Unavailable</html>'), /Invalid/);
  assert.throws(() => parseYouTubeFeed(xml.replaceAll('UCu3cfIi88PH2qwY4GvOgR4Q', 'UC0000000000000000000000').replaceAll('u3cfIi88PH2qwY4GvOgR4Q', '0000000000000000000000')), /Invalid/);
});

test('concurrent refreshes use one request, then failed refresh keeps last good data', async () => {
  let time = Date.parse('2026-09-30T12:00:00Z');
  let requests = 0;
  let outage = false;
  const handler = createYoutubeHandler({ now: () => time, fetchImpl: async () => {
    requests++;
    if (outage) throw new Error('Unavailable');
    await new Promise(resolve => setTimeout(resolve, 10));
    return new Response(xml);
  } });
  const responses = await Promise.all([handler(), handler(), handler()]);
  const first = await responses[0].json();
  assert.equal(first.stale, false);
  assert.equal(requests, 1);
  assert.deepEqual(await responses[1].json(), first);
  time += 4 * 60 * 1000;
  assert.deepEqual(await (await handler()).json(), first);
  assert.equal(requests, 1);
  time += 2 * 60 * 1000;
  outage = true;
  const fallback = await (await handler()).json();
  assert.deepEqual(fallback.videos, first.videos);
  assert.equal(fallback.fetchedAt, first.fetchedAt);
  assert.equal(fallback.stale, true);
  assert.equal(requests, 2);
});

test('offline first load returns included snapshot', async () => {
  const handler = createYoutubeHandler({ fetchImpl: async () => { throw new Error('Offline'); } });
  const response = await handler();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.stale, true);
  assert.equal(result.videos.length, 11);
  assert.equal(result.videos[0].id, '25hRdX37Kww');
});
