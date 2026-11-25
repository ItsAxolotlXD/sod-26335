// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, { useContext, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor,
  Bluetooth,
  Wifi,
  Paintbrush,
  LayoutGrid,
  UserCheck,
  Clock,
  Gamepad2,
  Accessibility as AccessibilityIcon,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronRight,
  HardDrive,
  PanelBottom,
  Cloud,
  Plus,
  Check,
  Volume2,
  BatteryCharging,
  Info,
  Trash2,
  ExternalLink,
  Laptop,
  Plane,
  Lock,
  Globe,
  Sparkles,
  CheckCircle2,
  X,
  Camera,
  User,
} from "lucide-react";
import { useSettings, resolveDesktopWallpaper } from "../hooks/useSettings";
import { modalDialogVariants, modalBackdropVariants } from "../utils/animations";
import { showAppToast } from "../utils/toast";
import {
  DEFAULT_WALLPAPER_ID,
  SPOTLIGHT_COLLECTION_THEME_ID,
  WINDOWS_WALLPAPERS,
  type WallpaperOption,
} from "../constants/wallpapers";
import {
  SPOTLIGHT_INTERVAL_OPTIONS,
  SPOTLIGHT_TARGET_OPTIONS,
  useSpotlightCollection,
  type SpotlightInterval,
  type SpotlightTarget,
} from "../services/spotlightService";
import { WindowTitleBarPortalContext } from "../components/WindowFrame";
import { FluentHomeIcon } from "../components/FluentIcons";

type PcCategoryId =
  | "home"
  | "system"
  | "bluetooth"
  | "network"
  | "personalization"
  | "apps"
  | "accounts"
  | "time"
  | "gaming"
  | "accessibility"
  | "privacy"
  | "update";

interface BluetoothDeviceItem {
  id: string;
  name: string;
  kind: "Audio" | "Input" | "Phone";
  connected: boolean;
  battery: number;
}

interface PcSettingsState {
  deviceName: string;
  deviceModel: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  selectedThemeId: string;
  brightness: number;
  displayScale: string;
  nightLight: boolean;
  soundVolume: number;
  soundMuted: boolean;
  powerMode: "Balanced" | "Best power efficiency" | "Best performance";
  bluetoothEnabled: boolean;
  bluetoothDevices: BluetoothDeviceItem[];
  wifiEnabled: boolean;
  airplaneMode: boolean;
  energySaver: boolean;
  nearbySharing: boolean;
  meteredConnection: boolean;
  taskbarCentered: boolean;
  taskbarAutoHide: boolean;
  transparencyEffects: boolean;
  windowsHelloPin: boolean;
  syncSettings: boolean;
  autoTimeZone: boolean;
  displayLanguage: string;
  gameMode: boolean;
  gameBarCaptures: boolean;
  pcTextScale: number;
  alwaysShowScrollbars: boolean;
  cameraPermission: boolean;
  micPermission: boolean;
  pauseUpdates: boolean;
  lastUpdateCheck: string;
  tempFilesGb: number;
}

const PC_SETTINGS_STORAGE_KEY = "sparkle_pc_settings_v1";

const DEFAULT_PC_SETTINGS: PcSettingsState = {
  deviceName: "vm-w11-ssd",
  deviceModel: "Sodium 27 (Milestone 1)",
  userName: "Sodium User",
  userEmail: "Unregistered Account",
  userAvatar: "",
  selectedThemeId: DEFAULT_WALLPAPER_ID,
  brightness: 82,
  displayScale: "100% (Recommended)",
  nightLight: false,
  soundVolume: 74,
  soundMuted: false,
  powerMode: "Balanced",
  bluetoothEnabled: true,
  bluetoothDevices: [
    { id: "bt-1", name: "Surface Precision Mouse", kind: "Input", connected: true, battery: 92 },
    { id: "bt-2", name: "WH-1000XM5 Studio", kind: "Audio", connected: true, battery: 78 },
    { id: "bt-3", name: "Mechanical Keychron K2", kind: "Input", connected: false, battery: 64 },
  ],
  wifiEnabled: true,
  airplaneMode: false,
  energySaver: true,
  nearbySharing: false,
  meteredConnection: false,
  taskbarCentered: true,
  taskbarAutoHide: false,
  transparencyEffects: true,
  windowsHelloPin: true,
  syncSettings: true,
  autoTimeZone: true,
  displayLanguage: "English (United States)",
  gameMode: true,
  gameBarCaptures: true,
  pcTextScale: 100,
  alwaysShowScrollbars: false,
  cameraPermission: true,
  micPermission: true,
  pauseUpdates: false,
  lastUpdateCheck: "Today",
  tempFilesGb: 2.4,
};

const WIN11_THEMES: WallpaperOption[] = WINDOWS_WALLPAPERS;

interface NavCategoryDef {
  id: PcCategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  keywords: string;
}

const NAV_CATEGORIES: NavCategoryDef[] = [
  {
    id: "home",
    label: "Home",
    icon: FluentHomeIcon,
    iconColor: "text-[#0067b8] dark:text-[#4cc2ff]",
    keywords: "home recommended personalize bluetooth cloud",
  },
  {
    id: "system",
    label: "System",
    icon: Monitor,
    iconColor: "text-sky-600 dark:text-sky-400",
    keywords:
      "display brightness scale night light sound volume storage power battery about rename",
  },
  {
    id: "bluetooth",
    label: "Bluetooth & devices",
    icon: Bluetooth,
    iconColor: "text-blue-600 dark:text-blue-400",
    keywords: "bluetooth mouse keyboard headphones devices add remove",
  },
  {
    id: "network",
    label: "Network & internet",
    icon: Wifi,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    keywords: "wifi ethernet network internet airplane mode metered dns ip",
  },
  {
    id: "personalization",
    label: "Personalization",
    icon: Paintbrush,
    iconColor: "text-indigo-500 dark:text-indigo-400",
    keywords: "themes wallpaper color mode light dark taskbar mica transparency",
  },
  {
    id: "apps",
    label: "Apps",
    icon: LayoutGrid,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    keywords: "installed apps html writer notes gallery camera screenbox",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: UserCheck,
    iconColor: "text-teal-600 dark:text-teal-400",
    keywords: "profile email account user hello pin backup sync",
  },
  {
    id: "time",
    label: "Time & language",
    icon: Clock,
    iconColor: "text-amber-600 dark:text-amber-400",
    keywords: "clock time zone language region vietnamese english",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad2,
    iconColor: "text-violet-600 dark:text-violet-400",
    keywords: "game mode xbox bar captures fps",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: AccessibilityIcon,
    iconColor: "text-sky-600 dark:text-sky-400",
    keywords: "text size scrollbars contrast motion accessibility",
  },
  {
    id: "privacy",
    label: "Privacy & security",
    icon: ShieldCheck,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    keywords: "windows security defender scan virus camera mic privacy",
  },
  {
    id: "update",
    label: "Sodium Update",
    icon: RefreshCw,
    iconColor: "text-[#0067b8] dark:text-[#4cc2ff]",
    keywords: "windows update check patch version pause history",
  },
];

