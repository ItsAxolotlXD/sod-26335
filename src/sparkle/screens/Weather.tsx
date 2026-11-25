import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Droplets,
  ExternalLink,
  Info,
  LocateFixed,
  MapPin,
  Menu,
  Pin,
  RotateCw,
  Search,
  SlidersHorizontal,
  Sunrise,
  Sunset,
  X,
} from "lucide-react";
import {
  DEFAULT_WEATHER_PLACES,
  DEFAULT_WEATHER_PREFS,
  formatTemperature,
  formatWindSpeed,
  getUvSeverityLabel,
  getWindCompass,
  loadWeatherAppPrefs,
  saveWeatherAppPrefs,
  searchWeatherPlaces,
  useRealtimeWeather,
  type WeatherAppPreferences,
  type WeatherPlace,
  type WeatherRefreshMs,
} from "../hooks/useRealtimeWeather";
import { loadWidgetsPrefs } from "../components/WindowsWidgetsBoard";
import { Fluent3DWeatherIcon } from "../components/Fluent3DIcons";
import { FluentSettingsIcon } from "../components/FluentIcons";
import { showAppToast } from "../utils/toast";

interface WeatherProps {
  navigate?: (path: string, state?: unknown) => void;
}

const FluentWeatherGraphic: React.FC<{
  code: number;
  isDay?: boolean;
  className?: string;
}> = ({ code, isDay = true, className = "w-12 h-12" }) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const isThunder = code >= 95;
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  const isFog = code === 45 || code === 48;
  const isClear = code === 0;
  const isMostlyClear = code === 1 || code === 2;
  const showSunOrMoon = isClear || isMostlyClear;
  const showCloud = !isClear;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient
          id={`sun-${uid}`}
          x1="12"
          y1="8"
          x2="40"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="55%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient
          id={`moon-${uid}`}
          x1="16"
          y1="10"
          x2="42"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
        <linearGradient
          id={`cloud-main-${uid}`}
          x1="16"
          y1="22"
          x2="48"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#E6EEF8" />
          <stop offset="100%" stopColor="#C3D4E8" />
        </linearGradient>
        <linearGradient
          id={`cloud-dark-${uid}`}
          x1="16"
          y1="20"
          x2="48"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.22" />
        </filter>
      </defs>

      {showSunOrMoon &&
        (isDay ? (
          <circle
            cx={isClear ? 32 : 25}
            cy={isClear ? 32 : 24}
            r={isClear ? 16 : 12.5}
            fill={`url(#sun-${uid})`}
          />
        ) : (
          <path
            d={
              isClear
                ? "M37 15C28.7 15 22 21.7 22 30C22 38.3 28.7 45 37 45C40.4 45 43.5 43.9 46 42C39.8 41.3 35 36.1 35 29.7C35 24 38.9 19.2 44.2 17.8C42 16 39.6 15 37 15Z"
                : "M27 12C21.5 12 17 16.5 17 22C17 27.5 21.5 32 27 32C29.4 32 31.6 31.1 33.3 29.7C29 29.2 25.7 25.6 25.7 21.2C25.7 17.3 28.4 14 32.1 13.1C30.6 12.4 28.9 12 27 12Z"
            }
            fill={`url(#moon-${uid})`}
          />
        ))}

      {showCloud && (
        <g filter={`url(#glow-${uid})`}>
          <path
            d="M19 47H46.5C51.7 47 56 42.7 56 37.5C56 32.6 52.3 28.6 47.6 28.1C45.8 22.3 40.4 18 34 18C26.7 18 20.6 23.4 19.7 30.5C15.3 31.2 12 35 12 39.6C12 43.7 15.1 47 19 47Z"
            fill={isThunder || code === 3 ? `url(#cloud-dark-${uid})` : `url(#cloud-main-${uid})`}
          />
        </g>
      )}

      {isFog && (
        <g stroke="#E2E8F0" strokeWidth="3.2" strokeLinecap="round" opacity="0.92">
          <line x1="16" y1="51" x2="48" y2="51" />
          <line x1="21" y1="57" x2="43" y2="57" />
        </g>
      )}

      {(isRain || isThunder) && (
        <g stroke="#60CDFF" strokeWidth="3.2" strokeLinecap="round">
          <line x1="24" y1="51" x2="21.5" y2="57.5" />
          <line x1="34" y1="51" x2="31.5" y2="57.5" />
          {!isThunder && <line x1="44" y1="51" x2="41.5" y2="57.5" />}
        </g>
      )}

      {isThunder && (
        <path d="M36 45L31 53.5H36.5L34.5 60.5L43 50.5H37.2L39.5 45H36Z" fill="#FACC15" />
      )}

      {isSnow && (
        <g fill="#F8FAFC">
          <circle cx="24" cy="54" r="2.2" />
          <circle cx="34" cy="56" r="2.2" />
          <circle cx="44" cy="54" r="2.2" />
        </g>
      )}
    </svg>
  );
};

