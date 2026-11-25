import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  Droplets,
  LayoutGrid,
  MapPin,
  Pause,
  PinOff,
  Play,
  RotateCcw,
  Tv,
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import { useCityWeather } from "../hooks/useCityWeather";
import { galleryDB, type GalleryMediaItem } from "../services/galleryStorage";
import {
  DESKTOP_WIDGETS_KEY,
  DESKTOP_WIDGETS_UPDATED_EVENT,
  loadDesktopWidgets,
  moveDesktopWidget,
  unpinDesktopWidget,
  type DesktopPinnedWidget,
} from "../services/desktopStore";
import { showAppToast } from "../utils/toast";
import { WindowsContextMenu } from "./WindowsContextMenu";
import {
  CITY_WEATHER_DATA,
  ClockWidgetFace,
  CountdownRing,
  FluentWeatherIcon,
  loadWidgetsPrefs,
  saveWidgetsPrefs,
  WIDGET_CATALOG,
  type WidgetsPreferences,
} from "./WindowsWidgetsBoard";
import {
  Fluent3DCraftmineIcon,
  Fluent3DDrawsIcon,
  Fluent3DGalleryIcon,
  Fluent3DHtmlWriterIcon,
  Fluent3DNotesIcon,
  Fluent3DPhotopeaIcon,
} from "./Fluent3DIcons";

interface DesktopWidgetsLayerProps {
  onLaunchRoute: (route: string, state?: Record<string, unknown>) => void;
  onClearMenus?: () => void;
}

const TIPS_LIST = [
  {
    title: "Use clipboard history",
    body: "Press Sodium key + V to view clipboard history and paste quickly.",
  },
  {
    title: "Quick Direct Command",
    body: "Press Ctrl + Shift + R or click the terminal tray icon for commands.",
  },
  {
    title: "Pin windows & layouts",
    body: "Right-click the desktop to switch wallpapers, icons, and themes.",
  },
];