interface PcSettingsProps {
  navigate?: (route: string, state?: unknown) => void;
  initialCategory?: PcCategoryId;
  routeState?: {
    appSection?: PcCategoryId;
    initialCategory?: PcCategoryId;
    sectionNonce?: number;
  };
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const WinSwitch: React.FC<{
  checked: boolean;
  onToggle: () => void;
  label?: string;
}> = ({ checked, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label || "Toggle setting"}
    onClick={onToggle}
    className={`relative w-[40px] h-[20px] rounded-full transition-colors cursor-pointer shrink-0 border ${
      checked
        ? "bg-[#0067b8] dark:bg-[#4cc2ff] border-transparent"
        : "bg-black/[0.06] dark:bg-white/[0.08] border-black/35 dark:border-white/40"
    }`}
  >
    <span
      className={`block w-[12px] h-[12px] rounded-full transition-transform duration-150 ${
        checked
          ? "translate-x-[23px] bg-white dark:bg-[#111827]"
          : "translate-x-[3px] bg-[#4b5563] dark:bg-[#d1d5db]"
      }`}
    />
  </button>
);

export const PcSettings: React.FC<PcSettingsProps> = ({
  navigate,
  initialCategory,
  routeState,
  searchQuery: externalSearchQuery,
  onSearchChange,
}) => {
  const { settings, updateSetting } = useSettings();
  const { isInsideWindowFrame } = useContext(WindowTitleBarPortalContext);
  const spotlight = useSpotlightCollection();
  const isLightMode = settings.theme === "light";

  const [pcState, setPcState] = useState<PcSettingsState>(() => {
    try {
      const raw = localStorage.getItem(PC_SETTINGS_STORAGE_KEY);
      if (raw) {
        const merged = { ...DEFAULT_PC_SETTINGS, ...JSON.parse(raw) };
        if (merged.userEmail === "sonhuyc2kl@gmail.com") {
          merged.userEmail = "Unregistered Account";
        }
        if (!WINDOWS_WALLPAPERS.some((w) => w.id === merged.selectedThemeId)) {
          merged.selectedThemeId = DEFAULT_WALLPAPER_ID;
        }
        return merged;
      }
    } catch {}
    return DEFAULT_PC_SETTINGS;
  });

  const resolvedRouteCategory =
    routeState?.appSection || routeState?.initialCategory || initialCategory || "home";
  const [activeCategory, setActiveCategory] = useState<PcCategoryId>(resolvedRouteCategory);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;
  const selectCategory = (cat: PcCategoryId) => {
    setActiveCategory(cat);
    if (isInsideWindowFrame && navigate) {
      navigate("/pc-settings", {
        appSection: cat,
        initialCategory: cat,
        sectionNonce: Date.now(),
      });
    }
  };
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState(pcState.deviceName);
  const [isAddBtOpen, setIsAddBtOpen] = useState(false);
  const [newBtName, setNewBtName] = useState("");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResultMsg, setUpdateResultMsg] = useState("You're up to date");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [nowClock, setNowClock] = useState(() => new Date());

  useEffect(() => {
    try {
      localStorage.setItem(PC_SETTINGS_STORAGE_KEY, JSON.stringify(pcState));
      window.dispatchEvent(
        new CustomEvent("sparkle:pc-settings-updated", { detail: { source: "pc-settings" } }),
      );
    } catch {}
  }, [pcState]);

