// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { getAppLaunchRoute } from "../utils/windowInstances";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  ChevronUp,
  ChevronRight,
  Wifi,
  Volume2,
  VolumeX,
  Plus,
  X,
  Minus,
  Square,
  Copy,
  Sun,
  Moon,
  Sparkles,
  Keyboard,
  LogOut,
  Settings as SettingsIcon,
  Search,
  Globe,
  Layers,
  Monitor,
  Pin,
  PinOff,
  ExternalLink,
  PanelBottom,
  PanelTop,
  PanelLeft,
  PanelRight,
  Plane,
  Leaf,
  Share2,
  Sunset,
  Pencil,
  Gauge,
  Paintbrush,
  FolderOpen,
  StickyNote,
  Camera,
  Terminal,
  Bluetooth,
  RotateCcw,
  Check,
  ChevronLeft,
  Calculator as CalculatorIcon,
} from "lucide-react";
import { WindowsContextMenu } from "./WindowsContextMenu";
import {
  contextMenuMotionProps,
  contextMenuUpMotionProps,
  flyoutPanelClassName,
  flyoutPanelStyle,
} from "./FlyoutDropdown";
import {
  useSettings,
  SystemSettings,
  getTaskbarThicknessPx,
  FLOAT_BAR_BOTTOM_GAP_PX,
} from "../hooks/useSettings";
import { useNotes } from "../context/NotesContext";
import { type AppTab } from "./SparkleTabBar";
import { StartMenuRouteIcon, START_APP_ICONS } from "./StartAppIcons";
import { type AppWindowState } from "./WindowFrame";
import {
  Fluent3DWatchIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DArticlesIcon,
  Fluent3DGalleryIcon,
  Fluent3DNotesIcon,
  Fluent3DSettingsIcon,
  Fluent3DCraftmineIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DScreenbugIcon,
  Fluent3DDrawsIcon,
  Fluent3DFolderSearchIcon,
  Fluent3DCalculatorIcon,
  Fluent3DMapsIcon,
  Fluent3DMailIcon,
  Fluent3DUpdatesIcon,
  Fluent3DDiscordIcon,
  Fluent3DFileExplorerIcon,
} from "./Fluent3DIcons";
import { FluentHomeIcon, FluentSearchIcon } from "./FluentIcons";
import { FluentEmojiText } from "./FluentEmoji";
import { NEWS_DATA } from "../data/news";
import { Channel } from "../types";
import { galleryDB, GalleryMediaItem } from "../services/galleryStorage";
import { showAppToast } from "../utils/toast";
import { useCityWeather } from "../hooks/useCityWeather";
import {
  usePinState,
  pinActions,
  isRoutePinnedToTaskbar,
  findStartAppForRoute,
  canonicalPinRoute,
  taskbarPinId,
} from "../services/pinStore";
import { WindowsWidgetsBoard, CITY_WEATHER_DATA, loadWidgetsPrefs } from "./WindowsWidgetsBoard";
import { setSodiumDragData, type SodiumDragPayload } from "../utils/sodiumDragData";

interface TaskbarWeatherIconProps {
  temp?: number;
  condition?: "cloudy" | "sunny" | "rain" | "partly";
  weatherCode?: number;
  isDay?: boolean;
  className?: string;
}

