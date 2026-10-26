import snapshot from "@/lib/youtube-snapshot.json";
import { CHANNEL_ID, parseYouTubeFeed, type ChannelVideo } from "@/lib/youtube-feed";

export const dynamic = "force-dynamic";

type Uploads = { videos: ChannelVideo[]; fetchedAt: string };
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const refreshAfter = 5 * 60 * 1000;
const headers = { "Cache-Control": "no-store" };
let lastGood: Uploads | undefined;
let pending: Promise<Uploads> | undefined;

async function fetchUploads(): Promise<Uploads> {
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/atom+xml, application/xml" },
    signal: AbortSignal.timeout(8000),
    redirect: "manual",
  });
  if (!response.ok) throw new Error(`YouTube feed unavailable (${response.status})`);
  const videos = parseYouTubeFeed(await response.text());
  lastGood = { videos, fetchedAt: new Date().toISOString() };
  return lastGood;
}

export async function GET() {
  try {
    if (lastGood && Date.now() - Date.parse(lastGood.fetchedAt) < refreshAfter) {
      return Response.json({ ...lastGood, stale: false }, { headers });
    }
    if (!pending) pending = fetchUploads().finally(() => { pending = undefined; });
    const uploads = await pending;
    return Response.json({ ...uploads, stale: false }, { headers });
  } catch (error) {
    console.warn("YouTube uploads could not refresh:", error instanceof Error ? error.message : "Unknown feed error");
    return Response.json({ ...(lastGood ?? snapshot), stale: true }, { headers });
  }
}
