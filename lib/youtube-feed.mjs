export const CHANNEL_ID = "UCu3cfIi88PH2qwY4GvOgR4Q";
function decodeXml(value) {
    const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
        if (!entity.startsWith("#"))
            return entities[entity.toLowerCase()] ?? match;
        const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "\ufffd";
    });
}
function tagValue(xml, tag) {
    const raw = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "";
    const cdata = raw.trim().match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
    return (cdata ? cdata[1] : decodeXml(raw)).trim();
}
// Read only the bounded, documented fields in YouTube's public Atom feed.
export function parseYouTubeFeed(xml) {
    const channelId = tagValue(xml, "yt:channelId");
    if (xml.length > 1_000_000 || !/<feed\b/.test(xml) || !/<\/feed>\s*$/.test(xml) ||
        (channelId !== CHANNEL_ID && channelId !== CHANNEL_ID.slice(2))) {
        throw new Error("Invalid YouTube channel feed");
    }
    const videos = new Map();
    let entries = 0;
    for (const match of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)) {
        entries++;
        const entry = match[1];
        const id = tagValue(entry, "yt:videoId");
        const title = tagValue(entry, "title");
        const published = tagValue(entry, "published");
        const thumbnail = decodeXml(entry.match(/<media:thumbnail\b[^>]*\burl=(["'])(.*?)\1/)?.[2] ?? "");
        if (!/^[\w-]{11}$/.test(id) || !title || title.length > 1000 || !Number.isFinite(Date.parse(published)) ||
            tagValue(entry, "yt:channelId") !== CHANNEL_ID)
            continue;
        let thumbnailUrl;
        try {
            thumbnailUrl = new URL(thumbnail);
        }
        catch {
            continue;
        }
        if (thumbnailUrl.protocol !== "https:" || !/^i\d?\.ytimg\.com$/.test(thumbnailUrl.hostname) ||
            !thumbnailUrl.pathname.startsWith(`/vi/${id}/`))
            continue;
        videos.set(id, { id, title, published, thumbnail: thumbnailUrl.href });
    }
    if (entries && !videos.size)
        throw new Error("No valid channel videos in feed");
    return [...videos.values()].sort((a, b) => Date.parse(b.published) - Date.parse(a.published)).slice(0, 15);
}
