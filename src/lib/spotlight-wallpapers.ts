export interface SpotlightWallpaperItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  thumbnailUrl: string;
  pageUrl: string;
}

const FALLBACK_SPOTLIGHT_ITEMS: SpotlightWallpaperItem[] = [
  {
    id: "42377",
    title: "Larrybane Quarry on the Antrim County coastline, Causeway Coast, Northern Ireland, UK",
    date: "2026-11-21",
    imageUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/cd1c7235eb2abeed54f1175115966672.jpg",
    thumbnailUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/cd1c7235eb2abeed54f1175115966672-1024x576.jpg",
    pageUrl: "https://windows10spotlight.com/images/42377",
  },
  {
    id: "42372",
    title: "Two gray seals showing their affection, Helgoland, Schleswig-Holstein, Germany",
    date: "2026-11-20",
    imageUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/5139ddf2fe7fa523bfc021f6be1538e5.jpg",
    thumbnailUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/5139ddf2fe7fa523bfc021f6be1538e5-1024x576.jpg",
    pageUrl: "https://windows10spotlight.com/images/42372",
  },
  {
    id: "42368",
    title: "Autumn forest lake reflections in the morning mist",
    date: "2026-11-19",
    imageUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/71d45ae5b5f6f52ccc7e2e193eec2b09.jpg",
    thumbnailUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/71d45ae5b5f6f52ccc7e2e193eec2b09-1024x576.jpg",
    pageUrl: "https://windows10spotlight.com/images/42368",
  },
  {
    id: "42364",
    title: "Golden hour mountain ridge above the clouds",
    date: "2026-11-18",
    imageUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/f10d145aa013023de5e43db3c841a38a.jpg",
    thumbnailUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/f10d145aa013023de5e43db3c841a38a-1024x576.jpg",
    pageUrl: "https://windows10spotlight.com/images/42364",
  },
  {
    id: "42360",
    title: "Coastal sea stacks at twilight",
    date: "2026-11-17",
    imageUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/6236f149872175992448ee58058ca305.jpg",
    thumbnailUrl:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/6236f149872175992448ee58058ca305-1024x576.jpg",
    pageUrl: "https://windows10spotlight.com/images/42360",
  },
];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&#8217;/g, "'")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#(\d+);/g, (_m, dec: string) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .trim();
}

function toFullResolutionUrl(rawUrl: string): string {
  return rawUrl.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp)$)/i, "");
}

function parseSpotlightArticles(html: string): SpotlightWallpaperItem[] {
  const results: SpotlightWallpaperItem[] = [];
  const seen = new Set<string>();
  const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;

  let match: RegExpExecArray | null;
  while ((match = articleRegex.exec(html)) !== null) {
    const block = match[1] ?? "";
    const pageMatch = /href="(https:\/\/windows10spotlight\.com\/images\/(\d+)[^"]*)"/i.exec(block);
    const titleMatch = /<span[^>]*class="[^"]*entry-title[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(
      block,
    );
    const dateMatch = /<span[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block);
    const srcsetMatch = /srcset="([^"]+)"/i.exec(block);
    const srcMatch = /src="(https:\/\/windows10spotlight\.com\/wp-content\/uploads\/[^"]+)"/i.exec(
      block,
    );

    let bestImageUrl = "";
    let thumbnailUrl = srcMatch?.[1] ?? "";

    if (srcsetMatch?.[1]) {
      const candidates = srcsetMatch[1]
        .split(",")
        .map((part) => part.trim().split(/\s+/))
        .filter((parts) => parts[0]?.startsWith("https://windows10spotlight.com/wp-content/"));

      let bestWidth = -1;
      for (const [url, widthToken] of candidates) {
        if (!url) continue;
        const w = widthToken ? parseInt(widthToken.replace(/\D/g, ""), 10) : 0;
        if (w >= bestWidth) {
          bestWidth = w;
          bestImageUrl = url;
        }
        if (w >= 900 && w <= 1200 && !thumbnailUrl) {
          thumbnailUrl = url;
        }
      }
    }

    if (!bestImageUrl && thumbnailUrl) {
      bestImageUrl = toFullResolutionUrl(thumbnailUrl);
    }
    if (!bestImageUrl || /spotlight\.(png|webp)$/i.test(bestImageUrl)) {
      continue;
    }

    const fullImage = toFullResolutionUrl(bestImageUrl);
    if (seen.has(fullImage)) continue;
    seen.add(fullImage);

    const id = pageMatch?.[2] || String(results.length + 1);
    const title = titleMatch?.[1]
      ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, ""))
      : "Windows Spotlight";
    const date = dateMatch?.[1] ? decodeHtmlEntities(dateMatch[1].replace(/<[^>]+>/g, "")) : "";
    const pageUrl = pageMatch?.[1] || "https://windows10spotlight.com/";

    results.push({
      id,
      title: title || "Windows Spotlight",
      date,
      imageUrl: fullImage,
      thumbnailUrl: thumbnailUrl || fullImage,
      pageUrl,
    });
  }

  return results;
}

async function fetchSpotlightPage(pageUrl: string): Promise<SpotlightWallpaperItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseSpotlightArticles(html);
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

let cachedItems: SpotlightWallpaperItem[] = [];
let cachedAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getSpotlightWallpapers(forceRefresh = false): Promise<{
  items: SpotlightWallpaperItem[];
  fetchedAt: number;
  source: string;
}> {
  const now = Date.now();
  if (!forceRefresh && cachedItems.length > 0 && now - cachedAt < CACHE_TTL_MS) {
    return {
      items: cachedItems,
      fetchedAt: cachedAt,
      source: "windows10spotlight.com",
    };
  }

  const pageUrls = ["https://windows10spotlight.com/", "https://windows10spotlight.com/page/2"];
  if (forceRefresh) {
    const randomPage = 2 + Math.floor(Math.random() * 12);
    pageUrls.push(`https://windows10spotlight.com/page/${randomPage}`);
  }

  const pageResults = await Promise.all(pageUrls.map((url) => fetchSpotlightPage(url)));
  const merged: SpotlightWallpaperItem[] = [];
  const seen = new Set<string>();

  for (const list of pageResults) {
    for (const item of list) {
      if (!seen.has(item.imageUrl)) {
        seen.add(item.imageUrl);
        merged.push(item);
      }
    }
  }

  if (merged.length > 0) {
    cachedItems = merged;
    cachedAt = now;
    return {
      items: merged,
      fetchedAt: now,
      source: "windows10spotlight.com",
    };
  }

  if (cachedItems.length > 0) {
    return {
      items: cachedItems,
      fetchedAt: cachedAt,
      source: "windows10spotlight.com",
    };
  }

  return {
    items: FALLBACK_SPOTLIGHT_ITEMS,
    fetchedAt: now,
    source: "windows10spotlight.com",
  };
}
