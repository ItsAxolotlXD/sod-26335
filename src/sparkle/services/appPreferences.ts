import { useSyncExternalStore } from "react";

export interface AppPreferences {
  home: {
    showHeroCarousel: boolean;
    showGreeting: boolean;
    showRecommended: boolean;
    showQuickAccess: boolean;
    showRecentNote: boolean;
  };
  watch: {
    showCategoryTabs: boolean;
    showEpgSchedule: boolean;
    compactGrid: boolean;
    showChannelBadges: boolean;
  };
  news: {
    defaultTab: "All" | "Insider" | "Releases" | "Others";
    showFilterTabs: boolean;
    showMetadata: boolean;
    compactCards: boolean;
  };
  gallery: {
    defaultDensity: "small" | "medium" | "large";
    defaultSortOrder: "dont-sort" | "year" | "month";
    showTypeBadges: boolean;
    showFavoriteBadge: boolean;
    showItemCount: boolean;
  };
  feedback: {
    defaultType: "suggestion" | "bug";
    defaultSaveDiagnostics: boolean;
    showHistory: boolean;
    showRating: boolean;
  };
  winui: {
    showHeroBanner: boolean;
    showQuickLinks: boolean;
    showCodeBadges: boolean;
  };
  about: {
    showDisclaimer: boolean;
    showCommunity: boolean;
    compactHeader: boolean;
  };
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  home: {
    showHeroCarousel: true,
    showGreeting: true,
    showRecommended: true,
    showQuickAccess: true,
    showRecentNote: true,
  },
  watch: {
    showCategoryTabs: true,
    showEpgSchedule: true,
    compactGrid: false,
    showChannelBadges: true,
  },
  news: {
    defaultTab: "All",
    showFilterTabs: true,
    showMetadata: true,
    compactCards: false,
  },
  gallery: {
    defaultDensity: "medium",
    defaultSortOrder: "dont-sort",
    showTypeBadges: true,
    showFavoriteBadge: true,
    showItemCount: true,
  },
  feedback: {
    defaultType: "suggestion",
    defaultSaveDiagnostics: true,
    showHistory: true,
    showRating: true,
  },
  winui: {
    showHeroBanner: true,
    showQuickLinks: true,
    showCodeBadges: true,
  },
  about: {
    showDisclaimer: true,
    showCommunity: true,
    compactHeader: false,
  },
};

const STORAGE_KEY = "sparkle_app_preferences_v1";

function loadPreferences(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_APP_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      home: { ...DEFAULT_APP_PREFERENCES.home, ...(parsed.home ?? {}) },
      watch: { ...DEFAULT_APP_PREFERENCES.watch, ...(parsed.watch ?? {}) },
      news: { ...DEFAULT_APP_PREFERENCES.news, ...(parsed.news ?? {}) },
      gallery: { ...DEFAULT_APP_PREFERENCES.gallery, ...(parsed.gallery ?? {}) },
      feedback: { ...DEFAULT_APP_PREFERENCES.feedback, ...(parsed.feedback ?? {}) },
      winui: { ...DEFAULT_APP_PREFERENCES.winui, ...(parsed.winui ?? {}) },
      about: { ...DEFAULT_APP_PREFERENCES.about, ...(parsed.about ?? {}) },
    };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

let cachedPrefs: AppPreferences = loadPreferences();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function savePreferences(next: AppPreferences) {
  cachedPrefs = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota / private mode failures
  }
  notify();
}

export function getAppPreferences(): AppPreferences {
  return cachedPrefs;
}

export function updateAppPreferenceSection<K extends keyof AppPreferences>(
  section: K,
  updater: (prev: AppPreferences[K]) => AppPreferences[K],
) {
  savePreferences({
    ...cachedPrefs,
    [section]: updater(cachedPrefs[section]),
  });
}

export function resetAppPreferenceSection<K extends keyof AppPreferences>(section: K) {
  savePreferences({
    ...cachedPrefs,
    [section]: { ...DEFAULT_APP_PREFERENCES[section] },
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppPreferences(): AppPreferences {
  return useSyncExternalStore(
    subscribe,
    () => cachedPrefs,
    () => DEFAULT_APP_PREFERENCES,
  );
}
