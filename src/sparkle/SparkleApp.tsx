// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cascadeFrom, getAppGroup, isSingleInstanceApp } from "./utils/windowInstances";
import { Sidebar } from "./components/Sidebar";
import { WindowAppSidebar } from "./components/WindowAppSidebar";
import { TopBar } from "./components/TopBar";
import { BottomDock } from "./components/BottomDock";
import { SpotlightModal } from "./components/SpotlightModal";
import { CustomStreamModal } from "./components/CustomStreamModal";
import { WelcomeModal } from "./components/WelcomeModal";
import { UnderConstructionModal } from "./components/UnderConstructionModal";
import { UnsavedSettingsModal } from "./components/UnsavedSettingsModal";
import { UnsavedNoteModal } from "./components/UnsavedNoteModal";
import { HelpModal } from "./components/HelpModal";
import { NewsSummaryModal } from "./components/NewsSummaryModal";
import { FindWordsBar } from "./components/FindWordsBar";
import { AddStreamModal } from "./components/AddStreamModal";
import { TextToSpeechPlayer } from "./components/TextToSpeechPlayer";
import { SplashScreen } from "./components/SplashScreen";
import { SparkleOOBE } from "./components/SparkleOOBE";
import { WindowsBootScreen } from "./components/WindowsBootScreen";
import { WindowsPowerTransitionScreen } from "./components/WindowsPowerTransitionScreen";
import { AnimatedBootScreen } from "./components/AnimatedBootScreen";
import { NativeKeyboard } from "./components/NativeKeyboard";
import { NativeKeyboardProvider } from "./context/NativeKeyboardContext";
import { NotesProvider } from "./context/NotesContext";
import { StickyNoteWidget } from "./components/StickyNoteWidget";
import { AppScrollbar } from "./components/AppScrollbar";
import { GlobalToast } from "./components/GlobalToast";
import { EvaluationWatermark } from "./components/EvaluationWatermark";
import { showAppToast } from "./utils/toast";
import { HomePreview } from "./screens/HomePreview";
import type { UnsavedNoteHandler } from "./screens/NotesApp";

const About = React.lazy(() => import("./screens/About").then((m) => ({ default: m.About })));
const LiveTV = React.lazy(() => import("./screens/LiveTV").then((m) => ({ default: m.LiveTV })));
const TestChannels = React.lazy(() =>
  import("./screens/TestChannels").then((m) => ({ default: m.TestChannels })),
);
const News = React.lazy(() => import("./screens/News").then((m) => ({ default: m.News })));
const Article = React.lazy(() => import("./screens/Article").then((m) => ({ default: m.Article })));
const Channels = React.lazy(() =>
  import("./screens/Channels").then((m) => ({ default: m.Channels })),
);
const Favorites = React.lazy(() =>
  import("./screens/Favorites").then((m) => ({ default: m.Favorites })),
);
const Settings = React.lazy(() =>
  import("./screens/Settings").then((m) => ({ default: m.Settings })),
);
const ImmersiveSearch = React.lazy(() =>
  import("./screens/ImmersiveSearch").then((m) => ({ default: m.ImmersiveSearch })),
);
const NotesApp = React.lazy(() =>
  import("./screens/NotesApp").then((m) => ({ default: m.NotesApp })),
);
const Craftmine = React.lazy(() =>
  import("./screens/Craftmine").then((m) => ({ default: m.Craftmine })),
);
const Photopea = React.lazy(() =>
  import("./screens/Photopea").then((m) => ({ default: m.Photopea })),
);
const Gallery = React.lazy(() => import("./screens/Gallery").then((m) => ({ default: m.Gallery })));
const Draws = React.lazy(() => import("./screens/Draws").then((m) => ({ default: m.Draws })));
const VLC = React.lazy(() => import("./screens/VLC").then((m) => ({ default: m.VLC })));
const Camera = React.lazy(() => import("./screens/Camera").then((m) => ({ default: m.Camera })));
const Auth = React.lazy(() => import("./screens/Auth").then((m) => ({ default: m.Auth })));
const ResetPassword = React.lazy(() =>
  import("./screens/ResetPassword").then((m) => ({ default: m.ResetPassword })),
);
const Feedback = React.lazy(() =>
  import("./screens/Feedback").then((m) => ({ default: m.Feedback })),
);
const WinUI3 = React.lazy(() => import("./screens/WinUI3").then((m) => ({ default: m.WinUI3 })));
const Notepad = React.lazy(() => import("./screens/Notepad").then((m) => ({ default: m.Notepad })));
const HtmlWriter = React.lazy(() =>
  import("./screens/HtmlWriter").then((m) => ({ default: m.HtmlWriter })),
);
const PcSettings = React.lazy(() =>
  import("./screens/PcSettings").then((m) => ({ default: m.PcSettings })),
);
const FileExplorer = React.lazy(() =>
  import("./screens/FileExplorer").then((m) => ({ default: m.FileExplorer })),
);
const Calculator = React.lazy(() =>
  import("./screens/Calculator").then((m) => ({ default: m.Calculator })),
);
const Weather = React.lazy(() => import("./screens/Weather").then((m) => ({ default: m.Weather })));
import { CHANNELS_DATA } from "./data/channels";
import { NEWS_DATA } from "./data/news";
import { Channel, NewsArticle } from "./types";
import { useSettings, getTaskbarThicknessPx, resolveDesktopWallpaper } from "./hooks/useSettings";
import { SPOTLIGHT_COLLECTION_THEME_ID } from "./constants/wallpapers";
import { useSpotlightCollection, useSpotlightScheduler } from "./services/spotlightService";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { type AppTab } from "./components/SparkleTabBar";
import { WindowFrame, type AppWindowState } from "./components/WindowFrame";
import { WindowsStartMenu } from "./components/WindowsStartMenu";
import { WindowsTaskbar } from "./components/WindowsTaskbar";
import { WindowsContextMenu } from "./components/WindowsContextMenu";
import { WindowsLockScreen } from "./components/WindowsLockScreen";
import { DirectCommandFlyout } from "./components/DirectCommandFlyout";
import { DesktopIconsLayer } from "./components/DesktopIconsLayer";
import {
  loadAutoArrange,
  saveAutoArrange,
  loadSnapToGrid,
  saveSnapToGrid,
} from "./services/desktopStore";
import {
  Plus,
  RefreshCw,
  Palette,
  LayoutGrid,
  ArrowUpDown,
  Terminal,
  Image,
  FileText,
  Brush,
  Code2,
  AppWindow,
} from "lucide-react";

