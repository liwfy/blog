const RELATIVE_UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

function formatCount(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
}

function renderChannel(data) {
  const { channel, updatedAt } = data;

  if (channel.banner) {
    document.getElementById("banner").style.backgroundImage = `url("${channel.banner}")`;
  }
  if (channel.avatar) {
    document.getElementById("avatar").src = channel.avatar;
  }

  const subs = formatCount(channel.subscriberCount);
  const metaParts = [channel.handle];
  if (subs) metaParts.push(`${subs} subscribers`);
  if (channel.videoCount) metaParts.push(`${channel.videoCount} videos`);
  document.getElementById("channelMeta").textContent = metaParts.join(" · ");

  if (channel.description) {
    document.getElementById("channelDescription").textContent = channel.description;
  }

  if (updatedAt) {
    document.getElementById("updatedAt").textContent = `Last synced ${timeAgo(updatedAt)}`;
  }
}

function renderVideos(videos) {
  const grid = document.getElementById("videoGrid");
  if (!videos || videos.length === 0) return;

  grid.innerHTML = "";
  for (const video of videos) {
    const card = document.createElement("a");
    card.className = "video-card";
    card.href = `https://www.youtube.com/watch?v=${video.id}`;
    card.target = "_blank";
    card.rel = "noopener";

    card.innerHTML = `
      <div class="video-card__thumb">
        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" />
        ${video.duration ? `<span class="video-card__duration">${video.duration}</span>` : ""}
      </div>
      <p class="video-card__title">${video.title}</p>
      <p class="video-card__sub">${timeAgo(video.publishedAt)}</p>
    `;

    grid.appendChild(card);
  }
}

async function init() {
  try {
    const res = await fetch(`data/channel.json?t=${Date.now()}`);
    const data = await res.json();
    renderChannel(data);
    renderVideos(data.videos);
  } catch (err) {
    console.error("Failed to load channel data", err);
  }
}

init();
setInterval(init, 30 * 60 * 1000);
