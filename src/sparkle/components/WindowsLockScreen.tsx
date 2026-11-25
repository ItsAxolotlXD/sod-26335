import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Wifi,
  Accessibility,
  Power,
  Lock,
  RotateCcw,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Sun,
  Cloud,
  CloudRain,
  Camera,
  Sparkles,
  Settings2,
  MoreHorizontal,
  Tv,
  AlertTriangle,
  ChevronLeft,
  Check,
} from "lucide-react";
import { useSettings, resolveLockWallpaper } from "../hooks/useSettings";
import { useCityWeather } from "../hooks/useCityWeather";
import { useAuthSession, getAccountLabel } from "../services/authSession";
import { SPOTLIGHT_COLLECTION_THEME_ID, WINDOWS_WALLPAPERS } from "../constants/wallpapers";
import { rotateSpotlightPhoto, useSpotlightCollection } from "../services/spotlightService";
import { WINDOWS_BOOT_SOUND_SRC } from "../constants/assets";
import { SpinningRing, SPINNING_RING_GIF_LOOP_DURATION_MS } from "./SpinningRing";
import { Channel } from "../types";

interface WindowsLockScreenProps {
  isOpen: boolean;
  onUnlock: () => void;
  onExitWindowsMode?: () => void;
  onRestartSystem?: () => void;
  onNavigate?: (route: string) => void;
  channels?: Channel[];
}

interface LockAccount {
  id: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
}

const LOCK_PASSWORDS_STORAGE_KEY = "sparkle_lock_passwords_v1";
const LOCK_WIDGETS_STORAGE_KEY = "sparkle_lock_widgets_v1";
const LOCK_BG_STORAGE_KEY = "sparkle_lock_bg_v1";

interface LockWidgetsPrefs {
  showWeather: boolean;
  showTrending: boolean;
  weatherCity: "hanoi" | "hcmc" | "danang";
}

const DEFAULT_WIDGET_PREFS: LockWidgetsPrefs = {
  showWeather: true,
  showTrending: true,
  weatherCity: "hanoi",
};

const CITY_LABELS: Record<"hanoi" | "hcmc" | "danang", string> = {
  hanoi: "Hà Nội",
  hcmc: "TP. Hồ Chí Minh",
  danang: "Đà Nẵng",
};

const SPOTLIGHT_CAPTIONS = [
  {
    location: "Sodium Desktop",
    title: "With Sodium 27M1, enjoy live TV, notes, and Fluent apps in one place.",
  },
  {
    location: "Fluent Spotlight",
    title: "Click anywhere or press Space to sign in to your workspace.",
  },
  {
    location: "Windows Mode",
    title: "Customize your wallpapers, widgets, and lock password anytime.",
  },
];

function readSavedPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCK_PASSWORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function writeSavedPasswords(map: Record<string, string>) {
  try {
    localStorage.setItem(LOCK_PASSWORDS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

interface PcProfileSnapshot {
  userName: string;
  userAvatar: string;
}

function readPcProfile(): PcProfileSnapshot {
  try {
    const raw = localStorage.getItem("sparkle_pc_settings_v1");
    if (raw) {
      const parsed = JSON.parse(raw) as { userName?: unknown; userAvatar?: unknown };
      return {
        userName:
          typeof parsed.userName === "string" && parsed.userName.trim()
            ? parsed.userName.trim()
            : "Sodium User",
        userAvatar: typeof parsed.userAvatar === "string" ? parsed.userAvatar.trim() : "",
      };
    }
  } catch {
    // ignore
  }
  return { userName: "Sodium User", userAvatar: "" };
}

function readWidgetPrefs(): LockWidgetsPrefs {
  try {
    const raw = localStorage.getItem(LOCK_WIDGETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LockWidgetsPrefs>;
      return {
        showWeather: typeof parsed.showWeather === "boolean" ? parsed.showWeather : true,
        showTrending: typeof parsed.showTrending === "boolean" ? parsed.showTrending : true,
        weatherCity:
          parsed.weatherCity === "hcmc" || parsed.weatherCity === "danang"
            ? parsed.weatherCity
            : "hanoi",
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDGET_PREFS;
}

const WindowsUserGlyph: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    data-lock-avatar="true"
    className={className}
  >
    <circle cx="32" cy="21.5" r="8.2" fill="currentColor" />
    <path
      d="M16.2 40.5c0-4.9 6.3-8.1 15.8-8.1s15.8 3.2 15.8 8.1c0 4.7-6.3 7.7-15.8 7.7s-15.8-3-15.8-7.7z"
      fill="currentColor"
    />
  </svg>
);

const LockAccountAvatar: React.FC<{
  account: LockAccount;
  variant: "hero" | "switcher";
}> = ({ account, variant }) => {
  if (account.avatarUrl) {
    return (
      <img src={account.avatarUrl} alt={account.label} className="w-full h-full object-cover" />
    );
  }

  if (variant === "hero") {
    return <WindowsUserGlyph className="lock-avatar-hero w-[76%] h-[76%] text-white" />;
  }

  if (account.id === "local-demo" || account.id === "guest") {
    return <WindowsUserGlyph className="lock-avatar-switcher-light w-[76%] h-[76%] text-white" />;
  }

  return (
    <WindowsUserGlyph className="lock-avatar-switcher-neutral w-[76%] h-[76%] text-[#5c6670]" />
  );
};

export const WindowsLockScreen: React.FC<WindowsLockScreenProps> = ({
  isOpen,
  onUnlock,
  onExitWindowsMode,
  onRestartSystem,
  onNavigate,
  channels = [],
}) => {
  const { settings, updateSetting } = useSettings();
  const session = useAuthSession();
  const authLabel = getAccountLabel(session);
  const [pcProfile, setPcProfile] = useState<PcProfileSnapshot>(readPcProfile);

  useEffect(() => {
    const syncProfile = () => setPcProfile(readPcProfile());
    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("sparkle:pc-settings-updated", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("sparkle:pc-settings-updated", syncProfile);
    };
  }, [isOpen]);

  const [stage, setStage] = useState<"lock" | "signin" | "welcoming">("lock");
  const [welcomeRunId, setWelcomeRunId] = useState(0);
  const [isWelcomeGifReady, setIsWelcomeGifReady] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const pendingRouteRef = useRef<string | null>(null);

  const authAvatarUrl = useMemo(() => {
    const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
    const raw = meta?.["avatar_url"] ?? meta?.["picture"];
    return typeof raw === "string" && raw.trim() ? raw.trim() : "";
  }, [session]);

  // Accounts
  const accounts: LockAccount[] = useMemo(() => {
    const primaryName = authLabel || pcProfile.userName;
    const primaryAvatar = pcProfile.userAvatar || authAvatarUrl;
    return [
      { id: "primary", label: primaryName, ...(primaryAvatar ? { avatarUrl: primaryAvatar } : {}) },
      { id: "local-demo", label: "Local Demo" },
      { id: "administrator", label: "Administrator" },
      { id: "guest", label: "Guest" },
    ];
  }, [authLabel, authAvatarUrl, pcProfile.userAvatar, pcProfile.userName]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("primary");
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? accounts[0]!,
    [accounts, selectedAccountId],
  );

  // Lock screen background (syncs with Spotlight Collection or active wallpaper)
  useSpotlightCollection();
  const [customWallpaperId, setCustomWallpaperId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCK_BG_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const activeWallpaper = resolveLockWallpaper(settings, customWallpaperId);

  // Lock screen widgets & popovers
  const [widgetPrefs, setWidgetPrefs] = useState<LockWidgetsPrefs>(readWidgetPrefs);
  const [isManageWidgetsOpen, setIsManageWidgetsOpen] = useState(false);
  const [isSpotlightInfoOpen, setIsSpotlightInfoOpen] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);

  // Sign-in password & menus state
  const [passwordsMap, setPasswordsMap] = useState<Record<string, string>>(readSavedPasswords);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [shakeError, setShakeError] = useState(false);

  // Bottom-right system popovers on Sign-in screen
  const [activeSystemMenu, setActiveSystemMenu] = useState<
    "network" | "accessibility" | "power" | null
  >(null);

  // Drag-up gesture tracking on Lock curtain
  const dragStartY = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const passwordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const bootAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data: liveWeather } = useCityWeather(widgetPrefs.weatherCity);

  // Preload Windows boot sound
  useEffect(() => {
    try {
      const audio = new Audio(WINDOWS_BOOT_SOUND_SRC);
      audio.preload = "auto";
      audio.volume = 0.75;
      bootAudioRef.current = audio;
    } catch {
      // ignore audio init errors
    }
  }, []);

  // Persist widget prefs
  useEffect(() => {
    try {
      localStorage.setItem(LOCK_WIDGETS_STORAGE_KEY, JSON.stringify(widgetPrefs));
    } catch {
      // ignore
    }
  }, [widgetPrefs]);

  // Reset state whenever lock screen opens
  useEffect(() => {
    if (isOpen) {
      setStage("lock");
      setIsWelcomeGifReady(false);
      pendingRouteRef.current = null;
      setNow(new Date());
      setPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      setAuthError("");
      setIsSettingPassword(false);
      setIsManageWidgetsOpen(false);
      setIsSpotlightInfoOpen(false);
      setActiveSystemMenu(null);
      setDragOffsetY(0);
      setPasswordsMap(readSavedPasswords());
    }
  }, [isOpen]);

  // Live clock tick
  useEffect(() => {
    if (!isOpen) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  // Focus password input when entering signin stage
  useEffect(() => {
    if (!isOpen || stage !== "signin") return;
    const timer = setTimeout(() => {
      if (isSettingPassword) {
        newPasswordRef.current?.focus();
      } else if (passwordsMap[selectedAccount.id]) {
        passwordRef.current?.focus();
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [isOpen, stage, isSettingPassword, selectedAccount.id, passwordsMap]);

  const goToSignIn = useCallback(() => {
    setIsManageWidgetsOpen(false);
    setIsSpotlightInfoOpen(false);
    setDragOffsetY(0);
    setStage("signin");
  }, []);

  const triggerError = useCallback((msg: string) => {
    setAuthError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 420);
  }, []);

  // Keyboard handling on Lock & Sign-in screens
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage === "lock") {
        if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp") {
          e.preventDefault();
          goToSignIn();
        }
      } else if (stage === "signin") {
        if (e.key === "Escape") {
          if (activeSystemMenu) {
            setActiveSystemMenu(null);
          } else if (isSettingPassword) {
            setIsSettingPassword(false);
            setAuthError("");
          } else {
            setStage("lock");
            setAuthError("");
            setPasswordInput("");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, stage, activeSystemMenu, isSettingPassword, goToSignIn]);

  const formattedTime = useMemo(() => {
    const hours24 = now.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours12}:${minutes}`;
  }, [now]);

  const formattedDate = useMemo(() => {
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  const currentAccountPassword = passwordsMap[selectedAccount.id] || "";
  const hasPassword = Boolean(currentAccountPassword);

  const playBootSound = useCallback(() => {
    try {
      const audio = bootAudioRef.current ?? new Audio(WINDOWS_BOOT_SOUND_SRC);
      bootAudioRef.current = audio;
      audio.muted = false;
      audio.volume = 0.75;
      audio.currentTime = 0;
      audio.play().catch(() => {
        try {
          const fallback = new Audio(WINDOWS_BOOT_SOUND_SRC);
          fallback.volume = 0.75;
          fallback.play().catch(() => {});
        } catch {
          // ignore playback errors
        }
      });
    } catch {
      // ignore playback errors
    }
  }, []);

  const completeUnlock = useCallback(() => {
    const target = pendingRouteRef.current;
    pendingRouteRef.current = null;
    playBootSound();
    if (target && onNavigate) {
      onNavigate(target);
    } else {
      onUnlock();
    }
  }, [onNavigate, onUnlock, playBootSound]);

  const beginWelcomeSignIn = useCallback(() => {
    setAuthError("");
    setActiveSystemMenu(null);
    setIsManageWidgetsOpen(false);
    setIsSpotlightInfoOpen(false);
    setIsWelcomeGifReady(false);
    setWelcomeRunId((id) => id + 1);
    setStage("welcoming");

    // Unlock audio element synchronously on the Sign-in user gesture so delayed boot playback is permitted
    try {
      const audio = bootAudioRef.current ?? new Audio(WINDOWS_BOOT_SOUND_SRC);
      bootAudioRef.current = audio;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    } catch {
      // ignore audio unlock errors
    }
  }, []);

  // Wait for 2 full loops of the spinning ring GIF before entering the desktop
  useEffect(() => {
    if (!isOpen || stage !== "welcoming" || !isWelcomeGifReady) return;
    const timer = setTimeout(() => {
      completeUnlock();
    }, SPINNING_RING_GIF_LOOP_DURATION_MS * 2);
    return () => clearTimeout(timer);
  }, [isOpen, stage, isWelcomeGifReady, completeUnlock]);

  const handleWidgetNavigate = useCallback(
    (route: string) => {
      pendingRouteRef.current = route;
      if (hasPassword) {
        goToSignIn();
      } else {
        beginWelcomeSignIn();
      }
    },
    [hasPassword, goToSignIn, beginWelcomeSignIn],
  );

  const handleSignInSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError("");

    if (isSettingPassword) {
      if (!newPasswordInput) {
        triggerError("Please enter a new password.");
        return;
      }
      if (newPasswordInput !== confirmPasswordInput) {
        triggerError("Those passwords didn't match. Try again.");
        return;
      }
      const next = { ...passwordsMap, [selectedAccount.id]: newPasswordInput };
      setPasswordsMap(next);
      writeSavedPasswords(next);
      setIsSettingPassword(false);
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      beginWelcomeSignIn();
      return;
    }

    if (hasPassword) {
      if (passwordInput !== currentAccountPassword) {
        triggerError("The password is incorrect. Try again.");
        setPasswordInput("");
        return;
      }
    }

    beginWelcomeSignIn();
  };

  const handleClearAccountPassword = () => {
    const next = { ...passwordsMap };
    delete next[selectedAccount.id];
    setPasswordsMap(next);
    writeSavedPasswords(next);
    setPasswordInput("");
    setAuthError("");
  };

  const handleSwitchAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    setPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    setAuthError("");
    setIsSettingPassword(false);
    setActiveSystemMenu(null);
  };

  const handleCycleWallpaper = () => {
    if (
      settings.windowsWallpaper === SPOTLIGHT_COLLECTION_THEME_ID &&
      settings.spotlightTarget !== "desktop"
    ) {
      rotateSpotlightPhoto();
      setCaptionIndex((i) => (i + 1) % SPOTLIGHT_CAPTIONS.length);
      return;
    }
    const idx = WINDOWS_WALLPAPERS.findIndex((w) => w.id === activeWallpaper.id);
    const next = WINDOWS_WALLPAPERS[(idx + 1) % WINDOWS_WALLPAPERS.length]!;
    setCustomWallpaperId(next.id);
    try {
      localStorage.setItem(LOCK_BG_STORAGE_KEY, next.id);
    } catch {
      // ignore
    }
    setCaptionIndex((i) => (i + 1) % SPOTLIGHT_CAPTIONS.length);
  };

  const trendingChannels = useMemo(() => channels.slice(0, 4), [channels]);
  const weatherTemp = liveWeather?.temp ?? 24;
  const weatherCond = liveWeather?.condition ?? "cloudy";
  const weatherDesc = liveWeather?.conditionLabel ?? "Partly cloudy";

  const renderWeatherIcon = () => {
    if (weatherCond === "sunny") {
      return <Sun className="w-7 h-7 text-amber-300 drop-shadow-sm shrink-0" />;
    }
    if (weatherCond === "rain") {
      return <CloudRain className="w-7 h-7 text-sky-300 drop-shadow-sm shrink-0" />;
    }
    return <Cloud className="w-7 h-7 text-sky-200 drop-shadow-sm shrink-0" />;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="windows-lock-screen-root"
          id="windows-lock-screen"
          data-lock-stage={stage}
          role="dialog"
          aria-modal="true"
          aria-label="Lock Screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: settings.reduceAllMotion ? 0 : 0.24 }}
          className={`fixed inset-0 z-[95000] select-none overflow-hidden bg-[#0c0e14] text-white ${
            stage === "welcoming" ? "cursor-none" : ""
          }`}
          style={{
            fontFamily:
              "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', 'Be Vietnam Pro', system-ui, sans-serif",
          }}
        >
          {/* Base Wallpaper Layer (always present behind both stages) */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `url('${activeWallpaper.image}')`,
            }}
          />

          {/* STAGE 2 & 3: Sign-in / Password / Welcome Screen (blurred wallpaper without dim) */}
          <div
            onClick={() => setActiveSystemMenu(null)}
            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
              stage === "signin" || stage === "welcoming"
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            } ${stage === "welcoming" ? "cursor-none" : ""}`}
            style={{
              backgroundColor: "transparent",
              backdropFilter: "blur(42px) saturate(150%)",
              WebkitBackdropFilter: "blur(42px) saturate(150%)",
            }}
          >
            {/* Subtle return-to-lock button at top-left */}
            {stage === "signin" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStage("lock");
                  setAuthError("");
                }}
                aria-label="Back to lock screen"
                className="absolute top-5 left-5 w-9 h-9 rounded-[6px] flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Center User Card */}
            <motion.div
              animate={shakeError ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center text-center px-6 -mt-8 max-w-sm w-full"
            >
              {/* User Avatar */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center overflow-hidden shadow-2xl mb-4">
                <LockAccountAvatar account={selectedAccount} variant="hero" />
              </div>

              {/* User Name */}
              <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-white drop-shadow-sm mb-5">
                {selectedAccount.label}
              </h1>

              {/* Welcome Loading or Password / Sign-in Controls */}
              {stage === "welcoming" ? (
                <div className="mt-1 flex items-center justify-center gap-3 min-h-[40px]">
                  <SpinningRing
                    key={welcomeRunId}
                    size={26}
                    ariaLabel="Welcome"
                    onGifReady={() => setIsWelcomeGifReady(true)}
                  />
                  <span className="text-[20px] font-normal tracking-wide text-white">Welcome</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSignInSubmit}
                  className="w-full max-w-[280px] flex flex-col items-center gap-2.5"
                >
                  {isSettingPassword ? (
                    <>
                      <div className="relative w-full">
                        <input
                          ref={newPasswordRef}
                          type={showPassword ? "text" : "password"}
                          value={newPasswordInput}
                          onChange={(e) => {
                            setNewPasswordInput(e.target.value);
                            setAuthError("");
                          }}
                          placeholder="New password"
                          className="w-full h-[36px] px-3 pr-9 rounded-[4px] bg-[#1f242c]/90 text-[13px] text-white placeholder-white/65 border border-white/15 border-b-2 border-b-[#4cc2ff] outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/65 hover:text-white cursor-pointer border-none bg-transparent"
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="relative w-full">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPasswordInput}
                          onChange={(e) => {
                            setConfirmPasswordInput(e.target.value);
                            setAuthError("");
                          }}
                          placeholder="Confirm password"
                          className="w-full h-[36px] px-3 pr-9 rounded-[4px] bg-white/15 focus:bg-[#1f242c]/90 text-[13px] text-white placeholder-white/70 border border-white/25 focus:border-b-2 focus:border-b-[#4cc2ff] outline-none transition-colors"
                        />
                        <button
                          type="submit"
                          aria-label="Save password and sign in"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-[4px] flex items-center justify-center text-white/85 hover:text-white hover:bg-white/15 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingPassword(false);
                          setAuthError("");
                        }}
                        className="mt-1 text-[12px] text-white/75 hover:text-white hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Cancel
                      </button>
                    </>
                  ) : hasPassword ? (
                    <>
                      <div className="relative w-full">
                        <input
                          ref={passwordRef}
                          type={showPassword ? "text" : "password"}
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            setAuthError("");
                          }}
                          placeholder="Password"
                          className="w-full h-[36px] px-3 pr-16 rounded-[4px] bg-[#1f242c]/90 text-[13px] text-white placeholder-white/65 border border-white/15 border-b-2 border-b-[#4cc2ff] outline-none transition-colors"
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 cursor-pointer border-none bg-transparent"
                          >
                            {showPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="submit"
                            aria-label="Sign in"
                            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 cursor-pointer border-none bg-transparent"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAccountPassword}
                        className="mt-1 text-[12px] text-white/70 hover:text-white hover:underline cursor-pointer border-none bg-transparent"
                      >
                        I forgot my password
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        className="lock-signin-btn h-[36px] px-9 rounded-[4px] bg-white/30 hover:bg-white/40 active:scale-[0.98] border-0 outline-none focus:outline-none focus-visible:outline-none text-[13.5px] font-medium text-white backdrop-blur-md transition-all cursor-pointer"
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingPassword(true);
                          setAuthError("");
                        }}
                        className="mt-1 text-[12px] text-white/70 hover:text-white hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Set password
                      </button>
                    </>
                  )}

                  {authError && (
                    <p role="alert" className="mt-1 text-[12px] text-amber-200 font-medium">
                      {authError}
                    </p>
                  )}
                </form>
              )}
            </motion.div>

            {/* Bottom-Left Account Switcher */}
            {stage === "signin" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-5 left-5 flex flex-col gap-1 w-[196px]"
              >
                {accounts.map((acc) => {
                  const isSelected = acc.id === selectedAccount.id;
                  const switcherBg =
                    acc.id === "local-demo"
                      ? "bg-[#fbbf24]"
                      : acc.id === "guest"
                        ? "bg-[#38bdf8]"
                        : "bg-white/95";
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSwitchAccount(acc.id)}
                      className={`w-full h-[42px] px-2.5 rounded-[6px] flex items-center gap-2.5 text-left transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-white/18 border-white/15 shadow-sm"
                          : "bg-transparent border-transparent hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full ${switcherBg} flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}
                      >
                        <LockAccountAvatar account={acc} variant="switcher" />
                      </div>
                      <span className="text-[12.5px] font-medium text-white truncate">
                        {acc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bottom-Right Utility Icons (Network, Accessibility, Power) */}
            {stage === "signin" && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-5 right-6 flex items-center gap-1"
              >
                {/* Network */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveSystemMenu((m) => (m === "network" ? null : "network"))}
                    aria-label="Network status"
                    className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                      activeSystemMenu === "network"
                        ? "bg-white/20"
                        : "bg-transparent hover:bg-white/12"
                    }`}
                  >
                    <Wifi className="w-4.5 h-4.5 text-white" />
                  </button>
                  <AnimatePresence>
                    {activeSystemMenu === "network" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 bottom-full mb-2 w-[220px] p-3 rounded-[8px] bg-[#1e222a]/92 backdrop-blur-2xl border border-white/15 shadow-2xl text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Wifi className="w-4 h-4 text-[#4cc2ff] shrink-0" />
                          <div>
                            <div className="text-[12.5px] font-semibold text-white">
                              Sodium Wi-Fi
                            </div>
                            <div className="text-[11px] text-white/65">Connected, secured</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Accessibility */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSystemMenu((m) => (m === "accessibility" ? null : "accessibility"))
                    }
                    aria-label="Accessibility"
                    className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                      activeSystemMenu === "accessibility"
                        ? "bg-white/20"
                        : "bg-transparent hover:bg-white/12"
                    }`}
                  >
                    <Accessibility className="w-4.5 h-4.5 text-white" />
                  </button>
                  <AnimatePresence>
                    {activeSystemMenu === "accessibility" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 bottom-full mb-2 w-[230px] p-1.5 rounded-[8px] bg-[#1e222a]/92 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-0.5"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateSetting("reduceAllMotion", !settings.reduceAllMotion)
                          }
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center justify-between text-[12px] text-white hover:bg-white/10 cursor-pointer border-none bg-transparent"
                        >
                          <span>Reduce motion</span>
                          {settings.reduceAllMotion && (
                            <Check className="w-3.5 h-3.5 text-[#4cc2ff]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSetting("theme", settings.theme === "light" ? "dark" : "light")
                          }
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center justify-between text-[12px] text-white hover:bg-white/10 cursor-pointer border-none bg-transparent"
                        >
                          <span>Theme: {settings.theme === "light" ? "Light" : "Dark"}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Power */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveSystemMenu((m) => (m === "power" ? null : "power"))}
                    aria-label="Power"
                    className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                      activeSystemMenu === "power"
                        ? "bg-white/20"
                        : "bg-transparent hover:bg-white/12"
                    }`}
                  >
                    <Power className="w-4.5 h-4.5 text-white" />
                  </button>
                  <AnimatePresence>
                    {activeSystemMenu === "power" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 bottom-full mb-2 w-[196px] p-1.5 rounded-[8px] bg-[#1e222a]/92 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-0.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSystemMenu(null);
                            setStage("lock");
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] text-white hover:bg-white/10 cursor-pointer text-left border-none bg-transparent"
                        >
                          <Lock className="w-3.5 h-3.5 text-[#4cc2ff]" />
                          <span>Sleep / Lock</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onRestartSystem ? onRestartSystem() : window.location.reload()
                          }
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] text-white hover:bg-white/10 cursor-pointer text-left border-none bg-transparent"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-white/75" />
                          <span>Restart</span>
                        </button>
                        {onExitWindowsMode && (
                          <button
                            type="button"
                            onClick={onExitWindowsMode}
                            className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] text-white hover:bg-white/10 cursor-pointer text-left border-none bg-transparent"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-400" />
                            <span>Exit SodiumOS</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* STAGE 1: Windows 11 Lock Screen Curtain (slides up to reveal Sign-in) */}
          <AnimatePresence>
            {stage === "lock" && (
              <motion.div
                key="lock-curtain"
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: dragOffsetY, opacity: 1 }}
                exit={
                  settings.reduceAllMotion
                    ? { opacity: 0 }
                    : {
                        y: "-100%",
                        opacity: 0.9,
                        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
                      }
                }
                onPointerDown={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("[data-lock-interactive]")) return;
                  dragStartY.current = e.clientY;
                }}
                onPointerMove={(e) => {
                  if (dragStartY.current === null) return;
                  const delta = e.clientY - dragStartY.current;
                  if (delta < 0) {
                    setDragOffsetY(Math.max(-160, delta));
                  }
                }}
                onPointerUp={(e) => {
                  if (dragStartY.current === null) return;
                  const delta = e.clientY - dragStartY.current;
                  dragStartY.current = null;
                  if (delta < -50 || Math.abs(delta) < 8) {
                    goToSignIn();
                  } else {
                    setDragOffsetY(0);
                  }
                }}
                className="absolute inset-0 z-10 flex flex-col justify-between bg-cover bg-center cursor-pointer"
                style={{
                  backgroundImage: `url('${activeWallpaper.image}')`,
                }}
              >
                {/* Top-Right Spotlight Location Badge */}
                <div
                  data-lock-interactive="true"
                  className="relative z-20 flex justify-end pt-5 pr-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsSpotlightInfoOpen((v) => !v)}
                      aria-label="Lock screen background info"
                      className="w-8 h-8 rounded-[6px] bg-black/40 hover:bg-black/55 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-medium text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]">
                      {activeWallpaper.label}
                    </span>

                    <AnimatePresence>
                      {isSpotlightInfoOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.96 }}
                          transition={{ duration: 0.14 }}
                          className="absolute top-full right-0 mt-2 w-[230px] p-3 rounded-[8px] bg-black/70 backdrop-blur-2xl border border-white/15 shadow-2xl text-left space-y-2"
                        >
                          <div className="text-[12px] font-semibold text-white">
                            {activeWallpaper.label}
                          </div>
                          <div className="text-[11px] text-white/75 leading-snug">
                            Sodium Spotlight wallpaper
                          </div>
                          <button
                            type="button"
                            onClick={handleCycleWallpaper}
                            className="w-full h-7 px-2.5 rounded-[5px] bg-white/15 hover:bg-white/25 text-[11.5px] font-medium text-white transition-colors cursor-pointer border-none"
                          >
                            Switch background
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Center Clock + Date + Spotlight Tip */}
                <div className="relative z-10 flex flex-col items-center text-center px-4 -mt-10 pointer-events-none">
                  <div className="text-[72px] sm:text-[96px] font-semibold tracking-tight leading-none text-white drop-shadow-[0_3px_20px_rgba(0,0,0,0.4)] tabular-nums">
                    {formattedTime}
                  </div>
                  <div className="mt-2 text-[18px] sm:text-[22px] font-medium text-white/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]">
                    {formattedDate}
                  </div>

                  {/* Center Spotlight Hint (matching screenshot's center badge + 2-line text) */}
                  <div className="mt-14 sm:mt-20 flex flex-col items-center gap-2 max-w-[300px]">
                    <div className="w-8 h-8 rounded-[7px] bg-black/40 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/95">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <p className="text-[12px] leading-snug text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                      {SPOTLIGHT_CAPTIONS[captionIndex]?.title}
                    </p>
                  </div>
                </div>

                {/* Bottom Widgets Section + Bottom-Right Status Icon */}
                <div className="relative z-20 pb-5 px-4 flex flex-col items-center">
                  {/* Manage Widgets Button */}
                  <div
                    data-lock-interactive="true"
                    onClick={(e) => e.stopPropagation()}
                    className="relative mb-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => setIsManageWidgetsOpen((v) => !v)}
                      className="lock-widget-pill h-[28px] px-3 rounded-[7px] bg-black/45 hover:bg-black/60 backdrop-blur-xl border-0 outline-none flex items-center gap-1.5 text-[11.5px] font-medium text-white/95 transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Manage widgets</span>
                    </button>

                    <AnimatePresence>
                      {isManageWidgetsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.14 }}
                          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[240px] p-2.5 rounded-[9px] bg-[#141820]/85 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-2 text-left"
                        >
                          <div className="text-[11.5px] font-semibold text-white/90 px-1">
                            Lock screen widgets
                          </div>
                          <label className="flex items-center justify-between px-1.5 py-1 rounded-[5px] hover:bg-white/10 cursor-pointer text-[12px]">
                            <span>Weather</span>
                            <input
                              type="checkbox"
                              checked={widgetPrefs.showWeather}
                              onChange={(e) =>
                                setWidgetPrefs((p) => ({ ...p, showWeather: e.target.checked }))
                              }
                              className="accent-[#4cc2ff] cursor-pointer"
                            />
                          </label>
                          <label className="flex items-center justify-between px-1.5 py-1 rounded-[5px] hover:bg-white/10 cursor-pointer text-[12px]">
                            <span>Trending on Sodium</span>
                            <input
                              type="checkbox"
                              checked={widgetPrefs.showTrending}
                              onChange={(e) =>
                                setWidgetPrefs((p) => ({ ...p, showTrending: e.target.checked }))
                              }
                              className="accent-[#4cc2ff] cursor-pointer"
                            />
                          </label>
                          <div className="pt-1 border-t border-white/10 flex items-center gap-1 px-1">
                            {(["hanoi", "hcmc", "danang"] as const).map((cid) => (
                              <button
                                key={cid}
                                type="button"
                                onClick={() => setWidgetPrefs((p) => ({ ...p, weatherCity: cid }))}
                                className={`flex-1 h-6 rounded-[4px] text-[10.5px] font-medium transition-colors cursor-pointer ${
                                  widgetPrefs.weatherCity === cid
                                    ? "bg-white/25 text-white border border-white/40"
                                    : "bg-white/10 text-white/85 hover:bg-white/20 border border-transparent"
                                }`}
                              >
                                {cid === "hanoi" ? "HN" : cid === "hcmc" ? "HCM" : "ĐN"}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Two Side-by-Side Frosted Widget Cards */}
                  {(widgetPrefs.showWeather || widgetPrefs.showTrending) && (
                    <div
                      data-lock-interactive="true"
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-stretch justify-center gap-2.5 max-w-full"
                    >
                      {widgetPrefs.showWeather && (
                        <div className="lock-widget-card w-[228px] sm:w-[244px] rounded-[10px] bg-black/42 hover:bg-black/52 backdrop-blur-2xl border-0 outline-none px-3.5 py-2.5 flex flex-col justify-between transition-colors">
                          <div className="flex items-center justify-between text-[11.5px] text-white/90">
                            <div className="flex items-center gap-1.5 font-medium truncate">
                              <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
                              <span className="truncate">
                                {CITY_LABELS[widgetPrefs.weatherCity]}
                              </span>
                            </div>
                            <MoreHorizontal className="w-3.5 h-3.5 text-white/60 shrink-0" />
                          </div>

                          <div className="my-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {renderWeatherIcon()}
                              <span className="text-[26px] font-semibold leading-none tabular-nums">
                                {weatherTemp}°C
                              </span>
                            </div>
                            <div className="flex items-start gap-1 text-[11px] text-white/85 leading-tight text-right max-w-[96px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{weatherDesc}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleWidgetNavigate("/")}
                            className="text-[11px] font-medium text-sky-300 hover:underline text-center w-full cursor-pointer border-none bg-transparent"
                          >
                            See full forecast
                          </button>
                        </div>
                      )}

                      {widgetPrefs.showTrending && (
                        <div className="lock-widget-card w-[228px] sm:w-[244px] rounded-[10px] bg-black/42 hover:bg-black/52 backdrop-blur-2xl border-0 outline-none px-3.5 py-2.5 flex flex-col justify-between transition-colors">
                          <div className="flex items-center justify-between text-[11.5px] text-white/90">
                            <div className="flex items-center gap-1.5 font-medium truncate">
                              <Tv className="w-3 h-3 text-sky-300 shrink-0" />
                              <span className="truncate">Trending in Sodium</span>
                            </div>
                            <MoreHorizontal className="w-3.5 h-3.5 text-white/60 shrink-0" />
                          </div>

                          <div className="my-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                            {trendingChannels.length > 0 ? (
                              trendingChannels.map((ch) => (
                                <div
                                  key={ch.id}
                                  className="flex items-center justify-between gap-1 truncate"
                                >
                                  <span className="truncate text-white/90 font-medium">
                                    {ch.name}
                                  </span>
                                  <span className="text-[10px] text-emerald-300 shrink-0">
                                    LIVE
                                  </span>
                                </div>
                              ))
                            ) : (
                              <>
                                <div className="flex items-center justify-between text-white/90">
                                  <span>VTV1</span>
                                  <span className="text-emerald-300 text-[10px]">LIVE</span>
                                </div>
                                <div className="flex items-center justify-between text-white/90">
                                  <span>VTV3</span>
                                  <span className="text-emerald-300 text-[10px]">LIVE</span>
                                </div>
                                <div className="flex items-center justify-between text-white/90">
                                  <span>HTV7</span>
                                  <span className="text-emerald-300 text-[10px]">LIVE</span>
                                </div>
                                <div className="flex items-center justify-between text-white/90">
                                  <span>HTV9</span>
                                  <span className="text-emerald-300 text-[10px]">LIVE</span>
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleWidgetNavigate("/live-tv")}
                            className="text-[11px] font-medium text-sky-300 hover:underline text-center w-full cursor-pointer border-none bg-transparent"
                          >
                            See more in Watch
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom-Right Network Icon */}
                  <div className="absolute bottom-5 right-6 pointer-events-none text-white/90">
                    <Wifi className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