  useEffect(() => {
    const syncFromExternal = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      if (detail?.source === "pc-settings") return;
      try {
        const raw = localStorage.getItem(PC_SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PcSettingsState>;
          setPcState((prev) => ({ ...prev, ...parsed }));
        }
      } catch {}
    };
    window.addEventListener("sparkle:pc-settings-updated", syncFromExternal);
    window.addEventListener("storage", syncFromExternal);
    return () => {
      window.removeEventListener("sparkle:pc-settings-updated", syncFromExternal);
      window.removeEventListener("storage", syncFromExternal);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const updatePc = <K extends keyof PcSettingsState>(key: K, value: PcSettingsState[K]) => {
    setPcState((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          updatePc("userAvatar", canvas.toDataURL("image/jpeg", 0.88));
        } else {
          updatePc("userAvatar", result);
        }
        showAppToast("Profile picture updated", { appName: "Accounts" });
      };
      img.onerror = () => {
        updatePc("userAvatar", result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return NAV_CATEGORIES;
    return NAV_CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  useEffect(() => {
    const nextCat = routeState?.appSection || routeState?.initialCategory || initialCategory;
    if (nextCat) {
      setActiveCategory(nextCat);
    }
  }, [
    initialCategory,
    routeState?.appSection,
    routeState?.initialCategory,
    routeState?.sectionNonce,
  ]);

  useEffect(() => {
    const handleCategoryEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ category?: PcCategoryId }>).detail;
      if (detail?.category) {
        setActiveCategory(detail.category);
      }
    };
    window.addEventListener("sparkle:pc-settings-category", handleCategoryEvent);
    return () => window.removeEventListener("sparkle:pc-settings-category", handleCategoryEvent);
  }, []);

  const currentWallpaperId =
    settings.windowsWallpaper || pcState.selectedThemeId || DEFAULT_WALLPAPER_ID;

  const isSpotlightActive = currentWallpaperId === SPOTLIGHT_COLLECTION_THEME_ID;

  const activeTheme = resolveDesktopWallpaper(settings);

  const handleSelectTheme = (theme: WallpaperOption) => {
    updatePc("selectedThemeId", theme.id);
    updateSetting("windowsWallpaper", theme.id);
    if (theme.id === SPOTLIGHT_COLLECTION_THEME_ID) {
      void spotlight.ensureLoaded(false);
    } else if (theme.mode !== settings.theme) {
      updateSetting("theme", theme.mode);
    }
    showAppToast(`Đã áp dụng hình nền ${theme.label}`, { appName: "PC Settings" });
  };

  const handleCheckUpdates = () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    setUpdateResultMsg("Checking for updates...");
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateResultMsg("You're up to date — Sodium 27 (Milestone 1) Build 26335");
      updatePc("lastUpdateCheck", `Today, ${new Date().toLocaleTimeString()}`);
      showAppToast("Hệ thống đang ở phiên bản mới nhất", { appName: "Sodium Update" });
    }, 1500);
  };

  const handleQuickScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(12);
    const timer = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setIsScanning(false);
          showAppToast("Quét bảo mật hoàn tất: Không phát hiện mối đe dọa nào.", {
            appName: "Sodium Security",
          });
          return 100;
        }
        return Math.min(100, p + 22);
      });
    }, 320);
  };

  const handleRenameSubmit = () => {
    const clean = renameDraft.trim();
    if (!clean) return;
    updatePc("deviceName", clean);
    setIsRenameOpen(false);
    showAppToast(`Đã đổi tên máy tính thành ${clean}`, { appName: "PC Settings" });
  };

  const handleAddBtDevice = () => {
    const clean = newBtName.trim();
    if (!clean) return;
    const added: BluetoothDeviceItem = {
      id: `bt-${Date.now()}`,
      name: clean,
      kind: "Audio",
      connected: true,
      battery: 100,
    };
    updatePc("bluetoothDevices", [added, ...pcState.bluetoothDevices]);
    updatePc("bluetoothEnabled", true);
    setNewBtName("");
    setIsAddBtOpen(false);
    showAppToast(`Đã ghép nối ${clean}`, { appName: "Bluetooth & devices" });
  };

  const cardClass =
    "rounded-[8px] bg-white/85 dark:bg-[#2b2f36]/85 border border-black/[0.07] dark:border-white/[0.08] shadow-2xs";
  const rowClass =
    "rounded-[8px] bg-white/85 dark:bg-[#2b2f36]/85 border border-black/[0.07] dark:border-white/[0.08] px-4 py-3.5 flex items-center justify-between gap-3";

  return (
    <div
      id="pc-settings-page"
      className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-transparent text-[#1b1b1b] dark:text-[#f3f3f3] select-none"
    >
      {/* Left Navigation Sidebar (shown only outside WindowFrame; inside WindowFrame it uses WindowAppSidebar) */}
      {!isInsideWindowFrame && (
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-[270px] shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-black/[0.07] dark:border-white/[0.07] bg-[#f5f6f8]/65 dark:bg-[#1f2228]/65 backdrop-blur-xl"
        >
          {/* User Profile Header */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0067b8] to-[#4cc2ff] text-white flex items-center justify-center font-semibold text-[16px] shadow-xs shrink-0 overflow-hidden">
              {pcState.userAvatar ? (
                <img
                  src={pcState.userAvatar}
                  alt={pcState.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                pcState.userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-[#111827] dark:text-white truncate">
                {pcState.userName}
              </div>
              <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                {pcState.userEmail}
              </div>
            </div>
          </div>

          {/* "Find a setting" Search Box */}
          <div className="px-3.5 pb-3">
            <div className="relative flex items-center h-[34px] rounded-[6px] bg-white/90 dark:bg-[#2c3037]/90 border border-black/10 dark:border-white/10 focus-within:border-[#0067b8] dark:focus-within:border-[#4cc2ff] px-2.5 transition-colors">
              <input
                id="pc-settings-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a setting"
                className="flex-1 min-w-0 bg-transparent text-[12.5px] text-[#111827] dark:text-white placeholder-[#6b7280] dark:placeholder-[#9ca3af] outline-none border-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 opacity-70" />
                </button>
              ) : (
                <Search className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#9ca3af] shrink-0" />
              )}
            </div>
          </div>

          {/* Navigation Category List (Horizontal scroll on mobile, vertical list on desktop) */}
          <nav className="flex md:flex-col gap-0.5 px-2.5 pb-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto flex-1">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    duration: 0.24,
                    delay: Math.min(filteredCategories.indexOf(cat) * 0.025, 0.2),
                  }}
                  onClick={() => selectCategory(cat.id)}
                  className={`relative shrink-0 md:w-full h-[32px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] transition-colors cursor-pointer text-left ${
                    active
                      ? "bg-black/[0.06] dark:bg-white/[0.08] font-medium text-[#111827] dark:text-white"
                      : "text-[#374151] dark:text-[#d1d5db] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-full bg-[#0067b8] dark:bg-[#4cc2ff]"
                    />
                  )}
                  <span
                    className={`w-[22px] h-[22px] shrink-0 rounded-[6px] flex items-center justify-center bg-gradient-to-br from-white/80 to-black/[0.06] dark:from-white/[0.18] dark:to-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.18)]`}
                  >
                    <Icon
                      className={`w-[16px] h-[16px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.24)] ${cat.iconColor}`}
                    />
                  </span>
                  <span className="truncate whitespace-nowrap">{cat.label}</span>
                </motion.button>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="px-3 py-4 text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                No matching settings found.
              </div>
            )}
          </nav>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 md:px-8 md:py-6">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[980px] mx-auto space-y-5"
        >
          {/* Search results quick-jump panel when searching from Window TitleBar */}
          {isInsideWindowFrame && searchQuery.trim().length > 0 && (
            <section className={`${cardClass} overflow-hidden`}>
              <div className="px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-[#111827] dark:text-white">
                  Search results for "{searchQuery.trim()}"
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[12px] font-medium text-[#0067b8] dark:text-[#4cc2ff] hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
              {filteredCategories.length > 0 ? (
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                  {filteredCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={`search-cat-${cat.id}`}
                        type="button"
                        onClick={() => {
                          selectCategory(cat.id);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${cat.iconColor}`} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[#111827] dark:text-white truncate">
                              {cat.label}
                            </div>
                            <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                              {cat.keywords}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-60 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-4 text-[12.5px] text-[#6b7280] dark:text-[#9ca3af]">
                  No matching settings found.
                </div>
              )}
            </section>
          )}

          {/* Page Heading */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-[#111827] dark:text-white">
              {NAV_CATEGORIES.find((c) => c.id === activeCategory)?.label || "Sodium"}
            </h1>
            {activeCategory !== "home" && (
              <button
                type="button"
                onClick={() => selectCategory("home")}
                className="text-[12.5px] font-medium text-[#0067b8] dark:text-[#4cc2ff] hover:underline cursor-pointer"
              >
                Back to Home
              </button>
            )}
          </div>

          {/* 1. HOME (Matches Hình 2 layout) */}
          {activeCategory === "home" && (
            <div className="space-y-5">
              {/* Top Device & Status Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-[82px] h-[52px] rounded-[6px] overflow-hidden border-2 border-[#1f2937] dark:border-[#4b5563] shadow-sm shrink-0 bg-[#111827]">
                    <img
                      src={activeTheme.image}
                      alt={pcState.deviceName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-[16px] font-semibold text-[#111827] dark:text-white leading-tight">
                      {pcState.deviceName}
                    </div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      {pcState.deviceModel}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameDraft(pcState.deviceName);
                        setIsRenameOpen(true);
                      }}
                      className="text-[12px] font-medium text-[#0067b8] dark:text-[#4cc2ff] hover:underline cursor-pointer mt-0.5"
                    >
                      Rename
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <button
                    type="button"
                    onClick={() => selectCategory("network")}
                    className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#0067b8] dark:text-[#4cc2ff]">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">
                        {pcState.airplaneMode
                          ? "Airplane mode"
                          : pcState.wifiEnabled
                            ? "Ethernet 10Gb"
                            : "Disconnected"}
                      </div>
                      <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af]">
                        {pcState.airplaneMode || !pcState.wifiEnabled ? "Offline" : "Connected"}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectCategory("update")}
                    className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#0067b8] dark:text-[#4cc2ff]">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">Sodium Update</div>
                      <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af]">
                        Last checked: {pcState.lastUpdateCheck}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Two-Column Card Grid matching Hình 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Recommended settings Card */}
                  <section className={`${cardClass} overflow-hidden`}>
                    <div className="px-4 pt-4 pb-2.5">
                      <h2 className="text-[15.5px] font-semibold text-[#111827] dark:text-white">
                        Recommended settings
                      </h2>
                      <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                        Recent and commonly used settings
                      </p>
                    </div>
                    <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                      {[
                        { label: "Storage", icon: HardDrive, target: "system" as PcCategoryId },
                        {
                          label: "Taskbar",
                          icon: PanelBottom,
                          target: "personalization" as PcCategoryId,
                        },
                        { label: "Display", icon: Monitor, target: "system" as PcCategoryId },
                      ].map((item) => {
                        const RowIcon = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => selectCategory(item.target)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-3">
                              <RowIcon className="w-4 h-4 text-[#4b5563] dark:text-[#cbd5e1]" />
                              <span className="text-[13px] font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Personalize your device Card */}
                  <section className={`${cardClass} p-4 space-y-3.5`}>
                    <h2 className="text-[15.5px] font-semibold text-[#111827] dark:text-white">
                      Personalize your device
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {WIN11_THEMES.map((theme) => {
                        const selected = currentWallpaperId === theme.id;
                        const previewSrc = theme.isSpotlight
                          ? spotlight.currentPhoto.thumbnailUrl || spotlight.currentPhoto.imageUrl
                          : theme.image;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleSelectTheme(theme)}
                            title={theme.label}
                            className={`relative aspect-[16/10] rounded-[6px] overflow-hidden border-2 transition-all cursor-pointer group ${
                              selected
                                ? "border-[#0067b8] dark:border-[#4cc2ff] ring-2 ring-[#0067b8]/25 dark:ring-[#4cc2ff]/25"
                                : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                            }`}
                          >
                            <img
                              src={previewSrc}
                              alt={theme.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {theme.isSpotlight && (
                              <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-[4px] bg-black/60 text-white text-[9.5px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                                <Sparkles className="w-2.5 h-2.5 text-[#4cc2ff]" />
                                Spotlight
                              </span>
                            )}
                            {/* Mini floating window preview chip like Hình 2 */}
                            <div
                              className={`absolute right-1.5 bottom-1.5 w-[38%] h-[42%] rounded-[3px] ${theme.taskbarBg} border border-black/15 dark:border-white/20 shadow-xs flex items-end p-1`}
                            >
                              <span
                                className="w-full h-[3px] rounded-full"
                                style={{ backgroundColor: theme.accent }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Paintbrush className="w-4 h-4 text-[#4b5563] dark:text-[#cbd5e1]" />
                        <span className="text-[13px] font-medium">Color mode</span>
                      </div>
                      <select
                        value={settings.theme}
                        onChange={(e) => {
                          const mode = e.target.value as "light" | "dark";
                          updateSetting("theme", mode);
                          showAppToast(
                            `Đã chuyển Color mode sang ${mode === "light" ? "Light" : "Dark"}`,
                            {
                              appName: "PC Settings",
                            },
                          );
                        }}
                        aria-label="Color mode"
                        className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px] font-medium outline-none cursor-pointer"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Bluetooth devices Card */}
                  <section className={`${cardClass} overflow-hidden`}>
                    <div className="px-4 pt-4 pb-2.5">
                      <h2 className="text-[15.5px] font-semibold text-[#111827] dark:text-white">
                        Bluetooth devices
                      </h2>
                      <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                        Manage, add, and remove devices
                      </p>
                    </div>

                    <div className="px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Bluetooth className="w-4 h-4 text-[#0067b8] dark:text-[#4cc2ff] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium">Bluetooth</div>
                          <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                            {pcState.bluetoothEnabled
                              ? `Discoverable as "${pcState.deviceName.toUpperCase()}"`
                              : "Bluetooth is turned off"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                          {pcState.bluetoothEnabled ? "On" : "Off"}
                        </span>
                        <WinSwitch
                          checked={pcState.bluetoothEnabled}
                          label="Bluetooth"
                          onToggle={() => updatePc("bluetoothEnabled", !pcState.bluetoothEnabled)}
                        />
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => selectCategory("bluetooth")}
                        className="text-[13px] font-medium hover:underline cursor-pointer"
                      >
                        View all devices ({pcState.bluetoothDevices.length})
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddBtOpen(true)}
                          className="h-[30px] px-3 rounded-[5px] bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] border border-black/15 dark:border-white/15 text-[12.5px] font-medium cursor-pointer"
                        >
                          Add device
                        </button>
                        <button
                          type="button"
                          onClick={() => selectCategory("bluetooth")}
                          className="p-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
                          aria-label="Open Bluetooth & devices"
                        >
                          <ChevronRight className="w-4 h-4 opacity-60" />
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Cloud storage Card */}
                  <section className={`${cardClass} p-4 space-y-2.5`}>
                    <div className="w-8 h-8 rounded-[6px] bg-[#0067b8]/10 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#0067b8] dark:text-[#4cc2ff]">
                      <Cloud className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h2 className="text-[15.5px] font-semibold text-[#111827] dark:text-white">
                        Cloud storage
                      </h2>
                      <p className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af] mt-1 leading-relaxed">
                        Make sure Cloud Drive is synced and running on your PC so you can see your
                        storage details here.
                      </p>
                    </div>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectCategory("system")}
                        className="h-[30px] px-3 rounded-[5px] bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] border border-black/15 dark:border-white/15 text-[12.5px] font-medium cursor-pointer"
                      >
                        Open Storage
                      </button>
                    </div>
                  </section>

                  {/* Productivity Suite Card (Bottom-right slot in Hình 2) */}
                  <section className={`${cardClass} p-4 space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-[15.5px] font-semibold text-[#111827] dark:text-white">
                        Sodium Workspace Apps
                      </h2>
                      <button
                        type="button"
                        onClick={() => selectCategory("apps")}
                        className="text-[12px] font-medium text-[#0067b8] dark:text-[#4cc2ff] hover:underline cursor-pointer"
                      >
                        All apps
                      </button>
                    </div>
                    <p className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af] leading-relaxed">
                      Create documents, edit HTML & CSS, draw on Ink Canvas, and manage media right
                      inside your workstation.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {[
                        { label: "Notepad", route: "/notepad" },
                        { label: "HTML Writer", route: "/html-writer" },
                        { label: "Notes", route: "/notes" },
                        { label: "Ink Canvas", route: "/draws" },
                        { label: "Gallery", route: "/gallery" },
                      ].map((app) => (
                        <button
                          key={app.route}
                          type="button"
                          onClick={() => navigate?.(app.route)}
                          className="h-[28px] px-2.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-[#0067b8]/12 dark:hover:bg-[#4cc2ff]/15 border border-black/[0.07] dark:border-white/[0.08] text-[12px] font-medium transition-colors cursor-pointer"
                        >
                          {app.label}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* 2. SYSTEM */}
          {activeCategory === "system" && (
            <div className="space-y-3">
              <div className={cardClass}>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2.5 text-[14.5px] font-semibold">
                    <Monitor className="w-4.5 h-4.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                    <span>Display</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span>Brightness</span>
                      <span className="font-medium tabular-nums">{pcState.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={pcState.brightness}
                      onChange={(e) => updatePc("brightness", Number(e.target.value))}
                      className="w-full accent-[#0067b8] dark:accent-[#4cc2ff] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.07]">
                    <div>
                      <div className="text-[13px] font-medium">Night light</div>
                      <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af]">
                        Use warmer colors to help block blue light
                      </div>
                    </div>
                    <WinSwitch
                      checked={pcState.nightLight}
                      onToggle={() => updatePc("nightLight", !pcState.nightLight)}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.07]">
                    <span className="text-[13px] font-medium">Scale</span>
                    <select
                      value={pcState.displayScale}
                      onChange={(e) => updatePc("displayScale", e.target.value)}
                      className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                    >
                      <option>100% (Recommended)</option>
                      <option>125%</option>
                      <option>150%</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={rowClass}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Volume2 className="w-4.5 h-4.5 text-[#0067b8] dark:text-[#4cc2ff] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium">
                      Sound output volume (
                      {pcState.soundMuted ? "Muted" : `${pcState.soundVolume}%`})
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={pcState.soundMuted ? 0 : pcState.soundVolume}
                      onChange={(e) => {
                        updatePc("soundMuted", false);
                        updatePc("soundVolume", Number(e.target.value));
                      }}
                      className="w-full max-w-md mt-1 accent-[#0067b8] dark:accent-[#4cc2ff] cursor-pointer"
                    />
                  </div>
                </div>
                <WinSwitch
                  checked={!pcState.soundMuted}
                  onToggle={() => updatePc("soundMuted", !pcState.soundMuted)}
                />
              </div>

              <div className={`${cardClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4.5 h-4.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                    <div>
                      <div className="text-[13.5px] font-semibold">
                        Local Disk (C:) — 256 GB NVMe SSD
                      </div>
                      <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                        {(98.4 + pcState.tempFilesGb).toFixed(1)} GB used •{" "}
                        {(157.6 - pcState.tempFilesGb).toFixed(1)} GB free (Temp files:{" "}
                        {pcState.tempFilesGb.toFixed(1)} GB)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={pcState.tempFilesGb <= 0.1}
                    onClick={() => {
                      updatePc("tempFilesGb", 0.1);
                      showAppToast("Đã dọn dẹp tệp tạm thành công", { appName: "Storage Sense" });
                    }}
                    className="h-[30px] px-3 rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] text-[12px] font-medium cursor-pointer disabled:opacity-50"
                  >
                    Clean temporary files
                  </button>
                </div>
                <div className="h-2.5 rounded-full bg-black/[0.08] dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full bg-[#0067b8] dark:bg-[#4cc2ff] transition-all duration-300"
                    style={{
                      width: `${Math.min(95, ((98.4 + pcState.tempFilesGb) / 256) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <BatteryCharging className="w-4.5 h-4.5 text-emerald-500" />
                  <div>
                    <div className="text-[13.5px] font-medium">Power mode</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Optimize workstation performance and energy
                    </div>
                  </div>
                </div>
                <select
                  value={pcState.powerMode}
                  onChange={(e) =>
                    updatePc("powerMode", e.target.value as PcSettingsState["powerMode"])
                  }
                  className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                >
                  <option>Best power efficiency</option>
                  <option>Balanced</option>
                  <option>Best performance</option>
                </select>
              </div>

              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Info className="w-4.5 h-4.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                  <div>
                    <div className="text-[13.5px] font-medium">
                      Device specifications — {pcState.deviceName}
                    </div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      {pcState.deviceModel} • 16.0 GB RAM • 64-bit operating system
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRenameDraft(pcState.deviceName);
                    setIsRenameOpen(true);
                  }}
                  className="h-[30px] px-3 rounded-[5px] border border-black/15 dark:border-white/15 text-[12.5px] font-medium cursor-pointer"
                >
                  Rename PC
                </button>
              </div>
            </div>
          )}

          {/* 3. BLUETOOTH & DEVICES */}
          {activeCategory === "bluetooth" && (
            <div className="space-y-3">
              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Bluetooth className="w-5 h-5 text-[#0067b8] dark:text-[#4cc2ff]" />
                  <div>
                    <div className="text-[13.5px] font-medium">Bluetooth</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Discoverable as "{pcState.deviceName.toUpperCase()}"
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddBtOpen(true)}
                    className="fluent-btn-primary h-[30px] px-3 rounded-[5px] text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add device
                  </button>
                  <WinSwitch
                    checked={pcState.bluetoothEnabled}
                    onToggle={() => updatePc("bluetoothEnabled", !pcState.bluetoothEnabled)}
                  />
                </div>
              </div>

              <div className={`${cardClass} divide-y divide-black/[0.06] dark:divide-white/[0.07]`}>
                {pcState.bluetoothDevices.map((dev) => (
                  <div key={dev.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13.5px] font-medium">{dev.name}</div>
                      <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                        {dev.kind} •{" "}
                        {pcState.bluetoothEnabled && dev.connected
                          ? `Connected • ${dev.battery}%`
                          : "Paired"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updatePc(
                            "bluetoothDevices",
                            pcState.bluetoothDevices.map((d) =>
                              d.id === dev.id ? { ...d, connected: !d.connected } : d,
                            ),
                          )
                        }
                        className="h-[28px] px-2.5 rounded-[5px] border border-black/15 dark:border-white/15 text-[12px] font-medium cursor-pointer"
                      >
                        {dev.connected ? "Disconnect" : "Connect"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updatePc(
                            "bluetoothDevices",
                            pcState.bluetoothDevices.filter((d) => d.id !== dev.id),
                          )
                        }
                        className="p-1.5 rounded-[5px] hover:bg-rose-500/15 text-rose-500 cursor-pointer"
                        title="Remove device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. NETWORK & INTERNET */}
          {activeCategory === "network" && (
            <div className="space-y-3">
              <div className={`${cardClass} p-4 flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-[8px] bg-[#0067b8]/12 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#0067b8] dark:text-[#4cc2ff]">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[14.5px] font-semibold">
                      {pcState.airplaneMode
                        ? "Airplane mode is on"
                        : pcState.wifiEnabled
                          ? "Ethernet 10Gb / Sodium Fiber"
                          : "Not connected"}
                    </div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      {pcState.airplaneMode || !pcState.wifiEnabled
                        ? "No internet access"
                        : "Connected, secured • IPv4: 192.168.1.42 • DNS: 1.1.1.1"}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-[5px] text-[11.5px] font-semibold ${
                    pcState.airplaneMode || !pcState.wifiEnabled
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {pcState.airplaneMode || !pcState.wifiEnabled ? "Offline" : "Connected"}
                </span>
              </div>

              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Wifi className="w-4.5 h-4.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                  <div>
                    <div className="text-[13.5px] font-medium">Wi-Fi & Ethernet adapter</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Enable network connectivity on this PC
                    </div>
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.wifiEnabled}
                  onToggle={() => updatePc("wifiEnabled", !pcState.wifiEnabled)}
                />
              </div>

              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Plane className="w-4.5 h-4.5" />
                  <div>
                    <div className="text-[13.5px] font-medium">Airplane mode</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Stop all wireless communication
                    </div>
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.airplaneMode}
                  onToggle={() => updatePc("airplaneMode", !pcState.airplaneMode)}
                />
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Metered connection</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Reduce background bandwidth usage
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.meteredConnection}
                  onToggle={() => updatePc("meteredConnection", !pcState.meteredConnection)}
                />
              </div>
            </div>
          )}

          {/* 5. PERSONALIZATION */}
          {activeCategory === "personalization" && (
            <div className="space-y-4">
              <div className={`${cardClass} p-4 space-y-3`}>
                <div className="text-[14.5px] font-semibold">Select a theme to apply</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WIN11_THEMES.map((theme) => {
                    const active = currentWallpaperId === theme.id;
                    const previewSrc = theme.isSpotlight
                      ? spotlight.currentPhoto.thumbnailUrl || spotlight.currentPhoto.imageUrl
                      : theme.image;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectTheme(theme)}
                        className={`text-left rounded-[8px] overflow-hidden border-2 transition-all cursor-pointer ${
                          active
                            ? "border-[#0067b8] dark:border-[#4cc2ff]"
                            : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25"
                        }`}
                      >
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <img
                            src={previewSrc}
                            alt={theme.label}
                            className="w-full h-full object-cover"
                          />
                          {theme.isSpotlight && (
                            <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-[4px] bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                              <Sparkles className="w-2.5 h-2.5 text-[#4cc2ff]" />
                              Windows Spotlight
                            </span>
                          )}
                        </div>
                        <div className="px-2.5 py-1.5 text-[12px] font-medium flex items-center justify-between">
                          <span className="truncate">{theme.label}</span>
                          {active && (
                            <Check className="w-3.5 h-3.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spotlight Collection Settings Card */}
              <div className={`${cardClass} p-4 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[7px] bg-[#0067b8]/12 dark:bg-[#4cc2ff]/15 text-[#0067b8] dark:text-[#4cc2ff] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold">Spotlight Collection</span>
                        {isSpotlightActive && (
                          <span className="px-2 py-0.5 rounded-[4px] bg-[#0067b8]/12 dark:bg-[#4cc2ff]/15 text-[#0067b8] dark:text-[#4cc2ff] text-[11px] font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                        Automatically fetch & rotate high-res wallpapers from windows10spotlight.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isSpotlightActive && (
                      <button
                        type="button"
                        onClick={() => {
                          const spotlightTheme = WIN11_THEMES.find((t) => t.isSpotlight);
                          if (spotlightTheme) handleSelectTheme(spotlightTheme);
                        }}
                        className="fluent-btn-primary h-[30px] px-3 rounded-[5px] text-[12px] font-semibold cursor-pointer"
                      >
                        Use Spotlight Collection
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = spotlight.rotateNext();
                        showAppToast(`Switched Spotlight photo: ${next.title}`, {
                          appName: "Spotlight Collection",
                        });
                      }}
                      className="h-[30px] px-3 rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[12px] font-medium cursor-pointer"
                    >
                      Next photo
                    </button>
                    <button
                      type="button"
                      disabled={spotlight.isFetching}
                      onClick={() => void spotlight.ensureLoaded(true)}
                      aria-label="Refresh Spotlight collection"
                      className="h-[30px] w-[30px] rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] flex items-center justify-center cursor-pointer disabled:opacity-50"
                      title="Refresh collection from windows10spotlight.com"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${spotlight.isFetching ? "animate-spin" : ""}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Current Spotlight photo caption & quick gallery */}
                <div className="rounded-[7px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.07] p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="w-full sm:w-[140px] aspect-[16/9] rounded-[5px] overflow-hidden shrink-0 bg-black/20">
                    <img
                      src={spotlight.currentPhoto.thumbnailUrl || spotlight.currentPhoto.imageUrl}
                      alt={spotlight.currentPhoto.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[12.5px] font-medium text-[#111827] dark:text-white line-clamp-2">
                      {spotlight.currentPhoto.title}
                    </div>
                    <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {spotlight.currentPhoto.date && <span>{spotlight.currentPhoto.date}</span>}
                      <span>windows10spotlight.com</span>
                      <span>
                        Photo {spotlight.currentIndex + 1} of {spotlight.photos.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rotation Interval + Target Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between gap-3 rounded-[6px] border border-black/[0.07] dark:border-white/[0.08] px-3 py-2.5">
                    <div>
                      <div className="text-[13px] font-medium">Change picture every</div>
                      <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af]">
                        Auto-rotate interval
                      </div>
                    </div>
                    <select
                      aria-label="Spotlight change interval"
                      value={settings.spotlightInterval || "1m"}
                      onChange={(e) => {
                        updateSetting("spotlightInterval", e.target.value as SpotlightInterval);
                      }}
                      className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                    >
                      {SPOTLIGHT_INTERVAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[6px] border border-black/[0.07] dark:border-white/[0.08] px-3 py-2.5">
                    <div>
                      <div className="text-[13px] font-medium">Apply Spotlight to</div>
                      <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af]">
                        Desktop, Lock screen, or Both
                      </div>
                    </div>
                    <select
                      aria-label="Spotlight wallpaper target"
                      value={settings.spotlightTarget || "both"}
                      onChange={(e) => {
                        updateSetting("spotlightTarget", e.target.value as SpotlightTarget);
                      }}
                      className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                    >
                      {SPOTLIGHT_TARGET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Recent Spotlight thumbnails strip */}
                {spotlight.photos.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="text-[11.5px] font-medium text-[#6b7280] dark:text-[#9ca3af]">
                      Recent photos from Windows Spotlight
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {spotlight.photos.slice(0, 6).map((photo) => {
                        const selected = spotlight.currentPhoto.id === photo.id;
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            title={photo.title}
                            onClick={() => {
                              if (!isSpotlightActive) {
                                updatePc("selectedThemeId", SPOTLIGHT_COLLECTION_THEME_ID);
                                updateSetting("windowsWallpaper", SPOTLIGHT_COLLECTION_THEME_ID);
                              }
                              spotlight.selectPhoto(photo.id);
                            }}
                            className={`aspect-[16/10] rounded-[5px] overflow-hidden border-2 transition-all cursor-pointer ${
                              selected
                                ? "border-[#0067b8] dark:border-[#4cc2ff]"
                                : "border-transparent hover:border-black/25 dark:hover:border-white/25"
                            }`}
                          >
                            <img
                              src={photo.thumbnailUrl || photo.imageUrl}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Choose your mode</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Change the colors that appear in Sodium and your apps
                  </div>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting("theme", e.target.value as "light" | "dark")}
                  className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Transparency & Mica effects</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Sodium and surfaces appear translucent with desktop wallpaper
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.transparencyEffects}
                  onToggle={() => updatePc("transparencyEffects", !pcState.transparencyEffects)}
                />
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Center taskbar icons</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Sodium 27 centered taskbar alignment
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.taskbarCentered}
                  onToggle={() => updatePc("taskbarCentered", !pcState.taskbarCentered)}
                />
              </div>

              {(
                [
                  {
                    key: "windowsUiScale",
                    label: "Global interface scale",
                    command: "/ui /si",
                    value: settings.windowsUiScale || "default",
                  },
                  {
                    key: "taskbarScale",
                    label: "Taskbar size",
                    command: "/taskbar /si",
                    value: settings.taskbarScale || "default",
                  },
                  {
                    key: "taskbarAlignment",
                    label: "Taskbar alignment",
                    command: "/taskbar /alignment",
                    value: settings.taskbarAlignment || "center",
                  },
                  {
                    key: "taskbarLocation",
                    label: "Taskbar location",
                    command: "/taskbar /location",
                    value: settings.taskbarLocation || "bottom",
                  },
                ] as const
              ).map((option) => (
                <div key={option.key} className={rowClass}>
                  <div>
                    <div className="text-[13.5px] font-medium">{option.label}</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Command: {option.command}
                    </div>
                  </div>
                  <select
                    aria-label={option.label}
                    value={option.value}
                    onChange={(event) => updateSetting(option.key, event.target.value as never)}
                    className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                  >
                    {option.key === "taskbarAlignment" ? (
                      <>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                      </>
                    ) : option.key === "taskbarLocation" ? (
                      <>
                        <option value="bottom">Bottom</option>
                        <option value="top">Top</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </>
                    ) : (
                      <>
                        <option value="small">Small</option>
                        <option value="default">Default</option>
                        <option value="large">Large</option>
                      </>
                    )}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* 6. APPS */}
          {activeCategory === "apps" && (
            <div className={`${cardClass} divide-y divide-black/[0.06] dark:divide-white/[0.07]`}>
              {[
                {
                  name: "Notepad",
                  desc: "WinUI 3 plain text & Markdown editor with tabs",
                  size: "12.8 MB",
                  route: "/notepad",
                },
                {
                  name: "HTML Writer",
                  desc: "WinUI 3 HTML/CSS/JS Editor & Live Runner",
                  size: "18.4 MB",
                  route: "/html-writer",
                },
                {
                  name: "Notes",
                  desc: "Rich text notes and documents",
                  size: "24.2 MB",
                  route: "/notes",
                },
                {
                  name: "Ink Canvas",
                  desc: "Digital drawing & sketching studio",
                  size: "31.0 MB",
                  route: "/draws",
                },
                {
                  name: "Gallery",
                  desc: "Photos, videos, and local media",
                  size: "42.6 MB",
                  route: "/gallery",
                },
                {
                  name: "Screenbox",
                  desc: "Modern Fluent media player",
                  size: "36.8 MB",
                  route: "/screenbox",
                },
                {
                  name: "Camera",
                  desc: "Webcam capture & Camera Roll",
                  size: "14.5 MB",
                  route: "/camera",
                },
                {
                  name: "WinUI 3 Gallery",
                  desc: "Fluent Design control showcase",
                  size: "19.1 MB",
                  route: "/winui-3",
                },
              ].map((app) => (
                <div key={app.route} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-medium">{app.name}</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      {app.desc} • {app.size}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate?.(app.route)}
                    className="h-[30px] px-3 rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 7. ACCOUNTS */}
          {activeCategory === "accounts" && (
            <div className="space-y-3">
              <div className={`${cardClass} p-4 space-y-4`}>
                <div className="text-[14px] font-semibold">Your info</div>
                <div className="flex flex-wrap items-center gap-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.07]">
                  <div className="w-16 h-16 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
                    {pcState.userAvatar ? (
                      <img
                        src={pcState.userAvatar}
                        alt={pcState.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 opacity-75" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="h-[32px] px-3 rounded-[6px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Choose a file</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="sr-only"
                      />
                    </label>
                    {pcState.userAvatar && (
                      <button
                        type="button"
                        onClick={() => updatePc("userAvatar", "")}
                        className="h-[32px] px-3 rounded-[6px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset default</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] mb-1">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={pcState.userName}
                      onChange={(e) => updatePc("userName", e.target.value)}
                      className="w-full h-[34px] px-3 rounded-[6px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[13px] outline-none focus:border-[#0067b8] dark:focus:border-[#4cc2ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] mb-1">
                      Account email
                    </label>
                    <input
                      type="text"
                      value={pcState.userEmail}
                      onChange={(e) => updatePc("userEmail", e.target.value)}
                      placeholder="Unregistered Account"
                      className="w-full h-[34px] px-3 rounded-[6px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[13px] outline-none focus:border-[#0067b8] dark:focus:border-[#4cc2ff]"
                    />
                  </div>
                </div>
              </div>
              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Lock className="w-4.5 h-4.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                  <div>
                    <div className="text-[13.5px] font-medium">Sodium Hello PIN</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Sign in securely to your PC
                    </div>
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.windowsHelloPin}
                  onToggle={() => updatePc("windowsHelloPin", !pcState.windowsHelloPin)}
                />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Remember my preferences</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Back up PC Settings locally across sessions
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.syncSettings}
                  onToggle={() => updatePc("syncSettings", !pcState.syncSettings)}
                />
              </div>
            </div>
          )}

          {/* 8. TIME & LANGUAGE */}
          {activeCategory === "time" && (
            <div className="space-y-3">
              <div className={`${cardClass} p-4 flex items-center justify-between`}>
                <div>
                  <div className="text-[22px] font-semibold tabular-nums">
                    {nowClock.toLocaleTimeString()}
                  </div>
                  <div className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af]">
                    {nowClock.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <Clock className="w-7 h-7 text-[#0067b8] dark:text-[#4cc2ff]" />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Set time zone automatically</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Sync with local workstation clock
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.autoTimeZone}
                  onToggle={() => updatePc("autoTimeZone", !pcState.autoTimeZone)}
                />
              </div>
              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Globe className="w-4.5 h-4.5" />
                  <div>
                    <div className="text-[13.5px] font-medium">Sodium display language</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Preferred OS interface language
                    </div>
                  </div>
                </div>
                <select
                  value={pcState.displayLanguage}
                  onChange={(e) => updatePc("displayLanguage", e.target.value)}
                  className="h-[30px] px-2.5 rounded-[5px] bg-white dark:bg-[#1f2329] border border-black/15 dark:border-white/15 text-[12.5px]"
                >
                  <option>English (United States)</option>
                  <option>Tiếng Việt (Việt Nam)</option>
                </select>
              </div>
            </div>
          )}

          {/* 9. GAMING */}
          {activeCategory === "gaming" && (
            <div className="space-y-3">
              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-violet-500" />
                  <div>
                    <div className="text-[13.5px] font-medium">Game Mode</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Optimize your PC for play by turning things off in the background
                    </div>
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.gameMode}
                  onToggle={() => updatePc("gameMode", !pcState.gameMode)}
                />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Captures & Game Bar shortcuts</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Allow recording clips and screenshots while running games
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.gameBarCaptures}
                  onToggle={() => updatePc("gameBarCaptures", !pcState.gameBarCaptures)}
                />
              </div>
            </div>
          )}

          {/* 10. ACCESSIBILITY */}
          {activeCategory === "accessibility" && (
            <div className="space-y-3">
              <div className={`${cardClass} p-4 space-y-2`}>
                <div className="flex justify-between text-[13.5px] font-medium">
                  <span>Text size preview</span>
                  <span className="tabular-nums">{pcState.pcTextScale}%</span>
                </div>
                <input
                  type="range"
                  min={90}
                  max={150}
                  step={5}
                  value={pcState.pcTextScale}
                  onChange={(e) => updatePc("pcTextScale", Number(e.target.value))}
                  className="w-full accent-[#0067b8] dark:accent-[#4cc2ff] cursor-pointer"
                />
                <p
                  style={{ fontSize: `${Math.round(13 * (pcState.pcTextScale / 100))}px` }}
                  className="text-[#6b7280] dark:text-[#9ca3af] pt-1"
                >
                  Sample text scaled to {pcState.pcTextScale}% for comfortable reading.
                </p>
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Animation effects</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Window zoom, minimize, and fluent UI transitions
                  </div>
                </div>
                <WinSwitch
                  checked={!settings.reduceAllMotion}
                  onToggle={() => updateSetting("reduceAllMotion", !settings.reduceAllMotion)}
                />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Always show scrollbars</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Keep scrollbars visible in scrollable panels
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.alwaysShowScrollbars}
                  onToggle={() => updatePc("alwaysShowScrollbars", !pcState.alwaysShowScrollbars)}
                />
              </div>
            </div>
          )}

          {/* 11. PRIVACY & SECURITY */}
          {activeCategory === "privacy" && (
            <div className="space-y-3">
              <div className={`${cardClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-[14.5px] font-semibold">Sodium Security — Protected</div>
                      <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                        Virus & threat protection, Firewall, and App guard are active.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickScan}
                    disabled={isScanning}
                    className="fluent-btn-primary h-[30px] px-3 rounded-[5px] text-[12.5px] font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {isScanning ? "Scanning..." : "Quick scan"}
                  </button>
                </div>
                {(isScanning || scanProgress > 0) && (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-200"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <div className="text-[11.5px] text-[#6b7280] dark:text-[#9ca3af]">
                      {isScanning
                        ? `Scanning system files... ${scanProgress}%`
                        : "Last quick scan: No threats found."}
                    </div>
                  </div>
                )}
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Camera access for desktop apps</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Allow Camera and media apps to access webcam
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.cameraPermission}
                  onToggle={() => updatePc("cameraPermission", !pcState.cameraPermission)}
                />
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Microphone access</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Allow voice search and audio recording
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.micPermission}
                  onToggle={() => updatePc("micPermission", !pcState.micPermission)}
                />
              </div>
            </div>
          )}

          {/* 12. WINDOWS UPDATE */}
          {activeCategory === "update" && (
            <div className="space-y-3">
              <div
                className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-[8px] bg-[#0067b8]/12 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#0067b8] dark:text-[#4cc2ff] shrink-0">
                    <RefreshCw className={`w-5 h-5 ${isCheckingUpdate ? "animate-spin" : ""}`} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{updateResultMsg}</div>
                    <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                      Last checked: {pcState.lastUpdateCheck}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  disabled={isCheckingUpdate}
                  className="fluent-btn-primary h-[32px] px-4 rounded-[6px] text-[12.5px] font-semibold cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {isCheckingUpdate ? "Checking..." : "Check for updates"}
                </button>
              </div>

              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Pause updates for 1 week</div>
                  <div className="text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                    Temporarily delay optional feature updates
                  </div>
                </div>
                <WinSwitch
                  checked={pcState.pauseUpdates}
                  onToggle={() => updatePc("pauseUpdates", !pcState.pauseUpdates)}
                />
              </div>

              <div className={`${cardClass} p-4 space-y-2`}>
                <div className="text-[13.5px] font-semibold">Recent update history</div>
                <div className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af] space-y-1.5">
                  <div className="flex justify-between">
                    <span>2026-11 Cumulative Update for Sodium OS 24H2 (KB5046617)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Installed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>WinUI 3 Mica & HTML Writer Runtime Component Pack</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Installed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Rename PC ContentDialog */}
      {createPortal(
        <AnimatePresence>
          {isRenameOpen && (
            <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
              <motion.div
                variants={modalBackdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setIsRenameOpen(false)}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                variants={modalDialogVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fluent-modal-dialog relative w-full max-w-md rounded-[10px] bg-white dark:bg-[#2b2f36] border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-5 h-5 text-[#0067b8] dark:text-[#4cc2ff]" />
                    <h3 className="text-[17px] font-semibold text-[#111827] dark:text-white">
                      Rename your PC
                    </h3>
                  </div>
                  <p className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af] mt-1.5">
                    Current PC name: <strong>{pcState.deviceName}</strong>
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") setIsRenameOpen(false);
                    }}
                    className="mt-3 w-full h-[36px] px-3 rounded-[6px] bg-black/[0.04] dark:bg-black/25 border border-black/15 dark:border-white/15 focus:border-[#0067b8] dark:focus:border-[#4cc2ff] outline-none text-[13.5px]"
                    placeholder="Enter a new PC name"
                  />
                </div>
                <div className="fluent-modal-footer px-5 py-3.5 bg-black/[0.03] dark:bg-black/20 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRenameOpen(false)}
                    className="h-[32px] px-4 rounded-[6px] border border-black/15 dark:border-white/15 text-[13px] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRenameSubmit}
                    className="fluent-btn-primary h-[32px] px-4 rounded-[6px] text-[13px] font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Add Bluetooth Device ContentDialog */}
      {createPortal(
        <AnimatePresence>
          {isAddBtOpen && (
            <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
              <motion.div
                variants={modalBackdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setIsAddBtOpen(false)}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                variants={modalDialogVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fluent-modal-dialog relative w-full max-w-md rounded-[10px] bg-white dark:bg-[#2b2f36] border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <Bluetooth className="w-5 h-5 text-[#0067b8] dark:text-[#4cc2ff]" />
                    <h3 className="text-[17px] font-semibold text-[#111827] dark:text-white">
                      Add a Bluetooth device
                    </h3>
                  </div>
                  <p className="text-[12.5px] text-[#6b7280] dark:text-[#9ca3af] mt-1.5">
                    Make sure your device is turned on and discoverable.
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={newBtName}
                    onChange={(e) => setNewBtName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddBtDevice();
                      if (e.key === "Escape") setIsAddBtOpen(false);
                    }}
                    className="mt-3 w-full h-[36px] px-3 rounded-[6px] bg-black/[0.04] dark:bg-black/25 border border-black/15 dark:border-white/15 focus:border-[#0067b8] dark:focus:border-[#4cc2ff] outline-none text-[13.5px]"
                    placeholder="e.g. AirPods Pro, Xbox Wireless Controller"
                  />
                </div>
                <div className="fluent-modal-footer px-5 py-3.5 bg-black/[0.03] dark:bg-black/20 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBtOpen(false)}
                    className="h-[32px] px-4 rounded-[6px] border border-black/15 dark:border-white/15 text-[13px] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBtDevice}
                    className="fluent-btn-primary h-[32px] px-4 rounded-[6px] text-[13px] font-semibold cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
