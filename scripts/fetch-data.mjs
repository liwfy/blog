import { writeFile } from "node:fs/promises";

const API_KEY = process.env.YT_API_KEY;
const HANDLE = process.env.CHANNEL_HANDLE || "lienxt";
const MAX_VIDEOS = 6;

if (!API_KEY) {
  console.error("Missing YT_API_KEY environment variable");
  process.exit(1);
}

function fmtDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  const parts = [];
  if (h) parts.push(h);
  parts.push(h ? String(m).padStart(2, "0") : String(m));
  parts.push(String(s).padStart(2, "0"));
  return parts.join(":");
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function main() {
  const channelUrl =
    `https://www.googleapis.com/youtube/v3/channels` +
    `?part=snippet,statistics,brandingSettings,contentDetails` +
    `&forHandle=${encodeURIComponent(HANDLE)}` +
    `&key=${API_KEY}`;

  const channelData = await getJson(channelUrl);
  const channel = channelData.items && channelData.items[0];

  if (!channel) {
    throw new Error(`No channel found for handle ${HANDLE}`);
  }

  const uploadsPlaylistId =
    channel.contentDetails.relatedPlaylists.uploads;

  const playlistUrl =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?part=snippet,contentDetails` +
    `&maxResults=${MAX_VIDEOS}` +
    `&playlistId=${uploadsPlaylistId}` +
    `&key=${API_KEY}`;

  const playlistData = await getJson(playlistUrl);
  const videoIds = playlistData.items
    .map((item) => item.contentDetails.videoId)
    .join(",");

  let durationById = {};
  if (videoIds) {
    const videosUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=contentDetails,statistics` +
      `&id=${videoIds}` +
      `&key=${API_KEY}`;
    const videosData = await getJson(videosUrl);
    durationById = Object.fromEntries(
      videosData.items.map((v) => [
        v.id,
        {
          duration: fmtDuration(v.contentDetails.duration),
          viewCount: v.statistics?.viewCount || "0",
        },
      ])
    );
  }

  const videos = playlistData.items.map((item) => {
    const id = item.contentDetails.videoId;
    const thumbs = item.snippet.thumbnails;
    const thumbnail =
      thumbs.maxres?.url ||
      thumbs.high?.url ||
      thumbs.medium?.url ||
      thumbs.default?.url;
    return {
      id,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail,
      duration: durationById[id]?.duration || "",
      viewCount: durationById[id]?.viewCount || "0",
    };
  });

  const output = {
    updatedAt: new Date().toISOString(),
    channel: {
      id: channel.id,
      handle: `@${HANDLE}`,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: channel.statistics.hiddenSubscriberCount
        ? null
        : channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount,
      avatar:
        channel.snippet.thumbnails?.high?.url ||
        channel.snippet.thumbnails?.default?.url ||
        "",
      banner: channel.brandingSettings?.image?.bannerExternalUrl
        ? `${channel.brandingSettings.image.bannerExternalUrl}=w1600`
        : "",
    },
    videos,
  };

  await writeFile(
    new URL("../data/channel.json", import.meta.url),
    JSON.stringify(output, null, 2)
  );

  console.log(`Wrote ${videos.length} videos for ${output.channel.title}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
