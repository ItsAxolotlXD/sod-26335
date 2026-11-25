// Widgets, tabs, For you grid and footer shortcuts for the StartLayoutConcept Vive feature.
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Accessibility,
  ArrowRight,
  Bluetooth,
  BookOpen,
  Clock,
  Download,
  FileCode2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Monitor,
  Music,
  Newspaper,
  Paintbrush,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Tv,
  UserCheck,
} from "lucide-react";
import { useCityWeather } from "../hooks/useCityWeather";
import { TaskbarWeatherIcon } from "./WindowsTaskbar";
import { loadWidgetsPrefs } from "./WindowsWidgetsBoard";
import { START_APP_ICONS } from "./StartAppIcons";
import { FluentHomeIcon } from "./FluentIcons";
import type { PcSettingCategoryId, StartForYouItem } from "../utils/startForYouSuggestions";
import { setSodiumDragData, type SodiumDragPayload } from "../utils/sodiumDragData";

export type StartConceptTab = "for-you" | "pinned" | "all" | "recents";

export interface StartConceptAppItem {
  id: string;
  label: string;
  route?: string;
  externalUrl?: string;
  renderIcon: (sizeClass?: string) => React.ReactNode;
}

const TABS: Array<{
  id: StartConceptTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "for-you", label: "For you", icon: Sparkles },
  { id: "pinned", label: "Pinned", icon: FluentHomeIcon },
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "recents", label: "Recents", icon: BookOpen },
];

export const StartConceptTabs: React.FC<{
  value: StartConceptTab;
  onChange: (tab: StartConceptTab) => void;
}> = ({ value, onChange }) => (
  <div
    role="tablist"
    aria-label="Start menu sections"
    className="flex items-center gap-1 overflow-x-auto pb-1 mb-2.5 no-scrollbar border-0"
  >
    {TABS.map((tab) => {
      const isActive = tab.id === value;
      const TabIcon = tab.icon;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`relative px-2.5 sm:px-3 py-1.5 text-[12px] sm:text-[12.5px] whitespace-nowrap cursor-pointer select-none transition-colors flex flex-col items-center justify-center !bg-transparent !border-0 !outline-none !shadow-none hover:!bg-transparent active:!bg-transparent focus:!bg-transparent ${
            isActive
              ? "text-black dark:text-white font-bold"
              : "text-[#6B7280] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white font-medium"
          }`}
        >
          <span className="relative z-10 inline-flex items-center gap-1.5 !bg-transparent">
            <TabIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
          </span>
          {isActive && (
            <motion.div
              layoutId="start-concept-tab-underline"
              className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-[#0067b8] dark:bg-[#4cc2ff]"
              initial={{ scaleX: 1 }}
              animate={{
                scaleX: [1, 2.1, 1],
              }}
              transition={{
                layout: {
                  duration: 0.4,
                  ease: [0.4, 0.0, 0.2, 1],
                },
                scaleX: {
                  duration: 0.4,
                  times: [0, 0.5, 1],
                  ease: [0.4, 0.0, 0.2, 1],
                },
              }}
            />
          )}
        </button>
      );
    })}
  </div>
);

const cardClass =
  "rounded-[8px] bg-white/55 dark:bg-white/[0.06] !border-0 !outline-none shadow-none overflow-hidden";

const Win11FolderGraphic: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
    <path
      d="M5 12.5C5 10.567 6.567 9 8.5 9H18.3c1.05 0 2.04.47 2.7 1.28L23 12.75H39.5C41.433 12.75 43 14.317 43 16.25V35.5C43 37.433 41.433 39 39.5 39H8.5C6.567 39 5 37.433 5 35.5V12.5Z"
      fill="#E8A42B"
    />
    <path
      d="M5 17C5 15.619 6.119 14.5 7.5 14.5H40.5C41.881 14.5 43 15.619 43 17V35.5C43 37.433 41.433 39 39.5 39H8.5C6.567 39 5 37.433 5 35.5V17Z"
      fill="#FCD34D"
    />
    <path d="M5 18.5H43V20H5V18.5Z" fill="#FDE68A" fillOpacity="0.65" />
  </svg>
);