export const TaskbarWeatherIcon: React.FC<TaskbarWeatherIconProps> = ({
  temp = 23,
  condition = "cloudy",
  weatherCode,
  isDay = true,
  className = "w-6 h-6",
}) => {
  const uid = useId().replace(/:/g, "");
  const sunHot = temp >= 30;
  const sunCool = temp <= 17;
  const sunTop = sunHot ? "#FDBA74" : sunCool ? "#FEF9C3" : "#FEF08A";
  const sunMid = sunHot ? "#F97316" : sunCool ? "#FACC15" : "#F59E0B";
  const sunBot = sunHot ? "#DC2626" : sunCool ? "#EAB308" : "#EA580C";
  const cloudTop = temp <= 16 ? "#F0F9FF" : "#FFFFFF";
  const cloudBot = temp <= 16 ? "#93C5FD" : "#CBD5E1";

  const isStorm = typeof weatherCode === "number" && weatherCode >= 90;
  const isRain = condition === "rain" || (typeof weatherCode === "number" && weatherCode >= 51);
  const isFog = typeof weatherCode === "number" && weatherCode >= 45 && weatherCode < 50;
  const isPartly = condition === "partly" || weatherCode === 2;
  const isClear = condition === "sunny" || (typeof weatherCode === "number" && weatherCode <= 1);

  if (isStorm) {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient
            id={`${uid}_storm_c`}
            x1="12"
            y1="10"
            x2="36"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>
        <path
          d="M14 32h20a7.5 7.5 0 0 0 1.3-14.88A10.2 10.2 0 0 0 15.2 15.5a8.2 8.2 0 0 0-1.2 16.5Z"
          fill={`url(#${uid}_storm_c)`}
        />
        <path d="M25.5 27l-4.5 8h4.2l-1.7 7 6.5-9.5h-4.3L28 27h-2.5Z" fill="#FACC15" />
        <path
          d="M16 36l-1.5 4.5M34 36l-1.5 4.5"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (isRain) {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id={`${uid}_rsun`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor={sunTop} />
            <stop offset="100%" stopColor={sunMid} />
          </radialGradient>
          <linearGradient
            id={`${uid}_rcloud`}
            x1="12"
            y1="12"
            x2="36"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={cloudTop} />
            <stop offset="100%" stopColor={cloudBot} />
          </linearGradient>
        </defs>
        {isDay && typeof weatherCode === "number" && weatherCode >= 80 && (
          <circle cx="32" cy="14" r="7.5" fill={`url(#${uid}_rsun)`} />
        )}
        <path
          d="M14.5 32h20a7.5 7.5 0 0 0 1.4-14.87A10.2 10.2 0 0 0 15.5 15.6a8.2 8.2 0 0 0-1 16.4Z"
          fill={`url(#${uid}_rcloud)`}
        />
        <path
          d="M17.5 36.5l-2 5.2M24.5 36.5l-2 5.2M31.5 36.5l-2 5.2"
          stroke="#38BDF8"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (isClear) {
    if (!isDay) {
      return (
        <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient
              id={`${uid}_moon`}
              x1="12"
              y1="8"
              x2="36"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <path
            d="M31.8 30.6A12.5 12.5 0 0 1 17.4 16.2a12.6 12.6 0 0 1 2.2-7.1 13.5 13.5 0 1 0 19.3 19.3 12.6 12.6 0 0 1-7.1 2.2Z"
            fill={`url(#${uid}_moon)`}
          />
          <circle cx="34" cy="13" r="2" fill="#FEF08A" />
          <circle cx="38" cy="20" r="1.4" fill="#FDE047" />
        </svg>
      );
    }
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id={`${uid}_sun`} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor={sunTop} />
            <stop offset="55%" stopColor={sunMid} />
            <stop offset="100%" stopColor={sunBot} />
          </radialGradient>
        </defs>
        {sunHot && <circle cx="24" cy="24" r="20" fill={sunMid} fillOpacity="0.22" />}
        <circle cx="24" cy="24" r="14.5" fill={`url(#${uid}_sun)`} />
      </svg>
    );
  }

  if (isFog) {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient
            id={`${uid}_fcloud`}
            x1="12"
            y1="12"
            x2="36"
            y2="30"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={cloudTop} />
            <stop offset="100%" stopColor={cloudBot} />
          </linearGradient>
        </defs>
        <path
          d="M14 29h20a7 7 0 0 0 1.2-13.9A9.6 9.6 0 0 0 15.8 14a7.5 7.5 0 0 0-1.8 15Z"
          fill={`url(#${uid}_fcloud)`}
        />
        <path d="M11 34.5h26M14 39.5h20" stroke="#94A3B8" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (isPartly) {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id={`${uid}_psun`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={sunTop} />
            <stop offset="58%" stopColor={sunMid} />
            <stop offset="100%" stopColor={sunBot} />
          </radialGradient>
          <linearGradient
            id={`${uid}_pcloud`}
            x1="12"
            y1="16"
            x2="36"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={cloudTop} />
            <stop offset="100%" stopColor={cloudBot} />
          </linearGradient>
        </defs>
        {isDay ? (
          <circle cx="30" cy="17" r="9.5" fill={`url(#${uid}_psun)`} />
        ) : (
          <path
            d="M33 21.5a7.5 7.5 0 0 1-8.5-8.5 8 8 0 1 0 10.5 10.5 7.2 7.2 0 0 1-2-.2Z"
            fill="#FDE047"
          />
        )}
        <path
          d="M14 35h19.5a7.5 7.5 0 0 0 1.3-14.88A10 10 0 0 0 15.1 19a8 8 0 0 0-1.1 16Z"
          fill={`url(#${uid}_pcloud)`}
        />
      </svg>
    );
  }

  // Overcast / Cloudy
  return (
    <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient
          id={`${uid}_cfront`}
          x1="10"
          y1="14"
          x2="38"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={cloudTop} />
          <stop offset="100%" stopColor={cloudBot} />
        </linearGradient>
        <linearGradient
          id={`${uid}_cback`}
          x1="20"
          y1="10"
          x2="40"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      <path
        d="M20 27h16a6 6 0 0 0 1-11.9 8.2 8.2 0 0 0-15.6-1.4A6.5 6.5 0 0 0 20 27Z"
        fill={`url(#${uid}_cback)`}
      />
      <path
        d="M13 35h20a7.2 7.2 0 0 0 1.2-14.3 9.5 9.5 0 0 0-18.3-1.2A7.6 7.6 0 0 0 13 35Z"
        fill={`url(#${uid}_cfront)`}
      />
    </svg>
  );
};

interface PcQuickState {
  brightness: number;
  nightLight: boolean;
  airplaneMode: boolean;
  energySaver: boolean;
  nearbySharing: boolean;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  soundVolume: number;
  soundMuted: boolean;
}

const PC_SETTINGS_KEY = "sparkle_pc_settings_v1";

function readPcQuickState(): PcQuickState {
  try {
    const raw = localStorage.getItem(PC_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PcQuickState & { powerMode?: string }>;
      return {
        brightness: typeof parsed.brightness === "number" ? parsed.brightness : 82,
        nightLight: Boolean(parsed.nightLight),
        airplaneMode: Boolean(parsed.airplaneMode),
        energySaver: typeof parsed.energySaver === "boolean" ? parsed.energySaver : true,
        nearbySharing: Boolean(parsed.nearbySharing),
        wifiEnabled: typeof parsed.wifiEnabled === "boolean" ? parsed.wifiEnabled : true,
        bluetoothEnabled:
          typeof parsed.bluetoothEnabled === "boolean" ? parsed.bluetoothEnabled : true,
        soundVolume: typeof parsed.soundVolume === "number" ? parsed.soundVolume : 72,
        soundMuted: Boolean(parsed.soundMuted),
      };
    }
  } catch {}
  return {
    brightness: 82,
    nightLight: false,
    airplaneMode: false,
    energySaver: true,
    nearbySharing: false,
    wifiEnabled: true,
    bluetoothEnabled: true,
    soundVolume: 72,
    soundMuted: false,
  };
}

type ControlCenterItemId =
  | "theme"
  | "night-light"
  | "airplane-mode"
  | "energy-saver"
  | "nearby-sharing"
  | "touch-keyboard"
  | "speedtest"
  | "pc-settings"
  | "customize"
  | "wifi"
  | "bluetooth"
  | "personalization"
  | "file-explorer"
  | "notes"
  | "camera"
  | "direct-command"
  | "show-desktop"
  | "mute-audio"
  | "calculator";

const CONTROL_CENTER_LAYOUT_KEY = "sparkle_control_center_layout_v1";

const DEFAULT_CONTROL_CENTER_IDS: ControlCenterItemId[] = [
  "theme",
  "night-light",
  "airplane-mode",
  "energy-saver",
  "nearby-sharing",
  "touch-keyboard",
  "speedtest",
  "pc-settings",
  "customize",
];

const ALL_CONTROL_CENTER_ITEMS: ReadonlyArray<{
  id: ControlCenterItemId;
  label: string;
  removable: boolean;
}> = [
  { id: "theme", label: "Dark / Light", removable: true },
  { id: "night-light", label: "Night light", removable: true },
  { id: "airplane-mode", label: "Airplane mode", removable: true },
  { id: "energy-saver", label: "Energy saver", removable: true },
  { id: "nearby-sharing", label: "Nearby sharing", removable: true },
  { id: "touch-keyboard", label: "Touch keyboard", removable: true },
  { id: "speedtest", label: "Speedtest", removable: true },
  { id: "pc-settings", label: "Settings", removable: true },
  { id: "customize", label: "Customize controls", removable: false },
  { id: "wifi", label: "Wi-Fi", removable: true },
  { id: "bluetooth", label: "Bluetooth", removable: true },
  { id: "personalization", label: "Personalization", removable: true },
  { id: "file-explorer", label: "File Explorer", removable: true },
  { id: "notes", label: "Notes", removable: true },
  { id: "camera", label: "Camera", removable: true },
  { id: "calculator", label: "Calculator", removable: true },
  { id: "direct-command", label: "Direct Command", removable: true },
  { id: "show-desktop", label: "Show desktop", removable: true },
  { id: "mute-audio", label: "Mute audio", removable: true },
];

const VALID_CONTROL_CENTER_SET = new Set<string>(ALL_CONTROL_CENTER_ITEMS.map((item) => item.id));

function readControlCenterLayout(): ControlCenterItemId[] {
  try {
    const raw = localStorage.getItem(CONTROL_CENTER_LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (id, idx): id is ControlCenterItemId =>
            typeof id === "string" &&
            VALID_CONTROL_CENTER_SET.has(id) &&
            parsed.indexOf(id) === idx,
        );
        if (!cleaned.includes("customize")) cleaned.push("customize");
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch {}
  return [...DEFAULT_CONTROL_CENTER_IDS];
}

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SearchHistoryItem {
  query: string;
  type?: SearchAspectItem["type"];
  logo?: string;
  startAppId?: string;
  subtitle?: string;
  timestamp?: number;
}

interface SearchAspectItem {
  id: string;
  title: string;
  subtitle?: string;
  type:
    | "history"
    | "page"
    | "channel"
    | "news"
    | "setting"
    | "tool"
    | "setting-toggle"
    | "setting-action"
    | "note"
    | "gallery"
    | "web-search";
  logo?: string;
  startAppId?: string;
  keywords?: string;
  timestamp?: number;
  settingKey?: keyof SystemSettings;
  customToggle?: {
    checked: boolean;
    onToggle: () => void;
  };
  customAction?: {
    label: string;
    onAction: () => void;
  };
  externalUrl?: string;
  onSelect: () => void;
}

interface PinnedAppDef {
  id: string;
  title: string;
  route: string;
  matchPrefixes: string[];
}

interface WindowsTaskbarProps {
  tabs: AppTab[];
  activeTabId: string;
  windowStates: Record<string, AppWindowState>;
  isDesktopRevealed?: boolean;
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onCloseStartMenu: () => void;
  isDirectCommandOpen: boolean;
  onToggleDirectCommand: () => void;
  onCloseDirectCommand: () => void;
  onTaskbarWindowClick: (tabId: string) => void;
  onLaunchRoute: (route: string, state?: any) => void;
  onLaunchNewWindow: (route: string) => void;
  onCreateNewWindow: (route?: string) => void;
  onCloseWindow: (tabId: string) => void;
  onMinimizeWindow: (tabId: string) => void;
  onToggleMaximizeWindow: (tabId: string) => void;
  onDuplicateWindow: (tabId: string) => void;
  onShowDesktop: () => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

interface TaskbarClockProps {
  clockTextSizeClass: string;
  heightClass: string;
  isVertical?: boolean;
  onClick: () => void;
}

const TaskbarClock: React.FC<TaskbarClockProps> = React.memo(
  ({ clockTextSizeClass, heightClass, isVertical = false, onClick }) => {
    const [clockText, setClockText] = useState(() => {
      const now = new Date();
      return {
        time: now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        date: `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`,
      };
    });

    useEffect(() => {
      const updateClock = () => {
        const now = new Date();
        const time = now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
        setClockText((prev) => (prev.time === time && prev.date === date ? prev : { time, date }));
      };
      updateClock();
      const timer = setInterval(updateClock, 5000);
      return () => clearInterval(timer);
    }, []);

    if (isVertical) {
      return (
        <button
          id="btn-taskbar-clock-tray"
          type="button"
          onClick={onClick}
          className="taskbar-press-btn w-full py-1 px-0.5 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none text-center shrink-0"
        >
          <span className="taskbar-press-icon flex flex-col items-center justify-center leading-[1.15]">
            <span className="text-[10px] font-normal tabular-nums">
              {clockText.time.replace(/\s*(AM|PM)$/i, "")}
            </span>
            <span className="text-[9px] opacity-75 tabular-nums">
              {clockText.date.replace(/\/\d{4}$/, "")}
            </span>
          </span>
        </button>
      );
    }

    return (
      <button
        id="btn-taskbar-clock-tray"
        type="button"
        onClick={onClick}
        className={`taskbar-press-btn ${heightClass} pl-2 pr-1 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none text-right shrink-0`}
      >
        <span className="taskbar-press-icon flex flex-col items-end justify-center leading-[1.15]">
          <span className={`${clockTextSizeClass} font-normal tabular-nums`}>{clockText.time}</span>
          <span className={`${clockTextSizeClass} font-normal tabular-nums`}>{clockText.date}</span>
        </span>
      </button>
    );
  },
);

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  tabs,
  activeTabId,
  windowStates,
  isDesktopRevealed = true,
  isStartMenuOpen,
  onToggleStartMenu,
  onCloseStartMenu,
  isDirectCommandOpen,
  onToggleDirectCommand,
  onCloseDirectCommand,
  onTaskbarWindowClick,
  onLaunchRoute,
  onLaunchNewWindow,
  onCreateNewWindow,
  onCloseWindow,
  onMinimizeWindow,
  onToggleMaximizeWindow,
  onDuplicateWindow,
  onShowDesktop,
  channels,
  onSelectChannel,
}) => {
  const { settings, updateSetting } = useSettings();
  const { notes, setActiveNoteId, isStickyVisible, toggleSticky, createNote } = useNotes();
  const isLightMode = settings.theme === "light";
  const taskbarScale = settings.taskbarScale || "default";
  const taskbarLocation = settings.taskbarLocation || "bottom";
  const isVertical = taskbarLocation === "left" || taskbarLocation === "right";
  const hasMaximizedWindow = tabs.some((t) => {
    const ws = windowStates[t.id];
    return Boolean(ws && ws.isMaximized && !ws.isMinimized);
  });
  const isFloating = Boolean(settings.floatBar) && !hasMaximizedWindow;
  const taskbarThickness = getTaskbarThicknessPx(taskbarScale, isFloating, taskbarLocation);
  const effectiveTaskbarBottom = isFloating ? FLOAT_BAR_BOTTOM_GAP_PX : 0;
  const flyoutBottomOffset = taskbarThickness + effectiveTaskbarBottom + 8;
  const isLeftAligned = settings.taskbarAlignment === "left";
  const isSearchButtonMode = settings.taskbarSearchStyle === "button" || isVertical;

  // Widgets Dashboard state & synced city weather
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);
  const [widgetsPrefs, setWidgetsPrefs] = useState(() => loadWidgetsPrefs());
  const { data: liveCityWeather } = useCityWeather(widgetsPrefs.selectedCityId);
  const weatherHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onPrefsChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setWidgetsPrefs(detail);
      else setWidgetsPrefs(loadWidgetsPrefs());
    };
    window.addEventListener("sparkle:widgets-prefs-changed", onPrefsChanged);
    return () => window.removeEventListener("sparkle:widgets-prefs-changed", onPrefsChanged);
  }, []);

  useEffect(() => {
    return () => {
      if (weatherHoverTimerRef.current) clearTimeout(weatherHoverTimerRef.current);
    };
  }, []);

  const activeCityWeather = useMemo(() => {
    const selected =
      CITY_WEATHER_DATA.find((city) => city.id === widgetsPrefs.selectedCityId) ||
      CITY_WEATHER_DATA.find((city) => city.id === "hanoi")!;
    return liveCityWeather ? { ...selected, ...liveCityWeather } : selected;
  }, [widgetsPrefs.selectedCityId, liveCityWeather]);

  const handleToggleWidgets = () => {
    onCloseStartMenu();
    onCloseDirectCommand();
    setIsSearchOpen(false);
    setIsQuickSettingsOpen(false);
    setIsTrayOverflowOpen(false);
    setIsTaskViewOpen(false);
    setHoverTooltip(null);
    setIsWidgetsOpen((prev) => !prev);
  };

  const handleWeatherMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    showTooltip("Widgets", e);
    if (widgetsPrefs.openOnHover && !isWidgetsOpen) {
      if (weatherHoverTimerRef.current) clearTimeout(weatherHoverTimerRef.current);
      weatherHoverTimerRef.current = setTimeout(() => {
        onCloseStartMenu();
        onCloseDirectCommand();
        setIsSearchOpen(false);
        setIsQuickSettingsOpen(false);
        setIsTrayOverflowOpen(false);
        setIsTaskViewOpen(false);
        setHoverTooltip(null);
        setIsWidgetsOpen(true);
      }, 300);
    }
  };

  const handleWeatherMouseLeave = () => {
    setHoverTooltip(null);
    if (weatherHoverTimerRef.current) {
      clearTimeout(weatherHoverTimerRef.current);
      weatherHoverTimerRef.current = null;
    }
  };

  const btnSizeClass = isFloating
    ? taskbarScale === "small"
      ? "w-[32px] h-[32px]"
      : taskbarScale === "large"
        ? "w-[44px] h-[44px]"
        : "w-[38px] h-[38px]"
    : taskbarScale === "small"
      ? "w-[34px] h-[34px]"
      : taskbarScale === "large"
        ? "w-[46px] h-[46px]"
        : "w-[40px] h-[40px]";
  const directCmdBtnSizeClass = isFloating
    ? taskbarScale === "small"
      ? "w-[28px] h-[32px]"
      : taskbarScale === "large"
        ? "w-[38px] h-[44px]"
        : "w-[34px] h-[38px]"
    : taskbarScale === "small"
      ? "w-[30px] h-[32px]"
      : taskbarScale === "large"
        ? "w-[40px] h-[44px]"
        : "w-[34px] h-[38px]";
  const startIconSizeClass =
    taskbarScale === "small"
      ? "w-[20px] h-[20px]"
      : taskbarScale === "large"
        ? "w-[28px] h-[28px]"
        : "w-[24px] h-[24px]";
  const appIconSizeClass =
    taskbarScale === "small"
      ? "w-[19px] h-[19px]"
      : taskbarScale === "large"
        ? "w-[27px] h-[27px]"
        : "w-[23px] h-[23px]";
  const searchBoxHeightClass = isFloating
    ? taskbarScale === "small"
      ? "h-[28px]"
      : taskbarScale === "large"
        ? "h-[36px]"
        : "h-[32px]"
    : taskbarScale === "small"
      ? "h-[28px]"
      : taskbarScale === "large"
        ? "h-[36px]"
        : "h-[32px]";
  const clockTextSizeClass =
    taskbarScale === "small"
      ? "text-[10.5px]"
      : taskbarScale === "large"
        ? "text-[12.5px]"
        : "text-[11.5px]";

  // Search box & Trending Search UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const galleryDirtyRef = useRef(true);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchFlyoutRef = useRef<HTMLDivElement>(null);
  const searchFlyoutInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = galleryDB.subscribe(() => {
      galleryDirtyRef.current = true;
      if (isSearchOpen) {
        galleryDB
          .getAll()
          .then((items) => {
            galleryDirtyRef.current = false;
            setGalleryItems(items);
          })
          .catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen || !galleryDirtyRef.current) return;
    galleryDB
      .getAll()
      .then((items) => {
        galleryDirtyRef.current = false;
        setGalleryItems(items);
      })
      .catch(() => {});
  }, [isSearchOpen]);

  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return "Just now";
    const elapsed = Math.max(0, Date.now() - timestamp);
    const seconds = Math.floor(elapsed / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("vone_search_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          return parsed
            .map((item: any, idx: number) => {
              if (typeof item === "string") {
                return { query: item, timestamp: now - (idx + 1) * 300000 };
              }
              const rawSubtitle =
                item.subtitle === "Do action" || item.subtitle === "Switch page"
                  ? "Open"
                  : item.subtitle;
              return {
                query: item.query || item.title || "",
                type: item.type,
                logo: item.logo,
                startAppId: item.startAppId,
                subtitle: rawSubtitle,
                timestamp: item.timestamp || now - (idx + 1) * 300000,
              };
            })
            .filter((item: SearchHistoryItem) => Boolean(item.query.trim()));
        }
      }
    } catch {}
    return [];
  });

  const saveToHistory = (
    query: string,
    meta?: {
      type?: SearchAspectItem["type"];
      logo?: string;
      startAppId?: string;
      subtitle?: string;
      timestamp?: number;
    },
  ) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const now = Date.now();
    const cleanSubtitle =
      meta?.subtitle === "Do action" || meta?.subtitle === "Switch page" ? "Open" : meta?.subtitle;
    setSearchHistory((prev) => {
      const next = [
        {
          query: trimmed,
          type: meta?.type,
          logo: meta?.logo,
          startAppId: meta?.startAppId,
          subtitle: cleanSubtitle,
          timestamp: meta?.timestamp || now,
        },
        ...prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 20);
      try {
        localStorage.setItem("vone_search_history", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeFromHistory = (queryToRemove: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item.query.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem("vone_search_history", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.setItem("vone_search_history", JSON.stringify([]));
    } catch {}
  };

  // Taskbar popovers & Control Center quick state
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isCustomizingControls, setIsCustomizingControls] = useState(false);
  const [controlCenterIds, setControlCenterIds] = useState<ControlCenterItemId[]>(() =>
    readControlCenterLayout(),
  );
  const [draggedControlId, setDraggedControlId] = useState<ControlCenterItemId | null>(null);
  const [isTrayOverflowOpen, setIsTrayOverflowOpen] = useState(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [pcQuickState, setPcQuickState] = useState<PcQuickState>(() => readPcQuickState());
  const isMuted = pcQuickState.soundMuted;
  const volume = pcQuickState.soundVolume;

  useEffect(() => {
    if (!isQuickSettingsOpen) {
      setIsCustomizingControls(false);
      setDraggedControlId(null);
    }
  }, [isQuickSettingsOpen]);

  const persistControlCenterIds = useCallback((next: ControlCenterItemId[]) => {
    setControlCenterIds(next);
    try {
      localStorage.setItem(CONTROL_CENTER_LAYOUT_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const moveControlIndex = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= controlCenterIds.length || fromIndex === toIndex) return;
      const next = [...controlCenterIds];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return;
      next.splice(toIndex, 0, moved);
      persistControlCenterIds(next);
    },
    [controlCenterIds, persistControlCenterIds],
  );

  const removeControlId = useCallback(
    (id: ControlCenterItemId) => {
      if (id === "customize") return;
      persistControlCenterIds(controlCenterIds.filter((item) => item !== id));
    },
    [controlCenterIds, persistControlCenterIds],
  );

  const addControlId = useCallback(
    (id: ControlCenterItemId) => {
      if (controlCenterIds.includes(id)) return;
      const customizeIdx = controlCenterIds.indexOf("customize");
      const next = [...controlCenterIds];
      if (customizeIdx >= 0) {
        next.splice(customizeIdx, 0, id);
      } else {
        next.push(id);
      }
      persistControlCenterIds(next);
    },
    [controlCenterIds, persistControlCenterIds],
  );

  const resetControlLayout = useCallback(() => {
    persistControlCenterIds([...DEFAULT_CONTROL_CENTER_IDS]);
  }, [persistControlCenterIds]);

  useEffect(() => {
    const syncQuick = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      if (detail?.source === "quick-settings") return;
      setPcQuickState(readPcQuickState());
    };
    window.addEventListener("sparkle:pc-settings-updated", syncQuick);
    window.addEventListener("storage", syncQuick);
    return () => {
      window.removeEventListener("sparkle:pc-settings-updated", syncQuick);
      window.removeEventListener("storage", syncQuick);
    };
  }, []);

  const updatePcQuickState = useCallback(
    (patch: Partial<PcQuickState> & { powerMode?: string }) => {
      setPcQuickState((prev) => {
        const next: PcQuickState = {
          brightness: patch.brightness ?? prev.brightness,
          nightLight: patch.nightLight ?? prev.nightLight,
          airplaneMode: patch.airplaneMode ?? prev.airplaneMode,
          energySaver: patch.energySaver ?? prev.energySaver,
          nearbySharing: patch.nearbySharing ?? prev.nearbySharing,
          wifiEnabled: patch.wifiEnabled ?? prev.wifiEnabled,
          bluetoothEnabled: patch.bluetoothEnabled ?? prev.bluetoothEnabled,
          soundVolume: patch.soundVolume ?? prev.soundVolume,
          soundMuted: patch.soundMuted ?? prev.soundMuted,
        };
        try {
          const raw = localStorage.getItem(PC_SETTINGS_KEY);
          const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          const merged = { ...existing, ...patch };
          localStorage.setItem(PC_SETTINGS_KEY, JSON.stringify(merged));
          window.dispatchEvent(
            new CustomEvent("sparkle:pc-settings-updated", {
              detail: { source: "quick-settings" },
            }),
          );
        } catch {}
        return next;
      });
    },
    [],
  );

  // Hover tooltip
  const [hoverTooltip, setHoverTooltip] = useState<{
    label: string;
    left: number;
    top: number;
  } | null>(null);

  // Taskbar icon right-click menu & empty taskbar context menu
  const [taskMenu, setTaskMenu] = useState<{
    tabId?: string;
    route: string;
    title: string;
    x: number;
    y: number;
  } | null>(null);
  const [taskbarContextMenu, setTaskbarContextMenu] = useState<{ x: number; y: number } | null>(
    null,
  );

  const quickSettingsRef = useRef<HTMLDivElement>(null);
  const trayOverflowRef = useRef<HTMLDivElement>(null);
  const taskViewRef = useRef<HTMLDivElement>(null);
  const taskMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-windows-context-menu]")) return;
      if (
        isSearchOpen &&
        searchBoxRef.current &&
        !searchBoxRef.current.contains(target) &&
        !target.closest("#windows-taskbar-search-btn") &&
        (!searchFlyoutRef.current || !searchFlyoutRef.current.contains(target))
      ) {
        setIsSearchOpen(false);
        setShowAllResults(false);
      }
      if (
        isQuickSettingsOpen &&
        quickSettingsRef.current &&
        !quickSettingsRef.current.contains(target) &&
        !target.closest("#btn-taskbar-quick-settings") &&
        !target.closest("#btn-taskbar-clock-tray")
      ) {
        setIsQuickSettingsOpen(false);
      }
      if (
        isTrayOverflowOpen &&
        trayOverflowRef.current &&
        !trayOverflowRef.current.contains(target) &&
        !target.closest("#btn-taskbar-tray-overflow")
      ) {
        setIsTrayOverflowOpen(false);
      }
      if (
        isTaskViewOpen &&
        taskViewRef.current &&
        !taskViewRef.current.contains(target) &&
        !target.closest("#btn-taskbar-taskview")
      ) {
        setIsTaskViewOpen(false);
      }
      if (taskMenu && taskMenuRef.current && !taskMenuRef.current.contains(target)) {
        setTaskMenu(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setShowAllResults(false);
        setIsQuickSettingsOpen(false);
        setIsTrayOverflowOpen(false);
        setIsTaskViewOpen(false);
        setTaskMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isSearchOpen, isQuickSettingsOpen, isTrayOverflowOpen, isTaskViewOpen, taskMenu]);

  // Listen to vplay:focus-topbar-search shortcut
  useEffect(() => {
    const onFocusSearch = () => {
      setIsSearchOpen(true);
      onCloseStartMenu();
      onCloseDirectCommand();
      setTimeout(() => {
        searchFlyoutInputRef.current?.focus();
      }, 60);
    };
    window.addEventListener("vplay:focus-topbar-search", onFocusSearch);
    return () => window.removeEventListener("vplay:focus-topbar-search", onFocusSearch);
  }, [onCloseStartMenu, onCloseDirectCommand]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const t = setTimeout(() => {
      searchFlyoutInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [isSearchOpen]);

  // Pinned taskbar apps (File Explorer and Watch by default), editable via right-click
  const { taskbarPins, startUnpinned } = usePinState();
  const pinnedApps: PinnedAppDef[] = useMemo(
    () =>
      taskbarPins.map((pin) => ({
        id: taskbarPinId(pin.route),
        title: pin.title,
        route: pin.route,
        matchPrefixes: [pin.route],
      })),
    [taskbarPins],
  );

  const routeMatchesPinned = (route: string, pinned: PinnedAppDef) => {
    const base = route.split("?")[0];
    return pinned.matchPrefixes.some((p) =>
      p === "/" ? base === "/" : base === p || base.startsWith(`${p}/`),
    );
  };

  // Build extra open tabs that aren't in pinnedApps
  const extraOpenTabs = useMemo(() => {
    return tabs.filter((t) => !pinnedApps.some((p) => routeMatchesPinned(t.route, p)));
  }, [tabs, pinnedApps]);

  // Unified draggable taskbar app slots (pinned + extra open tabs) persisted in localStorage
  const TASKBAR_ORDER_KEY = "sparkle_taskbar_order_v1";
  const [taskbarOrder, setTaskbarOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TASKBAR_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [draggedSlotKey, setDraggedSlotKey] = useState<string | null>(null);
  const [taskbarDropTarget, setTaskbarDropTarget] = useState<{
    key: string;
    side: "before" | "after";
  } | null>(null);

  type TaskbarSlot =
    | { key: string; kind: "pinned"; pinned: PinnedAppDef; matchingTabs: AppTab[] }
    | { key: string; kind: "tab"; tab: AppTab };

  const orderedTaskbarSlots: TaskbarSlot[] = useMemo(() => {
    const slotMap = new Map<string, TaskbarSlot>();
    const defaultKeys: string[] = [];

    pinnedApps.forEach((pinned) => {
      const key = `pin:${pinned.id}`;
      defaultKeys.push(key);
      slotMap.set(key, {
        key,
        kind: "pinned",
        pinned,
        matchingTabs: tabs.filter((t) => routeMatchesPinned(t.route, pinned)),
      });
    });

    extraOpenTabs.forEach((tab) => {
      const key = `tab:${tab.id}`;
      defaultKeys.push(key);
      slotMap.set(key, {
        key,
        kind: "tab",
        tab,
      });
    });

    const orderedKeys: string[] = [];
    const used = new Set<string>();

    taskbarOrder.forEach((k) => {
      if (slotMap.has(k) && !used.has(k)) {
        used.add(k);
        orderedKeys.push(k);
      }
    });

    defaultKeys.forEach((k) => {
      if (!used.has(k)) {
        used.add(k);
        orderedKeys.push(k);
      }
    });

    return orderedKeys.map((k) => slotMap.get(k)!);
  }, [pinnedApps, extraOpenTabs, tabs, taskbarOrder]);

  const handleTaskbarSlotDrop = (targetKey: string, side: "before" | "after") => {
    if (!draggedSlotKey || draggedSlotKey === targetKey) return;
    const keys = orderedTaskbarSlots.map((s) => s.key);
    const filtered = keys.filter((k) => k !== draggedSlotKey);
    const destIdx = filtered.indexOf(targetKey);
    if (destIdx === -1) return;
    filtered.splice(side === "after" ? destIdx + 1 : destIdx, 0, draggedSlotKey);
    setTaskbarOrder(filtered);
    try {
      localStorage.setItem(TASKBAR_ORDER_KEY, JSON.stringify(filtered));
    } catch {}
  };

  const taskbarLayoutTransition = settings.reduceAllMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 460, damping: 34, mass: 0.85 };

  const TASKBAR_BOUNCE_DURATION_SEC = 0.85;
  const TASKBAR_BOUNCE_TIMEOUT_MS = 920;
  const taskbarBounceKeyframes = {
    y: [0, -11, 2, -4, 0],
    scale: [1, 1.06, 0.98, 1.02, 1],
  };
  const taskbarBounceTransition = {
    duration: TASKBAR_BOUNCE_DURATION_SEC,
    times: [0, 0.32, 0.64, 0.84, 1],
    ease: "easeInOut" as const,
  };

  // Track newly opened app tabs to trigger an upward bounce animation on their taskbar icon
  const prevTabIdsRef = useRef<Set<string> | null>(null);
  const [bouncingKeys, setBouncingKeys] = useState<Record<string, boolean>>({});
  const bounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const triggerBounceForKey = useCallback((key: string) => {
    setBouncingKeys((prev) => ({ ...prev, [key]: true }));
    if (bounceTimersRef.current[key]) {
      clearTimeout(bounceTimersRef.current[key]);
    }
    bounceTimersRef.current[key] = setTimeout(() => {
      setBouncingKeys((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete bounceTimersRef.current[key];
    }, TASKBAR_BOUNCE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const timers = bounceTimersRef.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    const currentIds = new Set(tabs.map((t) => t.id));
    if (prevTabIdsRef.current === null) {
      prevTabIdsRef.current = currentIds;
      return;
    }
    tabs.forEach((tab) => {
      if (!prevTabIdsRef.current!.has(tab.id)) {
        const matchedPinned = pinnedApps.find((p) => routeMatchesPinned(tab.route, p));
        if (matchedPinned) {
          const matchedForPin = tabs.filter((t) => routeMatchesPinned(t.route, matchedPinned));
          const key =
            matchedForPin.length > 1 && matchedForPin[0]?.id !== tab.id
              ? `tab:${tab.id}`
              : `pin:${matchedPinned.id}`;
          triggerBounceForKey(key);
        } else {
          triggerBounceForKey(`tab:${tab.id}`);
        }
      }
    });
    prevTabIdsRef.current = currentIds;
  }, [tabs, pinnedApps, triggerBounceForKey]);

  // Pre-configured App Aspects matching TopBar Search UI
  const appAspects = useMemo(() => {
    const aspects: SearchAspectItem[] = [
      {
        id: "page-home",
        title: "Home",
        subtitle: "Open",
        startAppId: "app-home",
        keywords: "trang chủ home overview",
        type: "page",
        onSelect: () => onLaunchRoute("/"),
      },
      {
        id: "page-watch",
        title: "Watch",
        subtitle: "Open",
        startAppId: "app-watch",
        keywords: "live tv xem truyền hình trực tuyến watch",
        type: "page",
        onSelect: () => onLaunchRoute("/live-tv"),
      },
      {
        id: "page-news",
        title: "Feed",
        subtitle: "Open",
        startAppId: "app-feed",
        keywords: "tin tức bài viết news articles feed update blogs changelog cập nhật",
        type: "page",
        onSelect: () => onLaunchRoute("/news"),
      },
      {
        id: "page-channels",
        title: "Channels",
        subtitle: "Open",
        startAppId: "app-channels",
        keywords: "danh sách kênh channels channel directory",
        type: "page",
        onSelect: () => onLaunchRoute("/channels"),
      },
      {
        id: "page-favs",
        title: "Favorites",
        subtitle: "Open",
        startAppId: "app-favorites",
        keywords: "kênh yêu thích favorites favs",
        type: "page",
        onSelect: () => onLaunchRoute("/favorites"),
      },
      {
        id: "page-craftmine",
        title: "Craftmine",
        subtitle: "Open",
        startAppId: "app-craftmine",
        keywords: "minecraft preview web game",
        type: "page",
        onSelect: () => onLaunchRoute("/craftmine"),
      },
      {
        id: "page-photopea",
        title: "Photopea",
        subtitle: "Open",
        startAppId: "app-photopea",
        keywords: "photopea photoshop chỉnh sửa ảnh biên tập ảnh psd photo editor web app",
        type: "page",
        onSelect: () => onLaunchRoute("/photopea"),
      },
      {
        id: "page-gallery",
        title: "Gallery",
        subtitle: "Open",
        startAppId: "app-gallery",
        keywords: "gallery bộ sưu tập ảnh video âm thanh phương tiện media photos",
        type: "page",
        onSelect: () => onLaunchRoute("/gallery"),
      },
      {
        id: "page-draws",
        title: "Ink Canvas",
        subtitle: "Open",
        startAppId: "app-draws",
        keywords: "ink canvas draws paint vẽ hội họa bút cọ sketch ms paint canvas",
        type: "page",
        onSelect: () => onLaunchRoute("/draws"),
      },
      {
        id: "page-notes",
        title: "Notes",
        subtitle: "Open",
        startAppId: "app-notes",
        keywords: "ghi chú soạn thảo notes office",
        type: "page",
        onSelect: () => onLaunchRoute("/notes"),
      },
      {
        id: "page-screenbox",
        title: "Screenbox",
        subtitle: "Open",
        startAppId: "app-screenbox",
        keywords:
          "screenbox screenbug vlc media player phát video âm thanh stream disc network equalizer open url",
        type: "page",
        onSelect: () => onLaunchRoute("/screenbox"),
      },
      {
        id: "page-camera",
        title: "Camera",
        subtitle: "Open",
        startAppId: "app-camera",
        keywords: "camera máy ảnh chụp ảnh camera rolls webcam snapshot photo insider",
        type: "page",
        onSelect: () => onLaunchRoute("/camera"),
      },
      {
        id: "page-calculator",
        title: "Calculator",
        subtitle: "Open",
        startAppId: "app-calculator",
        keywords: "calculator calc máy tính standard scientific math tính toán",
        type: "page",
        onSelect: () => onLaunchRoute("/calculator"),
      },
      {
        id: "page-weather",
        title: "Weather",
        subtitle: "Open",
        startAppId: "app-weather",
        keywords: "weather forecast thời tiết dự báo nhiệt độ mưa gió fluentweather",
        type: "page",
        onSelect: () => onLaunchRoute("/weather"),
      },
      {
        id: "page-file-explorer",
        title: "File Explorer",
        subtitle: "Open",
        startAppId: "app-file-explorer",
        keywords:
          "file explorer files folders drives documents downloads pictures explorer tep tin thu muc",
        type: "page",
        onSelect: () => onLaunchRoute("/file-explorer"),
      },
      {
        id: "page-notepad",
        title: "Notepad",
        subtitle: "Open",
        startAppId: "app-notepad",
        keywords: "notepad text editor markdown plain text ghi chu winui 3",
        type: "page",
        onSelect: () => onLaunchRoute("/notepad"),
      },
      {
        id: "page-html-writer",
        title: "HTML Writer",
        subtitle: "Open",
        startAppId: "app-html-writer",
        keywords: "html writer code editor css js preview winui 3 viet chay html",
        type: "page",
        onSelect: () => onLaunchRoute("/html-writer"),
      },
      {
        id: "page-pc-settings",
        title: "PC Settings",
        subtitle: "Open",
        startAppId: "app-pc-settings",
        keywords: "pc settings windows 11 system bluetooth network personalization windows update",
        type: "page",
        onSelect: () => onLaunchRoute("/pc-settings"),
      },
      {
        id: "page-settings",
        title: "Settings",
        subtitle: "Open",
        startAppId: "app-settings",
        keywords: "cài đặt hệ thống settings preferences",
        type: "page",
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "flag-theme-toggle",
        title: "Dark / Light Mode",
        subtitle: "System Setting",
        keywords: "dark light mode theme sáng tối giao diện ban đêm ban ngày",
        type: "setting-toggle",
        customToggle: {
          checked: settings.theme === "light",
          onToggle: () => updateSetting("theme", settings.theme === "light" ? "dark" : "light"),
        },
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "flag-windows-mode",
        title: "SodiumOS Mode (Vive)",
        subtitle: "Vive Feature",
        keywords:
          "windows mode windows 11 taskbar start menu floating window desktop wallpaper vive velocity",
        type: "setting-toggle",
        settingKey: "windowsMode",
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "flag-float-bar",
        title: "FloatBar (Vive)",
        subtitle: "Vive Feature",
        keywords: "floatbar float bar floating taskbar rounded corners maximized vive velocity",
        type: "setting-toggle",
        settingKey: "floatBar",
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "flag-start-layout-concept",
        title: "StartLayoutConcept (Vive)",
        subtitle: "Vive Feature",
        keywords:
          "startlayoutconcept start layout concept start menu widgets recents vive velocity",
        type: "setting-toggle",
        settingKey: "startLayoutConcept",
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "tool-direct-command",
        title: "Direct Command",
        subtitle: "Command Prompt UI",
        keywords: "direct command cmd terminal prompt cli vivetool session taskbar",
        type: "tool",
        logo: "/assets/aistudio/direct_command_6240d59d.png",
        onSelect: () => window.dispatchEvent(new CustomEvent("vplay:open-direct-command")),
      },
      {
        id: "flag-spatial-glass",
        title: "Spatial Glass & Blur (Acrylic)",
        subtitle: "System Setting",
        keywords: "settings spatial glass acrylic blur kính mờ hiệu ứng mờ",
        type: "setting-toggle",
        settingKey: "spatialGlass",
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "flag-super-dark",
        title: "Super Dark Mode (OLED Black)",
        subtitle: "System Setting",
        keywords: "settings super dark mode oled black đen hoàn toàn",
        type: "setting-toggle",
        settingKey: "superDarkMode",
        onSelect: () => onLaunchRoute("/settings"),
      },
      {
        id: "action-toggle-sticky-widget",
        title: "Sticky Note Widget",
        subtitle: "Direct Action",
        keywords: "sticky note stickies ghi chú dán mở stickies",
        type: "setting-toggle",
        customToggle: {
          checked: isStickyVisible,
          onToggle: () => toggleSticky(),
        },
        onSelect: () => onLaunchRoute("/notes"),
      },
      {
        id: "action-create-new-note",
        title: "Tạo ghi chú mới (Create Note)",
        subtitle: "Direct Action",
        keywords: "tạo ghi chú mới create note new note notion apple notes",
        type: "setting-action",
        customAction: {
          label: "+ Tạo note",
          onAction: () => {
            createNote("Ghi chú mới", "<p></p>");
            onLaunchRoute("/notes");
            setIsSearchOpen(false);
          },
        },
        onSelect: () => {
          createNote("Ghi chú mới", "<p></p>");
          onLaunchRoute("/notes");
        },
      },
      {
        id: "flag-native-keyboard",
        title: "Touch keyboard",
        subtitle: "Insider Flags",
        keywords:
          "insider flags experimental touch keyboard native keyboard on-screen keyboard bàn phím cảm ứng",
        type: "setting-toggle",
        settingKey: "nativeKeyboard",
        onSelect: () => onLaunchRoute("/test"),
      },
      {
        id: "flag-fluent-icons",
        title: "Fluent icons (3D)",
        subtitle: "Insider Flags",
        keywords: "insider flags experimental fluent icons 3d icon biểu tượng",
        type: "setting-toggle",
        settingKey: "fluentIcons",
        onSelect: () => onLaunchRoute("/test"),
      },
      {
        id: "flag-developer-mode",
        title: "Developer Mode",
        subtitle: "Insider Flags",
        keywords: "developer mode chế độ nhà phát triển debug",
        type: "setting-toggle",
        settingKey: "developerMode",
        onSelect: () => onLaunchRoute("/test"),
      },
      {
        id: "tool-discord",
        title: "Discord Community",
        subtitle: "Open",
        startAppId: "app-discord",
        keywords: "community discord sodium",
        type: "tool",
        onSelect: () => window.open("https://discord.gg/wcdjaDDayK", "_blank"),
      },
    ];

    (channels || []).forEach((ch) => {
      aspects.push({
        id: `channel-${ch.id}`,
        title: ch.name,
        subtitle: ch.category || "Live Channel",
        keywords: `${ch.category} ${ch.shortName || ""} ${ch.slug}`,
        type: "channel",
        logo: ch.logo,
        onSelect: () => {
          onSelectChannel(ch);
          onLaunchRoute(`/live-tv?channel=${ch.slug}`);
        },
      });
    });

    NEWS_DATA.forEach((art) => {
      aspects.push({
        id: `article-${art.id}`,
        title: art.title,
        subtitle: "Sodium News",
        keywords: `${art.category} ${art.excerpt || ""}`,
        type: "news",
        onSelect: () => onLaunchRoute(`/article/${art.id}`),
      });
    });

    (notes || []).forEach((note) => {
      const plainText = stripHtml(note.content).trim();
      aspects.push({
        id: `note-${note.id}`,
        title: note.title.trim() || "Ghi chú không có tiêu đề",
        subtitle: `Note • ${formatRelativeTime(note.updatedAt)}`,
        keywords: `note notes ghi chú notion apple notes ${plainText}`,
        type: "note",
        customAction: {
          label: "Mở",
          onAction: () => {
            setActiveNoteId(note.id);
            saveToHistory(note.title, { subtitle: "Note", type: "note" });
            onLaunchRoute("/notes");
            setIsSearchOpen(false);
          },
        },
        onSelect: () => {
          setActiveNoteId(note.id);
          saveToHistory(note.title, { subtitle: "Note", type: "note" });
          onLaunchRoute("/notes");
        },
      });
    });

    (galleryItems || []).forEach((media) => {
      aspects.push({
        id: `gallery-${media.id}`,
        title: media.title,
        subtitle:
          media.type === "document"
            ? "Gallery Document"
            : media.type === "video"
              ? "Gallery Video"
              : media.type === "audio"
                ? "Gallery Audio"
                : "Gallery Image",
        keywords: `gallery ${media.type} ${media.tags ? media.tags.join(" ") : ""} ${media.description || ""}`,
        type: "gallery",
        logo: media.thumbnailUrl || (media.type === "image" ? media.url : undefined),
        customAction: {
          label: "Xem",
          onAction: () => {
            saveToHistory(media.title, { subtitle: "Gallery", type: "gallery" });
            onLaunchRoute(`/gallery?preview=${encodeURIComponent(media.id)}`);
            setIsSearchOpen(false);
          },
        },
        onSelect: () => {
          saveToHistory(media.title, { subtitle: "Gallery", type: "gallery" });
          onLaunchRoute(`/gallery?preview=${encodeURIComponent(media.id)}`);
        },
      });
    });

    return aspects;
  }, [
    channels,
    onLaunchRoute,
    onSelectChannel,
    settings,
    updateSetting,
    isStickyVisible,
    toggleSticky,
    createNote,
    notes,
    galleryItems,
    setActiveNoteId,
  ]);

  // Trending searches shown when input is empty & history is empty (matching TopBar.tsx)
  const trendingSearchItems: SearchAspectItem[] = useMemo(() => {
    return [
      {
        id: "trending-vtv1-hd",
        title: "VTV1 HD",
        subtitle: "Watch",
        type: "channel" as const,
        onSelect: () => {
          const matched = channels.find(
            (c) =>
              c.slug.toLowerCase().includes("vtv1") ||
              c.name.toLowerCase().includes("vtv1") ||
              c.shortName?.toLowerCase().includes("vtv1"),
          );
          if (matched) onSelectChannel(matched);
          saveToHistory("VTV1 HD", { subtitle: "Watch", type: "channel" });
          onLaunchRoute(`/live-tv?channel=${matched?.slug || "vtv1-hd"}`);
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
      {
        id: "trending-craftmine",
        title: "The Craftmine",
        subtitle: "Play",
        type: "page" as const,
        onSelect: () => {
          saveToHistory("The Craftmine", { subtitle: "Play", type: "page" });
          onLaunchRoute("/craftmine");
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
      {
        id: "trending-memories",
        title: "View memories",
        subtitle: "Gallery",
        type: "page" as const,
        onSelect: () => {
          saveToHistory("View memories", { subtitle: "Gallery", type: "page" });
          onLaunchRoute("/gallery");
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
      {
        id: "trending-settings",
        title: "Flag experimental",
        subtitle: "Settings",
        type: "setting" as const,
        onSelect: () => {
          saveToHistory("Flag experimental", { subtitle: "Settings", type: "setting" });
          onLaunchRoute("/test");
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
    ];
  }, [channels, onLaunchRoute, onSelectChannel]);

  const searchResults: SearchAspectItem[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (searchHistory.length === 0) {
        return trendingSearchItems;
      }
      return searchHistory.map((hist, idx) => ({
        id: `history-${idx}`,
        title: hist.query,
        subtitle: hist.subtitle || "Search history",
        type: "history" as const,
        logo: hist.logo,
        startAppId: hist.startAppId,
        timestamp: hist.timestamp,
        onSelect: () => {
          setSearchQuery(hist.query);
          saveToHistory(hist.query, {
            type: hist.type,
            logo: hist.logo,
            startAppId: hist.startAppId,
            subtitle: hist.subtitle,
            timestamp: hist.timestamp,
          });
          const found =
            appAspects.find((a) => a.title.toLowerCase() === hist.query.toLowerCase()) ||
            trendingSearchItems.find((t) => t.title.toLowerCase() === hist.query.toLowerCase());
          if (found) {
            found.onSelect();
          }
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      }));
    }

    const matches: SearchAspectItem[] = [];

    searchHistory.forEach((hist, idx) => {
      if (hist.query.toLowerCase().includes(q)) {
        matches.push({
          id: `hist-match-${idx}`,
          title: hist.query,
          subtitle: hist.subtitle || "Search history",
          type: "history",
          logo: hist.logo,
          startAppId: hist.startAppId,
          timestamp: hist.timestamp,
          onSelect: () => {
            saveToHistory(hist.query, {
              type: hist.type,
              logo: hist.logo,
              startAppId: hist.startAppId,
              subtitle: hist.subtitle,
              timestamp: hist.timestamp,
            });
            const found =
              appAspects.find((a) => a.title.toLowerCase() === hist.query.toLowerCase()) ||
              trendingSearchItems.find((t) => t.title.toLowerCase() === hist.query.toLowerCase());
            if (found) found.onSelect();
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        });
      }
    });

    appAspects.forEach((item) => {
      if (
        item.title.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.toLowerCase().includes(q))
      ) {
        matches.push(item);
      }
    });

    if (matches.length === 0 && q) {
      return [
        {
          id: "web-google",
          title: "Find on Google",
          subtitle: `Search "${searchQuery.trim()}" on Google`,
          type: "web-search" as const,
          externalUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
          onSelect: () => {
            window.open(
              `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
              "_blank",
            );
            saveToHistory(searchQuery.trim(), { subtitle: "Find on Google", type: "web-search" });
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        },
        {
          id: "web-coccoc",
          title: "Find on Cốc Cốc Search",
          subtitle: `Search "${searchQuery.trim()}" on Cốc Cốc`,
          type: "web-search" as const,
          externalUrl: `https://coccoc.com/search?query=${encodeURIComponent(searchQuery.trim())}`,
          onSelect: () => {
            window.open(
              `https://coccoc.com/search?query=${encodeURIComponent(searchQuery.trim())}`,
              "_blank",
            );
            saveToHistory(searchQuery.trim(), {
              subtitle: "Find on Cốc Cốc Search",
              type: "web-search",
            });
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        },
        {
          id: "web-bing",
          title: "Find on Bing",
          subtitle: `Search "${searchQuery.trim()}" on Bing`,
          type: "web-search" as const,
          externalUrl: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
          onSelect: () => {
            window.open(
              `https://www.bing.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
              "_blank",
            );
            saveToHistory(searchQuery.trim(), { subtitle: "Find on Bing", type: "web-search" });
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        },
      ];
    }

    return matches;
  }, [searchQuery, searchHistory, appAspects, trendingSearchItems]);

  const isWebSearch = Boolean(
    searchQuery.trim() && searchResults.length > 0 && searchResults[0]?.type === "web-search",
  );

  const handleClearAllWithAnimation = () => {
    if (isClearingHistory || searchHistory.length === 0) return;
    setIsClearingHistory(true);
    const count = showAllResults ? searchResults.length : Math.min(searchResults.length, 6);
    const totalDuration = Math.max(count * 45 + 260, 320);

    setTimeout(() => {
      clearAllHistory();
      setIsClearingHistory(false);
      setShowAllResults(false);
    }, totalDuration);
  };

  const handleSelectSearchResult = (item: SearchAspectItem) => {
    saveToHistory(item.title, {
      type: item.type,
      logo: item.logo,
      startAppId: item.startAppId,
      subtitle: item.subtitle,
    });
    item.onSelect();
    setIsSearchOpen(false);
    setShowAllResults(false);
    setSearchQuery("");
  };

  const getRecentSearchIcon = (query: string, logo?: string) => {
    if (logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/[-_\s]/g, "");

    const matchedChannel = channels.find((c) => {
      const cName = c.name.toLowerCase().replace(/[-_\s]/g, "");
      const cShort = c.shortName ? c.shortName.toLowerCase().replace(/[-_\s]/g, "") : "";
      const cSlug = c.slug.toLowerCase().replace(/[-_\s]/g, "");
      return (
        cleanQ === cName ||
        cleanQ === cSlug ||
        (cShort && cleanQ === cShort) ||
        cleanQ.includes(cName) ||
        (cShort && cleanQ.includes(cShort)) ||
        cName.includes(cleanQ) ||
        (cShort && cShort.includes(cleanQ))
      );
    });
    if (matchedChannel?.logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img
            src={matchedChannel.logo}
            alt=""
            className="w-6.5 h-6.5 object-contain rounded-[4px]"
          />
        </div>
      );
    }

    if (
      q.includes("file explorer") ||
      q.includes("explorer") ||
      q.includes("thu muc") ||
      q.includes("tệp tin")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DFileExplorerIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("minecraft") ||
      q.includes("craftmine") ||
      q.includes("game") ||
      q.includes("play") ||
      q.includes("chơi")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCraftmineIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("calculator") ||
      q.includes("calc") ||
      q.includes("máy tính") ||
      q.includes("math")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCalculatorIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("mail") ||
      q.includes("calendar") ||
      q.includes("email") ||
      q.includes("outlook")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DMailIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes("maps") || q.includes("map") || q.includes("bản đồ")) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DMapsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("notepad") ||
      q.includes("notes") ||
      q.includes("note") ||
      q.includes("ghi chú")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DNotesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("tv") ||
      q.includes("watch") ||
      q.includes("live") ||
      q.includes("vtv") ||
      q.includes("htv") ||
      q.includes("stream")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DWatchIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("news") ||
      q.includes("article") ||
      q.includes("thời sự") ||
      q.includes("tin tức") ||
      q.includes("feed")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DArticlesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("photo") ||
      q.includes("gallery") ||
      q.includes("image") ||
      q.includes("ảnh") ||
      q.includes("album") ||
      q.includes("memories")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("draw") ||
      q.includes("paint") ||
      q.includes("vẽ") ||
      q.includes("sketch") ||
      q.includes("canvas")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DDrawsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes("photopea") || q.includes("photoshop") || q.includes("psd")) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DPhotopeaIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes("screenbug") || q.includes("vlc") || q.includes("screenbox")) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DScreenbugIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (
      q.includes("setting") ||
      q.includes("cài đặt") ||
      q.includes("experimental") ||
      q.includes("flag")
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes("update") || q.includes("cập nhật")) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DUpdatesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes("discord")) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DDiscordIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes("home") || q.includes("trang chủ")) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <FluentHomeIcon className="w-6 h-6" />
        </div>
      );
    }

    return (
      <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
        <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
      </div>
    );
  };

  const renderItemIcon = (item: SearchAspectItem) => {
    if (item.id === "trending-vtv1-hd" || item.title === "VTV1 HD") {
      const vtv1Logo =
        channels.find((c) => c.slug.includes("vtv1") || c.name.toLowerCase().includes("vtv1"))
          ?.logo ||
        "https://img.vtvprime.vn/CK-rS1WbUz0mcRIodGxvvpqXiQB6XhphIkl2z7F_S_4/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvM2ZlMDdhZmQtYzIyZS00M2QwLTgyZTgtOWNkMGUyYTc3ZTRkLnBuZw==.png";
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={vtv1Logo} alt="VTV1 HD" className="w-7 h-7 object-contain rounded-[4px]" />
        </div>
      );
    }
    if (item.id === "trending-craftmine" || item.title === "The Craftmine") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCraftmineIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (item.id === "trending-memories" || item.title === "View memories") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (item.id === "trending-settings" || item.title === "Flag experimental") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === "web-search") {
      if (item.id === "web-google") {
        return (
          <div className="w-8.5 h-8.5 rounded-full bg-[#4285F4]/10 dark:bg-[#4285F4]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
        );
      }
      if (item.id === "web-coccoc") {
        return (
          <div className="w-8.5 h-8.5 rounded-full bg-[#189947]/10 dark:bg-[#189947]/20 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-full bg-[#189947] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              C
            </div>
          </div>
        );
      }
      if (item.id === "web-bing") {
        return (
          <div className="w-8.5 h-8.5 rounded-full bg-[#008373]/10 dark:bg-[#008373]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#008373">
              <path d="M5 3v18l5.5-3.2L15 21l4-2.3V11l-8.5-3.2V3L5 3zm6 6.8l5 1.9v4.9l-2.4 1.4-2.6-1.5V9.8z" />
            </svg>
          </div>
        );
      }
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#005fb8] dark:text-[#4cc2ff] shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
        </div>
      );
    }

    if (item.type === "history") {
      return getRecentSearchIcon(item.title, item.logo);
    }

    if (item.logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={item.logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    if (item.type === "note") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DNotesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === "gallery") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (
      item.type === "setting-toggle" ||
      item.type === "setting" ||
      item.type === "setting-action"
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === "news") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DArticlesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === "channel") {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DWatchPreviewIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    return (
      <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
        <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
      </div>
    );
  };

  const showTooltip = (label: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTooltip({
      label,
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
    });
  };

  const taskbarHideOffset = taskbarThickness + effectiveTaskbarBottom + 16;
  const hiddenAxisPose =
    taskbarLocation === "top"
      ? { x: 0, y: -taskbarHideOffset }
      : taskbarLocation === "left"
        ? { x: -taskbarHideOffset, y: 0 }
        : taskbarLocation === "right"
          ? { x: taskbarHideOffset, y: 0 }
          : { x: 0, y: taskbarHideOffset };

  return (
    <>
      <motion.footer
        id="windows-taskbar"
        role="region"
        aria-label="Sodium Taskbar"
        initial={settings.reduceAllMotion ? false : hiddenAxisPose}
        animate={isDesktopRevealed ? { x: 0, y: 0 } : hiddenAxisPose}
        transition={
          settings.reduceAllMotion
            ? { duration: 0 }
            : {
                duration: 0.48,
                delay: isDesktopRevealed ? 0.1 : 0,
                ease: [0.22, 1, 0.36, 1],
              }
        }
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setHoverTooltip(null);
          setTaskMenu(null);
          setTaskbarContextMenu({ x: e.clientX, y: e.clientY });
        }}
        style={{
          height: isVertical ? undefined : `${taskbarThickness}px`,
          width: isVertical ? `${taskbarThickness}px` : undefined,
          bottom:
            taskbarLocation === "bottom"
              ? `${effectiveTaskbarBottom}px`
              : isVertical
                ? isFloating
                  ? "12px"
                  : "0px"
                : undefined,
          top:
            taskbarLocation === "top"
              ? `${effectiveTaskbarBottom}px`
              : isVertical
                ? isFloating
                  ? "12px"
                  : "0px"
                : undefined,
          left:
            taskbarLocation === "left"
              ? `${effectiveTaskbarBottom}px`
              : !isVertical
                ? isFloating
                  ? "12px"
                  : "0px"
                : undefined,
          right:
            taskbarLocation === "right"
              ? `${effectiveTaskbarBottom}px`
              : !isVertical
                ? isFloating
                  ? "12px"
                  : "0px"
                : undefined,
          borderRadius: isFloating ? "10px" : "0px",
          backgroundColor: isLightMode ? "rgba(226, 233, 243, 0.76)" : "rgba(28, 30, 36, 0.80)",
          backdropFilter: "blur(36px) saturate(165%)",
          WebkitBackdropFilter: "blur(36px) saturate(165%)",
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
        className={`fixed z-[9000] border-0 outline-none flex ${
          isVertical
            ? "flex-col items-center justify-between py-2 px-1"
            : "flex-row items-center justify-between px-2 sm:px-3"
        } select-none text-[#111827] dark:text-white transition-[left,right,top,bottom,border-radius,height,width,box-shadow] duration-200 ease-out ${
          isFloating ? "windows-taskbar-floating" : ""
        } ${isDesktopRevealed ? "" : "pointer-events-none"}`}
      >
        {/* 1. Left / Top: Weather Widget (hidden here when alignment is left) */}
        {!isLeftAligned && (
          <button
            id="btn-taskbar-weather"
            type="button"
            onClick={handleToggleWidgets}
            onMouseEnter={handleWeatherMouseEnter}
            onMouseLeave={handleWeatherMouseLeave}
            aria-expanded={isWidgetsOpen}
            className={`taskbar-press-btn ${
              isVertical
                ? "flex flex-col items-center justify-center w-full py-1 px-0.5"
                : `hidden md:flex items-center ${isFloating ? (taskbarScale === "small" ? "h-[32px]" : "h-[38px]") : "h-[40px]"} px-2.5`
            } rounded-[6px] transition-colors duration-150 cursor-pointer border-0 outline-none focus:outline-none shrink-0 text-left ${
              isWidgetsOpen
                ? "bg-black/[0.08] dark:bg-white/[0.12]"
                : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            }`}
          >
            {isVertical ? (
              <span className="taskbar-press-icon flex flex-col items-center gap-0.5">
                <div
                  id="windows-taskbar-weather-sun"
                  className="w-7 h-7 shrink-0 flex items-center justify-center"
                >
                  <TaskbarWeatherIcon
                    temp={activeCityWeather.temp}
                    condition={activeCityWeather.condition}
                    weatherCode={activeCityWeather.weatherCode}
                    isDay={activeCityWeather.isDay}
                    className="w-7 h-7"
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums leading-none">
                  {activeCityWeather.temp}°
                </span>
              </span>
            ) : (
              <span className="taskbar-press-icon flex items-center gap-2.5">
                <div
                  id="windows-taskbar-weather-sun"
                  className={`${taskbarScale === "small" ? "w-7 h-7" : "w-8 h-8"} shrink-0 flex items-center justify-center`}
                >
                  <TaskbarWeatherIcon
                    temp={activeCityWeather.temp}
                    condition={activeCityWeather.condition}
                    weatherCode={activeCityWeather.weatherCode}
                    isDay={activeCityWeather.isDay}
                    className={taskbarScale === "small" ? "w-7 h-7" : "w-8 h-8"}
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] font-medium tabular-nums">
                    {activeCityWeather.temp}°C
                  </div>
                  <div className="text-[11px] text-black/65 dark:text-white/70">
                    {activeCityWeather.conditionLabel}
                  </div>
                </div>
              </span>
            )}
          </button>
        )}

        {/* 2. Main Cluster: Start + Search (Box or Button) + Task View + Taskbar App Icons */}
        <LayoutGroup id="windows-taskbar-icons">
          <div
            className={`flex items-center gap-1 ${
              isVertical
                ? `flex-col w-full flex-1 min-h-0 max-h-full overflow-y-auto overflow-x-hidden no-scrollbar ${
                    isLeftAligned ? "justify-start" : "justify-center"
                  }`
                : `sm:gap-1.5 flex-1 min-w-0 max-w-full max-md:overflow-x-auto md:overflow-visible no-scrollbar ${
                    isLeftAligned
                      ? "justify-start"
                      : "justify-center md:flex-none md:absolute md:left-1/2 md:-translate-x-1/2"
                  }`
            }`}
          >
            {/* Start Button (Windows 11 4-pane blue logo) */}
            <motion.button
              id="btn-taskbar-start"
              type="button"
              layout="position"
              transition={{ layout: taskbarLayoutTransition }}
              onClick={() => {
                setIsWidgetsOpen(false);
                setIsQuickSettingsOpen(false);
                setIsTrayOverflowOpen(false);
                setIsTaskViewOpen(false);
                setIsSearchOpen(false);
                onCloseDirectCommand();
                onToggleStartMenu();
              }}
              onMouseEnter={(e) => showTooltip("Start", e)}
              onMouseLeave={() => setHoverTooltip(null)}
              aria-label="Start"
              aria-expanded={isStartMenuOpen}
              className={`taskbar-press-btn ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer border-none ${
                isStartMenuOpen
                  ? "bg-black/10 dark:bg-white/[0.14]"
                  : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              }`}
            >
              <span className="taskbar-press-icon inline-flex items-center justify-center">
                <img
                  src="/assets/aistudio/image_3602759f.png"
                  alt="Start"
                  draggable={false}
                  className={`${startIconSizeClass} object-contain select-none pointer-events-none`}
                />
              </span>
            </motion.button>

            {/* Search Box or Search Icon Button based on taskbarSearchStyle */}
            <motion.div
              ref={searchBoxRef}
              layout="position"
              transition={{ layout: taskbarLayoutTransition }}
              className="relative shrink-0"
            >
              {isSearchButtonMode ? (
                <button
                  id="windows-taskbar-search-btn"
                  type="button"
                  onClick={() => {
                    onCloseStartMenu();
                    onCloseDirectCommand();
                    setIsQuickSettingsOpen(false);
                    setIsTrayOverflowOpen(false);
                    setIsTaskViewOpen(false);
                    setIsSearchOpen((prev) => !prev);
                  }}
                  onMouseEnter={(e) => showTooltip("Search", e)}
                  onMouseLeave={() => setHoverTooltip(null)}
                  aria-label="Search"
                  aria-expanded={isSearchOpen}
                  className={`taskbar-press-btn ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer border-none ${
                    isSearchOpen
                      ? "bg-black/10 dark:bg-white/[0.14]"
                      : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="taskbar-press-icon inline-flex items-center justify-center">
                    <FluentSearchIcon
                      className={`${appIconSizeClass} text-[#374151] dark:text-white/90 shrink-0`}
                    />
                  </span>
                </button>
              ) : (
                <form
                  id="windows-taskbar-search-box"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim() && searchResults.length > 0) {
                      handleSelectSearchResult(searchResults[0]);
                    } else {
                      setIsSearchOpen(true);
                    }
                  }}
                  style={{
                    backgroundColor: isLightMode
                      ? isSearchOpen
                        ? "rgba(255, 255, 255, 0.85)"
                        : "rgba(255, 255, 255, 0.80)"
                      : "rgba(255, 255, 255, 0.10)",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                  }}
                  className={`${searchBoxHeightClass} w-[118px] sm:w-[168px] rounded-full flex items-center pl-3 pr-1 gap-2 transition-colors !border-0 !outline-none focus:!outline-none focus-within:!outline-none ring-0 focus-within:ring-0`}
                >
                  {settings.refreshedSearchIcon ? (
                    <img
                      src={
                        isSearchOpen
                          ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Focused.png-C6h07cJuZkQ7qxr3AwmqXxINQya0tI.x-icon"
                          : isLightMode
                            ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Light.png-HoVpbl8N1AMI4rRIqBouhKXe4NoTxd.x-icon"
                            : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dark.png-5e1aw6TgUECnUtZ4mPQmegFRSvNg6x.x-icon"
                      }
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className="w-[16px] h-[16px] object-contain shrink-0 pointer-events-none select-none"
                    />
                  ) : (
                    <FluentSearchIcon className="w-[12px] h-[12px] text-[#374151] dark:text-white/90 shrink-0" />
                  )}
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => {
                      onCloseStartMenu();
                      onCloseDirectCommand();
                      setIsQuickSettingsOpen(false);
                      setIsTrayOverflowOpen(false);
                      setIsTaskViewOpen(false);
                      setIsSearchOpen(true);
                    }}
                    onClick={() => {
                      onCloseStartMenu();
                      onCloseDirectCommand();
                      setIsSearchOpen(true);
                    }}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowAllResults(false);
                      setIsSearchOpen(true);
                    }}
                    placeholder="Start search"
                    className="flex-1 min-w-0 !bg-transparent text-[12.5px] text-[#111827] dark:text-white placeholder-[#111827] dark:placeholder-white/80 !outline-none focus:!outline-none !border-none !border-b-0 !shadow-none"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="hidden sm:block w-[38px] h-[22px] rounded-full overflow-hidden shrink-0"
                    >
                      <img
                        src="/__l5e/assets-v1/f269de9e-38d0-44d2-87f0-35b1f89d0346/image_4ca107ee.png"
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </form>
              )}

              {/* Straight Slide-Up Search UI Card matching reference screenshot (no fade, no shadow, bottom Search input) */}
              {typeof document !== "undefined" &&
                createPortal(
                  <AnimatePresence>
                    {isSearchOpen && (
                      <motion.div
                        key="windows-taskbar-search-flyout-wrapper"
                        initial={
                          settings.reduceAllMotion
                            ? false
                            : taskbarLocation === "top"
                              ? { y: "-100%" }
                              : taskbarLocation === "left"
                                ? { x: "-100%" }
                                : taskbarLocation === "right"
                                  ? { x: "100%" }
                                  : { y: "100%" }
                        }
                        animate={{
                          x: 0,
                          y: 0,
                          transition: settings.reduceAllMotion
                            ? { duration: 0 }
                            : { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        }}
                        exit={
                          settings.reduceAllMotion
                            ? undefined
                            : {
                                ...(taskbarLocation === "top"
                                  ? { y: "-100%" }
                                  : taskbarLocation === "left"
                                    ? { x: "-100%" }
                                    : taskbarLocation === "right"
                                      ? { x: "100%" }
                                      : { y: "100%" }),
                                transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                              }
                        }
                        style={{
                          zIndex: 8990,
                          paddingBottom:
                            taskbarLocation === "bottom" ? `${flyoutBottomOffset}px` : undefined,
                          paddingTop:
                            taskbarLocation === "top" ? `${flyoutBottomOffset}px` : undefined,
                          paddingLeft:
                            taskbarLocation === "left" ? `${flyoutBottomOffset}px` : undefined,
                          paddingRight:
                            taskbarLocation === "right" ? `${flyoutBottomOffset}px` : undefined,
                        }}
                        className={`fixed pointer-events-none flex ${
                          taskbarLocation === "top"
                            ? `top-0 inset-x-0 px-3 ${isLeftAligned ? "justify-center md:justify-start" : "justify-center"}`
                            : taskbarLocation === "left"
                              ? `left-0 inset-y-0 py-3 ${isLeftAligned ? "items-start" : "items-center"}`
                              : taskbarLocation === "right"
                                ? `right-0 inset-y-0 py-3 justify-end ${isLeftAligned ? "items-start" : "items-center"}`
                                : `bottom-0 inset-x-0 px-3 ${isLeftAligned ? "justify-center md:justify-start" : "justify-center"}`
                        }`}
                      >
                        <div
                          ref={searchFlyoutRef}
                          id="windows-taskbar-search-flyout"
                          className="pointer-events-auto w-full max-w-[396px] rounded-[14px] border-0 outline-none shadow-none overflow-hidden flex flex-col"
                        >
                          {/* Upper Frosted Results List */}
                          <div
                            style={{
                              backgroundColor: isLightMode
                                ? "rgba(235, 240, 248, 0.82)"
                                : "rgba(32, 35, 42, 0.84)",
                              backdropFilter: "blur(36px) saturate(170%)",
                              WebkitBackdropFilter: "blur(36px) saturate(170%)",
                            }}
                            className={`p-2 space-y-0.5 ${
                              showAllResults
                                ? "max-h-[min(420px,calc(100vh-140px))] overflow-y-auto sidebar-scroller"
                                : "max-h-[calc(100vh-140px)] overflow-hidden"
                            }`}
                          >
                            {(showAllResults ? searchResults : searchResults.slice(0, 6)).map(
                              (item, index) => {
                                const matchedChannelLogo =
                                  item.logo ||
                                  channels.find((c) => {
                                    const q = item.title
                                      .trim()
                                      .toLowerCase()
                                      .replace(/[-_\s]/g, "");
                                    return (
                                      q === c.name.toLowerCase().replace(/[-_\s]/g, "") ||
                                      q === c.slug.toLowerCase().replace(/[-_\s]/g, "")
                                    );
                                  })?.logo;

                                const normalizedSubtitle =
                                  item.subtitle === "Switch page" ? "Open" : item.subtitle;
                                const isOpenItem = normalizedSubtitle === "Open";
                                const matchedAspectAppId =
                                  item.startAppId ||
                                  (isOpenItem
                                    ? appAspects.find(
                                        (a) => a.title.toLowerCase() === item.title.toLowerCase(),
                                      )?.startAppId
                                    : undefined);
                                const startAppIconRenderer = matchedAspectAppId
                                  ? START_APP_ICONS[matchedAspectAppId]
                                  : undefined;
                                const startAppIconCls =
                                  matchedAspectAppId === "app-craftmine" ||
                                  matchedAspectAppId === "app-settings"
                                    ? "w-5 h-5 [&_img]:!w-[88%] [&_img]:!h-[88%] [&_svg]:!w-[88%] [&_svg]:!h-[88%]"
                                    : "w-5 h-5";

                                const resolveDragPayload = (): SodiumDragPayload | null => {
                                  const routeMap: Record<
                                    string,
                                    { route: string; appId?: string }
                                  > = {
                                    "page-home": { route: "/", appId: "app-home" },
                                    "page-watch": { route: "/live-tv", appId: "app-watch" },
                                    "page-news": { route: "/news", appId: "app-feed" },
                                    "page-channels": { route: "/channels", appId: "app-channels" },
                                    "page-favs": { route: "/favorites", appId: "app-favorites" },
                                    "page-craftmine": {
                                      route: "/craftmine",
                                      appId: "app-craftmine",
                                    },
                                    "page-photopea": { route: "/photopea", appId: "app-photopea" },
                                    "page-gallery": { route: "/gallery", appId: "app-gallery" },
                                    "page-draws": { route: "/draws", appId: "app-draws" },
                                    "page-notes": { route: "/notes", appId: "app-notes" },
                                    "page-screenbox": {
                                      route: "/screenbox",
                                      appId: "app-screenbox",
                                    },
                                    "page-camera": { route: "/camera", appId: "app-camera" },
                                    "page-calculator": {
                                      route: "/calculator",
                                      appId: "app-calculator",
                                    },
                                    "page-weather": { route: "/weather", appId: "app-weather" },
                                    "page-file-explorer": {
                                      route: "/file-explorer",
                                      appId: "app-file-explorer",
                                    },
                                    "page-notepad": { route: "/notepad", appId: "app-notepad" },
                                    "page-html-writer": {
                                      route: "/html-writer",
                                      appId: "app-html-writer",
                                    },
                                    "page-pc-settings": {
                                      route: "/pc-settings",
                                      appId: "app-pc-settings",
                                    },
                                    "page-settings": { route: "/settings", appId: "app-settings" },
                                    "trending-craftmine": {
                                      route: "/craftmine",
                                      appId: "app-craftmine",
                                    },
                                    "trending-memories": {
                                      route: "/gallery",
                                      appId: "app-gallery",
                                    },
                                    "action-create-new-note": {
                                      route: "/notes",
                                      appId: "app-notes",
                                    },
                                    "action-toggle-sticky-widget": {
                                      route: "/notes",
                                      appId: "app-notes",
                                    },
                                  };
                                  const mapped = routeMap[item.id];
                                  if (mapped) {
                                    return {
                                      kind: "app",
                                      appId: item.startAppId || mapped.appId,
                                      label: item.title,
                                      route: mapped.route,
                                    };
                                  }
                                  if (item.id === "tool-discord") {
                                    return {
                                      kind: "app",
                                      appId: "app-discord",
                                      label: item.title,
                                      route: "/home",
                                      externalUrl: "https://discord.gg/wcdjaDDayK",
                                    };
                                  }
                                  if (item.id.startsWith("channel-")) {
                                    const chId = item.id.slice("channel-".length);
                                    const ch = channels.find((c) => c.id === chId);
                                    if (ch) {
                                      return {
                                        kind: "channel",
                                        channelId: ch.id,
                                        slug: ch.slug,
                                        name: ch.name,
                                        logo: ch.logo,
                                        category: ch.category,
                                      };
                                    }
                                  }
                                  if (item.id === "trending-vtv1-hd") {
                                    const ch = channels.find(
                                      (c) =>
                                        c.slug.toLowerCase().includes("vtv1") ||
                                        c.name.toLowerCase().includes("vtv1"),
                                    );
                                    return {
                                      kind: "channel",
                                      channelId: ch?.id || "vtv1-hd",
                                      slug: ch?.slug || "vtv1-hd",
                                      name: ch?.name || "VTV1 HD",
                                      logo: ch?.logo || matchedChannelLogo,
                                      category: ch?.category,
                                    };
                                  }
                                  if (item.id.startsWith("article-")) {
                                    const artId = item.id.slice("article-".length);
                                    const art = NEWS_DATA.find((a) => a.id === artId);
                                    if (art) {
                                      return {
                                        kind: "article",
                                        articleId: art.id,
                                        slug: art.slug,
                                        title: art.title.replace(/^#\s*/, ""),
                                        coverImage: art.coverImage,
                                      };
                                    }
                                  }
                                  if (item.id.startsWith("note-")) {
                                    const noteId = item.id.slice("note-".length);
                                    const n = notes.find((nt) => nt.id === noteId);
                                    if (n) {
                                      return {
                                        kind: "note",
                                        noteId: n.id,
                                        title: n.title || "Untitled Note",
                                        colorId: n.colorId,
                                      };
                                    }
                                  }
                                  if (item.id.startsWith("gallery-")) {
                                    const gId = item.id.slice("gallery-".length);
                                    const g = galleryItems.find((gi) => gi.id === gId);
                                    if (g) {
                                      return {
                                        kind: "file",
                                        name: g.title,
                                        fileKind: g.type,
                                        mediaUrl: g.url,
                                        thumbnailUrl:
                                          g.thumbnailUrl ||
                                          (g.type === "image" ? g.url : undefined),
                                        linkedSource: "gallery",
                                        linkedId: g.id,
                                        targetRoute: `/gallery?preview=${encodeURIComponent(g.id)}`,
                                      };
                                    }
                                  }
                                  if (item.type === "setting-toggle" || item.type === "setting") {
                                    return {
                                      kind: "setting",
                                      title: item.title,
                                      route: item.keywords?.includes("insider")
                                        ? "/test"
                                        : "/settings",
                                    };
                                  }
                                  if (item.type === "history") {
                                    const matched = appAspects.find(
                                      (a) => a.title.toLowerCase() === item.title.toLowerCase(),
                                    );
                                    if (matched?.startAppId) {
                                      return {
                                        kind: "app",
                                        appId: matched.startAppId,
                                        label: matched.title,
                                        route: routeMap[matched.id]?.route || "/",
                                      };
                                    }
                                  }
                                  return null;
                                };

                                const dragPayload = resolveDragPayload();

                                return (
                                  <div
                                    key={`${item.id}-${searchQuery}-${index}`}
                                    draggable={Boolean(dragPayload)}
                                    onDragStart={(e) => {
                                      if (dragPayload) setSodiumDragData(e, dragPayload);
                                    }}
                                    onClick={() =>
                                      !isClearingHistory && handleSelectSearchResult(item)
                                    }
                                    title={item.title}
                                    className="w-full min-h-[48px] px-3 py-2 rounded-[8px] flex items-center gap-3.5 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.09] dark:active:bg-white/[0.12] transition-colors cursor-pointer group select-none"
                                  >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                      {matchedChannelLogo ? (
                                        <img
                                          src={matchedChannelLogo}
                                          alt=""
                                          className="w-5 h-5 object-contain rounded-[3px]"
                                        />
                                      ) : startAppIconRenderer ? (
                                        startAppIconRenderer(startAppIconCls)
                                      ) : (
                                        <Search
                                          className="w-[15px] h-[15px] text-black/75 dark:text-white/80"
                                          strokeWidth={1.75}
                                        />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="search-result-title text-[13px] font-medium text-[#111827] dark:text-white truncate leading-[1.3]">
                                        <FluentEmojiText>{item.title}</FluentEmojiText>
                                      </div>
                                      <div className="text-[11.5px] font-normal text-black/60 dark:text-white/60 truncate leading-[1.25] mt-0.5">
                                        {item.type === "history" && item.timestamp ? (
                                          <>
                                            {formatRelativeTime(item.timestamp)} •{" "}
                                            <span
                                              className={
                                                isOpenItem
                                                  ? "text-[#0057A2] dark:text-[#43AAE0] font-medium"
                                                  : undefined
                                              }
                                            >
                                              <FluentEmojiText>
                                                {normalizedSubtitle || "Search history"}
                                              </FluentEmojiText>
                                            </span>
                                          </>
                                        ) : (
                                          <span
                                            className={
                                              isOpenItem || !normalizedSubtitle
                                                ? "text-[#0057A2] dark:text-[#43AAE0] font-medium"
                                                : undefined
                                            }
                                          >
                                            <FluentEmojiText>
                                              {normalizedSubtitle || "Open"}
                                            </FluentEmojiText>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {item.type === "setting-toggle" &&
                                      (item.settingKey || item.customToggle) && (
                                        <button
                                          type="button"
                                          role="switch"
                                          aria-checked={
                                            item.customToggle
                                              ? item.customToggle.checked
                                              : Boolean(settings[item.settingKey!])
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.customToggle) {
                                              item.customToggle.onToggle();
                                            } else if (item.settingKey) {
                                              const currentVal = Boolean(settings[item.settingKey]);
                                              const nextVal = !currentVal;
                                              updateSetting(item.settingKey, nextVal);
                                              showAppToast(
                                                nextVal
                                                  ? `Enable ${item.title}`
                                                  : `Disable ${item.title}`,
                                                { source: "search" },
                                              );
                                            }
                                          }}
                                          className="toggle-switch-btn shrink-0"
                                          title={
                                            (
                                              item.customToggle
                                                ? item.customToggle.checked
                                                : Boolean(settings[item.settingKey!])
                                            )
                                              ? "Turn off"
                                              : "Turn on"
                                          }
                                        >
                                          <span className="toggle-switch-thumb" />
                                        </button>
                                      )}

                                    {item.customAction && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          item.customAction!.onAction();
                                        }}
                                        className="px-2 py-0.5 rounded-[6px] bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 hover:bg-[#005fb8]/20 text-[#005fb8] dark:text-[#4cc2ff] text-[11px] font-semibold shrink-0 cursor-pointer border-none"
                                      >
                                        {item.customAction.label}
                                      </button>
                                    )}

                                    {item.type === "web-search" && (
                                      <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 text-[#005fb8] dark:text-[#4cc2ff] font-medium shrink-0">
                                        Open tab
                                      </span>
                                    )}

                                    {item.type === "history" && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeFromHistory(item.title);
                                        }}
                                        aria-label="Remove from history"
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white shrink-0 cursor-pointer border-none bg-transparent"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              },
                            )}

                            {/* Compact Show more / Clear all footer */}
                            {((!searchQuery.trim() && searchHistory.length > 0) ||
                              (searchQuery.trim() && searchResults.length > 6 && !isWebSearch)) && (
                              <div className="pt-1 pb-0.5 px-2.5 flex items-center justify-between text-[11px] text-black/55 dark:text-white/55 border-t border-black/[0.06] dark:border-white/[0.06] mt-1">
                                {searchResults.length > 6 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowAllResults((prev) => !prev);
                                    }}
                                    className="text-[#005fb8] dark:text-[#4cc2ff] hover:underline font-medium cursor-pointer border-none bg-transparent"
                                  >
                                    {showAllResults
                                      ? "Show less"
                                      : `Show more (${searchResults.length})`}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onLaunchRoute("/search");
                                      setIsSearchOpen(false);
                                    }}
                                    className="text-[#005fb8] dark:text-[#4cc2ff] hover:underline font-medium cursor-pointer border-none bg-transparent"
                                  >
                                    Spotlight
                                  </button>
                                )}
                                {!searchQuery.trim() && searchHistory.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClearAllWithAnimation();
                                    }}
                                    disabled={isClearingHistory}
                                    className="hover:text-[#005fb8] dark:hover:text-[#4cc2ff] hover:underline font-medium cursor-pointer border-none bg-transparent"
                                  >
                                    Clear all
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom Search Input Strip matching reference screenshot */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (searchQuery.trim() && searchResults.length > 0) {
                                handleSelectSearchResult(searchResults[0]);
                              }
                            }}
                            style={{
                              backgroundColor: isLightMode
                                ? "rgba(255, 255, 255, 0.96)"
                                : "rgba(24, 26, 31, 0.96)",
                            }}
                            className="h-[46px] px-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2.5 shrink-0"
                          >
                            <FluentSearchIcon className="w-[15px] h-[15px] text-[#374151] dark:text-white/85 shrink-0 pointer-events-none select-none" />
                            <input
                              ref={searchFlyoutInputRef}
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowAllResults(false);
                              }}
                              placeholder="Search"
                              className="flex-1 min-w-0 !bg-transparent text-[13.5px] text-[#111827] dark:text-white placeholder-black/55 dark:placeholder-white/55 !outline-none focus:!outline-none !border-none !shadow-none"
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery("");
                                  searchFlyoutInputRef.current?.focus();
                                }}
                                aria-label="Clear search"
                                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent text-black/60 dark:text-white/70"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body,
                )}
            </motion.div>

            {/* Task View / Open Windows Button (Windows 11 split dual-pane style) */}
            <motion.div
              layout="position"
              transition={{ layout: taskbarLayoutTransition }}
              className="relative shrink-0"
            >
              <button
                id="btn-taskbar-taskview"
                type="button"
                onClick={() => {
                  onCloseStartMenu();
                  onCloseDirectCommand();
                  setIsSearchOpen(false);
                  setIsTaskViewOpen((prev) => !prev);
                }}
                onMouseEnter={(e) => showTooltip("Task view", e)}
                onMouseLeave={() => setHoverTooltip(null)}
                aria-label="Task view"
                className={`taskbar-press-btn ${btnSizeClass} rounded-[6px] flex items-center justify-center transition-colors duration-150 cursor-pointer border-none ${
                  isTaskViewOpen
                    ? "bg-white/55 dark:bg-white/[0.14]"
                    : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                }`}
              >
                <span className="taskbar-press-icon inline-flex items-center justify-center">
                  <img
                    src="/assets/aistudio/new_taskview_b01f63c9.png"
                    alt=""
                    draggable={false}
                    className={`${appIconSizeClass} object-contain select-none pointer-events-none`}
                  />
                </span>
              </button>

              {typeof document !== "undefined" &&
                createPortal(
                  <AnimatePresence>
                    {isTaskViewOpen && (
                      <motion.div
                        key="windows-taskbar-taskview-wrapper"
                        initial={
                          settings.reduceAllMotion
                            ? false
                            : taskbarLocation === "top"
                              ? { y: "-100%" }
                              : taskbarLocation === "left"
                                ? { x: "-100%" }
                                : taskbarLocation === "right"
                                  ? { x: "100%" }
                                  : { y: "100%" }
                        }
                        animate={{
                          x: 0,
                          y: 0,
                          transition: settings.reduceAllMotion
                            ? { duration: 0 }
                            : { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        }}
                        exit={
                          settings.reduceAllMotion
                            ? undefined
                            : {
                                ...(taskbarLocation === "top"
                                  ? { y: "-100%" }
                                  : taskbarLocation === "left"
                                    ? { x: "-100%" }
                                    : taskbarLocation === "right"
                                      ? { x: "100%" }
                                      : { y: "100%" }),
                                transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                              }
                        }
                        style={{
                          zIndex: 8990,
                          paddingBottom:
                            taskbarLocation === "bottom" ? `${flyoutBottomOffset}px` : undefined,
                          paddingTop:
                            taskbarLocation === "top" ? `${flyoutBottomOffset}px` : undefined,
                          paddingLeft:
                            taskbarLocation === "left" ? `${flyoutBottomOffset}px` : undefined,
                          paddingRight:
                            taskbarLocation === "right" ? `${flyoutBottomOffset}px` : undefined,
                        }}
                        className={`fixed pointer-events-none flex ${
                          taskbarLocation === "top"
                            ? `top-0 inset-x-0 px-3 ${isLeftAligned ? "justify-center md:justify-start" : "justify-center"}`
                            : taskbarLocation === "left"
                              ? `left-0 inset-y-0 py-3 ${isLeftAligned ? "items-start" : "items-center"}`
                              : taskbarLocation === "right"
                                ? `right-0 inset-y-0 py-3 justify-end ${isLeftAligned ? "items-start" : "items-center"}`
                                : `bottom-0 inset-x-0 px-3 ${isLeftAligned ? "justify-center md:justify-start" : "justify-center"}`
                        }`}
                      >
                        <div
                          ref={taskViewRef}
                          id="windows-taskbar-taskview-flyout"
                          style={{
                            backgroundColor: isLightMode
                              ? "rgba(235, 240, 248, 0.84)"
                              : "rgba(30, 32, 37, 0.88)",
                            backdropFilter: "blur(36px) saturate(180%)",
                            WebkitBackdropFilter: "blur(36px) saturate(180%)",
                          }}
                          className="pointer-events-auto w-full max-w-[360px] rounded-[14px] border border-black/10 dark:border-white/[0.12] shadow-none p-2.5"
                        >
                          <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-black/10 dark:border-white/10">
                            <span className="text-[12px] font-semibold">
                              Open Windows ({tabs.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onCreateNewWindow("/");
                                setIsTaskViewOpen(false);
                              }}
                              className="h-6 px-2 rounded-[5px] bg-[#0078d4] text-white text-[11px] font-medium flex items-center gap-1 hover:bg-[#106ebe] cursor-pointer border-none"
                            >
                              <Plus className="w-3 h-3" />
                              <span>New window</span>
                            </button>
                          </div>
                          <div className="space-y-1 max-h-[260px] overflow-y-auto no-scrollbar">
                            {tabs.length === 0 ? (
                              <div className="py-5 text-center text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                                No open windows
                              </div>
                            ) : (
                              tabs.map((tab) => {
                                const ws = windowStates[tab.id];
                                const isWinActive = tab.id === activeTabId && !ws?.isMinimized;
                                return (
                                  <div
                                    key={tab.id}
                                    className={`h-[38px] px-2 rounded-[7px] flex items-center justify-between gap-2 ${
                                      isWinActive
                                        ? "bg-black/[0.08] dark:bg-white/[0.12]"
                                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onTaskbarWindowClick(tab.id);
                                        setIsTaskViewOpen(false);
                                      }}
                                      className="flex items-center gap-2.5 flex-1 min-w-0 h-full text-left cursor-pointer border-none bg-transparent"
                                    >
                                      <StartMenuRouteIcon
                                        route={tab.route}
                                        className="w-4 h-4 shrink-0"
                                      />
                                      <span className="text-[12.5px] font-medium truncate">
                                        {tab.title}
                                      </span>
                                      {ws?.isMinimized && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[#6b7280] dark:text-[#9ca3af]">
                                          Minimized
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCloseWindow(tab.id)}
                                      aria-label={`Close ${tab.title}`}
                                      className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-[#c42b1c] hover:text-white cursor-pointer border-none"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body,
                )}
            </motion.div>

            {/* Unified Draggable Taskbar App Icons (pinned + open windows) */}
            <AnimatePresence mode="popLayout" initial={false}>
              {orderedTaskbarSlots.map((slot) => {
                const isSlotDragged = draggedSlotKey === slot.key;
                const dropSide =
                  taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : null;

                if (slot.kind === "pinned") {
                  const { pinned, matchingTabs } = slot;
                  if (matchingTabs.length === 0) {
                    const isBouncing = Boolean(bouncingKeys[slot.key]);
                    return (
                      <motion.div
                        key={slot.key}
                        role="button"
                        layout="position"
                        initial={
                          settings.reduceAllMotion ? false : { opacity: 0, scale: 0.72, y: 12 }
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={
                          settings.reduceAllMotion ? undefined : { opacity: 0, scale: 0.72, y: 12 }
                        }
                        transition={{ layout: taskbarLayoutTransition, duration: 0.2 }}
                        tabIndex={0}
                        draggable
                        onClick={() => {
                          if (!draggedSlotKey) {
                            onCloseStartMenu();
                            onCloseDirectCommand();
                            setIsSearchOpen(false);
                            onLaunchRoute(pinned.route);
                          }
                        }}
                        onMouseDown={(e) => {
                          if (e.button === 1) e.preventDefault();
                        }}
                        onAuxClick={(e) => {
                          if (e.button !== 1) return;
                          e.preventDefault();
                          onCloseStartMenu();
                          onCloseDirectCommand();
                          setIsSearchOpen(false);
                          onLaunchNewWindow(pinned.route);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCloseStartMenu();
                            onCloseDirectCommand();
                            setIsSearchOpen(false);
                            onLaunchRoute(pinned.route);
                          }
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", slot.key);
                          setHoverTooltip(null);
                          setDraggedSlotKey(slot.key);
                        }}
                        onDragOver={(e) => {
                          if (!draggedSlotKey || draggedSlotKey === slot.key) return;
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const side = isVertical
                            ? e.clientY < rect.top + rect.height / 2
                              ? "before"
                              : "after"
                            : e.clientX < rect.left + rect.width / 2
                              ? "before"
                              : "after";
                          setTaskbarDropTarget({ key: slot.key, side });
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setTaskbarDropTarget((prev) => (prev?.key === slot.key ? null : prev));
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const side =
                            taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : "before";
                          handleTaskbarSlotDrop(slot.key, side);
                          setDraggedSlotKey(null);
                          setTaskbarDropTarget(null);
                        }}
                        onDragEnd={() => {
                          setDraggedSlotKey(null);
                          setTaskbarDropTarget(null);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTaskMenu({
                            route: pinned.route,
                            title: pinned.title,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseEnter={(e) => !draggedSlotKey && showTooltip(pinned.title, e)}
                        onMouseLeave={() => setHoverTooltip(null)}
                        aria-label={pinned.title}
                        className={`taskbar-press-btn relative ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-150 cursor-pointer border-0 outline-none select-none ${
                          isSlotDragged ? "opacity-45 scale-90" : ""
                        }`}
                      >
                        {dropSide === "before" && (
                          <span
                            className={
                              isVertical
                                ? "absolute -top-[2px] left-1.5 right-1.5 h-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                                : "absolute -left-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                            }
                          />
                        )}
                        {dropSide === "after" && (
                          <span
                            className={
                              isVertical
                                ? "absolute -bottom-[2px] left-1.5 right-1.5 h-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                                : "absolute -right-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                            }
                          />
                        )}
                        <span className="taskbar-press-icon inline-flex items-center justify-center">
                          <motion.span
                            className="inline-flex items-center justify-center"
                            animate={
                              !settings.reduceAllMotion && isBouncing
                                ? taskbarBounceKeyframes
                                : { y: 0, scale: 1 }
                            }
                            transition={taskbarBounceTransition}
                          >
                            <StartMenuRouteIcon
                              route={pinned.route}
                              className={`${appIconSizeClass} shrink-0`}
                            />
                          </motion.span>
                        </span>
                      </motion.div>
                    );
                  }

                  return matchingTabs.map((tab, tabIdx) => {
                    const ws = windowStates[tab.id];
                    const isFocused = tab.id === activeTabId && !ws?.isMinimized;
                    const itemKey = tabIdx === 0 ? slot.key : tab.id;
                    const bounceLookupKey = tabIdx === 0 ? slot.key : `tab:${tab.id}`;
                    const isBouncing = Boolean(bouncingKeys[bounceLookupKey]);
                    return (
                      <motion.div
                        key={itemKey}
                        role="button"
                        layout="position"
                        initial={
                          settings.reduceAllMotion ? false : { opacity: 0, scale: 0.72, y: 12 }
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={
                          settings.reduceAllMotion ? undefined : { opacity: 0, scale: 0.72, y: 12 }
                        }
                        transition={{ layout: taskbarLayoutTransition, duration: 0.2 }}
                        tabIndex={0}
                        draggable
                        onClick={(e) => {
                          if (!draggedSlotKey) {
                            onCloseStartMenu();
                            onCloseDirectCommand();
                            setIsSearchOpen(false);
                            if (e.shiftKey) {
                              onLaunchNewWindow(getAppLaunchRoute(tab.route));
                            } else {
                              onTaskbarWindowClick(tab.id);
                            }
                          }
                        }}
                        onMouseDown={(e) => {
                          if (e.button === 1) e.preventDefault();
                        }}
                        onAuxClick={(e) => {
                          if (e.button !== 1) return;
                          e.preventDefault();
                          onCloseStartMenu();
                          onCloseDirectCommand();
                          setIsSearchOpen(false);
                          onLaunchNewWindow(getAppLaunchRoute(tab.route));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCloseStartMenu();
                            onCloseDirectCommand();
                            setIsSearchOpen(false);
                            onTaskbarWindowClick(tab.id);
                          }
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", slot.key);
                          setHoverTooltip(null);
                          setDraggedSlotKey(slot.key);
                        }}
                        onDragOver={(e) => {
                          if (!draggedSlotKey || draggedSlotKey === slot.key) return;
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const side = isVertical
                            ? e.clientY < rect.top + rect.height / 2
                              ? "before"
                              : "after"
                            : e.clientX < rect.left + rect.width / 2
                              ? "before"
                              : "after";
                          setTaskbarDropTarget({ key: slot.key, side });
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setTaskbarDropTarget((prev) => (prev?.key === slot.key ? null : prev));
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const side =
                            taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : "before";
                          handleTaskbarSlotDrop(slot.key, side);
                          setDraggedSlotKey(null);
                          setTaskbarDropTarget(null);
                        }}
                        onDragEnd={() => {
                          setDraggedSlotKey(null);
                          setTaskbarDropTarget(null);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTaskMenu({
                            tabId: tab.id,
                            route: tab.route,
                            title: tab.title,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseEnter={(e) => !draggedSlotKey && showTooltip(tab.title, e)}
                        onMouseLeave={() => setHoverTooltip(null)}
                        aria-label={tab.title}
                        className={`taskbar-press-btn relative ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer border-0 outline-none select-none ${
                          isFocused
                            ? "bg-black/[0.08] dark:bg-white/[0.12]"
                            : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                        } ${isSlotDragged ? "opacity-45 scale-90" : ""}`}
                      >
                        {tabIdx === 0 && dropSide === "before" && (
                          <span
                            className={
                              isVertical
                                ? "absolute -top-[2px] left-1.5 right-1.5 h-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                                : "absolute -left-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                            }
                          />
                        )}
                        {tabIdx === matchingTabs.length - 1 && dropSide === "after" && (
                          <span
                            className={
                              isVertical
                                ? "absolute -bottom-[2px] left-1.5 right-1.5 h-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                                : "absolute -right-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                            }
                          />
                        )}
                        <span className="taskbar-press-icon inline-flex items-center justify-center">
                          <motion.span
                            className="inline-flex items-center justify-center"
                            animate={
                              !settings.reduceAllMotion && isBouncing
                                ? taskbarBounceKeyframes
                                : { y: 0, scale: 1 }
                            }
                            transition={taskbarBounceTransition}
                          >
                            <StartMenuRouteIcon
                              route={tab.route}
                              className={`${appIconSizeClass} shrink-0`}
                            />
                          </motion.span>
                        </span>
                        <span
                          className={`absolute rounded-full transition-all duration-200 ${
                            isVertical
                              ? `${taskbarLocation === "right" ? "right-[2px]" : "left-[2px]"} top-1/2 -translate-y-1/2 w-[3px] ${
                                  isFocused
                                    ? "h-[16px] bg-[#0078d4] dark:bg-[#4cc2ff]"
                                    : "h-[6px] bg-black/40 dark:bg-white/50"
                                }`
                              : `bottom-[2px] left-1/2 -translate-x-1/2 h-[3px] ${
                                  isFocused
                                    ? "w-[16px] bg-[#0078d4] dark:bg-[#4cc2ff]"
                                    : "w-[6px] bg-black/40 dark:bg-white/50"
                                }`
                          }`}
                        />
                      </motion.div>
                    );
                  });
                }

                const { tab } = slot;
                const ws = windowStates[tab.id];
                const isFocused = tab.id === activeTabId && !ws?.isMinimized;
                const isBouncing = Boolean(bouncingKeys[slot.key]);
                return (
                  <motion.div
                    key={slot.key}
                    role="button"
                    layout="position"
                    initial={settings.reduceAllMotion ? false : { opacity: 0, scale: 0.72, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={settings.reduceAllMotion ? undefined : { opacity: 0, scale: 0.72, y: 12 }}
                    transition={{ layout: taskbarLayoutTransition, duration: 0.2 }}
                    tabIndex={0}
                    draggable
                    onClick={(e) => {
                      if (!draggedSlotKey) {
                        onCloseStartMenu();
                        onCloseDirectCommand();
                        setIsSearchOpen(false);
                        if (e.shiftKey) {
                          onLaunchNewWindow(getAppLaunchRoute(tab.route));
                        } else {
                          onTaskbarWindowClick(tab.id);
                        }
                      }
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 1) e.preventDefault();
                    }}
                    onAuxClick={(e) => {
                      if (e.button !== 1) return;
                      e.preventDefault();
                      onCloseStartMenu();
                      onCloseDirectCommand();
                      setIsSearchOpen(false);
                      onLaunchNewWindow(getAppLaunchRoute(tab.route));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCloseStartMenu();
                        onCloseDirectCommand();
                        setIsSearchOpen(false);
                        onTaskbarWindowClick(tab.id);
                      }
                    }}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", slot.key);
                      setHoverTooltip(null);
                      setDraggedSlotKey(slot.key);
                    }}
                    onDragOver={(e) => {
                      if (!draggedSlotKey || draggedSlotKey === slot.key) return;
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const side = isVertical
                        ? e.clientY < rect.top + rect.height / 2
                          ? "before"
                          : "after"
                        : e.clientX < rect.left + rect.width / 2
                          ? "before"
                          : "after";
                      setTaskbarDropTarget({ key: slot.key, side });
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setTaskbarDropTarget((prev) => (prev?.key === slot.key ? null : prev));
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const side =
                        taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : "before";
                      handleTaskbarSlotDrop(slot.key, side);
                      setDraggedSlotKey(null);
                      setTaskbarDropTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedSlotKey(null);
                      setTaskbarDropTarget(null);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTaskMenu({
                        tabId: tab.id,
                        route: tab.route,
                        title: tab.title,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseEnter={(e) => !draggedSlotKey && showTooltip(tab.title, e)}
                    onMouseLeave={() => setHoverTooltip(null)}
                    aria-label={tab.title}
                    className={`taskbar-press-btn relative ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer border-0 outline-none select-none ${
                      isFocused
                        ? "bg-black/[0.08] dark:bg-white/[0.12]"
                        : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    } ${isSlotDragged ? "opacity-45 scale-90" : ""}`}
                  >
                    {dropSide === "before" && (
                      <span
                        className={
                          isVertical
                            ? "absolute -top-[2px] left-1.5 right-1.5 h-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                            : "absolute -left-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                        }
                      />
                    )}
                    {dropSide === "after" && (
                      <span
                        className={
                          isVertical
                            ? "absolute -bottom-[2px] left-1.5 right-1.5 h-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                            : "absolute -right-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none"
                        }
                      />
                    )}
                    <span className="taskbar-press-icon inline-flex items-center justify-center">
                      <motion.span
                        className="inline-flex items-center justify-center"
                        animate={
                          !settings.reduceAllMotion && isBouncing
                            ? taskbarBounceKeyframes
                            : { y: 0, scale: 1 }
                        }
                        transition={taskbarBounceTransition}
                      >
                        <StartMenuRouteIcon
                          route={tab.route}
                          className={`${appIconSizeClass} shrink-0`}
                        />
                      </motion.span>
                    </span>
                    <span
                      className={`absolute rounded-full transition-all duration-200 ${
                        isVertical
                          ? `${taskbarLocation === "right" ? "right-[2px]" : "left-[2px]"} top-1/2 -translate-y-1/2 w-[3px] ${
                              isFocused
                                ? "h-[16px] bg-[#0078d4] dark:bg-[#4cc2ff]"
                                : "h-[6px] bg-black/40 dark:bg-white/50"
                            }`
                          : `bottom-[2px] left-1/2 -translate-x-1/2 h-[3px] ${
                              isFocused
                                ? "w-[16px] bg-[#0078d4] dark:bg-[#4cc2ff]"
                                : "w-[6px] bg-black/40 dark:bg-white/50"
                            }`
                      }`}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </LayoutGroup>

        {/* 3. Right / Bottom System Tray: ^ Overflow, Wi-Fi + Volume (Control Center), Clock + Date, Direct Command */}
        <div
          className={`flex items-center shrink-0 ${isVertical ? "flex-col gap-1 w-full" : "gap-0.5 sm:gap-1 h-full"}`}
        >
          {isLeftAligned && (
            <button
              id="btn-taskbar-weather"
              type="button"
              onClick={handleToggleWidgets}
              onMouseEnter={handleWeatherMouseEnter}
              onMouseLeave={handleWeatherMouseLeave}
              aria-expanded={isWidgetsOpen}
              className={`taskbar-press-btn ${
                isVertical
                  ? "flex flex-col items-center justify-center w-full py-1 px-0.5"
                  : "hidden lg:flex items-center h-[34px] px-2 mr-0.5"
              } rounded-[5px] transition-colors duration-150 cursor-pointer border-0 outline-none focus:outline-none shrink-0 text-left ${
                isWidgetsOpen
                  ? "bg-black/[0.08] dark:bg-white/[0.12]"
                  : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`taskbar-press-icon inline-flex items-center ${isVertical ? "flex-col gap-0.5" : "gap-2"}`}
              >
                <div
                  id="windows-taskbar-weather-sun"
                  className="w-7 h-7 shrink-0 flex items-center justify-center"
                >
                  <TaskbarWeatherIcon
                    temp={activeCityWeather.temp}
                    condition={activeCityWeather.condition}
                    weatherCode={activeCityWeather.weatherCode}
                    isDay={activeCityWeather.isDay}
                    className="w-7 h-7"
                  />
                </div>
                <span
                  className={`${isVertical ? "text-[10px] leading-none" : "text-[11.5px]"} font-medium tabular-nums`}
                >
                  {isVertical ? `${activeCityWeather.temp}°` : `${activeCityWeather.temp}°C`}
                </span>
              </span>
            </button>
          )}

          <div className="relative hidden sm:block">
            <button
              id="btn-taskbar-tray-overflow"
              type="button"
              onClick={() => {
                onCloseDirectCommand();
                setIsQuickSettingsOpen(false);
                setIsTrayOverflowOpen((prev) => !prev);
              }}
              aria-label="Show hidden icons"
              className={`taskbar-press-btn ${isVertical ? "w-8 h-7" : "w-7 h-[34px]"} rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none`}
            >
              <span className="taskbar-press-icon inline-flex items-center justify-center">
                <ChevronUp
                  className={`w-3.5 h-3.5 transition-transform ${isTrayOverflowOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            <AnimatePresence>
              {isTrayOverflowOpen && (
                <motion.div
                  ref={trayOverflowRef}
                  initial={{ opacity: 0, y: taskbarLocation === "top" ? -10 : 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: taskbarLocation === "top" ? -10 : 10, scale: 0.96 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    bottom:
                      taskbarLocation === "top"
                        ? undefined
                        : taskbarLocation === "bottom"
                          ? `${flyoutBottomOffset}px`
                          : "12px",
                    top: taskbarLocation === "top" ? `${flyoutBottomOffset}px` : undefined,
                    left: taskbarLocation === "left" ? `${flyoutBottomOffset}px` : undefined,
                    right:
                      taskbarLocation === "left"
                        ? undefined
                        : taskbarLocation === "right"
                          ? `${flyoutBottomOffset}px`
                          : "48px",
                    backgroundColor: isLightMode
                      ? "rgba(245, 245, 247, 0.92)"
                      : "rgba(30, 32, 37, 0.92)",
                    backdropFilter: "blur(28px)",
                  }}
                  className="fixed w-[195px] p-1.5 rounded-[10px] border border-black/10 dark:border-white/[0.12] shadow-2xl space-y-0.5 z-[9500]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      updateSetting("nativeKeyboard", !settings.nativeKeyboard);
                      setIsTrayOverflowOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>
                      {settings.nativeKeyboard ? "Hide touch keyboard" : "Touch keyboard"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchRoute("/settings");
                      setIsTrayOverflowOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>SodiumOS Mode Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateSetting("windowsMode", false);
                      setIsTrayOverflowOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12px] text-[#c42b1c] dark:text-[#ff99a4] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit SodiumOS Mode</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              id="btn-taskbar-quick-settings"
              type="button"
              onClick={() => {
                onCloseDirectCommand();
                setIsTrayOverflowOpen(false);
                setIsQuickSettingsOpen((prev) => !prev);
              }}
              aria-label="Quick settings"
              className={`taskbar-press-btn ${isVertical ? "w-9 py-1.5 px-1 justify-center" : "h-[34px] px-2"} rounded-[5px] flex items-center transition-colors cursor-pointer border-none ${
                isQuickSettingsOpen
                  ? "bg-black/10 dark:bg-white/[0.14]"
                  : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`taskbar-press-icon inline-flex items-center ${isVertical ? "flex-col gap-1" : "gap-2"}`}
              >
                {pcQuickState.airplaneMode ? (
                  <Plane className="w-3.5 h-3.5" />
                ) : (
                  <Wifi className="w-3.5 h-3.5" />
                )}
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
          </div>

          <div
            className={`flex items-center shrink-0 ${isVertical ? "flex-col gap-1 w-full" : "gap-0"}`}
          >
            <TaskbarClock
              clockTextSizeClass={clockTextSizeClass}
              heightClass={
                isFloating ? (taskbarScale === "small" ? "h-[30px]" : "h-[36px]") : "h-[36px]"
              }
              isVertical={isVertical}
              onClick={() => {
                onCloseDirectCommand();
                setIsQuickSettingsOpen((prev) => !prev);
              }}
            />

            {/* Direct Command icon placed tightly to the right / below Clock Tray */}
            <button
              id="btn-taskbar-direct-command"
              type="button"
              onClick={() => {
                onCloseStartMenu();
                setIsSearchOpen(false);
                setIsQuickSettingsOpen(false);
                setIsTrayOverflowOpen(false);
                setIsTaskViewOpen(false);
                onToggleDirectCommand();
              }}
              onMouseEnter={(e) => showTooltip("Direct Command", e)}
              onMouseLeave={() => setHoverTooltip(null)}
              aria-label="Direct Command"
              aria-expanded={isDirectCommandOpen}
              className={`taskbar-press-btn ${directCmdBtnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer border-none ${
                isDirectCommandOpen
                  ? "bg-black/10 dark:bg-white/[0.14]"
                  : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              }`}
            >
              <span className="taskbar-press-icon inline-flex items-center justify-center">
                <img
                  src="/assets/aistudio/direct_command_6240d59d.png"
                  alt="Direct Command"
                  draggable={false}
                  className={`${appIconSizeClass} object-contain select-none pointer-events-none`}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.footer>

      {/* Portaled Control Center (outside #windows-taskbar so backdropFilter blurs the desktop/windows cleanly) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isQuickSettingsOpen && (
              <motion.div
                key="windows-control-center"
                ref={quickSettingsRef}
                initial={
                  settings.reduceAllMotion
                    ? false
                    : { x: taskbarLocation === "left" ? "-110%" : "110%", opacity: 0 }
                }
                animate={{
                  x: 0,
                  opacity: 1,
                  transition: settings.reduceAllMotion
                    ? { duration: 0 }
                    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={
                  settings.reduceAllMotion
                    ? undefined
                    : {
                        x: taskbarLocation === "left" ? "-110%" : "110%",
                        opacity: 0,
                        transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                      }
                }
                style={{
                  bottom:
                    taskbarLocation === "top"
                      ? undefined
                      : taskbarLocation === "bottom"
                        ? `${flyoutBottomOffset}px`
                        : "12px",
                  top: taskbarLocation === "top" ? `${flyoutBottomOffset}px` : undefined,
                  left: taskbarLocation === "left" ? `${flyoutBottomOffset}px` : undefined,
                  right:
                    taskbarLocation === "left"
                      ? undefined
                      : taskbarLocation === "right"
                        ? `${flyoutBottomOffset}px`
                        : "12px",
                  zIndex: 9500,
                }}
                className="fixed w-[356px] max-w-[calc(100vw-24px)]"
              >
                <div
                  id="windows-control-center"
                  role="dialog"
                  aria-label="Control Center"
                  style={{
                    backgroundColor: isLightMode
                      ? "rgba(243, 243, 243, 0.76)"
                      : "rgba(30, 32, 37, 0.76)",
                    backdropFilter: "blur(42px) saturate(180%)",
                    WebkitBackdropFilter: "blur(42px) saturate(180%)",
                  }}
                  className="w-full rounded-[12px] border border-black/10 dark:border-white/[0.12] shadow-[0_16px_42px_rgba(0,0,0,0.28)] p-3.5 space-y-3 select-none text-[#111827] dark:text-white"
                >
                  {isCustomizingControls ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-black/[0.07] dark:border-white/[0.08]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Pencil className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="text-[12px] font-semibold truncate">
                            Customize controls
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={resetControlLayout}
                            title="Reset to default layout"
                            className="h-6 px-2 rounded-[5px] bg-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[11px] font-medium inline-flex items-center gap-1 border border-black/10 dark:border-white/15 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomizingControls(false);
                              setDraggedControlId(null);
                            }}
                            className="cc-control-tile h-6 px-2.5 rounded-[5px] bg-[#0067b8] dark:bg-[#4cc2ff] text-white dark:text-[#0b1220] text-[11px] font-semibold inline-flex items-center gap-1 border-none cursor-pointer shadow-none"
                            data-colored="true"
                          >
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-[10.5px] opacity-70">
                        Drag tiles or use arrows to rearrange, and add or remove shortcuts.
                      </div>

                      <div className="grid grid-cols-3 gap-2 max-h-[224px] overflow-y-auto pr-0.5 no-scrollbar">
                        {controlCenterIds.map((id, idx) => {
                          const meta = ALL_CONTROL_CENTER_ITEMS.find((item) => item.id === id);
                          if (!meta) return null;
                          const renderCustomIcon = () => {
                            switch (id) {
                              case "theme":
                                return settings.theme === "light" ? (
                                  <Sun className="w-3.5 h-3.5 shrink-0" />
                                ) : (
                                  <Moon className="w-3.5 h-3.5 shrink-0" />
                                );
                              case "night-light":
                                return <Sunset className="w-3.5 h-3.5 shrink-0" />;
                              case "airplane-mode":
                                return <Plane className="w-3.5 h-3.5 shrink-0" />;
                              case "energy-saver":
                                return <Leaf className="w-3.5 h-3.5 shrink-0" />;
                              case "nearby-sharing":
                                return <Share2 className="w-3.5 h-3.5 shrink-0" />;
                              case "touch-keyboard":
                                return <Keyboard className="w-3.5 h-3.5 shrink-0" />;
                              case "speedtest":
                                return <Gauge className="w-3.5 h-3.5 shrink-0" />;
                              case "pc-settings":
                                return <SettingsIcon className="w-3.5 h-3.5 shrink-0" />;
                              case "customize":
                                return <Pencil className="w-3.5 h-3.5 shrink-0" />;
                              case "wifi":
                                return <Wifi className="w-3.5 h-3.5 shrink-0" />;
                              case "bluetooth":
                                return <Bluetooth className="w-3.5 h-3.5 shrink-0" />;
                              case "personalization":
                                return <Paintbrush className="w-3.5 h-3.5 shrink-0" />;
                              case "file-explorer":
                                return <FolderOpen className="w-3.5 h-3.5 shrink-0" />;
                              case "notes":
                                return <StickyNote className="w-3.5 h-3.5 shrink-0" />;
                              case "camera":
                                return <Camera className="w-3.5 h-3.5 shrink-0" />;
                              case "calculator":
                                return <CalculatorIcon className="w-3.5 h-3.5 shrink-0" />;
                              case "direct-command":
                                return <Terminal className="w-3.5 h-3.5 shrink-0" />;
                              case "show-desktop":
                                return <Monitor className="w-3.5 h-3.5 shrink-0" />;
                              case "mute-audio":
                                return <VolumeX className="w-3.5 h-3.5 shrink-0" />;
                            }
                          };
                          return (
                            <div
                              key={id}
                              draggable
                              onDragStart={() => setDraggedControlId(id)}
                              onDragOver={(e) => {
                                e.preventDefault();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (!draggedControlId || draggedControlId === id) return;
                                const fromIdx = controlCenterIds.indexOf(draggedControlId);
                                if (fromIdx >= 0) moveControlIndex(fromIdx, idx);
                                setDraggedControlId(null);
                              }}
                              onDragEnd={() => setDraggedControlId(null)}
                              className={`relative h-[68px] p-1.5 rounded-[8px] bg-black/[0.05] dark:bg-white/[0.08] border-none flex flex-col items-center justify-between cursor-grab active:cursor-grabbing transition-opacity ${
                                draggedControlId === id ? "opacity-45" : "opacity-100"
                              }`}
                            >
                              <div className="w-full flex items-center justify-between gap-0.5">
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveControlIndex(idx, idx - 1)}
                                    aria-label={`Move ${meta.label} back`}
                                    className="w-4 h-4 rounded-[4px] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-25 border-none bg-transparent cursor-pointer"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === controlCenterIds.length - 1}
                                    onClick={() => moveControlIndex(idx, idx + 1)}
                                    aria-label={`Move ${meta.label} forward`}
                                    className="w-4 h-4 rounded-[4px] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-25 border-none bg-transparent cursor-pointer"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                                {meta.removable && (
                                  <button
                                    type="button"
                                    onClick={() => removeControlId(id)}
                                    aria-label={`Remove ${meta.label}`}
                                    className="w-4 h-4 rounded-[4px] flex items-center justify-center hover:bg-red-500/20 text-red-500 dark:text-red-400 border-none bg-transparent cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-col items-center justify-center gap-0.5 pb-0.5 w-full min-w-0">
                                {renderCustomIcon()}
                                <span className="text-[10px] font-medium leading-[1.15] text-center line-clamp-1 max-w-full px-0.5">
                                  {id === "theme"
                                    ? settings.theme === "light"
                                      ? "Light"
                                      : "Dark"
                                    : meta.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {ALL_CONTROL_CENTER_ITEMS.some(
                        (item) => !controlCenterIds.includes(item.id),
                      ) && (
                        <div className="pt-2 border-t border-black/[0.07] dark:border-white/[0.08] space-y-1.5">
                          <div className="text-[11px] font-semibold opacity-80">Add shortcuts</div>
                          <div className="flex flex-wrap gap-1.5 max-h-[104px] overflow-y-auto no-scrollbar">
                            {ALL_CONTROL_CENTER_ITEMS.filter(
                              (item) => !controlCenterIds.includes(item.id),
                            ).map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => addControlId(item.id)}
                                className="h-[26px] px-2 rounded-[6px] bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.13] border-none outline-none text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 shrink-0" />
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {controlCenterIds.map((id) => {
                          const tileBaseClass =
                            "cc-control-tile h-[64px] px-1.5 rounded-[8px] flex flex-col items-center justify-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer border-0 outline-none shadow-none no-underline";
                          const coloredClass =
                            "bg-[#0067b8] dark:bg-[#4cc2ff] text-white dark:text-[#0b1220] hover:opacity-95";
                          const plainClass =
                            "bg-black/[0.05] dark:bg-white/[0.08] text-[#111827] dark:text-white hover:bg-black/[0.09] dark:hover:bg-white/[0.14]";

                          if (id === "speedtest") {
                            return (
                              <a
                                key={id}
                                href="https://www.speedtest.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                data-colored="false"
                                onClick={() => setIsQuickSettingsOpen(false)}
                                className={`${tileBaseClass} ${plainClass}`}
                              >
                                <Gauge className="w-4 h-4 shrink-0" />
                                <span className="leading-[1.15] text-center line-clamp-2 max-w-full">
                                  Speedtest
                                </span>
                              </a>
                            );
                          }

                          let label = "";
                          let icon: React.ReactNode = null;
                          let isColored = false;
                          let ariaPressed: boolean | undefined;
                          let onClick: () => void = () => {};

                          switch (id) {
                            case "theme":
                              label = settings.theme === "light" ? "Light" : "Dark";
                              icon =
                                settings.theme === "light" ? (
                                  <Sun className="w-4 h-4 shrink-0" />
                                ) : (
                                  <Moon className="w-4 h-4 shrink-0" />
                                );
                              isColored = true;
                              onClick = () =>
                                updateSetting(
                                  "theme",
                                  settings.theme === "light" ? "dark" : "light",
                                );
                              break;
                            case "night-light":
                              label = "Night light";
                              icon = <Sunset className="w-4 h-4 shrink-0" />;
                              isColored = pcQuickState.nightLight;
                              ariaPressed = pcQuickState.nightLight;
                              onClick = () =>
                                updatePcQuickState({ nightLight: !pcQuickState.nightLight });
                              break;
                            case "airplane-mode":
                              label = "Airplane mode";
                              icon = <Plane className="w-4 h-4 shrink-0" />;
                              isColored = pcQuickState.airplaneMode;
                              ariaPressed = pcQuickState.airplaneMode;
                              onClick = () =>
                                updatePcQuickState({ airplaneMode: !pcQuickState.airplaneMode });
                              break;
                            case "energy-saver":
                              label = "Energy saver";
                              icon = <Leaf className="w-4 h-4 shrink-0" />;
                              isColored = pcQuickState.energySaver;
                              ariaPressed = pcQuickState.energySaver;
                              onClick = () => {
                                const next = !pcQuickState.energySaver;
                                updatePcQuickState({
                                  energySaver: next,
                                  powerMode: next ? "Best power efficiency" : "Balanced",
                                });
                              };
                              break;
                            case "nearby-sharing":
                              label = "Nearby sharing";
                              icon = <Share2 className="w-4 h-4 shrink-0" />;
                              isColored = pcQuickState.nearbySharing;
                              ariaPressed = pcQuickState.nearbySharing;
                              onClick = () =>
                                updatePcQuickState({ nearbySharing: !pcQuickState.nearbySharing });
                              break;
                            case "touch-keyboard":
                              label = "Touch keyboard";
                              icon = <Keyboard className="w-4 h-4 shrink-0" />;
                              isColored = Boolean(settings.nativeKeyboard);
                              ariaPressed = Boolean(settings.nativeKeyboard);
                              onClick = () =>
                                updateSetting("nativeKeyboard", !settings.nativeKeyboard);
                              break;
                            case "pc-settings":
                              label = "Settings";
                              icon = <SettingsIcon className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onLaunchRoute("/pc-settings");
                              };
                              break;
                            case "customize":
                              label = "Customize controls";
                              icon = <Pencil className="w-4 h-4 shrink-0" />;
                              onClick = () => setIsCustomizingControls(true);
                              break;
                            case "wifi":
                              label = "Wi-Fi";
                              icon = <Wifi className="w-4 h-4 shrink-0" />;
                              isColored = pcQuickState.wifiEnabled && !pcQuickState.airplaneMode;
                              ariaPressed = isColored;
                              onClick = () =>
                                updatePcQuickState({
                                  wifiEnabled: !pcQuickState.wifiEnabled,
                                  airplaneMode: pcQuickState.wifiEnabled
                                    ? pcQuickState.airplaneMode
                                    : false,
                                });
                              break;
                            case "bluetooth":
                              label = "Bluetooth";
                              icon = <Bluetooth className="w-4 h-4 shrink-0" />;
                              isColored =
                                pcQuickState.bluetoothEnabled && !pcQuickState.airplaneMode;
                              ariaPressed = isColored;
                              onClick = () =>
                                updatePcQuickState({
                                  bluetoothEnabled: !pcQuickState.bluetoothEnabled,
                                });
                              break;
                            case "personalization":
                              label = "Personalization";
                              icon = <Paintbrush className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onLaunchRoute("/pc-settings/personalization");
                                window.dispatchEvent(
                                  new CustomEvent("sparkle:pc-settings-category", {
                                    detail: { category: "personalization" },
                                  }),
                                );
                              };
                              break;
                            case "file-explorer":
                              label = "File Explorer";
                              icon = <FolderOpen className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onLaunchRoute("/file-explorer");
                              };
                              break;
                            case "notes":
                              label = "Notes";
                              icon = <StickyNote className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onLaunchRoute("/notes");
                              };
                              break;
                            case "camera":
                              label = "Camera";
                              icon = <Camera className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onLaunchRoute("/camera");
                              };
                              break;
                            case "calculator":
                              label = "Calculator";
                              icon = <CalculatorIcon className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onLaunchRoute("/calculator");
                              };
                              break;
                            case "direct-command":
                              label = "Direct Command";
                              icon = <Terminal className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onToggleDirectCommand();
                              };
                              break;
                            case "show-desktop":
                              label = "Show desktop";
                              icon = <Monitor className="w-4 h-4 shrink-0" />;
                              onClick = () => {
                                setIsQuickSettingsOpen(false);
                                onShowDesktop();
                              };
                              break;
                            case "mute-audio":
                              label = "Mute audio";
                              icon = <VolumeX className="w-4 h-4 shrink-0" />;
                              isColored = pcQuickState.soundMuted;
                              ariaPressed = pcQuickState.soundMuted;
                              onClick = () =>
                                updatePcQuickState({ soundMuted: !pcQuickState.soundMuted });
                              break;
                          }

                          return (
                            <button
                              key={id}
                              type="button"
                              aria-pressed={ariaPressed}
                              data-colored={isColored ? "true" : "false"}
                              onClick={onClick}
                              className={`${tileBaseClass} ${isColored ? coloredClass : plainClass}`}
                            >
                              {icon}
                              <span className="leading-[1.15] text-center line-clamp-2 max-w-full">
                                {label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Brightness & Volume Sliders */}
                      <div className="space-y-2.5 pt-1 border-t border-black/[0.07] dark:border-white/[0.08]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-[5px] flex items-center justify-center shrink-0"
                            aria-hidden="true"
                          >
                            <Sun className="w-4 h-4 opacity-85" />
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={100}
                            value={pcQuickState.brightness}
                            onChange={(e) =>
                              updatePcQuickState({ brightness: Number(e.target.value) })
                            }
                            aria-label="Brightness"
                            className="flex-1 accent-[#0067b8] dark:accent-[#4cc2ff] cursor-pointer"
                          />
                          <span className="text-[11px] w-7 text-right tabular-nums">
                            {pcQuickState.brightness}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              updatePcQuickState({ soundMuted: !pcQuickState.soundMuted })
                            }
                            aria-label={isMuted ? "Unmute" : "Mute"}
                            className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer border-none shrink-0"
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={isMuted ? 0 : volume}
                            onChange={(e) =>
                              updatePcQuickState({
                                soundMuted: false,
                                soundVolume: Number(e.target.value),
                              })
                            }
                            aria-label="Volume"
                            className="flex-1 accent-[#0067b8] dark:accent-[#4cc2ff] cursor-pointer"
                          />
                          <span className="text-[11px] w-7 text-right tabular-nums">
                            {isMuted ? 0 : volume}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* WinUI 3 Acrylic Tooltip matching Sidebar tooltip */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {hoverTooltip && (
              <motion.div
                key="taskbar-hover-tooltip"
                role="tooltip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  bottom: taskbarLocation === "bottom" ? `${flyoutBottomOffset}px` : undefined,
                  top: taskbarLocation === "top" ? `${flyoutBottomOffset}px` : undefined,
                  left:
                    taskbarLocation === "left"
                      ? `${flyoutBottomOffset}px`
                      : !isVertical
                        ? `${Math.max(48, Math.min(hoverTooltip.left, (typeof window !== "undefined" ? window.innerWidth : 1200) - 48))}px`
                        : undefined,
                  right: taskbarLocation === "right" ? `${flyoutBottomOffset}px` : undefined,
                  ...(isVertical
                    ? {
                        top: `${Math.max(32, Math.min(hoverTooltip.top, (typeof window !== "undefined" ? window.innerHeight : 800) - 32))}px`,
                        transform: "translateY(-50%)",
                      }
                    : {
                        transform: "translateX(-50%)",
                      }),
                  backgroundColor: isLightMode
                    ? "rgba(255, 255, 255, 0.50)"
                    : "rgba(24, 24, 28, 0.50)",
                  backdropFilter: "blur(16px) saturate(140%)",
                  WebkitBackdropFilter: "blur(16px) saturate(140%)",
                }}
                className="fluent-tooltip z-[2147483647] px-3 py-1.5 min-h-[30px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium shadow-[0_4px_20px_rgba(0,0,0,0.18)] border-0 outline-none pointer-events-none whitespace-nowrap select-none"
              >
                {hoverTooltip.label}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {taskMenu && (
              <div
                key={`task-menu-${taskMenu.tabId ?? taskMenu.route}-${taskMenu.x}`}
                ref={taskMenuRef}
                data-windows-context-menu="true"
                style={{
                  position: "fixed",
                  left:
                    taskbarLocation === "left"
                      ? `${flyoutBottomOffset}px`
                      : taskbarLocation === "right"
                        ? undefined
                        : Math.max(8, Math.min(taskMenu.x, window.innerWidth - 190)),
                  right: taskbarLocation === "right" ? `${flyoutBottomOffset}px` : undefined,
                  bottom:
                    taskbarLocation === "bottom"
                      ? `${taskbarThickness + effectiveTaskbarBottom + 6}px`
                      : undefined,
                  top:
                    taskbarLocation === "top"
                      ? `${taskbarThickness + effectiveTaskbarBottom + 6}px`
                      : isVertical
                        ? Math.max(8, Math.min(taskMenu.y, window.innerHeight - 220))
                        : undefined,
                  zIndex: 2147483647,
                  overflow: "clip",
                }}
                className="fluent-context-menu-wrapper pointer-events-auto"
              >
                <motion.div
                  {...(taskbarLocation === "top"
                    ? contextMenuMotionProps
                    : contextMenuUpMotionProps)}
                >
                  <div
                    role="menu"
                    style={flyoutPanelStyle}
                    className={`w-[180px] p-1 ${flyoutPanelClassName} fluent-context-menu shadow-none space-y-0.5 text-[#111827] dark:text-white`}
                  >
                    {taskMenu.tabId && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onTaskbarWindowClick(taskMenu.tabId);
                            setTaskMenu(null);
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>
                            {windowStates[taskMenu.tabId]?.isMinimized ? "Restore" : "Minimize"}
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onToggleMaximizeWindow(taskMenu.tabId);
                            setTaskMenu(null);
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>
                            {windowStates[taskMenu.tabId]?.isMaximized
                              ? "Restore size"
                              : "Maximize"}
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onLaunchNewWindow(getAppLaunchRoute(taskMenu.route));
                            setTaskMenu(null);
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New window</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onDuplicateWindow(taskMenu.tabId);
                            setTaskMenu(null);
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicate window</span>
                        </button>
                        <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onCloseWindow(taskMenu.tabId);
                            setTaskMenu(null);
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] text-[#c42b1c] dark:text-[#ff99a4] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close window</span>
                        </button>
                        <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
                      </>
                    )}
                    {(() => {
                      const startApp = findStartAppForRoute(taskMenu.route);
                      const onTaskbar = isRoutePinnedToTaskbar(taskbarPins, taskMenu.route);
                      const onStart = startApp ? !startUnpinned.includes(startApp.id) : false;
                      const itemClass =
                        "w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none";
                      return (
                        <>
                          {!taskMenu.tabId && (
                            <>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  onCloseStartMenu();
                                  onCloseDirectCommand();
                                  setIsSearchOpen(false);
                                  onLaunchRoute(taskMenu.route);
                                  setTaskMenu(null);
                                }}
                                className={itemClass}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="truncate">{taskMenu.title}</span>
                              </button>
                              <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
                            </>
                          )}
                          {startApp && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                if (onStart) pinActions.unpinFromStart(startApp.id);
                                else pinActions.pinToStart(startApp.id);
                                setTaskMenu(null);
                              }}
                              className={itemClass}
                            >
                              {onStart ? (
                                <PinOff className="w-3.5 h-3.5" />
                              ) : (
                                <Pin className="w-3.5 h-3.5" />
                              )}
                              <span>{onStart ? "Unpin from Start" : "Pin to Start"}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              if (onTaskbar) {
                                pinActions.unpinFromTaskbar(taskMenu.route);
                              } else {
                                pinActions.pinToTaskbar(taskMenu.route, taskMenu.title);
                                // Keep the icon where it was: swap its open-window slot for the new pinned slot
                                if (taskMenu.tabId) {
                                  const tabKey = `tab:${taskMenu.tabId}`;
                                  const pinKey = `pin:${taskbarPinId(canonicalPinRoute(taskMenu.route))}`;
                                  const keys = orderedTaskbarSlots.map((slot) => slot.key);
                                  const idx = keys.indexOf(tabKey);
                                  if (idx !== -1) {
                                    keys.splice(idx, 1, pinKey);
                                    setTaskbarOrder(keys);
                                    try {
                                      localStorage.setItem(TASKBAR_ORDER_KEY, JSON.stringify(keys));
                                    } catch {}
                                  }
                                }
                              }
                              setTaskMenu(null);
                            }}
                            className={itemClass}
                          >
                            {onTaskbar ? (
                              <PinOff className="w-3.5 h-3.5" />
                            ) : (
                              <Pin className="w-3.5 h-3.5" />
                            )}
                            <span>{onTaskbar ? "Unpin from taskbar" : "Pin to taskbar"}</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <AnimatePresence>
        {taskbarContextMenu && (
          <WindowsContextMenu
            key={`tb-ctx-${taskbarContextMenu.x}-${taskbarContextMenu.y}`}
            x={taskbarContextMenu.x}
            y={taskbarContextMenu.y}
            ariaLabel="Taskbar actions"
            onClose={() => setTaskbarContextMenu(null)}
            items={[
              {
                id: "tb-theme-mode",
                label: "Theme mode",
                icon: isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
                submenu: [
                  {
                    id: "tb-theme-light",
                    label: "Light",
                    icon: <Sun className="w-4 h-4" />,
                    checked: isLightMode,
                    onSelect: () => updateSetting("theme", "light"),
                  },
                  {
                    id: "tb-theme-dark",
                    label: "Dark",
                    icon: <Moon className="w-4 h-4" />,
                    checked: !isLightMode,
                    onSelect: () => updateSetting("theme", "dark"),
                  },
                ],
              },
              { id: "tb-div-1", divider: true },
              {
                id: "tb-location",
                label: "Location",
                icon:
                  taskbarLocation === "top" ? (
                    <PanelTop className="w-4 h-4" />
                  ) : taskbarLocation === "left" ? (
                    <PanelLeft className="w-4 h-4" />
                  ) : taskbarLocation === "right" ? (
                    <PanelRight className="w-4 h-4" />
                  ) : (
                    <PanelBottom className="w-4 h-4" />
                  ),
                submenu: [
                  {
                    id: "tb-loc-bottom",
                    label: "Bottom",
                    icon: <PanelBottom className="w-4 h-4" />,
                    checked: taskbarLocation === "bottom",
                    onSelect: () => updateSetting("taskbarLocation", "bottom"),
                  },
                  {
                    id: "tb-loc-top",
                    label: "Top",
                    icon: <PanelTop className="w-4 h-4" />,
                    checked: taskbarLocation === "top",
                    onSelect: () => updateSetting("taskbarLocation", "top"),
                  },
                  {
                    id: "tb-loc-left",
                    label: "Left",
                    icon: <PanelLeft className="w-4 h-4" />,
                    checked: taskbarLocation === "left",
                    onSelect: () => updateSetting("taskbarLocation", "left"),
                  },
                  {
                    id: "tb-loc-right",
                    label: "Right",
                    icon: <PanelRight className="w-4 h-4" />,
                    checked: taskbarLocation === "right",
                    onSelect: () => updateSetting("taskbarLocation", "right"),
                  },
                ],
              },
              {
                id: "tb-settings",
                label: "Floatbar settings",
                icon: <SettingsIcon className="w-4 h-4" />,
                onSelect: () => {
                  onLaunchRoute("/pc-settings/personalization");
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

      <WindowsWidgetsBoard
        isOpen={isWidgetsOpen}
        onClose={() => setIsWidgetsOpen(false)}
        onLaunchRoute={onLaunchRoute}
        channels={channels}
        onSelectChannel={onSelectChannel}
        taskbarBottomGap={effectiveTaskbarBottom}
        isTaskbarFloating={isFloating}
      />
    </>
  );
};