// WinUI 3 Toggle Switch matching File Explorer Settings
const WeatherToggle: React.FC<{ checked: boolean; onChange: () => void; ariaLabel: string }> = ({
  checked,
  onChange,
  ariaLabel,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex items-center w-[42px] h-[22px] rounded-full transition-colors cursor-pointer shrink-0 border ${
      checked ? "bg-[#4CC2FF] border-transparent" : "bg-white/[0.12] border-white/40"
    }`}
  >
    <span
      className={`inline-block w-[14px] h-[14px] rounded-full transition-transform ${
        checked ? "translate-x-[23px] bg-[#001829]" : "translate-x-[3px] bg-white/80"
      }`}
    />
  </button>
);

function getWeatherBackdropStyle(code: number, isDay: boolean): React.CSSProperties {
  if (!isDay) {
    if (code >= 95) {
      return {
        backgroundImage: "linear-gradient(155deg, #0b1324 0%, #16223b 48%, #223252 100%)",
      };
    }
    return {
      backgroundImage: "linear-gradient(155deg, #0a1833 0%, #122852 48%, #1e427c 100%)",
    };
  }
  if (code >= 95) {
    return {
      backgroundImage: "linear-gradient(155deg, #1b2840 0%, #2a3e5e 52%, #3a5478 100%)",
    };
  }
  if ((code >= 51 && code <= 86) || code === 45 || code === 48) {
    return {
      backgroundImage: "linear-gradient(155deg, #18426e 0%, #23598f 52%, #3474ad 100%)",
    };
  }
  if (code === 3) {
    return {
      backgroundImage: "linear-gradient(155deg, #15538e 0%, #226eb2 52%, #4a90c8 100%)",
    };
  }
  return {
    backgroundImage: "linear-gradient(155deg, #005eb8 0%, #0b7adb 52%, #36a1ea 100%)",
  };
}

function formatUpdatedTimestamp(epochMs: number, timeZone: string, tzAbbr: string): string {
  const date = new Date(epochMs);
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  });
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  });
  return `Updated on ${datePart} ${timePart}${tzAbbr ? ` (${tzAbbr})` : ""}`;
}

export const Weather: React.FC<WeatherProps> = ({ navigate }) => {
  const [prefs, setPrefs] = useState<WeatherAppPreferences>(() =>
    loadWeatherAppPrefs(loadWidgetsPrefs().selectedCityId),
  );
  const [activePlace, setActivePlace] = useState<WeatherPlace>(() => {
    const initial = loadWeatherAppPrefs(loadWidgetsPrefs().selectedCityId);
    return (
      initial.savedPlaces.find((p) => p.id === initial.selectedPlaceId) ??
      initial.savedPlaces[0] ??
      DEFAULT_WEATHER_PLACES[0]!
    );
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WeatherPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Hamburger NavigationView states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [moreSettingsExpanded, setMoreSettingsExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);

  const [isLocating, setIsLocating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.round(prefs.refreshMs / 1000));

  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const hourlyScrollerRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading, isValidating, mutate } = useRealtimeWeather(
    activePlace,
    prefs.refreshMs,
  );

  // Sync persisted preferences
  const updatePrefs = (updater: (prev: WeatherAppPreferences) => WeatherAppPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      saveWeatherAppPrefs(next);
      return next;
    });
  };

  // Real-time refresh countdown ticker synced with last fetch timestamp
  useEffect(() => {
    const intervalSec = Math.round(prefs.refreshMs / 1000);
    const computeRemaining = () => {
      if (!data?.fetchedAt) return intervalSec;
      const elapsedSec = Math.floor((Date.now() - data.fetchedAt) / 1000);
      const rem = intervalSec - (elapsedSec % intervalSec);
      return rem === 0 ? intervalSec : rem;
    };
    setSecondsLeft(computeRemaining());
    const timer = window.setInterval(() => {
      setSecondsLeft(computeRemaining());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [data?.fetchedAt, prefs.refreshMs]);

  // Debounced Open-Meteo global geocoding search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchWeatherPlaces(trimmed, controller.signal);
        setSearchResults(results);
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const isPlaceSaved = useMemo(
    () => prefs.savedPlaces.some((p) => p.id === activePlace.id),
    [prefs.savedPlaces, activePlace.id],
  );

  const handleSelectPlace = (place: WeatherPlace) => {
    setActivePlace(place);
    setSelectedDayIndex(0);
    setIsSettingsView(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsMobileDrawerOpen(false);
    if (prefs.savedPlaces.some((p) => p.id === place.id)) {
      updatePrefs((prev) => ({ ...prev, selectedPlaceId: place.id }));
    }
  };

  const handleTogglePinPlace = (place: WeatherPlace) => {
    updatePrefs((prev) => {
      const exists = prev.savedPlaces.some((p) => p.id === place.id);
      if (exists) {
        if (prev.savedPlaces.length <= 1) {
          showAppToast("Keep at least one pinned location.");
          return prev;
        }
        const filtered = prev.savedPlaces.filter((p) => p.id !== place.id);
        return {
          ...prev,
          savedPlaces: filtered,
          selectedPlaceId:
            prev.selectedPlaceId === place.id ? (filtered[0]?.id ?? "hanoi") : prev.selectedPlaceId,
        };
      }
      return {
        ...prev,
        selectedPlaceId: place.id,
        savedPlaces: [...prev.savedPlaces, place],
      };
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAppToast("Geolocation is not supported in this browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000) / 1000;
        const lon = Math.round(pos.coords.longitude * 1000) / 1000;
        const gpsPlace: WeatherPlace = {
          id: `gps-${lat}-${lon}`,
          name: "Current Location",
          subtitle: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setActivePlace(gpsPlace);
        setSelectedDayIndex(0);
        setIsSettingsView(false);
        setIsMobileDrawerOpen(false);
        setIsLocating(false);
        showAppToast("Switched to current GPS coordinates.");
      },
      () => {
        setIsLocating(false);
        showAppToast("Could not access device location.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const selectedDay = data?.daily[selectedDayIndex] ?? data?.daily[0];

  const displayedHourly = useMemo(() => {
    if (!data) return [];
    if (selectedDayIndex === 0 || !selectedDay) {
      const nowIdx = Math.max(
        0,
        data.hourly.findIndex((h) => h.hourLabel === "Now"),
      );
      return data.hourly.slice(nowIdx, nowIdx + 24);
    }
    return data.hourly.filter((h) => h.dayDateKey === selectedDay.dateKey);
  }, [data, selectedDayIndex, selectedDay]);

  const scrollHourly = (dir: -1 | 1) => {
    const el = hourlyScrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const backdropStyle = data
    ? getWeatherBackdropStyle(data.current.weatherCode, data.current.isDay)
    : getWeatherBackdropStyle(2, true);

  const unitSuffix = `°${prefs.tempUnit}`;
  const isMyLocationActive = !isSettingsView && activePlace.id.startsWith("gps-");

  const renderHamburgerBody = (
    collapsed: boolean,
    inputRef?: React.RefObject<HTMLInputElement | null>,
  ) => (
    <>
      {/* 1. Search Box */}
      <div className={collapsed ? "px-1.5 pb-1.5" : "px-2.5 pb-2"}>
        {collapsed ? (
          <button
            type="button"
            title="Search a place..."
            aria-label="Search a place"
            onClick={() => {
              setIsSidebarCollapsed(false);
              window.setTimeout(() => desktopSearchInputRef.current?.focus(), 60);
            }}
            className="w-full h-[36px] rounded-[6px] flex items-center justify-center text-white/85 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer border-none bg-white/[0.08]"
          >
            <Search className="w-4 h-4 shrink-0" />
          </button>
        ) : (
          <div className="relative">
            <div className="relative flex items-center h-9 rounded-[6px] bg-white/14 hover:bg-white/20 focus-within:bg-[#0b1a30]/85 border border-white/18 border-b-white/40 focus-within:border-b-[#60cdff] transition-colors">
              <Search className="w-3.5 h-3.5 text-white/80 ml-2.5 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a place..."
                aria-label="Search a place"
                className="w-full h-full px-2 bg-transparent text-[12.5px] text-white placeholder:text-white/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="w-6 h-6 mr-1 rounded-[4px] flex items-center justify-center text-white/75 hover:text-white hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchQuery.trim().length >= 2 && (
              <div className="mt-1.5 rounded-[8px] bg-[#102038]/95 backdrop-blur-2xl border border-white/18 shadow-xl overflow-hidden max-h-[240px] overflow-y-auto p-1">
                {isSearching ? (
                  <div className="px-2.5 py-3 text-[12px] text-white/75 text-center">
                    Searching places...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-2.5 py-3 text-[12px] text-white/75 text-center">
                    No matching places found
                  </div>
                ) : (
                  searchResults.map((place) => {
                    const saved = prefs.savedPlaces.some((p) => p.id === place.id);
                    return (
                      <div
                        key={place.id}
                        className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-[6px] hover:bg-white/12 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="flex-1 text-left min-w-0 cursor-pointer"
                        >
                          <div className="text-[12.5px] font-semibold text-white truncate">
                            {place.name}
                          </div>
                          <div className="text-[11px] text-white/70 truncate">{place.subtitle}</div>
                        </button>
                        <button
                          type="button"
                          aria-label={saved ? `Unpin ${place.name}` : `Pin ${place.name}`}
                          onClick={() => handleTogglePinPlace(place)}
                          className={`w-6 h-6 rounded-[5px] flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                            saved
                              ? "bg-[#60cdff]/25 text-[#60cdff]"
                              : "text-white/70 hover:text-white hover:bg-white/15"
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. My location & Saved Cities List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2 space-y-0.5">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="My location"
          aria-label="My location"
          className={`relative w-full h-[32px] flex items-center ${
            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
          } rounded-[6px] text-[13px] text-left transition-colors cursor-pointer border-none disabled:opacity-60 ${
            isMyLocationActive
              ? "bg-white/[0.16] text-white font-semibold"
              : "text-white/85 hover:bg-white/[0.1] hover:text-white font-normal"
          }`}
        >
          {isMyLocationActive && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] bg-[#4cc2ff] rounded-full pointer-events-none"
            />
          )}
          <LocateFixed className={`w-4 h-4 shrink-0 ${isLocating ? "animate-spin" : ""}`} />
          {!collapsed && <span className="truncate">My location</span>}
        </button>

        <div role="separator" className="my-1.5 mx-1.5 h-[1px] bg-white/15" />

        {prefs.savedPlaces.map((place) => {
          const isActive = !isSettingsView && place.id === activePlace.id;
          return (
            <div key={place.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => handleSelectPlace(place)}
                title={place.name}
                aria-label={place.name}
                aria-current={isActive ? "page" : undefined}
                className={`relative w-full h-[32px] flex items-center ${
                  collapsed ? "justify-center px-0" : "gap-2.5 pl-3 pr-7"
                } rounded-[6px] text-[13px] text-left transition-colors cursor-pointer border-none ${
                  isActive
                    ? "bg-white/[0.16] text-white font-semibold"
                    : "text-white/85 hover:bg-white/[0.1] hover:text-white font-normal"
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] bg-[#4cc2ff] rounded-full pointer-events-none"
                  />
                )}
                <MapPin className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{place.name}</span>}
              </button>
              {!collapsed && prefs.savedPlaces.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove ${place.name}`}
                  title={`Unpin ${place.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePinPlace(place);
                  }}
                  className="absolute right-1.5 w-5 h-5 rounded-[4px] flex items-center justify-center opacity-0 group-hover:opacity-100 text-white/65 hover:text-white hover:bg-white/15 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Settings anchored at the bottom of Hamburger Menu */}
      <div className="p-2 border-t border-white/15 shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsSettingsView(true);
            setIsMobileDrawerOpen(false);
          }}
          title="Settings"
          aria-label="Settings"
          aria-current={isSettingsView ? "page" : undefined}
          className={`relative w-full h-[36px] flex items-center ${
            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
          } rounded-[6px] text-[13px] text-left transition-colors cursor-pointer border-none ${
            isSettingsView
              ? "bg-white/[0.16] text-white font-semibold"
              : "text-white/85 hover:bg-white/[0.1] hover:text-white font-normal"
          }`}
        >
          {isSettingsView && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#4cc2ff] rounded-full pointer-events-none"
            />
          )}
          <FluentSettingsIcon className="w-[18px] h-[18px] shrink-0 settings-spin-icon text-white" />
          {!collapsed && <span className="truncate">Settings</span>}
        </button>
      </div>
    </>
  );

  return (
    <div
      id="winui-weather-app"
      style={{
        ...backdropStyle,
        fontFamily:
          "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', 'Be Vietnam Pro', system-ui, sans-serif",
      }}
      className="relative w-full h-full min-h-0 flex text-white overflow-hidden select-none"
    >
      {/* Subtle Fluent atmospheric background wisps */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-45"
      >
        <div className="absolute -top-24 right-[-10%] w-[540px] h-[360px] rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[8%] w-[520px] h-[280px] rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      {/* Desktop WinUI 3 Hamburger Navigation Pane */}
      <aside
        aria-label="Weather navigation"
        className={`hidden md:flex relative z-20 h-full flex-col bg-[#0a1628]/45 backdrop-blur-2xl border-r border-white/15 shrink-0 transition-[width] duration-150 ${
          isSidebarCollapsed ? "w-[52px]" : "w-[264px]"
        }`}
      >
        <div
          className={`pt-2.5 pb-2 flex items-center ${
            isSidebarCollapsed ? "justify-center px-1" : "gap-1.5 px-2.5"
          } shrink-0`}
        >
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((v) => !v)}
            aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white hover:bg-white/12 transition-colors cursor-pointer border-none bg-transparent shrink-0"
          >
            <Menu className="w-4 h-4 stroke-[1.75]" />
          </button>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0 px-1">
              <Fluent3DWeatherIcon className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-semibold truncate">Weather</span>
            </div>
          )}
        </div>
        {renderHamburgerBody(isSidebarCollapsed, desktopSearchInputRef)}
      </aside>

      {/* Mobile / Compact Slide-in Hamburger Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="md:hidden absolute inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            />
            <motion.aside
              aria-label="Weather navigation"
              initial={{ x: -272 }}
              animate={{ x: 0 }}
              exit={{ x: -272 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[268px] max-w-[85%] h-full flex flex-col bg-[#0e1c33]/95 backdrop-blur-2xl border-r border-white/15 shadow-2xl"
            >
              <div className="px-2.5 pt-2.5 pb-2 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 px-1">
                  <Fluent3DWeatherIcon className="w-4 h-4 shrink-0" />
                  <span className="text-[13px] font-semibold truncate">Weather</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white hover:bg-white/12 transition-colors cursor-pointer border-none bg-transparent shrink-0"
                >
                  <X className="w-4 h-4 stroke-[1.75]" />
                </button>
              </div>
              {renderHamburgerBody(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area (Forecast View or File-Explorer-Style Settings Page) */}
      <div className="relative z-10 flex-1 min-w-0 min-h-0 overflow-y-auto px-4 sm:px-7 py-4 sm:py-5">
        {isSettingsView ? (
          /* WEATHER SETTINGS PAGE (Layout matching File Explorer Settings) */
          <div className="max-w-[760px] mx-auto space-y-5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                aria-label="Open navigation"
                className="md:hidden w-8 h-8 rounded-[6px] bg-white/14 hover:bg-white/22 border border-white/18 flex items-center justify-center cursor-pointer shrink-0"
              >
                <Menu className="w-4 h-4" />
              </button>
              <h2 className="text-[18px] font-semibold tracking-tight">Settings</h2>
            </div>

            <div className="space-y-2.5">
              {/* Temperature Unit Card */}
              <div className="rounded-[8px] border border-white/[0.16] bg-white/[0.10] backdrop-blur-md px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Fluent3DWeatherIcon className="w-6 h-6 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium">Temperature unit</div>
                    <div className="text-[11.5px] text-white/75">
                      Choose Celsius (°C) or Fahrenheit (°F) across all weather views
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(
                    [
                      ["C", "Celsius (°C)"],
                      ["F", "Fahrenheit (°F)"],
                    ] as const
                  ).map(([unitKey, label]) => {
                    const active = prefs.tempUnit === unitKey;
                    return (
                      <button
                        key={unitKey}
                        type="button"
                        onClick={() => updatePrefs((p) => ({ ...p, tempUnit: unitKey }))}
                        className={`h-8 px-3.5 rounded-[6px] border text-[12.5px] font-medium cursor-pointer transition-colors ${
                          active
                            ? "bg-[#4CC2FF] text-[#001829] border-transparent font-semibold"
                            : "bg-white/[0.10] hover:bg-white/[0.18] border-white/20 text-white"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Auto-Refresh Card */}
              <div className="rounded-[8px] border border-white/[0.16] bg-white/[0.10] backdrop-blur-md px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[13.5px] font-medium">Real-time sync interval</div>
                  <div className="text-[11.5px] text-white/75">
                    Choose how frequently live weather conditions update automatically
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {([30000, 60000, 120000] as WeatherRefreshMs[]).map((ms) => {
                    const active = prefs.refreshMs === ms;
                    return (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => updatePrefs((p) => ({ ...p, refreshMs: ms }))}
                        className={`h-8 px-3.5 rounded-[6px] border text-[12.5px] font-medium tabular-nums cursor-pointer transition-colors ${
                          active
                            ? "bg-[#4CC2FF] text-[#001829] border-transparent font-semibold"
                            : "bg-white/[0.10] hover:bg-white/[0.18] border-white/20 text-white"
                        }`}
                      >
                        {ms === 30000 ? "30s" : ms === 60000 ? "1m" : "2m"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* More settings */}
              <div className="pt-2 space-y-2">
                <h3 className="text-[13px] font-semibold">More settings</h3>

                <div className="rounded-[8px] border border-white/[0.16] bg-white/[0.10] backdrop-blur-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMoreSettingsExpanded((v) => !v)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.06] cursor-pointer border-none bg-transparent text-left text-white"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <SlidersHorizontal className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="text-[13.5px] font-medium">Units & display options</div>
                        <div className="text-[11.5px] text-white/75">
                          Manage metric wind & visibility units and hourly forecast visibility
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform shrink-0 ${
                        moreSettingsExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {moreSettingsExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/[0.12]"
                      >
                        <div className="px-11 py-3 space-y-3 text-[12.5px]">
                          <div className="flex items-center justify-between gap-4">
                            <span>Use metric wind & visibility (km/h · km)</span>
                            <WeatherToggle
                              checked={prefs.windUnit === "kmh"}
                              onChange={() =>
                                updatePrefs((p) => ({
                                  ...p,
                                  windUnit: p.windUnit === "kmh" ? "mph" : "kmh",
                                }))
                              }
                              ariaLabel="Use metric wind and visibility units"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span>Show Hourly forecast panel</span>
                            <WeatherToggle
                              checked={prefs.showHourlyPanel}
                              onChange={() =>
                                updatePrefs((p) => ({
                                  ...p,
                                  showHourlyPanel: !p.showHourlyPanel,
                                }))
                              }
                              ariaLabel="Show Hourly forecast panel"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pinned Locations Card */}
                <div className="rounded-[8px] border border-white/[0.16] bg-white/[0.10] backdrop-blur-md px-4 py-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13.5px] font-medium">Pinned locations</div>
                      <div className="text-[11.5px] text-white/75">
                        Manage saved cities shown in the Weather hamburger menu
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {prefs.savedPlaces.map((place) => (
                      <div
                        key={place.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white/[0.12] border border-white/15 text-[12px]"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="font-medium hover:underline cursor-pointer"
                        >
                          {place.name}
                        </button>
                        {prefs.savedPlaces.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleTogglePinPlace(place)}
                            aria-label={`Remove ${place.name}`}
                            className="text-white/70 hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="pt-2 space-y-2">
                <h3 className="text-[13px] font-semibold">About</h3>

                <div className="rounded-[8px] border border-white/[0.16] bg-white/[0.10] backdrop-blur-md overflow-hidden divide-y divide-white/[0.12]">
                  <button
                    type="button"
                    onClick={() => setAboutExpanded((v) => !v)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.06] cursor-pointer border-none bg-transparent text-left text-white"
                  >
                    <div className="flex items-center gap-3.5">
                      <Info className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="text-[13.5px] font-medium">Weather</div>
                        <div className="text-[11.5px] tabular-nums text-white/75">
                          Version: 22631.26335.0 · Build 26335 · Live Open-Meteo Feed
                        </div>
                      </div>
                    </div>
                    {aboutExpanded ? (
                      <ChevronUp className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    )}
                  </button>

                  {aboutExpanded && (
                    <>
                      {[
                        {
                          label: "Open PC Settings",
                          action: () => navigate?.("/pc-settings"),
                        },
                        {
                          label: "Open Sodium Settings",
                          action: () => navigate?.("/settings"),
                        },
                        {
                          label: "Give feedback",
                          action: () => navigate?.("/feedback"),
                        },
                        {
                          label: "Restore default Weather preferences",
                          action: () => {
                            updatePrefs(() => DEFAULT_WEATHER_PREFS);
                            setActivePlace(DEFAULT_WEATHER_PLACES[0]!);
                            showAppToast("Weather settings restored to defaults", {
                              appName: "Weather",
                            });
                          },
                        },
                      ].map((row) => (
                        <button
                          key={row.label}
                          type="button"
                          onClick={row.action}
                          className="w-full px-11 py-3 flex items-center justify-between text-[13px] hover:bg-white/[0.06] cursor-pointer border-none bg-transparent text-left text-white"
                        >
                          <span>{row.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LIVE WEATHER FORECAST VIEW */
          <div className="max-w-[1120px] mx-auto flex flex-col gap-5">
            {error && (
              <div
                role="alert"
                className="rounded-[8px] px-3.5 py-2.5 bg-red-950/55 border border-red-300/35 backdrop-blur-md flex items-center justify-between gap-3 text-[12.5px]"
              >
                <span>Unable to sync live weather right now. Check connection and retry.</span>
                <button
                  type="button"
                  onClick={() => void mutate()}
                  className="px-2.5 py-1 rounded-[5px] bg-white/18 hover:bg-white/28 font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading && !data ? (
              <div className="flex flex-col gap-5 py-2">
                <div className="h-14 w-72 rounded-[8px] bg-white/15" />
                <div className="h-24 w-80 rounded-[10px] bg-white/15" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[68px] rounded-[8px] bg-white/15" />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-[92px] rounded-[8px] bg-white/15" />
                  ))}
                </div>
                <div className="h-[175px] rounded-[12px] bg-white/18" />
              </div>
            ) : data ? (
              <>
                {/* Location Header & Refresh Action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setIsMobileDrawerOpen(true)}
                      aria-label="Open navigation"
                      className="md:hidden w-9 h-9 rounded-[8px] bg-white/14 hover:bg-white/22 border border-white/18 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Menu className="w-4 h-4" />
                    </button>

                    <div className="w-9 h-9 rounded-[8px] bg-white/12 border border-white/18 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-tight leading-tight text-white truncate">
                        {activePlace.name}
                        {activePlace.subtitle ? `, ${activePlace.subtitle}` : ""}
                      </h1>
                      <p className="text-[12px] sm:text-[12.5px] text-white/85 tabular-nums mt-0.5">
                        {formatUpdatedTimestamp(
                          data.fetchedAt,
                          data.timezone,
                          data.timezoneAbbreviation,
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void mutate()}
                      aria-label="Refresh weather now"
                      title="Refresh weather now"
                      className="ml-1 w-9 h-9 rounded-[6px] bg-white/16 hover:bg-white/26 active:scale-95 border border-white/20 flex items-center justify-center cursor-pointer transition-all shrink-0"
                    >
                      <RotateCw className={`w-4 h-4 ${isValidating ? "animate-spin" : ""}`} />
                    </button>
                    {!activePlace.id.startsWith("gps-") && (
                      <button
                        type="button"
                        onClick={() => handleTogglePinPlace(activePlace)}
                        title={isPlaceSaved ? "Unpin location" : "Pin location to menu"}
                        aria-label={isPlaceSaved ? "Unpin location" : "Pin location to menu"}
                        className={`w-9 h-9 rounded-[6px] border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                          isPlaceSaved
                            ? "bg-[#60cdff]/25 border-[#60cdff]/50 text-[#9ce0ff]"
                            : "bg-white/14 hover:bg-white/22 border-white/18 text-white"
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="text-[12px] font-medium px-2.5 py-1 rounded-[6px] bg-white/14 border border-white/18 text-white/95 tabular-nums">
                    {isValidating ? "Syncing live feed…" : `Live · Next sync in ${secondsLeft}s`}
                  </div>
                </div>

                {/* Hero Current Temperature + Condition */}
                <section
                  aria-label="Current conditions"
                  className="flex flex-wrap items-center gap-5 sm:gap-7 py-1"
                >
                  <FluentWeatherGraphic
                    code={data.current.weatherCode}
                    isDay={data.current.isDay}
                    className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md"
                  />
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <div className="text-[52px] sm:text-[62px] font-normal leading-none tracking-tight tabular-nums">
                      {formatTemperature(data.current.tempC, prefs.tempUnit)}
                      {unitSuffix}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[20px] sm:text-[22px] font-semibold leading-snug">
                        {data.current.conditionLabel}
                      </span>
                      <span className="text-[13.5px] text-white/85 tabular-nums">
                        Feels like {formatTemperature(data.current.feelsLikeC, prefs.tempUnit)}
                        {unitSuffix}
                      </span>
                    </div>
                  </div>
                </section>

                {/* 6 Live Atmospheric Metric Tiles */}
                <section
                  aria-label="Atmospheric details"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
                >
                  <div className="rounded-[8px] px-3.5 py-2.5 bg-white/14 border border-white/18 backdrop-blur-md">
                    <div className="text-[12px] text-white/80">Wind</div>
                    <div className="mt-1 text-[14.5px] font-semibold tabular-nums">
                      {formatWindSpeed(data.current.windKmh, prefs.windUnit)}{" "}
                      {getWindCompass(data.current.windDirectionDeg)}
                    </div>
                  </div>

                  <div className="rounded-[8px] px-3.5 py-2.5 bg-white/14 border border-white/18 backdrop-blur-md">
                    <div className="text-[12px] text-white/80">Pressure</div>
                    <div className="mt-1 text-[14.5px] font-semibold tabular-nums">
                      {data.current.pressureHpa.toFixed(1)} hPa
                    </div>
                  </div>

                  <div className="rounded-[8px] px-3.5 py-2.5 bg-white/14 border border-white/18 backdrop-blur-md">
                    <div className="text-[12px] text-white/80">Humidity</div>
                    <div className="mt-1 text-[14.5px] font-semibold tabular-nums">
                      {data.current.humidity}%
                    </div>
                  </div>

                  <div className="rounded-[8px] px-3.5 py-2.5 bg-white/14 border border-white/18 backdrop-blur-md">
                    <div className="text-[12px] text-white/80">Visibility</div>
                    <div className="mt-1 text-[14.5px] font-semibold tabular-nums">
                      {prefs.windUnit === "mph"
                        ? `${(data.current.visibilityKm * 0.621371).toFixed(2)} mi`
                        : `${data.current.visibilityKm.toFixed(2)} km`}
                    </div>
                  </div>

                  <div className="rounded-[8px] px-3.5 py-2.5 bg-white/14 border border-white/18 backdrop-blur-md">
                    <div className="text-[12px] text-white/80">Dew Point</div>
                    <div className="mt-1 text-[14.5px] font-semibold tabular-nums">
                      {formatTemperature(data.current.dewPointC, prefs.tempUnit)}
                      {unitSuffix}
                    </div>
                  </div>

                  <div className="rounded-[8px] px-3.5 py-2.5 bg-white/14 border border-white/18 backdrop-blur-md">
                    <div className="text-[12px] text-white/80">UV Index</div>
                    <div className="mt-1 text-[14.5px] font-semibold tabular-nums">
                      {Math.round(data.current.uvIndex)} ({getUvSeverityLabel(data.current.uvIndex)}
                      )
                    </div>
                  </div>
                </section>

                {/* Daily Forecast Section */}
                <section aria-label="Daily forecast" className="flex flex-col gap-2.5 mt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-[18px] font-semibold tracking-tight">Daily forecast</h2>
                    {selectedDay && (
                      <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/90 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Sunrise className="w-3.5 h-3.5 text-amber-200" />
                          {selectedDay.sunriseTime}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Sunset className="w-3.5 h-3.5 text-orange-200" />
                          {selectedDay.sunsetTime}
                        </span>
                        <span>
                          Max UV: <strong>{Math.round(selectedDay.uvMax)}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {data.daily.map((day, idx) => {
                      const isSelected = idx === selectedDayIndex;
                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`rounded-[8px] p-3 flex flex-col justify-between gap-2.5 text-left transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-[#0e1726]/85 border-white/55 shadow-lg"
                              : "bg-white/15 hover:bg-white/22 border-white/18"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <FluentWeatherGraphic
                              code={day.weatherCode}
                              isDay={true}
                              className="w-9 h-9"
                            />
                            <span className="text-[13px] font-semibold text-white text-right leading-tight">
                              {day.dayLabel}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-1 pt-0.5 tabular-nums">
                            <span className="text-[13.5px] font-semibold text-white">
                              {formatTemperature(day.highC, prefs.tempUnit)}° /{" "}
                              <span className="text-white/80 font-normal">
                                {formatTemperature(day.lowC, prefs.tempUnit)}°
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[12px] text-white/90">
                              <Droplets className="w-3 h-3 text-[#7dd3fc]" />
                              {day.precipProbMax}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Hourly Forecast Frosted Acrylic Section */}
                {prefs.showHourlyPanel && (
                  <section aria-label="Hourly forecast" className="flex flex-col gap-2.5 mt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2.5">
                        <h2 className="text-[18px] font-semibold tracking-tight">Hourly</h2>
                        {selectedDay && !selectedDay.isToday && (
                          <span className="text-[12.5px] text-white/80">
                            {selectedDay.dayLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => scrollHourly(-1)}
                          aria-label="Scroll hourly left"
                          className="w-7 h-7 rounded-[6px] bg-white/16 hover:bg-white/26 border border-white/18 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollHourly(1)}
                          aria-label="Scroll hourly right"
                          className="w-7 h-7 rounded-[6px] bg-white/16 hover:bg-white/26 border border-white/18 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[12px] bg-white/22 backdrop-blur-2xl border border-white/25 shadow-lg overflow-hidden">
                      <div
                        ref={hourlyScrollerRef}
                        className="flex items-stretch overflow-x-auto px-3 py-4 gap-2 scroll-smooth"
                      >
                        {displayedHourly.length === 0 ? (
                          <div className="w-full py-6 text-center text-[13px] text-white/80">
                            Hourly detail is unavailable beyond the active forecast window.
                          </div>
                        ) : (
                          displayedHourly.map((slot) => (
                            <div
                              key={slot.timeIso}
                              className="shrink-0 w-[108px] rounded-[8px] px-2.5 py-2.5 flex flex-col items-center justify-between text-center gap-1.5 hover:bg-white/14 transition-colors"
                            >
                              <span className="text-[12px] font-semibold text-white/90 tabular-nums">
                                {slot.hourLabel}
                              </span>
                              <FluentWeatherGraphic
                                code={slot.weatherCode}
                                isDay={slot.isDay}
                                className="w-9 h-9 my-0.5"
                              />
                              <span className="text-[22px] font-semibold leading-none tabular-nums">
                                {formatTemperature(slot.tempC, prefs.tempUnit)}°
                              </span>
                              <span className="text-[11.5px] font-medium text-white/90 leading-tight line-clamp-1">
                                {slot.conditionLabel}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-white/80 tabular-nums">
                                <Droplets className="w-2.5 h-2.5 text-[#bae6fd]" />
                                {slot.precipProb}%
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
