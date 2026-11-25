import { useEffect, useSyncExternalStore } from "react";

export type SpotlightInterval = "1m" | "5m" | "10m" | "30m" | "1h" | "1d";
export type SpotlightTarget = "desktop" | "lock" | "both";

export interface SpotlightPhoto {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  thumbnailUrl: string;
  pageUrl: string;
}

export const SPOTLIGHT_INTERVAL_OPTIONS: {
  value: SpotlightInterval;
  label: string;
  ms: number;
}[] = [
  { value: "1m", label: "1 minute", ms: 60_000 },
  { value: "5m", label: "5 minutes", ms: 5 * 60_000 },
  { value: "10m", label: "10 minutes", ms: 10 * 60_000 },
  { value: "30m", label: "30 minutes", ms: 30 * 60_000 },
  { value: "1h", label: "1 hour", ms: 60 * 60_000 },
  { value: "1d", label: "1 day", ms: 24 * 60 * 60_000 },
];

export const SPOTLIGHT_TARGET_OPTIONS: {
  value: SpotlightTarget;
  label: string;
  description: string;
}[] = [
  {
    value: "desktop",
    label: "Desktop Wallpaper",
    description: "Rotate Spotlight photos on the desktop background only",
  },
  {
    value: "lock",
    label: "Lock Wallpaper",
    description: "Rotate Spotlight photos on the lock screen only",
  },
  {
    value: "both",
    label: "Both",
    description: "Rotate Spotlight photos on both desktop and lock screen",
  },
];

const DEFAULT_SPOTLIGHT_PHOTOS: SpotlightPhoto[] = [
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

interface SpotlightStoreState {
  photos: SpotlightPhoto[];
  currentIndex: number;
  lastRotatedAt: number;
  lastFetchedAt: number;
  isFetching: boolean;
}

const STORAGE_KEY = "sparkle_spotlight_collection_v1";
const FETCH_TTL_MS = 15 * 60 * 1000;

function readInitialState(): SpotlightStoreState {
  const now = Date.now();
  if (typeof window === "undefined") {
    return {
      photos: DEFAULT_SPOTLIGHT_PHOTOS,
      currentIndex: 0,
      lastRotatedAt: now,
      lastFetchedAt: 0,
      isFetching: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SpotlightStoreState>;
      const validPhotos = Array.isArray(parsed.photos)
        ? parsed.photos.filter((p): p is SpotlightPhoto =>
            Boolean(p && typeof p.imageUrl === "string" && p.imageUrl.startsWith("http")),
          )
        : [];
      const photos = validPhotos.length > 0 ? validPhotos : DEFAULT_SPOTLIGHT_PHOTOS;
      const idx =
        typeof parsed.currentIndex === "number" &&
        parsed.currentIndex >= 0 &&
        parsed.currentIndex < photos.length
          ? parsed.currentIndex
          : 0;
      return {
        photos,
        currentIndex: idx,
        lastRotatedAt: typeof parsed.lastRotatedAt === "number" ? parsed.lastRotatedAt : now,
        lastFetchedAt: typeof parsed.lastFetchedAt === "number" ? parsed.lastFetchedAt : 0,
        isFetching: false,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    photos: DEFAULT_SPOTLIGHT_PHOTOS,
    currentIndex: 0,
    lastRotatedAt: now,
    lastFetchedAt: 0,
    isFetching: false,
  };
}

let storeState: SpotlightStoreState = readInitialState();
const subscribers = new Set<() => void>();
let inFlightFetch: Promise<void> | null = null;

function persistStore() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        photos: storeState.photos,
        currentIndex: storeState.currentIndex,
        lastRotatedAt: storeState.lastRotatedAt,
        lastFetchedAt: storeState.lastFetchedAt,
      }),
    );
  } catch {
    // ignore quota errors
  }
}

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error(err);
    }
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sparkle:spotlight-updated"));
  }
}

function preloadImage(url: string) {
  if (typeof window === "undefined" || !url) return;
  try {
    const img = new window.Image();
    img.src = url;
  } catch {
    // ignore
  }
}

export function getSpotlightIntervalMs(interval?: SpotlightInterval | string): number {
  const match = SPOTLIGHT_INTERVAL_OPTIONS.find((opt) => opt.value === interval);
  return match ? match.ms : 60_000;
}

export function normalizeSpotlightInterval(value: unknown): SpotlightInterval {
  if (
    value === "1m" ||
    value === "5m" ||
    value === "10m" ||
    value === "30m" ||
    value === "1h" ||
    value === "1d"
  ) {
    return value;
  }
  return "1m";
}

export function normalizeSpotlightTarget(value: unknown): SpotlightTarget {
  if (value === "desktop" || value === "lock" || value === "both") {
    return value;
  }
  return "both";
}

export function getCurrentSpotlightPhoto(): SpotlightPhoto {
  const photos = storeState.photos.length > 0 ? storeState.photos : DEFAULT_SPOTLIGHT_PHOTOS;
  return photos[storeState.currentIndex % photos.length] ?? DEFAULT_SPOTLIGHT_PHOTOS[0]!;
}