function renderSettingCategoryIcon(category?: PcSettingCategoryId, cls = "w-7 h-7") {
  switch (category) {
    case "personalization":
      return <Paintbrush className={`${cls} text-indigo-500 dark:text-indigo-400`} />;
    case "system":
      return <Monitor className={`${cls} text-sky-600 dark:text-sky-400`} />;
    case "update":
      return <RefreshCw className={`${cls} text-[#0067b8] dark:text-[#4cc2ff]`} />;
    case "accounts":
      return <UserCheck className={`${cls} text-teal-600 dark:text-teal-400`} />;
    case "accessibility":
      return <Accessibility className={`${cls} text-sky-600 dark:text-sky-400`} />;
    case "bluetooth":
      return <Bluetooth className={`${cls} text-blue-600 dark:text-blue-400`} />;
    case "privacy":
      return <ShieldCheck className={`${cls} text-emerald-600 dark:text-emerald-400`} />;
    case "apps":
      return <LayoutGrid className={`${cls} text-emerald-600 dark:text-emerald-400`} />;
    default:
      return <Settings className={`${cls} text-[#0067b8] dark:text-[#4cc2ff]`} />;
  }
}

function renderForYouMiniIcon(item: StartForYouItem): React.ReactNode {
  switch (item.kind) {
    case "channel":
      return <Tv className="w-3.5 h-3.5 shrink-0 opacity-80" />;
    case "note":
      return START_APP_ICONS["app-notes"] ? (
        START_APP_ICONS["app-notes"]("w-3.5 h-3.5 shrink-0")
      ) : (
        <StickyNote className="w-3.5 h-3.5 shrink-0 text-amber-500" />
      );
    case "folder":
      return <Win11FolderGraphic className="w-3.5 h-3.5 shrink-0" />;
    case "html":
      return START_APP_ICONS["app-html-writer"] ? (
        START_APP_ICONS["app-html-writer"]("w-3.5 h-3.5 shrink-0")
      ) : (
        <FileCode2 className="w-3.5 h-3.5 shrink-0 text-[#0078d4] dark:text-[#4cc2ff]" />
      );
    case "imported":
      return <FileText className="w-3.5 h-3.5 shrink-0 text-[#0078d4] dark:text-[#4cc2ff]" />;
    case "app":
      return item.appId && START_APP_ICONS[item.appId] ? (
        START_APP_ICONS[item.appId]!("w-3.5 h-3.5 shrink-0")
      ) : (
        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
      );
    case "screenbox":
      return START_APP_ICONS["app-screenbox"] ? (
        START_APP_ICONS["app-screenbox"]("w-3.5 h-3.5 shrink-0")
      ) : (
        <Play className="w-3.5 h-3.5 shrink-0 text-[#0078d4] dark:text-[#4cc2ff]" />
      );
    case "gallery":
      return START_APP_ICONS["app-gallery"] ? (
        START_APP_ICONS["app-gallery"]("w-3.5 h-3.5 shrink-0")
      ) : (
        <ImageIcon className="w-3.5 h-3.5 shrink-0 text-sky-500" />
      );
    case "article":
      return START_APP_ICONS["app-feed"] ? (
        START_APP_ICONS["app-feed"]("w-3.5 h-3.5 shrink-0")
      ) : (
        <Newspaper className="w-3.5 h-3.5 shrink-0 text-rose-500" />
      );
    case "setting":
      return START_APP_ICONS["app-pc-settings"] ? (
        START_APP_ICONS["app-pc-settings"]("w-3.5 h-3.5 shrink-0")
      ) : (
        <Settings className="w-3.5 h-3.5 shrink-0 text-[#0078d4] dark:text-[#4cc2ff]" />
      );
  }
}