const COUNTDOWN_MILESTONES = [
  { label: "First day", days: 1365, color: "#f59e0b" },
  { label: "Off work", days: 3, color: "#0ea5e9" },
  { label: "Lunch", days: 1, color: "#10b981" },
  { label: "Vacation", days: 42, color: "#22c55e" },
];

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export const DesktopWidgetsLayer: React.FC<DesktopWidgetsLayerProps> = ({
  onLaunchRoute,
  onClearMenus,
}) => {
  const { settings } = useSettings();
  const isLightMode = settings.theme === "light";
  const layerRef = useRef<HTMLDivElement>(null);

  const [widgets, setWidgets] = useState<DesktopPinnedWidget[]>(() => loadDesktopWidgets());
  const [workspaceSize, setWorkspaceSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight - 64 : 720,
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: DesktopPinnedWidget;
  } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    liveX: number;
    liveY: number;
  } | null>(null);

  // Shared live widget states
  const [widgetsPrefs, setWidgetsPrefs] = useState<WidgetsPreferences>(() => loadWidgetsPrefs());
  const { data: liveWeather } = useCityWeather(widgetsPrefs.selectedCityId);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryMediaItem[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [countdownIdx, setCountdownIdx] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(1500);
  const [focusRunning, setFocusRunning] = useState(false);
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    const sync = () => setWidgets(loadDesktopWidgets());
    const syncPrefs = (e: Event) => {
      const detail = (e as CustomEvent<WidgetsPreferences | undefined>).detail;
      setWidgetsPrefs(detail || loadWidgetsPrefs());
    };
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === DESKTOP_WIDGETS_KEY) sync();
      if (!e.key || e.key === "sparkle_widgets_board_v1") setWidgetsPrefs(loadWidgetsPrefs());
    };
    window.addEventListener(DESKTOP_WIDGETS_UPDATED_EVENT, sync);
    window.addEventListener("sparkle:widgets-prefs-changed", syncPrefs);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DESKTOP_WIDGETS_UPDATED_EVENT, sync);
      window.removeEventListener("sparkle:widgets-prefs-changed", syncPrefs);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!widgets.some((w) => w.widgetId === "clock")) return;
    setClockNow(new Date());
    const id = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [widgets]);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 40 && rect.height > 40) {
        setWorkspaceSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!widgets.some((w) => w.widgetId === "photos")) return;
    galleryDB
      .getAll()
      .then((items) => setGalleryPhotos(items.filter((i) => i.type === "image")))
      .catch(() => {});
  }, [widgets]);

  useEffect(() => {
    if (!timerRunning) return;
    const t = window.setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          setTimerRunning(false);
          showAppToast("Timer completed!", "success");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [timerRunning]);

  useEffect(() => {
    if (!focusRunning) return;
    const t = window.setInterval(() => {
      setFocusSeconds((s) => {
        if (s <= 1) {
          setFocusRunning(false);
          showAppToast("Focus session complete — take a break!", "success");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [focusRunning]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const active = dragRef.current;
      if (!active) return;
      const dx = e.clientX - active.startClientX;
      const dy = e.clientY - active.startClientY;
      const nextX = Math.max(12, Math.min(workspaceSize.width - 280, active.origX + dx));
      const nextY = Math.max(12, Math.min(workspaceSize.height - 140, active.origY + dy));
      active.liveX = nextX;
      active.liveY = nextY;
      setWidgets((prev) =>
        prev.map((w) => (w.id === active.id ? { ...w, x: nextX, y: nextY } : w)),
      );
    };
    const onPointerUp = () => {
      const active = dragRef.current;
      if (!active) return;
      dragRef.current = null;
      setDraggingId(null);
      const saved = moveDesktopWidget(
        active.id,
        active.liveX,
        active.liveY,
        workspaceSize.width,
        workspaceSize.height,
      );
      setWidgets(saved);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [workspaceSize.height, workspaceSize.width]);

  if (widgets.length === 0) return null;

  const surfaceClass =
    "windows-mica-frame rounded-[12px] border border-black/15 dark:border-white/[0.14] shadow-[0_16px_42px_rgba(0,0,0,0.34)] ring-1 ring-black/5 dark:ring-white/[0.06] text-[#111827] dark:text-white select-none";
  const mutedStyle: React.CSSProperties = {
    color: isLightMode ? "rgba(17, 24, 39, 0.65)" : "rgba(255, 255, 255, 0.68)",
  };
  const linkStyle: React.CSSProperties = {
    color: isLightMode ? "#0067c0" : "#4cc2ff",
  };

  const renderWidgetBody = (item: DesktopPinnedWidget) => {
    switch (item.widgetId) {
      case "weather": {
        const cityEntry =
          CITY_WEATHER_DATA.find((c) => c.id === widgetsPrefs.selectedCityId) ||
          CITY_WEATHER_DATA[0];
        const temp = liveWeather ? Math.round(liveWeather.temp) : (cityEntry?.temp ?? 25);
        const city = cityEntry?.city || "Hà Nội";
        const cond = liveWeather?.condition || cityEntry?.condition || "cloudy";
        const summary = liveWeather?.conditionLabel || cityEntry?.conditionLabel || "Partly cloudy";
        return (
          <div className="p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{city}</span>
              </div>
              <button
                type="button"
                onClick={() => onLaunchRoute("/weather")}
                className="text-[11px] font-medium hover:underline border-none bg-transparent cursor-pointer"
                style={linkStyle}
              >
                Forecast
              </button>
            </div>
            <div className="flex items-center gap-3">
              <FluentWeatherIcon type={cond} className="w-11 h-11" />
              <div>
                <div className="text-[30px] font-light leading-none tabular-nums">{temp}°C</div>
                <div className="text-[11.5px] mt-1" style={mutedStyle}>
                  {summary}
                </div>
              </div>
            </div>
            {liveWeather?.hourly && (
              <div className="grid grid-cols-4 gap-1 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-center">
                {liveWeather.hourly.slice(0, 4).map((h) => (
                  <div key={h.time} className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px]" style={mutedStyle}>
                      {h.time}
                    </span>
                    <span className="text-[12px] font-semibold tabular-nums">{h.temp}°</span>
                    <span
                      className="text-[10px] inline-flex items-center gap-0.5"
                      style={mutedStyle}
                    >
                      <Droplets className="w-2.5 h-2.5 text-sky-500" />
                      {h.rain}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "photos": {
        const currentPhoto = galleryPhotos[photoIdx % Math.max(1, galleryPhotos.length)];
        const imgSrc =
          currentPhoto?.thumbnailUrl ||
          currentPhoto?.url ||
          "/banners/chao_buoi_sang_vtv1_2026.webp";
        return (
          <div className="relative h-[188px] rounded-[11px] overflow-hidden flex flex-col justify-between">
            <img
              src={imgSrc}
              alt={currentPhoto?.title || "Gallery photo"}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/75 pointer-events-none" />
            <div className="relative z-10 p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white text-[12px] font-medium">
                <Fluent3DGalleryIcon className="w-4 h-4" />
                <span>Photos</span>
              </div>
              {galleryPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPhotoIdx((i) => (i + 1) % galleryPhotos.length)}
                  className="px-2 py-0.5 rounded-[5px] bg-white/20 hover:bg-white/30 text-white text-[11px] border-none cursor-pointer"
                >
                  Next
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onLaunchRoute("/gallery")}
              className="relative z-10 p-3 text-left border-none bg-transparent cursor-pointer w-full"
            >
              <div className="text-[12.5px] font-medium text-white truncate">
                {currentPhoto?.title || "Photos Gallery Highlights"}
              </div>
              <div className="text-[11px] text-sky-300 underline">Open Photos Gallery</div>
            </button>
          </div>
        );
      }

      case "markets":
        return (
          <div className="p-3.5 space-y-2.5">
            <div className="text-[12.5px] font-semibold">Markets</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "S&P 500", change: "+0.07%", price: "7,329.04", up: true },
                { name: "DOW", change: "-1.11%", price: "50,198.17", up: false },
                { name: "NASDAQ", change: "-0.18%", price: "24,385.99", up: false },
              ].map((m) => (
                <div key={m.name} className="space-y-0.5">
                  <div className="text-[11px] font-semibold truncate">{m.name}</div>
                  <div
                    className="text-[11px] font-semibold tabular-nums"
                    style={{
                      color: m.up
                        ? isLightMode
                          ? "#15803d"
                          : "#4ade80"
                        : isLightMode
                          ? "#c42b1c"
                          : "#fb7185",
                    }}
                  >
                    {m.change}
                  </div>
                  <div className="text-[11px] tabular-nums">{m.price}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "watchlist":
        return (
          <div className="p-3.5 space-y-2">
            <div className="text-[12.5px] font-semibold">Watchlist</div>
            <div className="space-y-1.5 text-[12px] tabular-nums">
              {[
                { symbol: "MSFT", price: "428.15", pct: "+1.24%" },
                { symbol: "NVDA", price: "142.80", pct: "+2.38%" },
                { symbol: "VN30", price: "1,346.20", pct: "+0.61%" },
              ].map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="font-semibold">{s.symbol}</span>
                  <div className="flex items-center gap-2.5">
                    <span>{s.price}</span>
                    <span style={{ color: isLightMode ? "#15803d" : "#4ade80" }}>{s.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "countdown": {
        const active =
          COUNTDOWN_MILESTONES[countdownIdx % COUNTDOWN_MILESTONES.length] ??
          COUNTDOWN_MILESTONES[0]!;
        return (
          <div className="p-3.5 flex flex-col items-center gap-2">
            <div className="w-full flex items-center gap-1.5 text-[12.5px] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#0078d4] dark:text-[#4cc2ff]" />
              <span>Countdown</span>
            </div>
            <CountdownRing daysLeft={active.days} size={118} />
            <div className="flex flex-wrap justify-center gap-1">
              {COUNTDOWN_MILESTONES.map((m, idx) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setCountdownIdx(idx)}
                  className={`px-2 py-0.5 rounded-full text-[10px] border cursor-pointer ${
                    countdownIdx === idx
                      ? "bg-black/10 dark:bg-white/15 border-black/20 dark:border-white/25 font-semibold"
                      : "bg-black/[0.03] dark:bg-white/[0.05] border-black/10 dark:border-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        );
      }

      case "timer":
        return (
          <div className="p-3.5 text-center space-y-2.5">
            <div className="text-[12.5px] font-semibold text-left">Timer</div>
            <div className="text-[32px] font-light tabular-nums leading-none">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="fluent-btn-primary h-7 px-3 rounded-[6px] bg-[#0078d4] text-white text-[12px] font-medium flex items-center gap-1 cursor-pointer border-none"
              >
                {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{timerRunning ? "Pause" : "Start"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(300);
                }}
                className="h-7 px-2.5 rounded-[6px] bg-black/[0.07] dark:bg-white/[0.1] text-[12px] flex items-center gap-1 cursor-pointer border-none"
              >
                <RotateCcw className="w-3 h-3" />
                <span>5m</span>
              </button>
            </div>
          </div>
        );

      case "focus-session":
        return (
          <div className="p-3.5 text-center space-y-2">
            <div className="text-[12.5px] font-semibold text-left">Focus session</div>
            <div className="text-[30px] font-light tabular-nums leading-none">
              {formatTimer(focusSeconds)}
            </div>
            <div className="text-[11px]" style={mutedStyle}>
              Deep work · 25 min block
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setFocusRunning((r) => !r)}
                className="fluent-btn-primary h-7 px-3 rounded-[6px] bg-[#0078d4] text-white text-[12px] font-medium cursor-pointer border-none"
              >
                {focusRunning ? "Pause focus" : "Start focus"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocusRunning(false);
                  setFocusSeconds(1500);
                }}
                className="h-7 px-2.5 rounded-[6px] bg-black/[0.07] dark:bg-white/[0.1] text-[12px] cursor-pointer border-none"
              >
                Reset
              </button>
            </div>
          </div>
        );

      case "tips": {
        const tip = TIPS_LIST[tipIndex % TIPS_LIST.length] ?? TIPS_LIST[0]!;
        return (
          <div className="p-3.5 space-y-2">
            <div className="text-[12.5px] font-semibold">Tips</div>
            <div className="text-[12.5px] font-semibold leading-snug">{tip.title}</div>
            <p className="text-[11.5px] leading-relaxed" style={mutedStyle}>
              {tip.body}
            </p>
            <button
              type="button"
              onClick={() => setTipIndex((i) => (i + 1) % TIPS_LIST.length)}
              className="text-[11.5px] font-medium hover:underline border-none bg-transparent cursor-pointer p-0"
              style={linkStyle}
            >
              Next tip
            </button>
          </div>
        );
      }

      case "games":
        return (
          <div className="p-3.5 space-y-2.5">
            <div className="text-[12.5px] font-semibold">Quick Apps & Games</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Craftmine",
                  route: "/craftmine",
                  icon: <Fluent3DCraftmineIcon className="w-7 h-7" />,
                },
                {
                  label: "Ink Canvas",
                  route: "/draws",
                  icon: <Fluent3DDrawsIcon className="w-7 h-7" />,
                },
                {
                  label: "Photopea",
                  route: "/photopea",
                  icon: <Fluent3DPhotopeaIcon className="w-7 h-7" />,
                },
                {
                  label: "HTML",
                  route: "/html-writer",
                  icon: <Fluent3DHtmlWriterIcon className="w-7 h-7" />,
                },
                {
                  label: "Notes",
                  route: "/notes",
                  icon: <Fluent3DNotesIcon className="w-7 h-7" />,
                },
                {
                  label: "Photos Gallery",
                  route: "/gallery",
                  icon: <Fluent3DGalleryIcon className="w-7 h-7" />,
                },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => onLaunchRoute(t.route)}
                  className="p-2 rounded-[8px] bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] flex flex-col items-center gap-1 cursor-pointer border-none"
                >
                  {t.icon}
                  <span className="text-[10px] truncate w-full text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "daily-discovery":
        return (
          <div className="p-3.5 space-y-2">
            <div className="text-[12.5px] font-semibold">Daily Discovery</div>
            <p className="text-[12px] font-medium leading-snug">
              Which channel broadcasts Thời sự 19h daily?
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {["VTV1", "VTV3", "HTV7"].map((opt, idx) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setQuizChoice(idx)}
                  className={`h-7 rounded-[5px] text-[11px] font-medium border cursor-pointer ${
                    quizChoice === idx
                      ? idx === 0
                        ? "bg-emerald-500/20 border-emerald-500"
                        : "bg-rose-500/20 border-rose-500"
                      : "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case "daily-wonder":
        return (
          <div className="p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold">
              <Tv className="w-3.5 h-3.5 text-indigo-500" />
              <span>Daily Wonder</span>
            </div>
            <button
              type="button"
              onClick={() => onLaunchRoute("/live-tv")}
              className="flex items-center gap-2.5 text-left border-none bg-transparent cursor-pointer w-full p-0"
            >
              <img
                src="/banners/vietnam_today.jpg"
                alt="Daily Wonder"
                className="w-16 h-11 rounded-[6px] object-cover shrink-0"
              />
              <span className="text-[12px] font-medium leading-snug line-clamp-2 hover:underline">
                Vietnam scenic broadcasts & live channels
              </span>
            </button>
          </div>
        );

      case "todays-moment":
        return (
          <div className="p-3.5 space-y-1.5">
            <div className="text-[12.5px] font-semibold">Today&apos;s Moment</div>
            <p className="text-[12px] leading-relaxed italic">
              &ldquo;Simplicity is about subtracting the obvious and adding the meaningful.&rdquo;
            </p>
            <div className="text-[10.5px]" style={mutedStyle}>
              Build 26335 · Sodium Design Note
            </div>
          </div>
        );

      case "clock": {
        const mode = widgetsPrefs.clockMode === "digital" ? "digital" : "analog";
        return (
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#0078d4] dark:text-[#4cc2ff] fluent-3d-icon" />
                <span>Clock</span>
              </div>
              <div className="flex items-center p-0.5 rounded-[6px] bg-black/[0.06] dark:bg-white/[0.08]">
                {(["analog", "digital"] as const).map((opt) => {
                  const active = mode === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const nextPrefs: WidgetsPreferences = { ...widgetsPrefs, clockMode: opt };
                        setWidgetsPrefs(nextPrefs);
                        saveWidgetsPrefs(nextPrefs);
                      }}
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium transition-colors cursor-pointer border-none whitespace-nowrap ${
                        active
                          ? "bg-white dark:bg-white/[0.18] shadow-xs font-semibold"
                          : "bg-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {opt === "analog" ? "Analog" : "Digital"}
                    </button>
                  );
                })}
              </div>
            </div>
            <ClockWidgetFace mode={mode} now={clockNow} isLightMode={isLightMode} compact />
          </div>
        );
      }

      default: {
        const meta = WIDGET_CATALOG.find((c) => c.id === item.widgetId);
        return (
          <div className="p-3.5 space-y-1.5">
            <div className="text-[12.5px] font-semibold">{meta?.title || item.widgetId}</div>
            <p className="text-[11.5px]" style={mutedStyle}>
              {meta?.description || "Pinned Sodium widget"}
            </p>
          </div>
        );
      }
    }
  };

  return (
    <>
      <div
        ref={layerRef}
        data-desktop-widgets-layer="true"
        className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
      >
        {widgets.map((w) => {
          const cat = WIDGET_CATALOG.find((c) => c.id === w.widgetId);
          return (
            <div
              key={w.id}
              data-desktop-widget="true"
              style={{ left: w.x, top: w.y, width: 272 }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                const t = e.target as HTMLElement | null;
                if (t?.closest("button, a, input, textarea, select")) return;
                e.stopPropagation();
                onClearMenus?.();
                setContextMenu(null);
                setDraggingId(w.id);
                dragRef.current = {
                  id: w.id,
                  startClientX: e.clientX,
                  startClientY: e.clientY,
                  origX: w.x,
                  origY: w.y,
                  liveX: w.x,
                  liveY: w.y,
                };
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearMenus?.();
                setContextMenu({ x: e.clientX, y: e.clientY, item: w });
              }}
              className={`pointer-events-auto absolute ${surfaceClass} ${
                draggingId === w.id
                  ? "cursor-grabbing ring-2 ring-[#4cc2ff]/70 scale-[1.01]"
                  : "cursor-grab"
              } transition-shadow`}
              title={`${cat?.title || w.widgetId} — Drag to move or right-click to unpin`}
            >
              {renderWidgetBody(w)}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <WindowsContextMenu
          key={`desk-widget-ctx-${contextMenu.item.id}-${contextMenu.x}`}
          x={contextMenu.x}
          y={contextMenu.y}
          ariaLabel="Desktop widget options"
          onClose={() => setContextMenu(null)}
          items={[
            {
              id: "desk-widget-open-board",
              label: "Open Widgets board",
              icon: <LayoutGrid className="w-4 h-4" />,
              onSelect: () => {
                window.dispatchEvent(new CustomEvent("sodium:open-widgets-board"));
              },
            },
            {
              id: "desk-widget-unpin",
              label: "Unpin from desktop",
              icon: <PinOff className="w-4 h-4" />,
              danger: true,
              onSelect: () => {
                const next = unpinDesktopWidget(contextMenu.item.id);
                setWidgets(next);
                showAppToast("Unpinned widget from Desktop", { appName: "Desktop" });
              },
            },
          ]}
        />
      )}
    </>
  );
};