export function getSpotlightSnapshot(): SpotlightStoreState {
  return storeState;
}

export async function ensureSpotlightLoaded(forceRefresh = false): Promise<void> {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (
    !forceRefresh &&
    storeState.lastFetchedAt > 0 &&
    now - storeState.lastFetchedAt < FETCH_TTL_MS &&
    storeState.photos.length > 5
  ) {
    return;
  }
  if (inFlightFetch) return inFlightFetch;

  storeState = { ...storeState, isFetching: true };
  notifySubscribers();

  inFlightFetch = (async () => {
    try {
      const endpoint = forceRefresh
        ? "/api/spotlight-wallpapers?refresh=1"
        : "/api/spotlight-wallpapers";
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const data = (await res.json()) as { items?: unknown };
      if (!Array.isArray(data.items)) return;

      const parsed = data.items.filter((item): item is SpotlightPhoto =>
        Boolean(
          item &&
          typeof item === "object" &&
          typeof (item as SpotlightPhoto).imageUrl === "string" &&
          (item as SpotlightPhoto).imageUrl.startsWith("http"),
        ),
      );
      if (parsed.length === 0) return;

      const currentUrl = getCurrentSpotlightPhoto().imageUrl;
      const existingIdx = parsed.findIndex((p) => p.imageUrl === currentUrl);
      const nextIdx = existingIdx >= 0 ? existingIdx : storeState.currentIndex % parsed.length;

      storeState = {
        photos: parsed,
        currentIndex: nextIdx,
        lastRotatedAt: storeState.lastRotatedAt,
        lastFetchedAt: Date.now(),
        isFetching: false,
      };
      persistStore();
      preloadImage(getCurrentSpotlightPhoto().imageUrl);
      const upcoming = parsed[(nextIdx + 1) % parsed.length];
      if (upcoming) preloadImage(upcoming.imageUrl);
    } catch {
      // keep existing/fallback photos on network failure
    } finally {
      if (storeState.isFetching) {
        storeState = { ...storeState, isFetching: false };
      }
      inFlightFetch = null;
      notifySubscribers();
    }
  })();

  return inFlightFetch;
}

export function rotateSpotlightPhoto(preferredIndex?: number): SpotlightPhoto {
  const photos = storeState.photos.length > 0 ? storeState.photos : DEFAULT_SPOTLIGHT_PHOTOS;
  let nextIndex: number;

  if (typeof preferredIndex === "number" && preferredIndex >= 0 && preferredIndex < photos.length) {
    nextIndex = preferredIndex;
  } else if (photos.length <= 1) {
    nextIndex = 0;
  } else {
    nextIndex = (storeState.currentIndex + 1) % photos.length;
  }

  storeState = {
    ...storeState,
    photos,
    currentIndex: nextIndex,
    lastRotatedAt: Date.now(),
  };
  persistStore();
  const chosen = getCurrentSpotlightPhoto();
  preloadImage(chosen.imageUrl);
  const upcoming = photos[(nextIndex + 1) % photos.length];
  if (upcoming) preloadImage(upcoming.imageUrl);
  notifySubscribers();
  return chosen;
}

export function selectSpotlightPhotoById(photoId: string): SpotlightPhoto {
  const photos = storeState.photos.length > 0 ? storeState.photos : DEFAULT_SPOTLIGHT_PHOTOS;
  const idx = photos.findIndex((p) => p.id === photoId);
  return rotateSpotlightPhoto(idx >= 0 ? idx : undefined);
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      storeState = readInitialState();
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useSpotlightCollection() {
  const state = useSyncExternalStore(subscribe, getSpotlightSnapshot, getSpotlightSnapshot);
  const currentPhoto =
    state.photos[state.currentIndex % Math.max(1, state.photos.length)] ??
    DEFAULT_SPOTLIGHT_PHOTOS[0]!;

  return {
    photos: state.photos,
    currentIndex: state.currentIndex,
    currentPhoto,
    lastRotatedAt: state.lastRotatedAt,
    isFetching: state.isFetching,
    ensureLoaded: ensureSpotlightLoaded,
    rotateNext: () => rotateSpotlightPhoto(),
    selectPhoto: selectSpotlightPhotoById,
  };
}

export function useSpotlightScheduler(isActive: boolean, interval: SpotlightInterval = "1m") {
  const { lastRotatedAt } = useSpotlightCollection();

  useEffect(() => {
    if (!isActive) return;
    void ensureSpotlightLoaded(false);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const intervalMs = getSpotlightIntervalMs(interval);
    const elapsed = Date.now() - lastRotatedAt;
    if (elapsed >= intervalMs) {
      rotateSpotlightPhoto();
      return;
    }

    const delay = Math.max(1000, intervalMs - elapsed);
    const timer = window.setTimeout(() => {
      rotateSpotlightPhoto();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isActive, interval, lastRotatedAt]);
}
