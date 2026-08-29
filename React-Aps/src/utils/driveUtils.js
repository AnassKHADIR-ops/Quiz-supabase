/**
 * Utility functions for Google Drive & Video URLs, thumbnails, embed URLs and preview links.
 */

// Extract Google Drive File ID from various URL formats
export function extractDriveFileId(urlOrId) {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();

  // Pattern 1: /d/{FILE_ID}
  const matchD = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];

  // Pattern 2: ?id={FILE_ID} or &id={FILE_ID}
  const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];

  // Pattern 3: Raw file ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    return str;
  }

  return null;
}

// Generate direct image thumbnail URLs for <img> tags
export function getDriveImageUrls(driveUrlOrId) {
  if (!driveUrlOrId) return [];

  const fileId = extractDriveFileId(driveUrlOrId);
  if (!fileId) return typeof driveUrlOrId === "string" && driveUrlOrId.startsWith("http") ? [driveUrlOrId] : [];

  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w600`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/uc?id=${fileId}`
  ];
}

// Extract YouTube ID from URL, iframe string, or return raw ID
export function extractYouTubeId(urlOrId) {
  if (!urlOrId) return "";
  let str = "";
  if (typeof urlOrId === "object") {
    str = String(
      urlOrId.youtubeId ||
      urlOrId.youtube_id ||
      urlOrId.video ||
      urlOrId.videoUrl ||
      urlOrId.video_url ||
      urlOrId.replayUrl ||
      urlOrId.url ||
      ""
    ).trim();
  } else {
    str = String(urlOrId).trim();
  }

  if (!str) return "";

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  // Extract from iframe src if string is an HTML tag
  const iframeMatch = str.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) str = iframeMatch[1];

  // Match youtube URLs
  const match = str.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : "";
}

// Generate YouTube or Drive video thumbnail
export function getYoutubeThumbnail(urlOrObject) {
  if (!urlOrObject) return null;
  if (typeof urlOrObject === "object") {
    const customThumb =
      urlOrObject.thumbnail ||
      urlOrObject.thumbnailUrl ||
      urlOrObject.thumbnail_url ||
      urlOrObject.cover ||
      urlOrObject.thumb;
    if (customThumb && typeof customThumb === "string" && customThumb.trim() !== "") {
      return customThumb.trim();
    }
  }

  const ytId = extractYouTubeId(urlOrObject);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  const rawUrl = typeof urlOrObject === "object" ? urlOrObject.url || urlOrObject.video || "" : urlOrObject;
  const driveId = extractDriveFileId(rawUrl);
  if (driveId) return `https://lh3.googleusercontent.com/d/${driveId}=w600`;

  return null;
}

// Generate universal embed preview URL for iframes (PDFs & Videos)
export function getEmbedUrl(url, type = "pdf") {
  if (!url) return "about:blank";
  const str = String(url).trim();

  // 1. YouTube to Embed URL
  const ytId = extractYouTubeId(str);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=0`;
  }

  // 2. Google Drive to Preview URL
  const driveId = extractDriveFileId(str);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  return str;
}

// Alias for getEmbedUrl with Drive fallback
export function getDrivePreviewUrl(urlOrId) {
  return getEmbedUrl(urlOrId, "pdf");
}

// Generate direct download URL
export function getDownloadUrl(url) {
  if (!url) return "";
  const driveId = extractDriveFileId(url);
  return driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : url;
}

export function getDriveDownloadUrl(urlOrId) {
  return getDownloadUrl(urlOrId);
}
