import { readFileSync } from 'node:fs';
import { CHANNEL_ID, parseYouTubeFeed } from './youtube-feed.mjs';

const snapshot = JSON.parse(readFileSync(new URL('./youtube-snapshot.json', import.meta.url), 'utf8'));
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const refreshAfter = 5 * 60 * 1000;
const headers = { 'Cache-Control': 'no-store' };

export function createYoutubeHandler({ fetchImpl = globalThis.fetch, now = Date.now } = {}) {
  let lastGood;
  let pending;

  async function fetchUploads() {
    const response = await fetchImpl(feedUrl, {
      signal: AbortSignal.timeout(8000),
      redirect: 'manual',
    });
    if (!response.ok) throw new Error('YouTube feed unavailable');
    const videos = parseYouTubeFeed(await response.text());
    lastGood = { videos, fetchedAt: new Date(now()).toISOString() };
    return lastGood;
  }

  return async function GET() {
    try {
      if (lastGood && now() - Date.parse(lastGood.fetchedAt) < refreshAfter) {
        return Response.json({ ...lastGood, stale: false }, { headers });
      }
      if (!pending) pending = fetchUploads().finally(() => { pending = undefined; });
      const uploads = await pending;
      return Response.json({ ...uploads, stale: false }, { headers });
    } catch {
      return Response.json({ ...(lastGood ?? snapshot), stale: true }, { headers });
    }
  };
}