export function getRouteTitle(route: string, channel?: Channel): string {
  if (route === "/" || route === "/home" || route === "/home-preview") return "Home";
  if (route.startsWith("/live-tv") || route.startsWith("/watch")) {
    return channel?.name ? channel.name : "Watch";
  }
  if (route.startsWith("/news") || route.startsWith("/updates")) return "Update blogs";
  if (route.startsWith("/article/")) {
    const slug = route.replace("/article/", "");
    const found = NEWS_DATA.find((n) => n.slug === slug);
    return found ? found.title.replace(/^#\s*/, "") : "Article";
  }
  if (route.startsWith("/gallery")) return "Gallery";
  if (route.startsWith("/notes") || route.startsWith("/write")) return "Notes";
  if (route.startsWith("/craftmine")) return "Craftmine";
  if (route.startsWith("/photopea")) return "Photopea";
  if (route.startsWith("/draws")) return "Ink Canvas";
  if (route.startsWith("/vlc")) return "Screenbox";
  if (route.startsWith("/camera")) return "Camera";
  if (route.startsWith("/settings")) return "Settings";
  if (route.startsWith("/winui-3") || route.startsWith("/winui")) return "WinUI 3";
  if (route.startsWith("/notepad")) return "Notepad";
  if (route.startsWith("/html-writer")) return "HTML Writer";
  if (route.startsWith("/pc-settings")) return "PC Settings";
  if (route.startsWith("/file-explorer")) return "File Explorer";
  if (route.startsWith("/calculator")) return "Calculator";
  if (route.startsWith("/weather")) return "Weather";
  if (route.startsWith("/feedback")) return "Feedback";
  if (route.startsWith("/channels")) return "Channels";
  if (route.startsWith("/favorites")) return "Favorites";
  if (route.startsWith("/test")) return "Test Channels";
  if (route.startsWith("/search")) return "Search";
  if (route.startsWith("/about")) return "About";
  if (route.startsWith("/auth") || route.startsWith("/reset-password")) return "Account";
  const clean = route.replace(/^\//, "").split(/[/?#]/)[0];
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Home";
}

export default function App() {
  const {
    settings,
    draftSettings,
    hasChanges,
    applyDraftSettings,
    discardDraftSettings,
    updateSetting,
  } = useSettings();

  useSpotlightCollection();
  useSpotlightScheduler(
    settings.windowsWallpaper === SPOTLIGHT_COLLECTION_THEME_ID,
    settings.spotlightInterval,
  );

  // Tooltip & navigation block for unsaved settings
  const [showUnsavedTooltip, setShowUnsavedTooltip] = useState(false);
  const unsavedTooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerUnsavedTooltip = useCallback(() => {
    setShowUnsavedTooltip(true);
    if (unsavedTooltipTimerRef.current) clearTimeout(unsavedTooltipTimerRef.current);
    unsavedTooltipTimerRef.current = setTimeout(() => {
      setShowUnsavedTooltip(false);
    }, 4500);
  }, []);

  // When changes are saved or cleared, hide tooltip
  useEffect(() => {
    if (!hasChanges) {
      setShowUnsavedTooltip(false);
    }
  }, [hasChanges]);

  useEffect(() => {
    return () => {
      if (unsavedTooltipTimerRef.current) clearTimeout(unsavedTooltipTimerRef.current);
    };
  }, []);

  // Navigation Route State (supports browser pathname or internal state)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname === "/" ? "/" : window.location.pathname;
  });
  const [routeState, setRouteState] = useState<any>(null);
  const previousRouteRef = useRef<string>("/");

  // Tab-specific search state for Floating Search Bar
  const [tabSearchQueries, setTabSearchQueries] = useState<Record<string, string>>({});
  const currentTabSearchQuery = tabSearchQueries[currentRoute] || "";
  const handleTabSearchChange = (query: string) => {
    setTabSearchQueries((prev) => ({
      ...prev,
      [currentRoute]: query,
    }));
  };

  // Tabbed Sparkle multi-tasking tabs state
  const [tabs, setTabs] = useState<AppTab[]>(() => {
    const initRoute = window.location.pathname === "/" ? "/" : window.location.pathname;
    return [
      {
        id: "tab-1",
        title: getRouteTitle(initRoute),
        route: initRoute,
        history: [initRoute],
      },
    ];
  });
  const [activeTabId, setActiveTabId] = useState<string>("tab-1");
  const tabsRef = useRef<AppTab[]>(tabs);
  tabsRef.current = tabs;

  // Windows Mode state & floating window geometry
  const isWindowsMode = Boolean(settings.windowsMode);
  const taskbarLocation = settings.taskbarLocation || "bottom";
  const isVerticalTaskbar = taskbarLocation === "left" || taskbarLocation === "right";
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isLockScreenOpen, setIsLockScreenOpen] = useState(false);
  const [isDirectCommandOpen, setIsDirectCommandOpen] = useState(false);
  const [desktopContextMenu, setDesktopContextMenu] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [desktopViewSize, setDesktopViewSize] = useState<"large" | "medium" | "small">(() => {
    try {
      const saved = localStorage.getItem("sparkle_desktop_view_size");
      if (saved === "large" || saved === "small" || saved === "medium") return saved;
    } catch {}
    return "medium";
  });
  const [desktopSortBy, setDesktopSortBy] = useState<"name" | "size" | "type" | "modified">(() => {
    try {
      const saved = localStorage.getItem("sparkle_desktop_sort_by");
      if (saved === "name" || saved === "size" || saved === "type" || saved === "modified")
        return saved;
    } catch {}
    return "name";
  });
  const [desktopAutoArrange, setDesktopAutoArrange] = useState<boolean>(() => loadAutoArrange());
  const [desktopSnapToGrid, setDesktopSnapToGrid] = useState<boolean>(() => loadSnapToGrid());
  const [isDesktopRefreshing, setIsDesktopRefreshing] = useState(false);
  const [windowStates, setWindowStates] = useState<Record<string, AppWindowState>>({});
  const hasMaximizedWindow =
    isWindowsMode &&
    tabs.some((t) => {
      const ws = windowStates[t.id];
      return Boolean(ws && ws.isMaximized && !ws.isMinimized);
    });
  const isTaskbarFloating = isWindowsMode && Boolean(settings.floatBar) && !hasMaximizedWindow;
  const taskbarThickness = getTaskbarThicknessPx(
    settings.taskbarScale,
    isTaskbarFloating,
    taskbarLocation,
  );
  const [displayOverlayState, setDisplayOverlayState] = useState<{
    brightness: number;
    nightLight: boolean;
  }>(() => {
    try {
      const raw = localStorage.getItem("sparkle_pc_settings_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { brightness?: number; nightLight?: boolean };
        return {
          brightness: typeof parsed.brightness === "number" ? parsed.brightness : 82,
          nightLight: Boolean(parsed.nightLight),
        };
      }
    } catch {}
    return { brightness: 82, nightLight: false };
  });

  useEffect(() => {
    const syncOverlay = () => {
      try {
        const raw = localStorage.getItem("sparkle_pc_settings_v1");
        if (raw) {
          const parsed = JSON.parse(raw) as { brightness?: number; nightLight?: boolean };
          setDisplayOverlayState({
            brightness: typeof parsed.brightness === "number" ? parsed.brightness : 82,
            nightLight: Boolean(parsed.nightLight),
          });
        }
      } catch {}
    };
    window.addEventListener("sparkle:pc-settings-updated", syncOverlay);
    window.addEventListener("storage", syncOverlay);
    return () => {
      window.removeEventListener("sparkle:pc-settings-updated", syncOverlay);
      window.removeEventListener("storage", syncOverlay);
    };
  }, []);

  useEffect(() => {
    const handleOpenDirectCommand = () => {
      setIsStartMenuOpen(false);
      setIsDirectCommandOpen(true);
    };
    const handleToggleDirectCommand = () => {
      setIsStartMenuOpen(false);
      setIsDirectCommandOpen((prev) => !prev);
    };
    window.addEventListener("vplay:open-direct-command", handleOpenDirectCommand);
    window.addEventListener("vplay:toggle-direct-command", handleToggleDirectCommand);
    return () => {
      window.removeEventListener("vplay:open-direct-command", handleOpenDirectCommand);
      window.removeEventListener("vplay:toggle-direct-command", handleToggleDirectCommand);
    };
  }, []);

  const createDefaultWindowState = useCallback(
    (index: number, zIndex: number, routePath?: string): AppWindowState => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const isMobileVw = vw < 768;
      const minX = taskbarLocation === "left" ? taskbarThickness : 0;
      const minY = taskbarLocation === "top" ? taskbarThickness : 0;
      const availW = Math.max(320, vw - (isVerticalTaskbar ? taskbarThickness : 0));
      const availH = Math.max(240, vh - (!isVerticalTaskbar ? taskbarThickness : 0));
      if (isMobileVw) {
        return {
          x: minX,
          y: minY,
          width: availW,
          height: availH,
          isMinimized: false,
          isMaximized: true,
          zIndex,
        };
      }
      const isCalculatorRoute = Boolean(
        routePath && (routePath === "/calculator" || routePath.startsWith("/calculator/")),
      );
      if (isCalculatorRoute) {
        const calcW = Math.min(360, availW);
        const calcH = Math.min(540, availH);
        const calcX = Math.max(minX, Math.round(minX + (availW - calcW) / 2));
        const calcY = Math.max(minY, Math.round(minY + (availH - calcH) / 2));
        return {
          x: calcX,
          y: calcY,
          width: calcW,
          height: calcH,
          isMinimized: false,
          isMaximized: false,
          zIndex,
        };
      }
      const width = Math.min(1040, Math.max(460, availW - 96));
      const height = Math.min(660, Math.max(340, availH - 72));
      const offsetIdx = index % 6;
      const baseLeft = minX + 36;
      const baseTop = minY + 20;
      const x = Math.min(baseLeft + offsetIdx * 28, Math.max(baseLeft, minX + availW - width - 16));
      const y = Math.min(
        baseTop + offsetIdx * 24,
        Math.max(minY + 12, minY + availH - height - 16),
      );
      return {
        x,
        y,
        width,
        height,
        isMinimized: false,
        isMaximized: false,
        zIndex,
      };
    },
    [taskbarThickness, taskbarLocation, isVerticalTaskbar],
  );

  // Helper to load channels with custom channels, overrides and exclusions
  const loadInitialChannels = (): Channel[] => {
    let list = CHANNELS_DATA;
    try {
      const saved = localStorage.getItem("waves_custom_channels");
      if (saved) {
        const parsed = JSON.parse(saved);
        list = [...list, ...parsed];
      }
    } catch {}

    try {
      const deletedSaved = localStorage.getItem("waves_deleted_channels");
      if (deletedSaved) {
        const deletedIds = new Set<string>(JSON.parse(deletedSaved));
        list = list.filter((c) => !deletedIds.has(c.id));
      }
    } catch {}

    try {
      const overridesSaved = localStorage.getItem("waves_channel_overrides");
      if (overridesSaved) {
        const overrides: Record<string, Partial<Channel>> = JSON.parse(overridesSaved);
        list = list.map((c) => {
          if (overrides[c.id]) {
            return {
              ...c,
              ...(overrides[c.id].name ? { name: overrides[c.id].name } : {}),
              ...(overrides[c.id].streamUrl ? { streamUrl: overrides[c.id].streamUrl } : {}),
              ...(overrides[c.id].logo ? { logo: overrides[c.id].logo } : {}),
            };
          }
          return c;
        });
      }
    } catch {}

    return list;
  };

  // Channels State (base channels + imported channels from localStorage)
  const [channels, setChannels] = useState<Channel[]>(loadInitialChannels);

  // Channel update & deletion handlers
  const handleUpdateChannel = useCallback(
    (channelId: string, updates: { name: string; streamUrl: string; logo?: string }) => {
      setChannels((prev) => {
        const updated = prev.map((ch) => (ch.id === channelId ? { ...ch, ...updates } : ch));
        try {
          const existing = JSON.parse(localStorage.getItem("waves_channel_overrides") || "{}");
          existing[channelId] = { ...(existing[channelId] || {}), ...updates };
          localStorage.setItem("waves_channel_overrides", JSON.stringify(existing));
        } catch {}
        return updated;
      });
      setCurrentChannel((prev) => (prev?.id === channelId ? { ...prev, ...updates } : prev));
    },
    [],
  );

  const handleRemoveChannel = useCallback(
    (channelId: string) => {
      setChannels((prev) => {
        const updated = prev.filter((ch) => ch.id !== channelId);
        try {
          const existing: string[] = JSON.parse(
            localStorage.getItem("waves_deleted_channels") || "[]",
          );
          if (!existing.includes(channelId)) {
            existing.push(channelId);
            localStorage.setItem("waves_deleted_channels", JSON.stringify(existing));
          }
        } catch {}
        return updated;
      });
      setCurrentChannel((prev) => {
        if (prev?.id === channelId) {
          const remaining = channels.filter((ch) => ch.id !== channelId);
          return remaining.length > 0 ? remaining[0] : prev;
        }
        return prev;
      });
    },
    [channels],
  );

  // Current Active Channel for Live TV Player
  const [currentChannel, setCurrentChannel] = useState<Channel>(() => {
    const list = loadInitialChannels();
    // Check if URL has ?channel=slug
    const urlParams = new URLSearchParams(window.location.search);
    const channelSlug = urlParams.get("channel");
    if (channelSlug) {
      const matched = list.find((c) => c.slug === channelSlug);
      if (matched) return matched;
    }
    try {
      const savedRecentId = localStorage.getItem("vplay_recent_channel_id");
      if (savedRecentId) {
        const found = list.find((c) => c.id === savedRecentId);
        if (found) return found;
      }
    } catch {}
    return list[0] || CHANNELS_DATA[0];
  });

  // Track recent channel in localStorage
  useEffect(() => {
    if (currentChannel?.id) {
      try {
        localStorage.setItem("vplay_recent_channel_id", currentChannel.id);
      } catch {}
    }
  }, [currentChannel]);

  // Modals state
  const [oobeKey, setOobeKey] = useState(0);
  const [isOobeOpen, setIsOobeOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("sparkle_oobe_completed");
    } catch {
      return false;
    }
  });

  // Ensure every tab has a windowState when Windows Mode is active and OOBE has finished, and close Start Menu on exit
  useEffect(() => {
    if (!isWindowsMode || isOobeOpen) {
      setIsStartMenuOpen(false);
      return;
    }
    setWindowStates((prev) => {
      let changed = false;
      const next: Record<string, AppWindowState> = { ...prev };
      const existingValues = Object.values(prev) as AppWindowState[];
      let maxZ: number = existingValues.reduce(
        (m: number, s: AppWindowState) => Math.max(m, s.zIndex),
        20,
      );
      tabs.forEach((tab, idx) => {
        if (!next[tab.id]) {
          maxZ += 1;
          next[tab.id] = createDefaultWindowState(idx, Math.min(180, maxZ), tab.route);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [isWindowsMode, isOobeOpen, tabs, createDefaultWindowState]);

  const handleRestartOobe = useCallback(() => {
    try {
      localStorage.removeItem("sparkle_oobe_completed");
    } catch {}
    setOobeKey((prev) => prev + 1);
    setIsOobeOpen(true);
    setIsSplashFinished(true);
  }, []);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isBootVideoFinished, setIsBootVideoFinished] = useState(
    () => !settings.animatedBootScreen,
  );
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [bootRunId, setBootRunId] = useState(0);
  const [powerTransition, setPowerTransition] = useState<"restarting" | "ending" | null>(null);
  const powerBusyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (powerBusyTimerRef.current) {
        clearTimeout(powerBusyTimerRef.current);
        powerBusyTimerRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("sparkle-busy-cursor");
      }
    };
  }, []);

  const handleBootFinish = useCallback(() => {
    setIsSplashFinished(true);
    if (!isOobeOpen) {
      setIsLockScreenOpen(true);
    }
  }, [isOobeOpen]);

  const startPowerTransitionWithBusyCursor = useCallback(
    (mode: "restarting" | "ending") => {
      setIsStartMenuOpen(false);
      if (powerBusyTimerRef.current || powerTransition) return;

      if (typeof document !== "undefined") {
        document.documentElement.classList.add("sparkle-busy-cursor");
      }

      powerBusyTimerRef.current = setTimeout(() => {
        powerBusyTimerRef.current = null;
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("sparkle-busy-cursor");
        }
        setIsLockScreenOpen(false);
        setPowerTransition(mode);
      }, 2000);
    },
    [powerTransition],
  );

  const handleRestartSystem = useCallback(() => {
    startPowerTransitionWithBusyCursor("restarting");
  }, [startPowerTransitionWithBusyCursor]);

  const handleEndSession = useCallback(() => {
    startPowerTransitionWithBusyCursor("ending");
  }, [startPowerTransitionWithBusyCursor]);

  const handlePowerTransitionFinish = useCallback(() => {
    if (powerTransition === "restarting") {
      setIsBootVideoFinished(!settings.animatedBootScreen);
      setBootRunId((prev) => prev + 1);
      setIsSplashFinished(false);
      setPowerTransition(null);
    } else if (powerTransition === "ending") {
      updateSetting("windowsMode", false);
      setPowerTransition(null);
    }
  }, [powerTransition, settings.animatedBootScreen, updateSetting]);
  const [isUnderConstructionOpen, setIsUnderConstructionOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isCustomStreamModalOpen, setIsCustomStreamModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isNewsSummaryOpen, setIsNewsSummaryOpen] = useState(false);
  const [summarizeArticle, setSummarizeArticle] = useState<NewsArticle>(NEWS_DATA[0]);
  const [isTtsOpen, setIsTtsOpen] = useState(false);
  const [ttsArticle, setTtsArticle] = useState<NewsArticle>(NEWS_DATA[0]);
  const [isFindWordsOpen, setIsFindWordsOpen] = useState(false);
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const handleOpenOfficeTool = (tool: string) => {
    if (tool === "notes" || tool === "write" || tool === "present" || tool === "table") {
      navigate("/notes");
    } else {
      navigate(`/${tool}`);
    }
  };
  const [articleFontSize, setArticleFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("vplay_font_size");
      return saved ? parseInt(saved, 10) : 16;
    } catch {
      return 16;
    }
  });

  const handleFontSizeChange = (size: number) => {
    setArticleFontSize(size);
    try {
      localStorage.setItem("vplay_font_size", String(size));
    } catch {}
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInkCanvasChromeVisible, setIsInkCanvasChromeVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("waves_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    if (settings.windowsMode) return;
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("waves_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const [mobileDragOffset, setMobileDragOffset] = useState<number | null>(null);

  // Edge swipe gesture: vuốt từ cạnh trái sang để mở sidebar - follow finger trong thời gian thực
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTrackingEdgeSwipe = false;
    let isSwipingHorizontally = false;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0;

    const getDrawerWidth = () => {
      return typeof window !== "undefined" ? Math.min(285, window.innerWidth * 0.85) : 285;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Swipe originates from within 45px of the left screen edge on mobile/tablet
      if (touch.clientX <= 45 && window.innerWidth < 768) {
        startX = touch.clientX;
        startY = touch.clientY;
        lastX = touch.clientX;
        lastTime = Date.now();
        velocityX = 0;
        isTrackingEdgeSwipe = true;
        isSwipingHorizontally = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingEdgeSwipe) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      const now = Date.now();
      const dt = Math.max(1, now - lastTime);
      velocityX = (touch.clientX - lastX) / dt;
      lastX = touch.clientX;
      lastTime = now;

      // Determine intent: if moving horizontally to the right
      if (!isSwipingHorizontally) {
        if (deltaX > 8) {
          if (Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
            isSwipingHorizontally = true;
          } else {
            isTrackingEdgeSwipe = false;
            return;
          }
        } else if (deltaX < -5 || Math.abs(deltaY) > 20) {
          isTrackingEdgeSwipe = false;
          return;
        }
      }

      if (isSwipingHorizontally) {
        if (e.cancelable) e.preventDefault();
        const drawerWidth = getDrawerWidth();
        const currentX = Math.min(drawerWidth, Math.max(0, touch.clientX));
        setMobileDragOffset(currentX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTrackingEdgeSwipe) return;
      isTrackingEdgeSwipe = false;

      if (isSwipingHorizontally) {
        isSwipingHorizontally = false;
        const drawerWidth = getDrawerWidth();
        const touch = e.changedTouches[0];
        const finalX = touch.clientX;

        // Open if dragged past 28% of width or flicked to right with positive velocity
        if (finalX > drawerWidth * 0.28 || velocityX > 0.3) {
          setIsMobileSidebarOpen(true);
          if (isSidebarCollapsed) {
            setIsSidebarCollapsed(false);
            try {
              localStorage.setItem("waves_sidebar_collapsed", "false");
            } catch {}
          }
        } else {
          setIsMobileSidebarOpen(false);
        }
        setMobileDragOffset(null);
      }
    };

    const handleTouchCancel = () => {
      if (isTrackingEdgeSwipe) {
        isTrackingEdgeSwipe = false;
        isSwipingHorizontally = false;
        setMobileDragOffset(null);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [isSidebarCollapsed]);

  // Determine effective sidebar width for page adaptation
  const isEffectiveCollapsed =
    Boolean(settings.windowsMode) || settings.autoHideSidebar || isSidebarCollapsed;
  const isInkCanvasEditor = currentRoute.startsWith("/draws/");

  useEffect(() => {
    if (!isInkCanvasEditor) return;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const handlePointerMove = (event: MouseEvent) => {
      const nearEdge =
        event.clientY <= 48 || event.clientY >= window.innerHeight - 48 || event.clientX <= 48;
      if (nearEdge) {
        setIsInkCanvasChromeVisible(true);
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setIsInkCanvasChromeVisible(false), 900);
      }
    };
    window.addEventListener("mousemove", handlePointerMove);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isInkCanvasEditor]);

  useEffect(() => {
    setIsInkCanvasChromeVisible(false);
  }, [isInkCanvasEditor, currentRoute]);

  // Gallery Fullscreen Viewer: auto-hide Sidebar & TopBar when viewing photos/videos/files
  const [isGalleryViewerOpen, setIsGalleryViewerOpen] = useState(false);

  useEffect(() => {
    const handleGalleryLightbox = (e: any) => {
      setIsGalleryViewerOpen(Boolean(e.detail?.isOpen));
    };
    window.addEventListener("vplay:gallery:lightbox_toggle", handleGalleryLightbox);
    return () => {
      window.removeEventListener("vplay:gallery:lightbox_toggle", handleGalleryLightbox);
    };
  }, []);

  useEffect(() => {
    if (currentRoute !== "/gallery") {
      setIsGalleryViewerOpen(false);
    }
  }, [currentRoute]);

  const [isUnsavedSettingsModalOpen, setIsUnsavedSettingsModalOpen] = useState(false);
  const [unsavedNoteState, setUnsavedNoteState] = useState<UnsavedNoteHandler | null>(null);
  const [isUnsavedNoteModalOpen, setIsUnsavedNoteModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ path: string; state?: any } | null>(
    null,
  );

  // Auto-collapse sidebar when entering note editor
  useEffect(() => {
    if (currentRoute.startsWith("/notes/")) {
      setIsSidebarCollapsed(true);
    }
  }, [currentRoute]);

  // Perform actual navigation
  const executeNavigation = useCallback(
    (path: string, state?: any) => {
      const targetRoute = path.includes("?") ? path.split("?")[0] : path;
      const isDifferentTab = targetRoute !== currentRoute;

      if (currentRoute !== "/search") {
        previousRouteRef.current = currentRoute;
      }
      setRouteState(state);

      let matchedChannel: Channel | undefined;
      // Parse query params if any
      if (path.includes("?")) {
        const [parsedBaseRoute, query] = path.split("?");
        const params = new URLSearchParams(query);
        const chSlug = params.get("channel");
        if (chSlug) {
          matchedChannel = channels.find((c) => c.slug === chSlug);
          if (matchedChannel) setCurrentChannel(matchedChannel);
        }
        window.history.pushState(null, "", path);
        setCurrentRoute(parsedBaseRoute);
      } else {
        window.history.pushState(null, "", path);
        setCurrentRoute(path);
      }

      // Update active tab in multi-tasking tabs state
      const title = getRouteTitle(targetRoute, matchedChannel || currentChannel);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                route: path,
                title: title,
                routeState: state,
                channelId: matchedChannel ? matchedChannel.id : t.channelId,
              }
            : t,
        ),
      );

      // Scroll to top on navigation
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [channels, currentChannel, currentRoute, activeTabId],
  );

  // Tab management handlers for Tabbed Sparkle & Windows Mode
  const handleReorderTabs = useCallback((reorderedTabs: AppTab[]) => {
    setTabs(reorderedTabs);
  }, []);

  const bringWindowToFront = useCallback(
    (
      prev: Record<string, AppWindowState>,
      tabId: string,
      tabList: AppTab[],
      unminimize = true,
    ): Record<string, AppWindowState> => {
      const next: Record<string, AppWindowState> = { ...prev };
      if (!next[tabId]) {
        next[tabId] = createDefaultWindowState(tabList.length, 40);
      }
      const orderedIds = tabList
        .map((t) => t.id)
        .filter((id) => id !== tabId && Boolean(next[id]))
        .sort((a, b) => (next[a]?.zIndex || 20) - (next[b]?.zIndex || 20));
      let z = 20;
      orderedIds.forEach((id) => {
        next[id] = { ...next[id], zIndex: z++ };
      });
      next[tabId] = {
        ...next[tabId],
        ...(unminimize ? { isMinimized: false } : {}),
        zIndex: Math.min(180, z),
      };
      return next;
    },
    [createDefaultWindowState],
  );

  const focusWindow = useCallback(
    (tabId: string) => {
      const currentTabs = tabsRef.current;
      const targetTab = currentTabs.find((t) => t.id === tabId);
      setActiveTabId(tabId);
      if (targetTab) {
        if (targetTab.channelId) {
          const ch = channels.find((c) => c.id === targetTab.channelId);
          if (ch) setCurrentChannel(ch);
        }
        setRouteState(targetTab.routeState || null);
        const base = targetTab.route.includes("?")
          ? targetTab.route.split("?")[0]
          : targetTab.route;
        setCurrentRoute(base);
        window.history.pushState(null, "", targetTab.route);
      }
      setWindowStates((prevWs) => bringWindowToFront(prevWs, tabId, currentTabs, true));
    },
    [channels, bringWindowToFront],
  );

  const handleMinimizeWindow = useCallback(
    (tabId: string) => {
      let nextFocusId: string | null = null;
      setWindowStates((prev) => {
        const current = prev[tabId];
        if (!current) return prev;
        const next = { ...prev, [tabId]: { ...current, isMinimized: true } };
        if (activeTabId === tabId) {
          const remainingVisible = (Object.entries(next) as [string, AppWindowState][])
            .filter(([id, ws]) => id !== tabId && !ws.isMinimized)
            .sort((a, b) => b[1].zIndex - a[1].zIndex);
          if (remainingVisible.length > 0) {
            nextFocusId = remainingVisible[0][0];
          }
        }
        return next;
      });
      if (nextFocusId) {
        setActiveTabId(nextFocusId);
      }
    },
    [activeTabId],
  );

  const handleToggleMaximizeWindow = useCallback(
    (tabId: string) => {
      const currentTabs = tabsRef.current;
      setActiveTabId(tabId);
      setWindowStates((prevWs) => {
        const updated = bringWindowToFront(prevWs, tabId, currentTabs, true);
        const target = updated[tabId];
        if (!target) return updated;
        return {
          ...updated,
          [tabId]: {
            ...target,
            isMaximized: !target.isMaximized,
          },
        };
      });
    },
    [bringWindowToFront],
  );

  const handleUpdateWindowBounds = useCallback((tabId: string, bounds: Partial<AppWindowState>) => {
    setWindowStates((prev) => {
      const existing = prev[tabId];
      if (!existing) return prev;
      return {
        ...prev,
        [tabId]: { ...existing, ...bounds },
      };
    });
  }, []);

  const handleTaskbarWindowClick = useCallback(
    (tabId: string) => {
      const ws = windowStates[tabId];
      if (tabId === activeTabId && ws && !ws.isMinimized) {
        handleMinimizeWindow(tabId);
      } else {
        focusWindow(tabId);
      }
    },
    [windowStates, activeTabId, handleMinimizeWindow, focusWindow],
  );

  const handleShowDesktop = useCallback(() => {
    setWindowStates((prev) => {
      const hasAnyVisible = tabs.some((t) => prev[t.id] && !prev[t.id].isMinimized);
      const next: Record<string, AppWindowState> = {};
      (Object.entries(prev) as [string, AppWindowState][]).forEach(([id, ws]) => {
        next[id] = { ...ws, isMinimized: hasAnyVisible };
      });
      return next;
    });
    setIsStartMenuOpen(false);
  }, [tabs]);

  const handleSelectTab = useCallback(
    (tabId: string) => {
      if (isWindowsMode) {
        focusWindow(tabId);
        return;
      }
      setActiveTabId(tabId);
      setTabs((prev) => {
        const targetTab = prev.find((t) => t.id === tabId);
        if (targetTab) {
          if (targetTab.channelId) {
            const ch = channels.find((c) => c.id === targetTab.channelId);
            if (ch) setCurrentChannel(ch);
          }
          setRouteState(targetTab.routeState || null);
          const targetPath = targetTab.route;
          const base = targetPath.includes("?") ? targetPath.split("?")[0] : targetPath;
          window.history.pushState(null, "", targetPath);
          setCurrentRoute(base);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return prev;
      });
    },
    [channels, isWindowsMode, focusWindow],
  );

  const handleCreateTab = useCallback(
    (initialRoute = "/") => {
      const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const base = initialRoute.includes("?") ? initialRoute.split("?")[0] : initialRoute;
      let matchedChannel: Channel | undefined;
      if (initialRoute.includes("?")) {
        const params = new URLSearchParams(initialRoute.split("?")[1]);
        const chSlug = params.get("channel");
        if (chSlug) matchedChannel = channels.find((c) => c.slug === chSlug);
      }
      const newTab: AppTab = {
        id: newId,
        title: getRouteTitle(base, matchedChannel),
        route: initialRoute,
        history: [initialRoute],
        channelId: matchedChannel?.id,
      };
      const currentTabs = tabsRef.current;
      const nextTabs = [...currentTabs, newTab];
      setTabs(nextTabs);
      if (isWindowsMode) {
        setWindowStates((prevWs) => {
          const ws = createDefaultWindowState(currentTabs.length, 40);
          return bringWindowToFront({ ...prevWs, [newId]: ws }, newId, nextTabs, true);
        });
      }
      setActiveTabId(newId);
      if (matchedChannel) setCurrentChannel(matchedChannel);
      setCurrentRoute(base);
      setRouteState(null);
      window.history.pushState(null, "", initialRoute);
      if (!isWindowsMode) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [channels, isWindowsMode, createDefaultWindowState, bringWindowToFront],
  );

  const navigateInWindow = useCallback(
    (tabId: string, path: string, state?: any) => {
      const base = path.includes("?") ? path.split("?")[0] : path;
      let matchedChannel: Channel | undefined;
      if (path.includes("?")) {
        const params = new URLSearchParams(path.split("?")[1]);
        const chSlug = params.get("channel");
        if (chSlug) {
          matchedChannel = channels.find((c) => c.slug === chSlug);
          if (matchedChannel) setCurrentChannel(matchedChannel);
        }
      }
      const nextTitle = getRouteTitle(base, matchedChannel || currentChannel);
      const nextTabs = tabsRef.current.map((t) => {
        if (t.id !== tabId) return t;
        const prevHist = t.history && t.history.length > 0 ? t.history : [t.route];
        const nextHist = prevHist[prevHist.length - 1] === path ? prevHist : [...prevHist, path];
        return {
          ...t,
          route: path,
          title: nextTitle,
          routeState: state,
          history: nextHist,
          channelId: matchedChannel ? matchedChannel.id : t.channelId,
        };
      });
      setTabs(nextTabs);
      setActiveTabId(tabId);
      setCurrentRoute(base);
      setRouteState(state || null);
      window.history.pushState(null, "", path);
      setWindowStates((prevWs) => bringWindowToFront(prevWs, tabId, nextTabs, true));
    },
    [channels, currentChannel, bringWindowToFront],
  );

  const handleWindowGoBack = useCallback(
    (tabId: string) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId || !t.history || t.history.length <= 1) return t;
          const nextHistory = t.history.slice(0, -1);
          const prevPath = nextHistory[nextHistory.length - 1];
          const base = prevPath.includes("?") ? prevPath.split("?")[0] : prevPath;
          let matchedChannel: Channel | undefined;
          if (prevPath.includes("?")) {
            const chSlug = new URLSearchParams(prevPath.split("?")[1]).get("channel");
            if (chSlug) matchedChannel = channels.find((c) => c.slug === chSlug);
          }
          if (matchedChannel) setCurrentChannel(matchedChannel);
          setCurrentRoute(base);
          window.history.pushState(null, "", prevPath);
          return {
            ...t,
            route: prevPath,
            title: getRouteTitle(base, matchedChannel),
            history: nextHistory,
            channelId: matchedChannel ? matchedChannel.id : t.channelId,
          };
        }),
      );
    },
    [channels],
  );

  const openOrFocusAppWindow = useCallback(
    (path: string, state?: any) => {
      const base = path.includes("?") ? path.split("?")[0] : path;
      const targetGroup = getAppGroup(base);
      let matchedChannel: Channel | undefined;
      if (path.includes("?")) {
        const chSlug = new URLSearchParams(path.split("?")[1]).get("channel");
        if (chSlug) {
          matchedChannel = channels.find((c) => c.slug === chSlug);
          if (matchedChannel) setCurrentChannel(matchedChannel);
        }
      }

      const currentTabs = tabsRef.current;
      const existing = currentTabs.find((t) => getAppGroup(t.route) === targetGroup);
      if (existing) {
        if (path !== existing.route || state !== undefined) {
          navigateInWindow(existing.id, path, state);
        } else {
          focusWindow(existing.id);
        }
        return;
      }

      const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTab: AppTab = {
        id: newId,
        title: getRouteTitle(base, matchedChannel || currentChannel),
        route: path,
        routeState: state,
        history: [path],
        channelId: matchedChannel?.id,
      };
      const nextTabs = [...currentTabs, newTab];
      setTabs(nextTabs);
      setWindowStates((prevWs) => {
        const ws = createDefaultWindowState(currentTabs.length, 40, base);
        return bringWindowToFront({ ...prevWs, [newId]: ws }, newId, nextTabs, true);
      });
      setActiveTabId(newId);
      setCurrentRoute(base);
      setRouteState(state || null);
      window.history.pushState(null, "", path);
    },
    [
      channels,
      currentChannel,
      navigateInWindow,
      focusWindow,
      createDefaultWindowState,
      bringWindowToFront,
    ],
  );

  // Opens another window of an app even when one is already open (like Windows).
  // Single-instance apps (Settings) focus their existing window instead.
  const openNewAppWindow = useCallback(
    (path: string, state?: any) => {
      if (isSingleInstanceApp(path)) {
        openOrFocusAppWindow(path, state);
        return;
      }
      const base = path.includes("?") ? path.split("?")[0] : path;
      let matchedChannel: Channel | undefined;
      if (path.includes("?")) {
        const chSlug = new URLSearchParams(path.split("?")[1]).get("channel");
        if (chSlug) {
          matchedChannel = channels.find((c) => c.slug === chSlug);
          if (matchedChannel) setCurrentChannel(matchedChannel);
        }
      }
      const currentTabs = tabsRef.current;
      const group = getAppGroup(base);
      const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTab: AppTab = {
        id: newId,
        title: getRouteTitle(base, matchedChannel || currentChannel),
        route: path,
        routeState: state,
        history: [path],
        channelId: matchedChannel?.id,
      };
      const nextTabs = [...currentTabs, newTab];
      setTabs(nextTabs);
      setWindowStates((prevWs) => {
        let ws = createDefaultWindowState(currentTabs.length, 40, base);
        if (!ws.isMaximized) {
          // Cascade from the front-most window of the same app so the new one doesn't hide it.
          const sameApp = currentTabs
            .filter((t) => getAppGroup(t.route) === group && prevWs[t.id])
            .map((t) => prevWs[t.id])
            .filter((w) => !w.isMaximized)
            .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
          if (sameApp.length > 0) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const pos = cascadeFrom(sameApp[0], ws, {
              minX: taskbarLocation === "left" ? taskbarThickness : 0,
              minY: taskbarLocation === "top" ? taskbarThickness : 0,
              maxX: vw - (taskbarLocation === "right" ? taskbarThickness : 0),
              maxY: vh - (taskbarLocation === "bottom" ? taskbarThickness : 0),
            });
            ws = { ...ws, ...pos };
          }
        }
        return bringWindowToFront({ ...prevWs, [newId]: ws }, newId, nextTabs, true);
      });
      setActiveTabId(newId);
      setCurrentRoute(base);
      setRouteState(state || null);
      window.history.pushState(null, "", path);
    },
    [
      channels,
      currentChannel,
      openOrFocusAppWindow,
      createDefaultWindowState,
      bringWindowToFront,
      taskbarLocation,
      taskbarThickness,
    ],
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const prev = tabsRef.current;
      if (prev.length <= 1) {
        if (isWindowsMode) {
          setTabs([]);
          setActiveTabId("");
          setWindowStates((prevWs) => {
            const nextWs = { ...prevWs };
            delete nextWs[tabId];
            return nextWs;
          });
          return;
        }
        // Reset single tab to Home
        setTabs([{ id: prev[0]?.id || "tab-1", title: "Home", route: "/", history: ["/"] }]);
        setCurrentRoute("/");
        setRouteState(null);
        window.history.pushState(null, "", "/");
        return;
      }
      const closeIdx = prev.findIndex((t) => t.id === tabId);
      const remaining = prev.filter((t) => t.id !== tabId);
      setTabs(remaining);
      setWindowStates((prevWs) => {
        const nextWs = { ...prevWs };
        delete nextWs[tabId];
        return nextWs;
      });
      if (activeTabId === tabId) {
        const nextIdx = Math.min(closeIdx, remaining.length - 1);
        const nextTab = remaining[nextIdx];
        setActiveTabId(nextTab.id);
        const base = nextTab.route.includes("?") ? nextTab.route.split("?")[0] : nextTab.route;
        setCurrentRoute(base);
        setRouteState(nextTab.routeState || null);
        if (nextTab.channelId) {
          const ch = channels.find((c) => c.id === nextTab.channelId);
          if (ch) setCurrentChannel(ch);
        }
        window.history.pushState(null, "", nextTab.route);
      }
    },
    [activeTabId, channels, isWindowsMode],
  );

  const handleDuplicateTab = useCallback(
    (tabId: string) => {
      const prev = tabsRef.current;
      const sourceTab = prev.find((t) => t.id === tabId);
      if (!sourceTab) return;
      const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTab: AppTab = {
        ...sourceTab,
        id: newId,
        history: sourceTab.history ? [...sourceTab.history] : [sourceTab.route],
      };
      const idx = prev.findIndex((t) => t.id === tabId);
      const next = [...prev];
      next.splice(idx + 1, 0, newTab);
      setTabs(next);
      if (isWindowsMode) {
        setWindowStates((prevWs) => {
          const ws = createDefaultWindowState(next.length, 40);
          return bringWindowToFront({ ...prevWs, [newId]: ws }, newId, next, true);
        });
      }
      setActiveTabId(newId);
    },
    [isWindowsMode, createDefaultWindowState, bringWindowToFront],
  );

  const handleCloseOtherTabs = useCallback((tabId: string) => {
    setTabs((prev) => {
      const target = prev.find((t) => t.id === tabId);
      return target ? [target] : prev;
    });
    setActiveTabId(tabId);
  }, []);

  // Keyboard shortcuts for Tabbed Sparkle & Windows Mode (Ctrl+T, Ctrl+W, Ctrl+Tab)
  useEffect(() => {
    if (!settings.tabbedSparkle && !settings.windowsMode) return;
    const handleTabKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      // Ctrl+T or Cmd+T: New tab
      if ((e.ctrlKey || e.metaKey) && (e.key === "t" || e.key === "T") && !e.shiftKey) {
        e.preventDefault();
        handleCreateTab("/");
      }
      // Ctrl+W or Cmd+W: Close current tab (only when not typing in text field)
      if ((e.ctrlKey || e.metaKey) && (e.key === "w" || e.key === "W") && !e.shiftKey && !isInput) {
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      // Ctrl+Tab: Switch tab
      if ((e.ctrlKey || e.metaKey) && e.key === "Tab") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex !== -1) {
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + tabs.length) % tabs.length
            : (currentIndex + 1) % tabs.length;
          handleSelectTab(tabs[nextIndex].id);
        }
      }
    };
    window.addEventListener("keydown", handleTabKeys);
    return () => window.removeEventListener("keydown", handleTabKeys);
  }, [
    settings.tabbedSparkle,
    settings.windowsMode,
    activeTabId,
    tabs,
    handleCreateTab,
    handleCloseTab,
    handleSelectTab,
  ]);

  // Navigation handler
  const navigate = useCallback(
    (path: string, state?: any) => {
      if (isWindowsMode) {
        openOrFocusAppWindow(path, state);
        return;
      }
      // If "Open Settings in new tab" is enabled, navigate to settings creates/switches to settings in another tab
      const isSettingsTarget =
        path === "/settings" ||
        path.startsWith("/settings?") ||
        path.startsWith("/settings#") ||
        path.startsWith("/settings/");
      if (settings.openSettingsInNewTab && isSettingsTarget) {
        if (currentRoute === "/settings" || currentRoute.startsWith("/settings")) {
          // Already active on settings
          return;
        }
        if (!settings.tabbedSparkle) {
          updateSetting("tabbedSparkle", true);
        }
        const existingSettingsTab = tabs.find(
          (t) => t.route === "/settings" || t.route.startsWith("/settings"),
        );
        if (existingSettingsTab) {
          handleSelectTab(existingSettingsTab.id);
        } else {
          handleCreateTab(path);
        }
        return;
      }

      // If currently on settings and there are unsaved changes, prompt before leaving
      if (currentRoute === "/settings" && hasChanges) {
        const isStillSettings =
          path === "/settings" || path.startsWith("/settings?") || path.startsWith("/settings#");
        if (!isStillSettings) {
          setPendingNavigation({ path, state });
          setIsUnsavedSettingsModalOpen(true);
          return;
        }
      }

      // If currently editing a note with unsaved edits and attempting to switch to another tab/route, prompt before leaving
      if (unsavedNoteState?.isDirty && path !== currentRoute) {
        setPendingNavigation({ path, state });
        setIsUnsavedNoteModalOpen(true);
        return;
      }

      executeNavigation(path, state);
    },
    [
      isWindowsMode,
      openOrFocusAppWindow,
      currentRoute,
      hasChanges,
      unsavedNoteState,
      executeNavigation,
      settings.openSettingsInNewTab,
      settings.tabbedSparkle,
      tabs,
      handleSelectTab,
      handleCreateTab,
      updateSetting,
    ],
  );

  const handleSaveAndNavigate = () => {
    applyDraftSettings();
    setIsUnsavedSettingsModalOpen(false);
    if (pendingNavigation) {
      executeNavigation(pendingNavigation.path, pendingNavigation.state);
      setPendingNavigation(null);
    }
  };

  const handleDiscardAndNavigate = () => {
    discardDraftSettings();
    setIsUnsavedSettingsModalOpen(false);
    if (pendingNavigation) {
      executeNavigation(pendingNavigation.path, pendingNavigation.state);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigate = () => {
    setIsUnsavedSettingsModalOpen(false);
    setPendingNavigation(null);
  };

  const handleSaveNoteAndNavigate = () => {
    if (unsavedNoteState) {
      unsavedNoteState.save();
    }
    setIsUnsavedNoteModalOpen(false);
    if (pendingNavigation) {
      executeNavigation(pendingNavigation.path, pendingNavigation.state);
      setPendingNavigation(null);
    }
  };

  const handleDiscardNoteAndNavigate = () => {
    if (unsavedNoteState) {
      unsavedNoteState.discard();
    }
    setIsUnsavedNoteModalOpen(false);
    if (pendingNavigation) {
      executeNavigation(pendingNavigation.path, pendingNavigation.state);
      setPendingNavigation(null);
    }
  };

  const handleCancelNoteNavigate = () => {
    setIsUnsavedNoteModalOpen(false);
    setPendingNavigation(null);
  };

  // Open search handler - opens search UI menu (Spotlight search modal / TopBar search)
  const handleOpenSearch = useCallback(() => {
    setIsSpotlightOpen(true);
    window.dispatchEvent(new CustomEvent("vplay:focus-topbar-search"));
  }, []);

  // Global search shortcut: Ctrl+K / Cmd+K vẫn mở page spotlight search (/search)
  useEffect(() => {
    const handleGlobalSearchKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handleGlobalSearchKey);
    return () => window.removeEventListener("keydown", handleGlobalSearchKey);
  }, [navigate]);

  // Global Customizable Keybinds (Alt+1: Home, Alt+2: Search box mới, Alt+3: Tools menu, Alt+4: Settings, Alt+5: Recent Channel)
  useKeyboardShortcuts({
    onHome: useCallback(() => {
      navigate("/");
    }, [navigate]),
    onSearch: useCallback(() => {
      window.dispatchEvent(new CustomEvent("vplay:focus-topbar-search"));
    }, []),
    onTools: useCallback(() => {
      window.dispatchEvent(new CustomEvent("vone:toggle-tools"));
      window.dispatchEvent(new CustomEvent("vplay:toggle-tools"));
    }, []),
    onSettings: useCallback(() => {
      navigate("/settings");
    }, [navigate]),
    onRecentChannel: useCallback(() => {
      let targetChannel = currentChannel;
      try {
        const savedId = localStorage.getItem("vplay_recent_channel_id");
        if (savedId) {
          const found = channels.find((c) => c.id === savedId);
          if (found) targetChannel = found;
        }
      } catch {}
      if (targetChannel) {
        setCurrentChannel(targetChannel);
        navigate(`/live-tv?channel=${targetChannel.slug}`);
      }
    }, [currentChannel, channels, navigate]),
  });

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (currentRoute === "/settings" && hasChanges) {
        window.history.pushState(null, "", "/settings");
        setPendingNavigation({ path: window.location.pathname });
        setIsUnsavedSettingsModalOpen(true);
        return;
      }
      if (unsavedNoteState?.isDirty) {
        window.history.pushState(null, "", currentRoute);
        setPendingNavigation({ path: window.location.pathname });
        setIsUnsavedNoteModalOpen(true);
        return;
      }
      const path = window.location.pathname;
      const isTabSwitch = path !== currentRoute;
      const params = new URLSearchParams(window.location.search);
      const chSlug = params.get("channel");
      if (chSlug) {
        const matched = channels.find((c) => c.slug === chSlug);
        if (matched) setCurrentChannel(matched);
      }
      setCurrentRoute(path);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [channels, currentRoute, hasChanges, unsavedNoteState, triggerUnsavedTooltip]);

  // Handle page reload / unload when settings or note edits are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((currentRoute === "/settings" && hasChanges) || unsavedNoteState?.isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentRoute, hasChanges, unsavedNoteState]);

  // Handle playing a custom single channel
  const handlePlayCustomChannel = (newChannel: Channel) => {
    setChannels((prev) => {
      const exists = prev.some((c) => c.id === newChannel.id);
      if (exists) return prev;
      const updated = [newChannel, ...prev];
      return updated;
    });
    setCurrentChannel(newChannel);
    navigate(`/live-tv?channel=${newChannel.slug}`);
  };

  // Handle adding a custom channel from Add Custom channel modal
  const handleAddCustomChannel = useCallback(
    (newChannel: Channel) => {
      setChannels((prev) => {
        const exists = prev.some((c) => c.id === newChannel.id);
        if (exists) return prev;
        return [newChannel, ...prev];
      });
      try {
        const saved = localStorage.getItem("waves_custom_channels");
        const existing: Channel[] = saved ? JSON.parse(saved) : [];
        const updated = [newChannel, ...existing.filter((c) => c.id !== newChannel.id)];
        localStorage.setItem("waves_custom_channels", JSON.stringify(updated));
      } catch {}
      setCurrentChannel(newChannel);
      navigate(`/live-tv?channel=${newChannel.slug}`);
    },
    [navigate],
  );

  // Handle importing a list of M3U channels
  const handleImportPlaylist = (importedList: Channel[]) => {
    setChannels((prev) => {
      const updated = [...importedList, ...prev];
      try {
        localStorage.setItem("waves_custom_channels", JSON.stringify(importedList));
      } catch {}
      return updated;
    });
    if (importedList.length > 0) {
      setCurrentChannel(importedList[0]);
      navigate(`/live-tv?channel=${importedList[0].slug}`);
    }
  };

  // Render Page Content based on route (supports both single-page mode and multi-window mode)
  const renderContent = (
    routeOverride?: string,
    stateOverride?: any,
    navigateOverride?: (path: string, state?: any) => void,
    channelOverride?: Channel,
  ) => {
    const activeRoute = routeOverride ?? currentRoute;
    const activeState = stateOverride !== undefined ? stateOverride : routeState;
    const activeNav = navigateOverride ?? navigate;
    const activeChannel = channelOverride ?? currentChannel;
    const activeSearchQuery = tabSearchQueries[activeRoute] || "";
    const onActiveSearchChange = (query: string) => {
      setTabSearchQueries((prev) => ({
        ...prev,
        [activeRoute]: query,
      }));
    };

    if (activeRoute.startsWith("/draws/")) return <Draws navigate={activeNav} />;
    if (activeRoute.startsWith("/notes/")) {
      return (
        <NotesApp
          navigate={activeNav}
          onEnterEditor={() => setIsSidebarCollapsed(true)}
          onRegisterUnsavedNote={setUnsavedNoteState}
        />
      );
    }
    if (activeRoute === "/pc-settings" || activeRoute.startsWith("/pc-settings/")) {
      const subCat = activeRoute.startsWith("/pc-settings/")
        ? activeRoute.replace("/pc-settings/", "").split(/[/?#]/)[0]
        : undefined;
      return (
        <PcSettings
          navigate={activeNav}
          routeState={activeState}
          searchQuery={activeSearchQuery}
          onSearchChange={onActiveSearchChange}
          initialCategory={
            (activeState as { initialCategory?: any } | null)?.initialCategory ||
            (subCat as any) ||
            undefined
          }
        />
      );
    }

    // Route matching for news detail: /news/:slug
    if (activeRoute.startsWith("/news/")) {
      const slug = activeRoute.replace("/news/", "");
      return <Article slug={slug} navigate={activeNav} fontSize={articleFontSize} />;
    }

    switch (activeRoute) {
      case "/":
      case "/home":
      case "/home-preview":
        return (
          <HomePreview
            channels={channels}
            onSelectChannel={setCurrentChannel}
            navigate={activeNav}
            routeState={activeState}
          />
        );

      case "/live-tv":
      case "/watch-preview":
        return (
          <LiveTV
            currentChannel={activeChannel}
            onSelectChannel={(ch) => {
              setCurrentChannel(ch);
            }}
            channels={channels}
            onOpenCustomStreamModal={() => setIsCustomStreamModalOpen(true)}
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            navigate={activeNav}
            onUpdateChannel={handleUpdateChannel}
            onRemoveChannel={handleRemoveChannel}
            onAddChannel={handleAddCustomChannel}
            routeState={activeState}
          />
        );

      case "/test":
        return (
          <TestChannels
            currentChannel={activeChannel}
            onSelectChannel={setCurrentChannel}
            channels={channels}
            onOpenCustomStreamModal={() => setIsCustomStreamModalOpen(true)}
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            navigate={activeNav}
            routeState={activeState}
          />
        );

      case "/news":
      case "/updates":
        return (
          <News
            navigate={activeNav}
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            onOpenUpdate={() => setIsUpdating(true)}
            routeState={activeState}
          />
        );

      case "/channels":
        return (
          <Channels
            channels={channels}
            onSelectChannel={setCurrentChannel}
            navigate={activeNav}
            onOpenCustomStreamModal={() => setIsCustomStreamModalOpen(true)}
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            routeState={activeState}
          />
        );

      case "/favorites":
        return (
          <Favorites
            channels={channels}
            onSelectChannel={setCurrentChannel}
            navigate={activeNav}
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            routeState={activeState}
          />
        );

      case "/about":
        return <About navigate={activeNav} routeState={activeState} />;

      case "/auth":
        return <Auth navigate={activeNav} />;

      case "/reset-password":
        return <ResetPassword navigate={activeNav} />;

      case "/feedback":
        return <Feedback navigate={activeNav} routeState={activeState} />;

      case "/winui-3":
        return <WinUI3 navigate={activeNav} routeState={activeState} />;

      case "/settings":
        return (
          <Settings
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            onOpenUpdate={() => setIsUpdating(true)}
            onOpenOfficeTool={handleOpenOfficeTool}
            navigate={activeNav}
            onRestartOobe={handleRestartOobe}
            routeState={activeState}
          />
        );

      case "/search":
        return (
          <ImmersiveSearch
            navigate={activeNav}
            onSelectChannel={setCurrentChannel}
            onClose={() => {
              const target =
                previousRouteRef.current && previousRouteRef.current !== "/search"
                  ? previousRouteRef.current
                  : "/";
              activeNav(target);
            }}
          />
        );

      case "/notes":
      case "/write":
      case "/present":
      case "/table":
        return (
          <NotesApp
            navigate={activeNav}
            onEnterEditor={() => setIsSidebarCollapsed(true)}
            onRegisterUnsavedNote={setUnsavedNoteState}
          />
        );

      case "/gallery":
        return (
          <Gallery navigate={activeNav} searchQuery={activeSearchQuery} routeState={activeState} />
        );

      case "/draws":
        return <Draws navigate={activeNav} />;

      case "/screenbug":
      case "/screenbox":
      case "/vlc":
        return <VLC navigate={activeNav} routeState={activeState} />;

      case "/camera":
        return <Camera navigate={activeNav} />;

      case "/craftmine":
        return <Craftmine />;

      case "/photopea":
        return <Photopea />;

      case "/notepad":
        return <Notepad navigate={activeNav} routeState={activeState} />;

      case "/html-writer":
        return <HtmlWriter routeState={activeState} />;

      case "/pc-settings": {
        const subCat = activeRoute.startsWith("/pc-settings/")
          ? activeRoute.replace("/pc-settings/", "").split(/[/?#]/)[0]
          : undefined;
        return (
          <PcSettings
            navigate={activeNav}
            routeState={activeState}
            searchQuery={activeSearchQuery}
            onSearchChange={onActiveSearchChange}
            initialCategory={
              (activeState as { initialCategory?: any } | null)?.initialCategory ||
              (subCat as any) ||
              undefined
            }
          />
        );
      }

      case "/file-explorer":
        return <FileExplorer navigate={activeNav} routeState={activeState} />;

      case "/calculator":
        return <Calculator navigate={activeNav} />;

      case "/weather":
        return <Weather navigate={activeNav} />;

      default:
        return (
          <HomePreview
            channels={channels}
            onSelectChannel={setCurrentChannel}
            navigate={activeNav}
          />
        );
    }
  };

  const isOfficeRoute = currentRoute.startsWith("/notes") || currentRoute === "/write";

  if (powerTransition) {
    return (
      <WindowsPowerTransitionScreen
        key={powerTransition}
        mode={powerTransition}
        statusDurationMs={5000}
        blankDurationMs={3000}
        onFinish={handlePowerTransitionFinish}
      />
    );
  }

  if (!isSplashFinished) {
    return (
      <>
        {!isBootVideoFinished && settings.animatedBootScreen ? (
          <AnimatedBootScreen onFinish={() => setIsBootVideoFinished(true)} />
        ) : (
          <WindowsBootScreen
            key={bootRunId}
            bootDurationMs={5000}
            blankDurationMs={3000}
            ringSize={28}
            onFinish={handleBootFinish}
          />
        )}
      </>
    );
  }

  if (isOobeOpen) {
    return (
      <NativeKeyboardProvider>
        <SparkleOOBE
          key={`sparkle-oobe-${oobeKey}`}
          isOpen={isOobeOpen}
          onComplete={() => {
            setIsOobeOpen(false);
            setIsSplashFinished(true);
          }}
          navigate={navigate}
        />
        <NativeKeyboard />
        <GlobalToast />
      </NativeKeyboardProvider>
    );
  }

  return (
    <NativeKeyboardProvider>
      <NotesProvider>
        <div
          data-immersive-sidebar={settings.immersiveSidebar}
          data-sidebar-position={settings.sidebarPosition}
          className={`min-h-screen ${
            isWindowsMode
              ? "bg-transparent"
              : settings.superDarkMode
                ? "bg-black"
                : "bg-[#f9f9f9] dark:bg-[#1b1f24]"
          } text-[#111827] dark:text-[#E0E0E6] flex font-sans selection:bg-[#d946ef] selection:text-white dark:selection:bg-[#ff2d92] dark:selection:text-white relative`}
        >
          {/* Fixed atmospheric cosmic / Windows Mode OOBE wallpaper background */}
          <div
            id="fixed-app-background-solid"
            className={`fixed inset-0 pointer-events-none ${
              isWindowsMode ? "z-0" : "-z-50"
            } ${settings.superDarkMode && !isWindowsMode ? "!bg-black" : ""}`}
            style={
              isWindowsMode
                ? {
                    backgroundImage: `url('${resolveDesktopWallpaper(settings).image}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "#16161a",
                    transition: "background-image 0.5s ease",
                  }
                : undefined
            }
            aria-hidden="true"
          />

          {!isWindowsMode && isInkCanvasEditor && !isInkCanvasChromeVisible && (
            <>
              <div
                onMouseEnter={() => setIsInkCanvasChromeVisible(true)}
                className="fixed left-0 top-0 bottom-0 w-3 z-[200]"
              />
              <div
                onMouseEnter={() => setIsInkCanvasChromeVisible(true)}
                className="fixed left-0 top-0 right-0 h-3 z-[200]"
              />
              <div
                onMouseEnter={() => setIsInkCanvasChromeVisible(true)}
                className="fixed left-0 bottom-0 right-0 h-3 z-[200]"
              />
            </>
          )}

          {/* Sidebar Navigation (Desktop + Mobile Drawer) - completely hidden in Windows Mode */}
          {!isWindowsMode &&
            (settings.navigationMode === "sidebar" ||
              isMobileSidebarOpen ||
              mobileDragOffset !== null) &&
            (!isInkCanvasEditor || isInkCanvasChromeVisible) &&
            !isGalleryViewerOpen && (
              <Sidebar
                currentRoute={currentRoute}
                navigate={isWindowsMode ? openOrFocusAppWindow : navigate}
                onOpenSearch={handleOpenSearch}
                onSelectChannel={setCurrentChannel}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
                isMobileOpen={isMobileSidebarOpen}
                mobileDragOffset={mobileDragOffset}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                channels={channels}
                currentChannel={currentChannel}
                onOpenHelp={() => setIsHelpModalOpen(true)}
                onOpenDiscord={() => setIsWelcomeModalOpen(true)}
                onOpenSummarize={(art) => {
                  setSummarizeArticle(art);
                  setIsNewsSummaryOpen(true);
                }}
                onOpenTextToSpeech={(art) => {
                  setTtsArticle(art);
                  setIsTtsOpen(true);
                }}
                onOpenFindWords={() => setIsFindWordsOpen(true)}
                onOpenAddStream={() => setIsAddStreamOpen(true)}
                onImportChannels={handleImportPlaylist}
                onOpenNotifications={() => setIsUnderConstructionOpen(true)}
                fontSize={articleFontSize}
                onChangeFontSize={handleFontSizeChange}
                onOpenUpdate={() => setIsUpdating(true)}
                onOpenOfficeTool={handleOpenOfficeTool}
                isSplashFinished={isSplashFinished}
                tabSearchQuery={currentTabSearchQuery}
                onTabSearchChange={handleTabSearchChange}
              />
            )}

          {/* Main App Container */}
          <div
            style={
              isWindowsMode
                ? {
                    paddingBottom:
                      taskbarLocation === "bottom" ? `${taskbarThickness}px` : undefined,
                    paddingTop: taskbarLocation === "top" ? `${taskbarThickness}px` : undefined,
                    paddingLeft: taskbarLocation === "left" ? `${taskbarThickness}px` : undefined,
                    paddingRight: taskbarLocation === "right" ? `${taskbarThickness}px` : undefined,
                  }
                : undefined
            }
            className={`flex-1 flex flex-col min-w-0 ${
              !isWindowsMode &&
              (currentRoute === "/file-explorer" || currentRoute.startsWith("/file-explorer/"))
                ? "h-screen overflow-hidden"
                : "min-h-screen"
            } transition-[padding] duration-[160ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] ${
              isWindowsMode ? "relative z-[1] !bg-transparent" : "bg-[#f3f3f3] dark:bg-[#1b1f24]"
            } ${
              isWindowsMode
                ? "md:pl-0 md:pr-0"
                : isInkCanvasEditor || isGalleryViewerOpen
                  ? "md:pl-0 md:pr-0 pb-0"
                  : settings.navigationMode === "topbar"
                    ? "md:pl-0 md:pr-0 pb-10"
                    : !settings.dockToSidebar || settings.navigationMode !== "sidebar"
                      ? "md:pl-0 md:pr-0 pb-20"
                      : settings.sidebarPosition === "right"
                        ? isEffectiveCollapsed
                          ? "md:pr-[48px]"
                          : "md:pr-[260px]"
                        : isEffectiveCollapsed
                          ? "md:pl-[48px]"
                          : "md:pl-[260px]"
            }`}
          >
            {isWindowsMode ? (
              /* Windows Mode Desktop Workspace with Floating / Resizable Windows */
              <main
                onMouseDown={() => {
                  setIsStartMenuOpen(false);
                  setDesktopContextMenu(null);
                }}
                onContextMenu={(e) => {
                  if ((e.target as HTMLElement).closest("[data-window-frame]")) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setIsStartMenuOpen(false);
                  setDesktopContextMenu({ x: e.clientX, y: e.clientY });
                }}
                style={{
                  height: isVerticalTaskbar ? "100vh" : `calc(100vh - ${taskbarThickness}px)`,
                }}
                className={`windows-desktop-workspace relative z-[1] flex-1 w-full overflow-hidden !bg-transparent transition-opacity duration-150 ${
                  isDesktopRefreshing ? "opacity-70" : "opacity-100"
                }`}
              >
                {/* Desktop-only Insider Evaluation Watermark (always visible in SodiumOS Mode, behind all windows & UIs) */}
                {isSplashFinished && <EvaluationWatermark isTaskbarFloating={isTaskbarFloating} />}
                {isSplashFinished && (
                  <DesktopIconsLayer
                    viewSize={desktopViewSize}
                    sortBy={desktopSortBy}
                    autoArrange={desktopAutoArrange}
                    snapToGrid={desktopSnapToGrid}
                    taskbarLocation={taskbarLocation}
                    taskbarThickness={taskbarThickness}
                    isTaskbarFloating={isTaskbarFloating}
                    onLaunchRoute={(r, st) => openNewAppWindow(r, st)}
                    onSelectChannel={setCurrentChannel}
                    channels={channels}
                    onClearMenus={() => {
                      setIsStartMenuOpen(false);
                      setDesktopContextMenu(null);
                    }}
                  />
                )}
                <AnimatePresence>
                  {tabs.map((tab) => {
                    const ws = windowStates[tab.id];
                    if (!ws) return null;
                    const winBaseRoute = tab.route.includes("?")
                      ? tab.route.split("?")[0]
                      : tab.route;
                    const winChannel = tab.channelId
                      ? channels.find((c) => c.id === tab.channelId) || currentChannel
                      : currentChannel;
                    const winLowerRoute = winBaseRoute.toLowerCase();
                    const isSubAppSettings =
                      (tab.routeState as { appSection?: string } | undefined)?.appSection ===
                        "settings" &&
                      !winLowerRoute.startsWith("/settings") &&
                      !winLowerRoute.startsWith("/pc-settings");
                    const winSearchPlaceholder = isSubAppSettings
                      ? undefined
                      : winLowerRoute === "/pc-settings" ||
                          winLowerRoute.startsWith("/pc-settings/")
                        ? "Find a setting"
                        : winLowerRoute === "/settings" || winLowerRoute.startsWith("/settings/")
                          ? "Search settings"
                          : winLowerRoute === "/live-tv" || winLowerRoute === "/watch-preview"
                            ? "Search Watch"
                            : winLowerRoute === "/channels"
                              ? "Search Channels"
                              : winLowerRoute === "/favorites"
                                ? "Search Favorites"
                                : winLowerRoute === "/test"
                                  ? "Search Insider Flags"
                                  : winLowerRoute === "/news" || winLowerRoute === "/updates"
                                    ? "Search for articles"
                                    : winLowerRoute === "/gallery" ||
                                        winLowerRoute.startsWith("/gallery/")
                                      ? "Search for photos or files"
                                      : undefined;
                    return (
                      <WindowFrame
                        key={tab.id}
                        tab={tab}
                        windowState={ws}
                        isActive={tab.id === activeTabId && !ws.isMinimized}
                        sidebarOffset={0}
                        isRightSidebar={false}
                        isTaskbarFloating={isTaskbarFloating}
                        canGoBack={(tab.history?.length || 0) > 1}
                        onGoBack={() => handleWindowGoBack(tab.id)}
                        onFocus={() => focusWindow(tab.id)}
                        onClose={() => handleCloseTab(tab.id)}
                        onMinimize={() => handleMinimizeWindow(tab.id)}
                        onToggleMaximize={() => handleToggleMaximizeWindow(tab.id)}
                        onUpdateBounds={(bounds) => handleUpdateWindowBounds(tab.id, bounds)}
                        renderWindowSidebar={({
                          isCompactWindow,
                          isDrawerOpen,
                          onCloseDrawer,
                          isCollapsed,
                          onToggleCollapse,
                        }) => (
                          <WindowAppSidebar
                            currentRoute={winBaseRoute}
                            routeState={tab.routeState}
                            appTitle={tab.title}
                            navigate={(p, s) => navigateInWindow(tab.id, p, s)}
                            canGoBack={(tab.history?.length || 0) > 1}
                            onGoBack={() => handleWindowGoBack(tab.id)}
                            isCompactWindow={isCompactWindow}
                            isCollapsed={isCollapsed}
                            onToggleCollapse={onToggleCollapse}
                            isMobileOpen={isDrawerOpen}
                            onCloseMobile={onCloseDrawer}
                            channels={channels}
                            searchQuery={tabSearchQueries[winBaseRoute] || ""}
                            searchPlaceholder={winSearchPlaceholder}
                            onSearchChange={(q) =>
                              setTabSearchQueries((prev) => ({
                                ...prev,
                                [winBaseRoute]: q,
                              }))
                            }
                          />
                        )}
                        renderBody={() => (
                          <React.Suspense
                            fallback={
                              <div className="w-full h-full flex items-center justify-center p-8 text-xs opacity-60">
                                Loading...
                              </div>
                            }
                          >
                            {renderContent(
                              winBaseRoute,
                              tab.routeState,
                              (p, s) => navigateInWindow(tab.id, p, s),
                              winChannel,
                            )}
                          </React.Suspense>
                        )}
                      />
                    );
                  })}
                </AnimatePresence>
              </main>
            ) : (
              <>
                {/* TopBar Header - hidden on an Ink Canvas sheet until the top edge is hovered or when Gallery media viewer is open */}
                {(!isInkCanvasEditor || isInkCanvasChromeVisible) && !isGalleryViewerOpen && (
                  <TopBar
                    currentRoute={currentRoute}
                    navigate={navigate}
                    tabSearchQuery={currentTabSearchQuery}
                    onTabSearchChange={handleTabSearchChange}
                    onOpenSearch={handleOpenSearch}
                    onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
                    currentChannel={currentChannel}
                    channels={channels}
                    onSelectChannel={setCurrentChannel}
                    onOpenHelp={() => setIsHelpModalOpen(true)}
                    onOpenDiscord={() => setIsWelcomeModalOpen(true)}
                    onOpenSummarize={(art) => {
                      setSummarizeArticle(art);
                      setIsNewsSummaryOpen(true);
                    }}
                    onOpenTextToSpeech={(art) => {
                      setTtsArticle(art);
                      setIsTtsOpen(true);
                    }}
                    onOpenFindWords={() => {
                      setIsFindWordsOpen(true);
                    }}
                    onOpenAddStream={() => setIsAddStreamOpen(true)}
                    onImportChannels={handleImportPlaylist}
                    onOpenNotifications={() => setIsUnderConstructionOpen(true)}
                    fontSize={articleFontSize}
                    onChangeFontSize={handleFontSizeChange}
                    showUnsavedTooltip={showUnsavedTooltip}
                    onDismissUnsavedTooltip={() => setShowUnsavedTooltip(false)}
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onSelectTab={handleSelectTab}
                    onCreateTab={() => handleCreateTab("/")}
                    onCloseTab={handleCloseTab}
                    onDuplicateTab={handleDuplicateTab}
                    onCloseOtherTabs={handleCloseOtherTabs}
                    onReorderTabs={handleReorderTabs}
                  />
                )}

                {/* Dynamic Page Content with slide transition between tab pages like touch keyboard (no splash screen) */}
                <main
                  className={`main-tab-page relative flex-1 w-full mx-auto rounded-tl-none md:rounded-tl-[10px] rounded-tr-none rounded-br-none rounded-bl-none overflow-hidden bg-[#f9f9f9] dark:bg-[#282c31] ${
                    currentRoute === "/" ||
                    currentRoute === "/home" ||
                    currentRoute === "/news" ||
                    currentRoute === "/updates" ||
                    isOfficeRoute ||
                    currentRoute === "/craftmine" ||
                    currentRoute === "/photopea" ||
                    currentRoute === "/vlc" ||
                    currentRoute === "/screenbox" ||
                    currentRoute === "/screenbug" ||
                    currentRoute === "/gallery" ||
                    currentRoute === "/draws" ||
                    currentRoute.startsWith("/draws/") ||
                    currentRoute === "/camera" ||
                    currentRoute === "/calculator" ||
                    currentRoute.startsWith("/calculator/") ||
                    currentRoute === "/weather" ||
                    currentRoute.startsWith("/weather/") ||
                    currentRoute === "/notepad" ||
                    currentRoute.startsWith("/notepad/") ||
                    currentRoute === "/html-writer" ||
                    currentRoute.startsWith("/html-writer/") ||
                    currentRoute === "/pc-settings" ||
                    currentRoute.startsWith("/pc-settings/") ||
                    currentRoute === "/file-explorer" ||
                    currentRoute.startsWith("/file-explorer/")
                      ? "p-0 max-w-none pt-0"
                      : "px-4 sm:px-6 md:px-8 py-5 max-w-7xl"
                  } ${
                    settings.navigationMode === "floaty" && !isOfficeRoute ? "pb-28 sm:pb-32" : ""
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={currentRoute}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="tab-page-slide-wrapper w-full h-full rounded-tl-none md:rounded-tl-[10px] rounded-tr-none rounded-br-none rounded-bl-none overflow-hidden"
                    >
                      <React.Suspense
                        fallback={
                          <div className="w-full h-full flex items-center justify-center p-8 text-xs opacity-60">
                            Loading...
                          </div>
                        }
                      >
                        {renderContent()}
                      </React.Suspense>
                    </motion.div>
                  </AnimatePresence>
                </main>
              </>
            )}
          </div>

          {/* Windows 11 Start Menu & Bottom Taskbar when Windows Mode is active */}
          {isWindowsMode && (
            <>
              <WindowsStartMenu
                isOpen={isStartMenuOpen}
                onClose={() => setIsStartMenuOpen(false)}
                onLaunchRoute={(r, st) => openNewAppWindow(r, st)}
                channels={channels}
                onSelectChannel={setCurrentChannel}
                onRestartOobe={handleRestartOobe}
                onRestartSystem={handleRestartSystem}
                onEndSession={handleEndSession}
                onLockScreen={() => {
                  setIsStartMenuOpen(false);
                  setIsLockScreenOpen(true);
                }}
                onOpenDirectCommand={() => {
                  setIsStartMenuOpen(false);
                  setIsDirectCommandOpen(true);
                }}
                isTaskbarFloating={isTaskbarFloating}
              />
              <WindowsTaskbar
                tabs={tabs}
                activeTabId={activeTabId}
                windowStates={windowStates}
                isDesktopRevealed={!isLockScreenOpen && !isOobeOpen && isSplashFinished}
                isStartMenuOpen={isStartMenuOpen}
                onToggleStartMenu={() => {
                  setIsDirectCommandOpen(false);
                  setIsStartMenuOpen((prev) => !prev);
                }}
                onCloseStartMenu={() => setIsStartMenuOpen(false)}
                isDirectCommandOpen={isDirectCommandOpen}
                onToggleDirectCommand={() => {
                  setIsStartMenuOpen(false);
                  setIsDirectCommandOpen((prev) => !prev);
                }}
                onCloseDirectCommand={() => setIsDirectCommandOpen(false)}
                onTaskbarWindowClick={handleTaskbarWindowClick}
                onLaunchRoute={(r, st) => openOrFocusAppWindow(r, st)}
                onLaunchNewWindow={(r) => openNewAppWindow(r)}
                onCreateNewWindow={(r) => handleCreateTab(r || "/")}
                onCloseWindow={handleCloseTab}
                onMinimizeWindow={handleMinimizeWindow}
                onToggleMaximizeWindow={handleToggleMaximizeWindow}
                onDuplicateWindow={handleDuplicateTab}
                onShowDesktop={handleShowDesktop}
                channels={channels}
                onSelectChannel={setCurrentChannel}
              />
              <AnimatePresence>
                {desktopContextMenu && (
                  <WindowsContextMenu
                    key={`desktop-ctx-${desktopContextMenu.x}-${desktopContextMenu.y}`}
                    x={desktopContextMenu.x}
                    y={desktopContextMenu.y}
                    ariaLabel="Desktop actions"
                    onClose={() => setDesktopContextMenu(null)}
                    items={[
                      {
                        id: "desk-view",
                        label: "View",
                        icon: <LayoutGrid className="w-4 h-4" />,
                        submenu: [
                          {
                            id: "desk-view-large",
                            label: "Large icons",
                            checked: desktopViewSize === "large",
                            onSelect: () => {
                              setDesktopViewSize("large");
                              try {
                                localStorage.setItem("sparkle_desktop_view_size", "large");
                              } catch {}
                            },
                          },
                          {
                            id: "desk-view-medium",
                            label: "Medium icons",
                            checked: desktopViewSize === "medium",
                            onSelect: () => {
                              setDesktopViewSize("medium");
                              try {
                                localStorage.setItem("sparkle_desktop_view_size", "medium");
                              } catch {}
                            },
                          },
                          {
                            id: "desk-view-small",
                            label: "Small icons",
                            checked: desktopViewSize === "small",
                            onSelect: () => {
                              setDesktopViewSize("small");
                              try {
                                localStorage.setItem("sparkle_desktop_view_size", "small");
                              } catch {}
                            },
                          },
                          { id: "desk-view-div-1", divider: true },
                          {
                            id: "desk-view-auto-arrange",
                            label: "Auto-arrange icons",
                            checked: desktopAutoArrange,
                            onSelect: () => {
                              setDesktopAutoArrange((prev) => {
                                const next = !prev;
                                saveAutoArrange(next);
                                return next;
                              });
                            },
                          },
                          {
                            id: "desk-view-snap-grid",
                            label: "Arrange icons to grid",
                            checked: desktopSnapToGrid,
                            onSelect: () => {
                              setDesktopSnapToGrid((prev) => {
                                const next = !prev;
                                saveSnapToGrid(next);
                                return next;
                              });
                            },
                          },
                        ],
                      },
                      {
                        id: "desk-sort-by",
                        label: "Sort by",
                        icon: <ArrowUpDown className="w-4 h-4" />,
                        submenu: [
                          {
                            id: "desk-sort-name",
                            label: "Name",
                            checked: desktopSortBy === "name",
                            onSelect: () => {
                              setDesktopSortBy("name");
                              try {
                                localStorage.setItem("sparkle_desktop_sort_by", "name");
                              } catch {}
                            },
                          },
                          {
                            id: "desk-sort-size",
                            label: "Size",
                            checked: desktopSortBy === "size",
                            onSelect: () => {
                              setDesktopSortBy("size");
                              try {
                                localStorage.setItem("sparkle_desktop_sort_by", "size");
                              } catch {}
                            },
                          },
                          {
                            id: "desk-sort-type",
                            label: "Item type",
                            checked: desktopSortBy === "type",
                            onSelect: () => {
                              setDesktopSortBy("type");
                              try {
                                localStorage.setItem("sparkle_desktop_sort_by", "type");
                              } catch {}
                            },
                          },
                          {
                            id: "desk-sort-modified",
                            label: "Date modified",
                            checked: desktopSortBy === "modified",
                            onSelect: () => {
                              setDesktopSortBy("modified");
                              try {
                                localStorage.setItem("sparkle_desktop_sort_by", "modified");
                              } catch {}
                            },
                          },
                        ],
                      },
                      {
                        id: "desk-refresh",
                        label: "Refresh",
                        icon: <RefreshCw className="w-4 h-4" />,
                        onSelect: () => {
                          setIsDesktopRefreshing(true);
                          window.dispatchEvent(new CustomEvent("sparkle:desktop-refresh"));
                          setTimeout(() => setIsDesktopRefreshing(false), 140);
                        },
                      },
                      { id: "desk-div-1", divider: true },
                      {
                        id: "desk-new",
                        label: "New",
                        icon: <Plus className="w-4 h-4" />,
                        submenu: [
                          {
                            id: "desk-new-window",
                            label: "New window",
                            icon: <AppWindow className="w-4 h-4" />,
                            onSelect: () => handleCreateTab("/"),
                          },
                          {
                            id: "desk-new-note",
                            label: "Text Document (Notes)",
                            icon: <FileText className="w-4 h-4" />,
                            onSelect: () => openNewAppWindow("/notes"),
                          },
                          {
                            id: "desk-new-canvas",
                            label: "Ink Canvas",
                            icon: <Brush className="w-4 h-4" />,
                            onSelect: () => openNewAppWindow("/draws"),
                          },
                          {
                            id: "desk-new-notepad",
                            label: "Text Document (Notepad)",
                            icon: <FileText className="w-4 h-4" />,
                            onSelect: () => openNewAppWindow("/notepad"),
                          },
                          {
                            id: "desk-new-html",
                            label: "HTML Document",
                            icon: <Code2 className="w-4 h-4" />,
                            onSelect: () => openNewAppWindow("/html-writer"),
                          },
                        ],
                      },
                      {
                        id: "desk-direct-command",
                        label: "Direct Command",
                        icon: <Terminal className="w-4 h-4" />,
                        onSelect: () => {
                          setIsStartMenuOpen(false);
                          setIsDirectCommandOpen(true);
                        },
                      },
                      { id: "desk-div-2", divider: true },
                      {
                        id: "desk-background",
                        label: "Desktop background",
                        icon: <Image className="w-4 h-4" />,
                        onSelect: () => {
                          openOrFocusAppWindow("/pc-settings/personalization");
                          window.dispatchEvent(
                            new CustomEvent("sparkle:pc-settings-category", {
                              detail: { category: "personalization" },
                            }),
                          );
                        },
                      },
                      {
                        id: "desk-personalize",
                        label: "Personalize",
                        icon: <Palette className="w-4 h-4" />,
                        onSelect: () => {
                          openOrFocusAppWindow("/pc-settings/personalization");
                          window.dispatchEvent(
                            new CustomEvent("sparkle:pc-settings-category", {
                              detail: { category: "personalization" },
                            }),
                          );
                        },
                      },
                    ]}
                  />
                )}
              </AnimatePresence>
            </>
          )}

          {/* Floaty bar navigation (Tab View) */}
          {!isWindowsMode && settings.navigationMode === "floaty" && !isGalleryViewerOpen && (
            <BottomDock
              currentRoute={currentRoute}
              navigate={navigate}
              currentChannel={currentChannel}
              channels={channels}
              onOpenSearch={handleOpenSearch}
              onOpenHelp={() => setIsHelpModalOpen(true)}
              onOpenDiscord={() => setIsWelcomeModalOpen(true)}
              onOpenSummarize={(art) => {
                setSummarizeArticle(art);
                setIsNewsSummaryOpen(true);
              }}
              onOpenTextToSpeech={(art) => {
                setTtsArticle(art);
                setIsTtsOpen(true);
              }}
              onOpenFindWords={() => {
                setIsFindWordsOpen(true);
              }}
              onOpenAddStream={() => setIsAddStreamOpen(true)}
              onImportChannels={handleImportPlaylist}
              fontSize={articleFontSize}
              onChangeFontSize={handleFontSizeChange}
              searchQuery={currentTabSearchQuery}
              onSearchChange={handleTabSearchChange}
              onOpenSpotlight={() => setIsSpotlightOpen(true)}
              onOpenOfficeTool={handleOpenOfficeTool}
            />
          )}

          {/* Global Modals */}
          <SpotlightModal
            isOpen={isSpotlightOpen}
            onClose={() => setIsSpotlightOpen(false)}
            navigate={navigate}
            onSelectChannel={setCurrentChannel}
          />

          {/* Direct Command Flyout (available in both Windows Mode and standard mode) */}
          <DirectCommandFlyout
            isOpen={isDirectCommandOpen}
            onClose={() => setIsDirectCommandOpen(false)}
            isTaskbarFloating={isTaskbarFloating}
          />

          {/* Unsaved Settings Confirmation Modal */}
          <UnsavedSettingsModal
            isOpen={isUnsavedSettingsModalOpen}
            onSave={handleSaveAndNavigate}
            onDiscard={handleDiscardAndNavigate}
            onCancel={handleCancelNavigate}
          />

          {/* Unsaved Note Confirmation Modal */}
          <UnsavedNoteModal
            isOpen={isUnsavedNoteModalOpen}
            noteTitle={unsavedNoteState?.noteTitle || "Untitled Note"}
            onSave={handleSaveNoteAndNavigate}
            onDiscard={handleDiscardNoteAndNavigate}
            onCancel={handleCancelNoteNavigate}
          />

          <CustomStreamModal
            isOpen={isCustomStreamModalOpen}
            onClose={() => setIsCustomStreamModalOpen(false)}
            onPlayCustomChannel={handlePlayCustomChannel}
            onImportPlaylist={handleImportPlaylist}
          />

          {/* Help Modal */}
          <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

          {/* News Summary Modal */}
          <NewsSummaryModal
            isOpen={isNewsSummaryOpen}
            onClose={() => setIsNewsSummaryOpen(false)}
            article={summarizeArticle}
          />

          {/* Text to Speech Floating Player */}
          <TextToSpeechPlayer
            isOpen={isTtsOpen}
            onClose={() => setIsTtsOpen(false)}
            article={ttsArticle}
          />

          {/* In-Article / News Word Finder */}
          <FindWordsBar isOpen={isFindWordsOpen} onClose={() => setIsFindWordsOpen(false)} />

          {/* Quick Add Stream Modal Dialog (Tên luồng, Địa chỉ luồng) */}
          <AddStreamModal
            isOpen={isAddStreamOpen}
            onClose={() => setIsAddStreamOpen(false)}
            onAddStream={handlePlayCustomChannel}
          />

          {/* Startup / Refresh Welcome Modal */}
          <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />

          {/* Notifications / Under Construction Modal */}
          <UnderConstructionModal
            isOpen={isUnderConstructionOpen}
            onClose={() => setIsUnderConstructionOpen(false)}
          />

          {/* Floating Movable Sticky Note Widget */}
          {!isGalleryViewerOpen && <StickyNoteWidget onNavigateNotes={() => navigate("/notes")} />}

          {/* Windows 11 Fluent In-App Custom Scroller Bar (only needed outside Windows Mode) */}
          {!isWindowsMode && (
            <AppScrollbar
              currentRoute={currentRoute}
              isGalleryViewerOpen={isGalleryViewerOpen}
              isTopBarVisible={
                (!isInkCanvasEditor || isInkCanvasChromeVisible) && !isGalleryViewerOpen
              }
            />
          )}

          {/* App Native Virtual Keyboard for Touch Devices */}
          <NativeKeyboard />

          {/* Global Application Toast Notifications */}
          <GlobalToast />

          {/* Update Sodium Splash Screen (1 minute: 60s) */}
          {isUpdating && (
            <SplashScreen
              duration={60000}
              subtitle="Sodium needs an update - Working on it"
              onFinish={() => setIsUpdating(false)}
            />
          )}

          {/* Windows 11 Lock Screen & Sign-in Overlay */}
          <WindowsLockScreen
            isOpen={isLockScreenOpen}
            onUnlock={() => setIsLockScreenOpen(false)}
            onRestartSystem={handleRestartSystem}
            onExitWindowsMode={() => {
              setIsLockScreenOpen(false);
              updateSetting("windowsMode", false);
            }}
            onNavigate={(route) => {
              setIsLockScreenOpen(false);
              if (isWindowsMode) {
                openOrFocusAppWindow(route);
              } else {
                navigate(route);
              }
            }}
            channels={channels}
          />

          {/* Night light & brightness screen overlays */}
          {displayOverlayState.nightLight && (
            <div
              aria-hidden="true"
              className="fixed inset-0 pointer-events-none z-[2147483645] transition-opacity duration-300"
              style={{ backgroundColor: "rgba(255, 148, 48, 0.16)", mixBlendMode: "multiply" }}
            />
          )}
          {displayOverlayState.brightness < 100 && (
            <div
              aria-hidden="true"
              className="fixed inset-0 pointer-events-none z-[2147483646] transition-opacity duration-150"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${Math.min(0.65, Math.max(0, (100 - displayOverlayState.brightness) * 0.0068)).toFixed(3)})`,
              }}
            />
          )}
        </div>
      </NotesProvider>
    </NativeKeyboardProvider>
  );
}