export const StartForYouGrid: React.FC<{ items: StartForYouItem[] }> = ({ items }) => (
  <div id="start-concept-for-you" className="grid grid-cols-3 gap-x-3 gap-y-3">
    {items.slice(0, 9).map((item) => {
      const renderPreview = () => {
        if (item.kind === "note") {
          return (
            <div
              style={{
                backgroundColor: item.noteBg ?? "#fef9c3",
                color: item.noteText ?? "#1f2937",
              }}
              className="w-full h-full p-2.5 text-left flex items-start overflow-hidden"
            >
              <p className="text-[10px] leading-[1.35] font-medium line-clamp-4 m-0 break-words">
                {item.noteExcerpt}
              </p>
            </div>
          );
        }

        if (item.kind === "channel") {
          return (
            <div className="w-full h-full bg-white/85 dark:bg-white/[0.12] flex items-center justify-center p-2.5">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-w-[78%] max-h-[72%] object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-[12px] font-bold text-[#111827] dark:text-white text-center line-clamp-2">
                  {item.title}
                </span>
              )}
            </div>
          );
        }

        if (item.imageUrl) {
          return (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
              loading="lazy"
            />
          );
        }

        if (item.kind === "app") {
          const iconRenderer = item.appId ? START_APP_ICONS[item.appId] : undefined;
          return (
            <div className="w-full h-full bg-white/70 dark:bg-white/[0.08] flex items-center justify-center">
              {iconRenderer ? (
                iconRenderer("w-11 h-11 group-hover:scale-105 transition-transform")
              ) : (
                <LayoutGrid className="w-10 h-10 opacity-75" />
              )}
            </div>
          );
        }

        if (item.kind === "folder") {
          return (
            <div className="w-full h-full bg-white/70 dark:bg-white/[0.08] flex items-center justify-center">
              <Win11FolderGraphic className="w-11 h-11 group-hover:scale-105 transition-transform" />
            </div>
          );
        }

        if (item.kind === "html") {
          return (
            <div className="w-full h-full bg-[#1b2029] text-[#cbd5e1] p-2 text-left flex flex-col justify-between overflow-hidden">
              <pre className="m-0 font-mono text-[7.5px] leading-[1.3] text-[#7dd3fc] whitespace-pre-wrap line-clamp-3">
                {item.htmlSnippet || "<!DOCTYPE html>"}
              </pre>
              <span className="self-end px-1.5 py-0.5 rounded-[4px] bg-[#0078d4]/30 text-[#93c5fd] text-[8px] font-bold">
                HTML
              </span>
            </div>
          );
        }

        if (item.kind === "screenbox") {
          return (
            <div className="w-full h-full bg-gradient-to-br from-[#16213e] via-[#0f3460] to-[#1a1a2e] text-white flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          );
        }

        if (item.kind === "setting") {
          return (
            <div className="w-full h-full bg-white/70 dark:bg-white/[0.08] flex items-center justify-center">
              <div className="w-11 h-11 rounded-[10px] bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center group-hover:scale-105 transition-transform">
                {renderSettingCategoryIcon(item.settingCategory, "w-6 h-6")}
              </div>
            </div>
          );
        }

        return (
          <div className="w-full h-full bg-white/70 dark:bg-white/[0.08] flex flex-col items-center justify-center gap-1">
            <FileText className="w-7 h-7 text-[#0078d4] dark:text-[#4cc2ff]" />
            {item.fileExt && (
              <span className="px-1.5 py-0.5 rounded-[4px] bg-black/[0.07] dark:bg-white/[0.12] text-[8.5px] font-bold tracking-wide">
                {item.fileExt}
              </span>
            )}
          </div>
        );
      };

      const dragPayload: SodiumDragPayload =
        item.dragPayload ??
        (item.kind === "folder"
          ? { kind: "folder", name: item.title, targetDirId: "dir-documents" }
          : item.kind === "app"
            ? {
                kind: "app",
                appId: item.appId,
                label: item.title,
                route: "/",
              }
            : {
                kind: "file",
                name: item.title,
                fileKind: item.kind,
                thumbnailUrl: item.imageUrl,
                targetRoute: "/file-explorer",
              });

      return (
        <button
          key={item.id}
          type="button"
          draggable
          onDragStart={(e) => setSodiumDragData(e, dragPayload)}
          onClick={item.onSelect}
          className="group p-1 rounded-[8px] flex flex-col text-left !border-0 !outline-none shadow-none !bg-transparent hover:!bg-black/[0.05] dark:hover:!bg-white/[0.07] active:scale-[0.98] transition-all cursor-pointer min-w-0"
        >
          <div className="w-full aspect-[3/2] rounded-[7px] !border-0 !outline-none shadow-none overflow-hidden">
            {renderPreview()}
          </div>
          <div className="mt-1.5 px-0.5 w-full min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {renderForYouMiniIcon(item)}
              <span className="text-[12px] font-medium leading-tight truncate text-[#111827] dark:text-white">
                {item.title}
              </span>
            </div>
            <div className="text-[10.5px] leading-tight text-[#4b5563] dark:text-white/65 truncate mt-0.5">
              {item.subtitle}
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

function formatClock(date: Date): { time: string; suffix: string; dateLabel: string } {
  let hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return { time: `${hours}:${String(date.getMinutes()).padStart(2, "0")}`, suffix, dateLabel };
}

const WEATHER_CITIES: Array<{ id: string; label: string }> = [
  { id: "hanoi", label: "Hà Nội" },
  { id: "hcmc", label: "TP. Hồ Chí Minh" },
  { id: "danang", label: "Đà Nẵng" },
];

const WeatherCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const [cityIndex, setCityIndex] = useState(() => {
    const savedId = loadWidgetsPrefs().selectedCityId;
    const idx = WEATHER_CITIES.findIndex((c) => c.id === savedId);
    return idx >= 0 ? idx : 0;
  });
  const city = WEATHER_CITIES[cityIndex] ?? WEATHER_CITIES[0]!;
  const { data } = useCityWeather(city.id);

  return (
    <div className={`${cardClass} aspect-square p-2.5 flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11.5px] font-bold truncate">{city.label}</span>
        <button
          type="button"
          aria-label="Open weather"
          onClick={onOpen}
          className="w-5 h-5 flex items-center justify-center rounded-[4px] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] !border-0 !outline-none bg-transparent cursor-pointer text-[#0078d4] dark:text-[#4cc2ff] shrink-0"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
        <TaskbarWeatherIcon
          temp={data ? Math.round(data.temp) : 25}
          condition={data?.condition ?? "cloudy"}
          {...(typeof data?.weatherCode === "number" ? { weatherCode: data.weatherCode } : {})}
          isDay={data?.isDay ?? true}
          className="w-10 h-10"
        />
        <div className="text-[22px] leading-none font-bold tabular-nums">
          {data ? Math.round(data.temp) : "--"}°C
        </div>
        <div className="text-[11px] font-bold opacity-80 truncate max-w-full">
          {data?.conditionLabel ?? "Loading…"}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {WEATHER_CITIES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Show weather for ${c.label}`}
            onClick={() => setCityIndex(i)}
            className={`w-[5px] h-[5px] rounded-full !border-0 !outline-none p-0 cursor-pointer ${
              i === cityIndex ? "bg-[#111827] dark:bg-white" : "bg-black/25 dark:bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const ClockCard: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const { time, suffix, dateLabel } = formatClock(now);
  return (
    <div className={`${cardClass} aspect-square p-2.5 flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Clock</span>
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
        <div className="flex items-baseline justify-center gap-1 tabular-nums">
          <span className="text-[25px] font-bold leading-none tracking-tight">{time}</span>
          <span className="text-[11.5px] font-bold opacity-75">{suffix}</span>
        </div>
        <div className="text-[11px] font-bold opacity-75">{dateLabel}</div>
      </div>
      <div className="h-[5px]" aria-hidden="true" />
    </div>
  );
};

const SuggestedAppsCard: React.FC<{
  apps: StartConceptAppItem[];
  onLaunchApp: (app: StartConceptAppItem) => void;
}> = ({ apps, onLaunchApp }) => (
  <div className={`${cardClass} p-2.5 flex flex-col gap-2`}>
    <div className="flex items-center justify-between px-0.5">
      <span className="text-[12px] font-semibold">Suggested apps</span>
    </div>
    <div className="grid grid-cols-3 gap-1">
      {apps.slice(0, 6).map((app) => (
        <button
          key={app.id}
          type="button"
          draggable
          onDragStart={(e) =>
            setSodiumDragData(e, {
              kind: "app",
              appId: app.id,
              label: app.label,
              route: app.route || "/",
              ...(app.externalUrl ? { externalUrl: app.externalUrl } : {}),
            })
          }
          onClick={() => onLaunchApp(app)}
          className="group py-2 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer !border-0 !outline-none shadow-none bg-transparent"
        >
          <div className="w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
            {app.renderIcon("w-8 h-8")}
          </div>
          <span className="text-[11.5px] font-normal text-center leading-tight line-clamp-1 max-w-full">
            {app.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export const StartConceptWidgets: React.FC<{
  suggestedApps: StartConceptAppItem[];
  onLaunchApp: (app: StartConceptAppItem) => void;
  onOpenRoute: (route: string) => void;
}> = ({ suggestedApps, onLaunchApp, onOpenRoute }) => (
  <div id="start-layout-concept-widgets" className="flex flex-col gap-2.5">
    <div className="grid grid-cols-2 gap-2.5">
      <WeatherCard onOpen={() => onOpenRoute("/weather")} />
      <ClockCard />
    </div>
    <SuggestedAppsCard apps={suggestedApps} onLaunchApp={onLaunchApp} />
  </div>
);

export const StartConceptFooterShortcuts: React.FC<{ onOpenRoute: (route: string) => void }> = ({
  onOpenRoute,
}) => {
  const items: Array<{
    label: string;
    route: string;
    icon: React.ReactNode;
    dragPayload: SodiumDragPayload;
  }> = [
    {
      label: "Documents",
      route: "/file-explorer",
      icon: <FileText className="w-4 h-4" />,
      dragPayload: { kind: "folder", name: "Documents", targetDirId: "dir-documents" },
    },
    {
      label: "Downloads",
      route: "/file-explorer",
      icon: <Download className="w-4 h-4" />,
      dragPayload: { kind: "folder", name: "Downloads", targetDirId: "dir-downloads" },
    },
    {
      label: "Music",
      route: "/file-explorer",
      icon: <Music className="w-4 h-4" />,
      dragPayload: { kind: "folder", name: "Music", targetDirId: "dir-music" },
    },
    {
      label: "Pictures",
      route: "/gallery",
      icon: <ImageIcon className="w-4 h-4" />,
      dragPayload: { kind: "folder", name: "Pictures", targetDirId: "dir-pictures" },
    },
    {
      label: "File Explorer",
      route: "/file-explorer",
      icon: <FolderOpen className="w-4 h-4" />,
      dragPayload: {
        kind: "app",
        appId: "app-file-explorer",
        label: "File Explorer",
        route: "/file-explorer",
      },
    },
  ];
  return (
    <>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          draggable
          onDragStart={(e) => setSodiumDragData(e, item.dragPayload)}
          aria-label={item.label}
          title={item.label}
          onClick={() => onOpenRoute(item.route)}
          className="w-9 h-9 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer !border-0 !outline-none bg-transparent"
        >
          {item.icon}
        </button>
      ))}
    </>
  );
};
