import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Accessibility,
  Bluetooth,
  BookOpen,
  Bug,
  CheckSquare,
  CircleDot,
  Clock,
  Compass,
  FileText,
  Film,
  FlaskConical,
  Folder,
  Gamepad2,
  Heart,
  Image as ImageIcon,
  Info,
  Keyboard,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Megaphone,
  Monitor,
  MousePointerClick,
  Music,
  Newspaper,
  Paintbrush,
  Palette,
  RefreshCw,
  Search,
  Shapes,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ToggleRight,
  Tv,
  UserCheck,
  Users,
  Wifi,
  Wrench,
  X,
  MessageSquare,
} from "lucide-react";
import { FluentHomeIcon, FluentSettingsIcon } from "./FluentIcons";
import { useSettings } from "../hooks/useSettings";
import type { Channel } from "../types";

export interface WindowSidebarState {
  appSection?: string;
  initialCategory?: string;
  appTab?: string;
  appFilter?: string;
  appCategory?: string;
  folderId?: string | null;
  sectionNonce?: number;
}

interface WindowAppSidebarProps {
  currentRoute: string;
  routeState?: unknown;
  appTitle: string;
  navigate: (route: string, state?: unknown) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  isCompactWindow?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  channels?: Channel[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

type SidebarEntry =
  | {
      kind: "item";
      id: string;
      label: string;
      icon: React.ReactNode;
      active: boolean;
      onClick: () => void;
    }
  | {
      kind: "divider";
      id: string;
    };

function asSidebarState(value: unknown): WindowSidebarState {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as WindowSidebarState;
  }
  return {};
}

export function getWindowSidebarSurfaceStyle(_theme: string): React.CSSProperties {
  return { backgroundColor: "transparent" };
}

export function getWindowMainContentSurfaceStyle(theme: string): React.CSSProperties {
  return theme === "light"
    ? { backgroundColor: "rgba(255, 255, 255, 0.52)" }
    : { backgroundColor: "rgba(255, 255, 255, 0.055)" };
}

interface WindowMorphingIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dependencyKey: string;
  reduceMotion?: boolean;
}

const WindowMorphingVerticalIndicator: React.FC<WindowMorphingIndicatorProps> = ({
  containerRef,
  dependencyKey,
  reduceMotion = false,
}) => {
  const [bounds, setBounds] = useState<{
    top: number;
    left: number;
    height: number;
    visible: boolean;
  }>({ top: 0, left: 8, height: 36, visible: false });

  const prevTopRef = useRef<number | null>(null);
  const [stretchKey, setStretchKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let rafId: number | null = null;
    let timer1: ReturnType<typeof setTimeout> | null = null;
    let timer2: ReturnType<typeof setTimeout> | null = null;
    let timer3: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      if (isCancelled) return;
      const container = containerRef.current;
      if (!container) return;

      const activeEl = container.querySelector('[data-nav-active="true"]') as HTMLElement | null;
      if (!activeEl) {
        setBounds((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const top = Math.round(activeRect.top - containerRect.top + container.scrollTop);
      const left = Math.round(activeRect.left - containerRect.left);
      const height = Math.round(activeRect.height);

      if (height > 0) {
        setBounds({ top, left, height, visible: true });
      }
    };

    measure();
    rafId = requestAnimationFrame(measure);
    timer1 = setTimeout(measure, 40);
    timer2 = setTimeout(measure, 120);
    timer3 = setTimeout(measure, 300);

    const container = containerRef.current;
    if (container) {
      observer = new ResizeObserver(() => measure());
      observer.observe(container);

      mutationObserver = new MutationObserver(() => measure());
      mutationObserver.observe(container, {
        attributes: true,
        attributeFilter: ["data-nav-active"],
        subtree: true,
      });

      container.addEventListener("scroll", measure, { capture: true, passive: true });
    }

    return () => {
      isCancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      if (observer) observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      if (container) container.removeEventListener("scroll", measure, true);
    };
  }, [dependencyKey, containerRef]);

  const INDICATOR_HEIGHT = 14;
  const centeredTop = bounds.top + Math.round((bounds.height - INDICATOR_HEIGHT) / 2);

  useEffect(() => {
    if (bounds.visible) {
      if (
        !reduceMotion &&
        prevTopRef.current !== null &&
        Math.abs(prevTopRef.current - centeredTop) > 2
      ) {
        setStretchKey((k) => k + 1);
      }
      prevTopRef.current = centeredTop;
    } else {
      prevTopRef.current = null;
    }
  }, [centeredTop, bounds.visible, reduceMotion]);

  if (!bounds.visible) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="absolute w-[3px] h-[14px] z-30 pointer-events-none rounded-full"
      initial={false}
      animate={{
        top: centeredTop,
        left: bounds.left,
        opacity: bounds.visible ? 1 : 0,
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              top: {
                duration: 0.38,
                ease: [0.4, 0.0, 0.2, 1],
              },
              left: {
                duration: 0.38,
                ease: [0.4, 0.0, 0.2, 1],
              },
              opacity: {
                duration: 0.15,
              },
            }
      }
    >
      <motion.div
        key={`win-sidebar-pill-stretch-${stretchKey}`}
        className="w-full h-full bg-[#4cc2ff] rounded-full origin-center"
        initial={{ scaleY: 1 }}
        animate={{
          scaleY: !reduceMotion && stretchKey > 0 ? [1, 2.2, 1] : 1,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 0.38,
                times: [0, 0.5, 1],
                ease: [0.4, 0.0, 0.2, 1],
              }
        }
      />
    </motion.div>
  );
};

export const WindowAppSidebar: React.FC<WindowAppSidebarProps> = ({
  currentRoute,
  routeState,
  appTitle,
  navigate,
  isCompactWindow = false,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  channels = [],
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
}) => {
  const { settings } = useSettings();
  const state = asSidebarState(routeState);
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const drawerNavRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSearchFocusRef = useRef(false);

  useEffect(() => {
    if (!isCollapsed && pendingSearchFocusRef.current) {
      pendingSearchFocusRef.current = false;
      const timer = window.setTimeout(() => {
        desktopSearchInputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isCollapsed]);

  const distinctCategories = useMemo(
    () => Array.from(new Set(channels.map((c) => c.category).filter(Boolean))).slice(0, 6),
    [channels],
  );

  const { headerLabel, entries } = useMemo((): {
    headerLabel: string;
    entries: SidebarEntry[];
  } => {
    const base = (currentRoute || "/").split(/[?#]/)[0]?.toLowerCase() || "/";
    const isAppSettingsOpen = state.appSection === "settings";
    const triggerSection = (targetRoute: string, patch: WindowSidebarState) => {
      navigate(targetRoute, { ...patch, sectionNonce: Date.now() });
      if (isCompactWindow && onCloseMobile) onCloseMobile();
    };

    // 1. Feedback Hub
    if (base === "/feedback" || base.startsWith("/feedback/")) {
      const active = state.appSection || "home";
      return {
        headerLabel: "Feedback Hub",
        entries: [
          {
            kind: "item",
            id: "fb-home",
            label: "Home",
            icon: (
              <FluentHomeIcon className="w-[18px] h-[18px] shrink-0 text-black dark:text-white" />
            ),
            active: !isAppSettingsOpen && active === "home",
            onClick: () => triggerSection("/feedback", { appSection: "home" }),
          },
          {
            kind: "item",
            id: "fb-community",
            label: "Community feedback",
            icon: <Users className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "community",
            onClick: () => triggerSection("/feedback", { appSection: "community" }),
          },
          { kind: "divider", id: "fb-divider" },
          {
            kind: "item",
            id: "fb-suggestion",
            label: "Feature suggestion",
            icon: <Lightbulb className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "suggestion",
            onClick: () => triggerSection("/feedback", { appSection: "suggestion" }),
          },
          {
            kind: "item",
            id: "fb-bug",
            label: "Bug reports",
            icon: <Bug className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "bug",
            onClick: () => triggerSection("/feedback", { appSection: "bug" }),
          },
        ],
      };
    }

    // 2. WinUI 3 Gallery
    if (base === "/winui-3" || base === "/winui" || base.startsWith("/winui-3/")) {
      const active = state.appSection || "home";
      return {
        headerLabel: "WinUI 3 Gallery",
        entries: [
          {
            kind: "item",
            id: "winui-home",
            label: "Home",
            icon: (
              <FluentHomeIcon className="w-[18px] h-[18px] shrink-0 text-black dark:text-white" />
            ),
            active: !isAppSettingsOpen && active === "home",
            onClick: () => triggerSection("/winui-3", { appSection: "home" }),
          },
          {
            kind: "item",
            id: "winui-buttons",
            label: "Buttons",
            icon: <MousePointerClick className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "buttons",
            onClick: () => triggerSection("/winui-3", { appSection: "buttons" }),
          },
          {
            kind: "item",
            id: "winui-toggles",
            label: "Toggles",
            icon: <ToggleRight className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "toggles",
            onClick: () => triggerSection("/winui-3", { appSection: "toggles" }),
          },
          {
            kind: "item",
            id: "winui-sliders",
            label: "Sliders",
            icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "sliders",
            onClick: () => triggerSection("/winui-3", { appSection: "sliders" }),
          },
          {
            kind: "item",
            id: "winui-checkbox",
            label: "Checkbox",
            icon: <CheckSquare className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "checkbox",
            onClick: () => triggerSection("/winui-3", { appSection: "checkbox" }),
          },
          {
            kind: "item",
            id: "winui-radio",
            label: "Radio",
            icon: <CircleDot className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "radio",
            onClick: () => triggerSection("/winui-3", { appSection: "radio" }),
          },
          {
            kind: "item",
            id: "winui-dialogs",
            label: "Dialogs",
            icon: <MessageSquare className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "dialogs",
            onClick: () => triggerSection("/winui-3", { appSection: "dialogs" }),
          },
          {
            kind: "item",
            id: "winui-progress",
            label: "Progress throbber",
            icon: <Loader2 className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "progress",
            onClick: () => triggerSection("/winui-3", { appSection: "progress" }),
          },
          {
            kind: "item",
            id: "winui-icons",
            label: "Fluent icons",
            icon: <Shapes className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "iconography",
            onClick: () => triggerSection("/winui-3", { appSection: "iconography" }),
          },
        ],
      };
    }

    // 3. Watch / Channels / Favorites
    if (
      base === "/live-tv" ||
      base === "/watch-preview" ||
      base === "/channels" ||
      base === "/favorites" ||
      base === "/test"
    ) {
      const activeCat = state.appCategory;
      const items: SidebarEntry[] = [
        {
          kind: "item",
          id: "watch-now",
          label: "Watch live",
          icon: <Tv className="w-4 h-4 shrink-0" />,
          active:
            !isAppSettingsOpen &&
            (base === "/live-tv" || base === "/watch-preview") &&
            (!activeCat || activeCat === "All"),
          onClick: () => triggerSection("/live-tv", { appCategory: "All" }),
        },
        {
          kind: "item",
          id: "watch-channels",
          label: "Channels",
          icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
          active: !isAppSettingsOpen && base === "/channels",
          onClick: () => triggerSection("/channels", {}),
        },
        {
          kind: "item",
          id: "watch-favorites",
          label: "Favorites",
          icon: <Heart className="w-4 h-4 shrink-0" />,
          active: !isAppSettingsOpen && base === "/favorites",
          onClick: () => triggerSection("/favorites", {}),
        },
      ];
      if (distinctCategories.length > 0) {
        items.push({ kind: "divider", id: "watch-divider" });
        distinctCategories.forEach((cat) => {
          items.push({
            kind: "item",
            id: `watch-cat-${cat}`,
            label: cat,
            icon: <Tv className="w-4 h-4 shrink-0 opacity-80" />,
            active: !isAppSettingsOpen && base === "/live-tv" && activeCat === cat,
            onClick: () => triggerSection("/live-tv", { appCategory: cat }),
          });
        });
      }
      return { headerLabel: "Watch", entries: items };
    }

    // 4. Update blogs / Feed
    if (base === "/news" || base.startsWith("/news/") || base === "/updates") {
      const activeTab = state.appTab || "All";
      return {
        headerLabel: "Update blogs",
        entries: [
          {
            kind: "item",
            id: "news-all",
            label: "All",
            icon: <Newspaper className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && base === "/news" && activeTab === "All",
            onClick: () => triggerSection("/news", { appTab: "All" }),
          },
          {
            kind: "item",
            id: "news-insider",
            label: "Insider",
            icon: <FlaskConical className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && base === "/news" && activeTab === "Insider",
            onClick: () => triggerSection("/news", { appTab: "Insider" }),
          },
          {
            kind: "item",
            id: "news-releases",
            label: "Releases",
            icon: <BookOpen className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && base === "/news" && activeTab === "Releases",
            onClick: () => triggerSection("/news", { appTab: "Releases" }),
          },
          {
            kind: "item",
            id: "news-others",
            label: "Others",
            icon: <Megaphone className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && base === "/news" && activeTab === "Others",
            onClick: () => triggerSection("/news", { appTab: "Others" }),
          },
          { kind: "divider", id: "news-divider" },
          {
            kind: "item",
            id: "news-updates",
            label: "Changelog",
            icon: <RefreshCw className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && base === "/updates",
            onClick: () => triggerSection("/updates", {}),
          },
        ],
      };
    }

    // 5. Gallery
    if (base === "/gallery" || base.startsWith("/gallery/")) {
      const activeFilter = state.appFilter || "all";
      return {
        headerLabel: "Photos Gallery",
        entries: [
          {
            kind: "item",
            id: "gal-all",
            label: "All media",
            icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "all",
            onClick: () => triggerSection("/gallery", { appFilter: "all", folderId: null }),
          },
          {
            kind: "item",
            id: "gal-images",
            label: "Images",
            icon: <ImageIcon className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "image",
            onClick: () => triggerSection("/gallery", { appFilter: "image" }),
          },
          {
            kind: "item",
            id: "gal-videos",
            label: "Videos",
            icon: <Film className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "video",
            onClick: () => triggerSection("/gallery", { appFilter: "video" }),
          },
          {
            kind: "item",
            id: "gal-audio",
            label: "Audio",
            icon: <Music className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "audio",
            onClick: () => triggerSection("/gallery", { appFilter: "audio" }),
          },
          {
            kind: "item",
            id: "gal-docs",
            label: "Documents",
            icon: <FileText className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "document",
            onClick: () => triggerSection("/gallery", { appFilter: "document" }),
          },
          { kind: "divider", id: "gal-divider" },
          {
            kind: "item",
            id: "gal-favorites",
            label: "Favorites",
            icon: <Heart className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "favorites",
            onClick: () => triggerSection("/gallery", { appFilter: "favorites" }),
          },
          {
            kind: "item",
            id: "gal-folders",
            label: "Folders",
            icon: <Folder className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && activeFilter === "folders",
            onClick: () => triggerSection("/gallery", { appFilter: "folders" }),
          },
        ],
      };
    }

    // 6. PC Settings
    if (base === "/pc-settings" || base.startsWith("/pc-settings/")) {
      const subCat = base.startsWith("/pc-settings/")
        ? base.replace("/pc-settings/", "").split(/[/?#]/)[0]
        : undefined;
      const activeCat = state.appSection || state.initialCategory || subCat || "home";
      const selectPcCategory = (catId: string) =>
        triggerSection("/pc-settings", { appSection: catId, initialCategory: catId });
      return {
        headerLabel: "PC Settings",
        entries: [
          {
            kind: "item",
            id: "pc-home",
            label: "Home",
            icon: (
              <FluentHomeIcon className="w-[18px] h-[18px] shrink-0 text-black dark:text-white" />
            ),
            active: activeCat === "home",
            onClick: () => selectPcCategory("home"),
          },
          { kind: "divider", id: "pc-divider-top" },
          {
            kind: "item",
            id: "pc-system",
            label: "System",
            icon: <Monitor className="w-4 h-4 shrink-0" />,
            active: activeCat === "system",
            onClick: () => selectPcCategory("system"),
          },
          {
            kind: "item",
            id: "pc-bluetooth",
            label: "Bluetooth & devices",
            icon: <Bluetooth className="w-4 h-4 shrink-0" />,
            active: activeCat === "bluetooth",
            onClick: () => selectPcCategory("bluetooth"),
          },
          {
            kind: "item",
            id: "pc-network",
            label: "Network & internet",
            icon: <Wifi className="w-4 h-4 shrink-0" />,
            active: activeCat === "network",
            onClick: () => selectPcCategory("network"),
          },
          {
            kind: "item",
            id: "pc-personalization",
            label: "Personalization",
            icon: <Paintbrush className="w-4 h-4 shrink-0" />,
            active: activeCat === "personalization",
            onClick: () => selectPcCategory("personalization"),
          },
          {
            kind: "item",
            id: "pc-apps",
            label: "Apps",
            icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
            active: activeCat === "apps",
            onClick: () => selectPcCategory("apps"),
          },
          {
            kind: "item",
            id: "pc-accounts",
            label: "Accounts",
            icon: <UserCheck className="w-4 h-4 shrink-0" />,
            active: activeCat === "accounts",
            onClick: () => selectPcCategory("accounts"),
          },
          {
            kind: "item",
            id: "pc-time",
            label: "Time & language",
            icon: <Clock className="w-4 h-4 shrink-0" />,
            active: activeCat === "time",
            onClick: () => selectPcCategory("time"),
          },
          {
            kind: "item",
            id: "pc-gaming",
            label: "Gaming",
            icon: <Gamepad2 className="w-4 h-4 shrink-0" />,
            active: activeCat === "gaming",
            onClick: () => selectPcCategory("gaming"),
          },
          {
            kind: "item",
            id: "pc-accessibility",
            label: "Accessibility",
            icon: <Accessibility className="w-4 h-4 shrink-0" />,
            active: activeCat === "accessibility",
            onClick: () => selectPcCategory("accessibility"),
          },
          {
            kind: "item",
            id: "pc-privacy",
            label: "Privacy & security",
            icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
            active: activeCat === "privacy",
            onClick: () => selectPcCategory("privacy"),
          },
          { kind: "divider", id: "pc-divider-bottom" },
          {
            kind: "item",
            id: "pc-update",
            label: "Sodium Update",
            icon: <RefreshCw className="w-4 h-4 shrink-0" />,
            active: activeCat === "update",
            onClick: () => selectPcCategory("update"),
          },
        ],
      };
    }

    // 7. Settings
    if (base === "/settings" || base.startsWith("/settings/")) {
      const active = state.appSection || "top";
      return {
        headerLabel: "Settings",
        entries: [
          {
            kind: "item",
            id: "set-all",
            label: "All settings",
            icon: (
              <FluentSettingsIcon className="w-[18px] h-[18px] shrink-0 settings-spin-icon text-black dark:text-white" />
            ),
            active: active === "top",
            onClick: () => triggerSection("/settings", { appSection: "top" }),
          },
          {
            kind: "item",
            id: "set-experimental",
            label: "Experimental",
            icon: <FlaskConical className="w-4 h-4 shrink-0" />,
            active: active === "settings-section-experimental",
            onClick: () =>
              triggerSection("/settings", { appSection: "settings-section-experimental" }),
          },
          {
            kind: "item",
            id: "set-interface",
            label: "Interface",
            icon: <Palette className="w-4 h-4 shrink-0" />,
            active: active === "settings-section-interface",
            onClick: () =>
              triggerSection("/settings", { appSection: "settings-section-interface" }),
          },
          {
            kind: "item",
            id: "set-keyboard",
            label: "Keyboard & input",
            icon: <Keyboard className="w-4 h-4 shrink-0" />,
            active: active === "settings-section-keyboard",
            onClick: () => triggerSection("/settings", { appSection: "settings-section-keyboard" }),
          },
          {
            kind: "item",
            id: "set-tools",
            label: "Tools",
            icon: <Wrench className="w-4 h-4 shrink-0" />,
            active: active === "settings-section-tools",
            onClick: () => triggerSection("/settings", { appSection: "settings-section-tools" }),
          },
          {
            kind: "item",
            id: "set-version",
            label: "Version & info",
            icon: <Info className="w-4 h-4 shrink-0" />,
            active: active === "settings-section-version",
            onClick: () => triggerSection("/settings", { appSection: "settings-section-version" }),
          },
        ],
      };
    }

    // 7. About
    if (base === "/about") {
      const active = state.appSection || "top";
      return {
        headerLabel: "About",
        entries: [
          {
            kind: "item",
            id: "about-overview",
            label: "Overview",
            icon: <Info className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "top",
            onClick: () => triggerSection("/about", { appSection: "top" }),
          },
          {
            kind: "item",
            id: "about-disclaimer",
            label: "Disclaimer",
            icon: <Shield className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "about-disclaimer-card",
            onClick: () => triggerSection("/about", { appSection: "about-disclaimer-card" }),
          },
          {
            kind: "item",
            id: "about-community",
            label: "Community",
            icon: <Users className="w-4 h-4 shrink-0" />,
            active: !isAppSettingsOpen && active === "about-community-card",
            onClick: () => triggerSection("/about", { appSection: "about-community-card" }),
          },
        ],
      };
    }

    // 8. Discover / Home (default fallback)
    const activeHome = state.appSection || "top";
    return {
      headerLabel: appTitle || "Discover",
      entries: [
        {
          kind: "item",
          id: "home-overview",
          label: "Home",
          icon: (
            <FluentHomeIcon className="w-[18px] h-[18px] shrink-0 text-black dark:text-white" />
          ),
          active: !isAppSettingsOpen && activeHome === "top",
          onClick: () => triggerSection("/", { appSection: "top" }),
        },
        {
          kind: "item",
          id: "home-recommended",
          label: "Recommended",
          icon: <Sparkles className="w-4 h-4 shrink-0" />,
          active: !isAppSettingsOpen && activeHome === "recommended",
          onClick: () => triggerSection("/", { appSection: "recommended" }),
        },
        {
          kind: "item",
          id: "home-quick",
          label: "Quick access",
          icon: <Compass className="w-4 h-4 shrink-0" />,
          active: !isAppSettingsOpen && activeHome === "quick-access",
          onClick: () => triggerSection("/", { appSection: "quick-access" }),
        },
      ],
    };
  }, [currentRoute, state, appTitle, navigate, isCompactWindow, onCloseMobile, distinctCategories]);

  const showTooltip = (label: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  };

  const renderNavItems = (collapsed: boolean) => (
    <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-3 space-y-0.5">
      {entries.map((entry) => {
        if (entry.kind === "divider") {
          return (
            <div
              key={entry.id}
              role="separator"
              className="my-2 mx-1.5 h-[1px] bg-black/10 dark:bg-white/10"
            />
          );
        }
        return (
          <button
            key={entry.id}
            type="button"
            data-nav-active={entry.active ? "true" : undefined}
            onClick={entry.onClick}
            onMouseEnter={collapsed ? (e) => showTooltip(entry.label, e) : undefined}
            onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
            aria-label={entry.label}
            aria-current={entry.active ? "page" : undefined}
            className={`sidebar-nav-item relative w-full h-[32px] flex items-center ${
              collapsed ? "justify-center px-0" : "gap-3 px-3"
            } rounded-[6px] text-[13px] text-left transition-colors cursor-pointer border-none ${
              entry.active
                ? "bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs"
                : "text-black/80 dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white font-normal"
            }`}
          >
            <span className="flex items-center justify-center shrink-0">{entry.icon}</span>
            {!collapsed && <span className="truncate">{entry.label}</span>}
          </button>
        );
      })}
    </div>
  );

  const baseRoute = (currentRoute || "/").split(/[?#]/)[0]?.toLowerCase() || "/";
  const isGlobalSettingsRoute = baseRoute === "/settings" || baseRoute.startsWith("/settings/");
  const isPcSettingsRoute = baseRoute === "/pc-settings" || baseRoute.startsWith("/pc-settings/");
  const isSettingsActive = isGlobalSettingsRoute || state.appSection === "settings";

  const handleOpenAppSettings = () => {
    if (isGlobalSettingsRoute) {
      navigate("/settings", { appSection: "top", sectionNonce: Date.now() });
    } else if (baseRoute.startsWith("/news/")) {
      navigate("/news", { appSection: "settings", sectionNonce: Date.now() });
    } else {
      navigate(baseRoute, { appSection: "settings", sectionNonce: Date.now() });
    }
    if (isCompactWindow && onCloseMobile) onCloseMobile();
  };

  const renderFooterSettings = (collapsed: boolean) => (
    <div className="p-2 border-t border-black/[0.06] dark:border-white/[0.07] shrink-0">
      <button
        type="button"
        data-nav-active={isSettingsActive ? "true" : undefined}
        onClick={handleOpenAppSettings}
        onMouseEnter={collapsed ? (e) => showTooltip("Settings", e) : undefined}
        onMouseLeave={collapsed ? () => setTooltip(null) : undefined}
        aria-label="Settings"
        aria-current={isSettingsActive ? "page" : undefined}
        className={`sidebar-nav-item relative w-full h-[32px] flex items-center ${
          collapsed ? "justify-center px-0" : "gap-3 px-3"
        } rounded-[6px] text-[13px] text-left transition-colors cursor-pointer border-none ${
          isSettingsActive
            ? "bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs"
            : "text-black/80 dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white font-normal"
        }`}
      >
        <FluentSettingsIcon className="w-[18px] h-[18px] shrink-0 settings-spin-icon text-black dark:text-white" />
        {!collapsed && <span className="truncate">Settings</span>}
      </button>
    </div>
  );

  // Match the parent Mica frame's background & opacity, just slightly brighter
  const embeddedSurfaceStyle = getWindowSidebarSurfaceStyle(settings.theme);
  const hasSearch = Boolean(searchPlaceholder && onSearchChange);
  const indicatorDependencyKey = `${currentRoute}|${entries.length}|${isCollapsed}|${hasSearch}|${state.appSection || ""}|${state.initialCategory || ""}|${state.appTab || ""}|${state.appFilter || ""}|${state.appCategory || ""}|${state.folderId || ""}|${isSettingsActive}|${isMobileOpen}`;

  const renderSidebarSearch = (
    collapsed: boolean,
    inputRef?: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (!hasSearch || !onSearchChange) return null;
    if (collapsed) {
      return (
        <div className="px-2 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              pendingSearchFocusRef.current = true;
              onToggleCollapse?.();
            }}
            onMouseEnter={(e) => showTooltip(searchPlaceholder || "Search", e)}
            onMouseLeave={() => setTooltip(null)}
            aria-label={searchPlaceholder || "Search"}
            className="sidebar-nav-item relative w-full h-[36px] flex items-center justify-center rounded-[6px] text-black/80 dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none"
          >
            <Search className="w-4 h-4 shrink-0" />
          </button>
        </div>
      );
    }

    return (
      <div className="px-2.5 pb-2.5 shrink-0">
        <div className="fluent-search-box relative flex items-center gap-2 px-3 h-[36px] bg-white/80 dark:bg-[#2c3037]/85 focus-within:bg-white dark:focus-within:bg-[#2c3037] rounded-[6px] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && searchQuery) {
                e.stopPropagation();
                onSearchChange("");
              }
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="flex-1 min-w-0 bg-transparent text-[12.5px] text-[#111827] dark:text-white placeholder-[#6b7280] dark:placeholder-[#9ca3af] outline-none border-none leading-none py-0"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange("");
                inputRef?.current?.focus();
              }}
              aria-label="Clear search"
              className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer shrink-0 border-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#9ca3af] shrink-0 pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  const overlaySurfaceStyle =
    settings.theme === "light"
      ? {
          backgroundColor: "rgba(250, 250, 250, 0.91)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0) 45%)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
        }
      : {
          backgroundColor: "rgba(44, 48, 55, 0.9)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 45%)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
        };

  return (
    <>
      {/* Desktop / wide-window embedded NavigationView */}
      {!isCompactWindow && (
        <aside
          aria-label={`${headerLabel} navigation`}
          style={embeddedSurfaceStyle}
          className={`flex relative h-full flex-col pt-1.5 text-[#111827] dark:text-white select-none shrink-0 overflow-hidden transition-[width] duration-150 ${
            isCollapsed ? "w-[52px]" : "w-[248px]"
          }`}
        >
          {renderSidebarSearch(isCollapsed, desktopSearchInputRef)}
          <div
            ref={desktopNavRef}
            className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <WindowMorphingVerticalIndicator
              containerRef={desktopNavRef}
              dependencyKey={indicatorDependencyKey}
              reduceMotion={settings.reduceAllMotion}
            />
            {renderNavItems(isCollapsed)}
            {!isPcSettingsRoute && renderFooterSettings(isCollapsed)}
          </div>
        </aside>
      )}

      {/* Compact-window overlay drawer triggered from WindowFrame titlebar hamburger button */}
      <AnimatePresence>
        {isCompactWindow && isMobileOpen && (
          <div className="absolute inset-0 z-[150] flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            />
            <motion.aside
              aria-label={`${headerLabel} navigation`}
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={overlaySurfaceStyle}
              className="relative z-10 w-[252px] max-w-[82%] h-full flex flex-col border-r border-[#e5e5e5] dark:border-[#2e2e2e] text-[#111827] dark:text-white select-none shadow-xl"
            >
              <div className="px-2.5 pt-2.5 pb-2 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation"
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                >
                  <X className="w-4 h-4 stroke-[1.75]" />
                </button>
              </div>
              {renderSidebarSearch(false)}
              <div
                ref={drawerNavRef}
                className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <WindowMorphingVerticalIndicator
                  containerRef={drawerNavRef}
                  dependencyKey={indicatorDependencyKey}
                  reduceMotion={settings.reduceAllMotion}
                />
                {renderNavItems(false)}
                {!isPcSettingsRoute && renderFooterSettings(false)}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed hover tooltip */}
      {isCollapsed && tooltip && !isCompactWindow && (
        <div
          style={{ top: tooltip.top, left: tooltip.left }}
          className="fixed -translate-y-1/2 z-[9999] pointer-events-none px-2.5 py-1 rounded-[5px] bg-[#2c3037] text-white text-[11.5px] font-medium shadow-md border border-white/10 whitespace-nowrap"
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
};
