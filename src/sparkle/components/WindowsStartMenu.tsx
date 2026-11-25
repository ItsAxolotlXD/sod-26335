/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Power,
  RotateCcw,
  LogOut,
  Monitor,
  Settings as SettingsIcon,
  User,
  Sparkles,
  Sun,
  Moon,
  LayoutGrid,
  X,
  FolderOpen,
  Pin,
  PinOff,
  ExternalLink,
  Lock,
} from "lucide-react";
import { WindowsContextMenu } from "./WindowsContextMenu";
import {
  contextMenuMotionProps,
  contextMenuUpMotionProps,
  flyoutPanelClassName,
  flyoutPanelStyle,
} from "./FlyoutDropdown";
import { Fluent3DWatchPreviewIcon, Fluent3DNotesIcon, Fluent3DArticlesIcon } from "./Fluent3DIcons";
import { FluentHomeIcon, FluentPersonFeedbackIcon, FluentSearchIcon } from "./FluentIcons";
import { START_APP_ICONS } from "./StartAppIcons";
import {
  StartConceptTabs,
  StartConceptWidgets,
  StartConceptFooterShortcuts,
  StartForYouGrid,
  type StartConceptTab,
} from "./StartLayoutConceptPanel";
import { buildStartForYouSuggestions, type StartForYouItem } from "../utils/startForYouSuggestions";
import {
  galleryDB,
  DEFAULT_GALLERY_ITEMS,
  type GalleryFolder,
  type GalleryMediaItem,
} from "../services/galleryStorage";
import {
  useSettings,
  getTaskbarThicknessPx,
  getWindowsUiScaleMultiplier,
  FLOAT_BAR_BOTTOM_GAP_PX,
} from "../hooks/useSettings";
import { useNotes } from "../context/NotesContext";
import { useAuthSession, getAccountLabel } from "../services/authSession";
import { NEWS_DATA } from "../data/news";
import { START_APPS } from "../data/startApps";
import { usePinState, pinActions, isRoutePinnedToTaskbar } from "../services/pinStore";
import { Channel } from "../types";
import { setSodiumDragData, type SodiumDragPayload } from "../utils/sodiumDragData";

export interface StartMenuAppItem {
  id: string;
  label: string;
  route?: string;
  externalUrl?: string;
  keywords: string;
  renderIcon: (sizeClass?: string) => React.ReactNode;
}

interface WindowsStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchRoute: (route: string, state?: any) => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onRestartOobe?: () => void;
  onRestartSystem?: () => void;
  onEndSession?: () => void;
  onLockScreen?: () => void;
  onOpenDirectCommand?: () => void;
  isTaskbarFloating?: boolean;
}

type StartPinnedEntry =
  { type: "app"; appId: string } | { type: "folder"; id: string; name: string; appIds: string[] };

const START_LAYOUT_STORAGE_KEY = "sparkle_start_pinned_layout_v1";

const getEntryKey = (entry: StartPinnedEntry) => (entry.type === "app" ? entry.appId : entry.id);

function reconcileStartLayout(
  saved: StartPinnedEntry[] | null,
  apps: StartMenuAppItem[],
): StartPinnedEntry[] {
  const validIds = new Set(apps.map((a) => a.id));
  const seen = new Set<string>();
  const result: StartPinnedEntry[] = [];

  if (Array.isArray(saved)) {
    for (const entry of saved) {
      if (!entry || typeof entry !== "object") continue;
      if (entry.type === "app") {
        if (validIds.has(entry.appId) && !seen.has(entry.appId)) {
          seen.add(entry.appId);
          result.push({ type: "app", appId: entry.appId });
        }
      } else if (entry.type === "folder" && Array.isArray(entry.appIds)) {
        const cleanIds: string[] = [];
        for (const id of entry.appIds) {
          if (validIds.has(id) && !seen.has(id)) {
            seen.add(id);
            cleanIds.push(id);
          }
        }
        if (cleanIds.length >= 2) {
          result.push({
            type: "folder",
            id: entry.id || `folder-${cleanIds[0]}`,
            name: typeof entry.name === "string" && entry.name.trim() ? entry.name : "Folder",
            appIds: cleanIds,
          });
        } else if (cleanIds.length === 1) {
          result.push({ type: "app", appId: cleanIds[0] });
        }
      }
    }
  }

  for (const app of apps) {
    if (!seen.has(app.id)) {
      seen.add(app.id);
      result.push({ type: "app", appId: app.id });
    }
  }
  return result;
}

export const WindowsStartMenu: React.FC<WindowsStartMenuProps> = ({
  isOpen,
  onClose,
  onLaunchRoute,
  channels,
  onSelectChannel,
  onRestartOobe,
  onRestartSystem,
  onEndSession,
  onLockScreen,
  onOpenDirectCommand,
  isTaskbarFloating = false,
}) => {
  const session = useAuthSession();
  const accountLabel = getAccountLabel(session);
  const { settings, updateSetting } = useSettings();
  const { notes, setActiveNoteId } = useNotes();
  const [pcProfile, setPcProfile] = useState<{
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
  }>({});

  useEffect(() => {
    const syncProfile = () => {
      try {
        const raw = localStorage.getItem("sparkle_pc_settings_v1");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            userName?: string;
            userEmail?: string;
            userAvatar?: string;
          };
          setPcProfile({
            userName: typeof parsed.userName === "string" ? parsed.userName : undefined,
            userEmail: typeof parsed.userEmail === "string" ? parsed.userEmail : undefined,
            userAvatar: typeof parsed.userAvatar === "string" ? parsed.userAvatar : undefined,
          });
        }
      } catch {}
    };
    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("sparkle:pc-settings-updated", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("sparkle:pc-settings-updated", syncProfile);
    };
  }, [isOpen]);

  const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
  const authAvatar =
    typeof meta?.["avatar_url"] === "string"
      ? meta["avatar_url"]
      : typeof meta?.["picture"] === "string"
        ? meta["picture"]
        : "";
  const displayAvatar = pcProfile.userAvatar || authAvatar;
  const displayAccountName = accountLabel || pcProfile.userName?.trim() || "Sodium User";
  const displayAccountSubtitle =
    session?.user?.email || pcProfile.userEmail?.trim() || "Unregistered Account";
  const isLightMode = settings.theme === "light";
  const taskbarLocation = settings.taskbarLocation || "bottom";
  const taskbarThickness = getTaskbarThicknessPx(
    settings.taskbarScale,
    isTaskbarFloating,
    taskbarLocation,
  );
  const uiScaleMult = getWindowsUiScaleMultiplier(settings.windowsUiScale);
  const isLeftAligned = settings.taskbarAlignment === "left";
  const taskbarEdgeOffset =
    taskbarThickness + (isTaskbarFloating ? FLOAT_BAR_BOTTOM_GAP_PX : 0) + 8;
  const menuRef = useRef<HTMLDivElement>(null);
  const powerMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [showAllApps, setShowAllApps] = useState(false);
  const [suggestedAppIds, setSuggestedAppIds] = useState<string[]>([]);
  const [forYouItems, setForYouItems] = useState<StartForYouItem[]>([]);
  const galleryItemsRef = useRef<GalleryMediaItem[]>(DEFAULT_GALLERY_ITEMS);
  const galleryFoldersRef = useRef<GalleryFolder[]>([]);
  const wasOpenRef = useRef(false);
  const isStartConcept = Boolean(settings.startLayoutConcept);
  const [conceptTab, setConceptTabState] = useState<StartConceptTab>("for-you");
  const setConceptTab = (tab: StartConceptTab) => {
    setConceptTabState(tab);
    setShowAllApps(tab === "all");
  };
  const launchAndClose = (route: string) => {
    onLaunchRoute(route);
    onClose();
  };
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const [startContextMenu, setStartContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [appContextMenu, setAppContextMenu] = useState<{
    x: number;
    y: number;
    app: StartMenuAppItem;
  } | null>(null);
  const openAppContextMenu = (e: React.MouseEvent, app: StartMenuAppItem) => {
    e.preventDefault();
    e.stopPropagation();
    setStartContextMenu(null);
    setAppContextMenu({ x: e.clientX, y: e.clientY, app });
  };
  const [dragState, setDragState] = useState<
    | { kind: "pinned"; entryKey: string }
    | { kind: "folder-app"; folderId: string; appId: string }
    | null
  >(null);
  const [dropTarget, setDropTarget] = useState<{
    entryKey: string;
    zone: "before" | "after" | "merge";
  } | null>(null);
  const [folderAppDropTarget, setFolderAppDropTarget] = useState<{
    appId: string;
    side: "before" | "after";
  } | null>(null);
  const [savedLayout, setSavedLayout] = useState<StartPinnedEntry[] | null>(() => {
    try {
      const raw = localStorage.getItem(START_LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return null;
  });

  const { startUnpinned, taskbarPins } = usePinState();

  const pinnedApps: StartMenuAppItem[] = useMemo(
    () =>
      START_APPS.filter(
        (app) =>
          (!app.devOnly || settings.developerMode) &&
          !["app-channels", "app-favorites", "app-search"].includes(app.id),
      ).map((app) => {
        const label = settings.windowsMode
          ? app.id === "app-home"
            ? "Discover"
            : app.id === "app-pc-settings"
              ? "Settings"
              : app.id === "app-settings"
                ? "Settings (Legacy)"
                : app.label
          : app.label;
        return {
          ...app,
          label,
          renderIcon:
            START_APP_ICONS[app.id] ?? ((cls = "w-8 h-8") => <FluentHomeIcon className={cls} />),
        };
      }),
    [settings.developerMode, settings.windowsMode],
  );

  // Apps shown in the "Pinned" grid (All apps and search still list everything)
  const startPinnedApps = useMemo(
    () => pinnedApps.filter((app) => !startUnpinned.includes(app.id)),
    [pinnedApps, startUnpinned],
  );

  const appById = useMemo(() => {
    const map = new Map<string, StartMenuAppItem>();
    pinnedApps.forEach((app) => map.set(app.id, app));
    return map;
  }, [pinnedApps]);

  const pinnedEntries = useMemo(
    () => reconcileStartLayout(savedLayout, startPinnedApps),
    [savedLayout, startPinnedApps],
  );

  const commitStartLayout = (nextEntries: StartPinnedEntry[]) => {
    const clean = reconcileStartLayout(nextEntries, startPinnedApps);
    setSavedLayout(clean);
    try {
      localStorage.setItem(START_LAYOUT_STORAGE_KEY, JSON.stringify(clean));
    } catch {}
  };

  const resetStartLayout = () => {
    setSavedLayout(null);
    setOpenFolderId(null);
    try {
      localStorage.removeItem(START_LAYOUT_STORAGE_KEY);
    } catch {}
  };

  const openFolder = useMemo(
    () =>
      openFolderId
        ? (pinnedEntries.find(
            (e): e is Extract<StartPinnedEntry, { type: "folder" }> =>
              e.type === "folder" && e.id === openFolderId,
          ) ?? null)
        : null,
    [openFolderId, pinnedEntries],
  );

  const handlePinnedEntryDrop = (
    targetEntry: StartPinnedEntry,
    zone: "before" | "after" | "merge",
  ) => {
    if (!dragState || dragState.kind !== "pinned") return;
    const sourceKey = dragState.entryKey;
    const targetKey = getEntryKey(targetEntry);
    if (sourceKey === targetKey) return;

    const current = [...pinnedEntries];
    const sourceIdx = current.findIndex((e) => getEntryKey(e) === sourceKey);
    if (sourceIdx === -1) return;
    const sourceEntry = current[sourceIdx];

    if (zone === "merge" && sourceEntry.type === "app") {
      if (targetEntry.type === "app") {
        const newFolderId = `folder-${Date.now()}`;
        const updated = current
          .map((e) =>
            getEntryKey(e) === targetKey
              ? {
                  type: "folder" as const,
                  id: newFolderId,
                  name: "Folder",
                  appIds: [targetEntry.appId, sourceEntry.appId],
                }
              : e,
          )
          .filter((e) => getEntryKey(e) !== sourceKey);
        commitStartLayout(updated);
        return;
      }
      if (targetEntry.type === "folder") {
        const updated = current
          .map((e) =>
            e.type === "folder" && e.id === targetEntry.id
              ? { ...e, appIds: [...e.appIds, sourceEntry.appId] }
              : e,
          )
          .filter((e) => getEntryKey(e) !== sourceKey);
        commitStartLayout(updated);
        return;
      }
    }

    const withoutSource = current.filter((e) => getEntryKey(e) !== sourceKey);
    const destIdx = withoutSource.findIndex((e) => getEntryKey(e) === targetKey);
    if (destIdx === -1) return;
    const insertIdx = zone === "after" ? destIdx + 1 : destIdx;
    withoutSource.splice(insertIdx, 0, sourceEntry);
    commitStartLayout(withoutSource);
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    const updated = pinnedEntries.map((e) =>
      e.type === "folder" && e.id === folderId ? { ...e, name } : e,
    );
    commitStartLayout(updated);
  };

  const handleRemoveAppFromFolder = (folderId: string, appId: string) => {
    const folderIdx = pinnedEntries.findIndex((e) => e.type === "folder" && e.id === folderId);
    if (folderIdx === -1) return;
    const folder = pinnedEntries[folderIdx];
    if (folder.type !== "folder") return;
    const remaining = folder.appIds.filter((id) => id !== appId);
    const next = [...pinnedEntries];
    if (remaining.length >= 2) {
      next.splice(folderIdx, 1, { ...folder, appIds: remaining }, { type: "app", appId });
    } else if (remaining.length === 1) {
      next.splice(folderIdx, 1, { type: "app", appId: remaining[0] }, { type: "app", appId });
      setOpenFolderId(null);
    } else {
      next.splice(folderIdx, 1, { type: "app", appId });
      setOpenFolderId(null);
    }
    commitStartLayout(next);
  };

  const handleUngroupFolder = (folderId: string) => {
    const folderIdx = pinnedEntries.findIndex((e) => e.type === "folder" && e.id === folderId);
    if (folderIdx === -1) return;
    const folder = pinnedEntries[folderIdx];
    if (folder.type !== "folder") return;
    const next = [...pinnedEntries];
    next.splice(folderIdx, 1, ...folder.appIds.map((appId) => ({ type: "app" as const, appId })));
    setOpenFolderId(null);
    commitStartLayout(next);
  };

  const handleReorderFolderApp = (
    folderId: string,
    sourceAppId: string,
    targetAppId: string,
    side: "before" | "after",
  ) => {
    if (sourceAppId === targetAppId) return;
    const updated = pinnedEntries.map((e) => {
      if (e.type !== "folder" || e.id !== folderId) return e;
      const filtered = e.appIds.filter((id) => id !== sourceAppId);
      const targetIdx = filtered.indexOf(targetAppId);
      if (targetIdx === -1) return e;
      filtered.splice(side === "after" ? targetIdx + 1 : targetIdx, 0, sourceAppId);
      return { ...e, appIds: filtered };
    });
    commitStartLayout(updated);
  };

  const filteredApps = useMemo(() => {
    if (!isOpen) return [];
    const q = query.trim().toLowerCase();
    const list = !q
      ? pinnedApps
      : pinnedApps.filter(
          (app) => app.label.toLowerCase().includes(q) || app.keywords.toLowerCase().includes(q),
        );
    if (showAllApps) {
      return [...list].sort((a, b) =>
        a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
      );
    }
    return list;
  }, [isOpen, pinnedApps, query, showAllApps]);

  const suggestedApps = useMemo(() => {
    const resolved = suggestedAppIds
      .map((id) => appById.get(id))
      .filter((app): app is StartMenuAppItem => Boolean(app));
    return resolved.length > 0 ? resolved.slice(0, 6) : pinnedApps.slice(0, 6);
  }, [suggestedAppIds, appById, pinnedApps]);

  const matchedChannels = useMemo(() => {
    if (!isOpen) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return channels
      .filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .slice(0, 4);
  }, [isOpen, channels, query]);

  const recommendedItems = useMemo(() => {
    if (!isOpen) return [];
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      dragPayload: SodiumDragPayload;
      onClick: () => void;
    }> = [];

    if (notes && notes.length > 0) {
      const latestNote = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
      if (latestNote) {
        const title = latestNote.title.trim() || "Untitled Note";
        items.push({
          id: `rec-note-${latestNote.id}`,
          title,
          subtitle: "Recent note",
          icon: <Fluent3DNotesIcon className="w-6 h-6 shrink-0" />,
          dragPayload: {
            kind: "note",
            noteId: latestNote.id,
            title,
            colorId: latestNote.colorId,
          },
          onClick: () => {
            setActiveNoteId(latestNote.id);
            onLaunchRoute("/notes");
            onClose();
          },
        });
      }
    }

    const featuredChannels = channels.slice(0, 2);
    featuredChannels.forEach((ch) => {
      items.push({
        id: `rec-ch-${ch.id}`,
        title: ch.name,
        subtitle: ch.category || "Live TV",
        icon: ch.logo ? (
          <img
            src={ch.logo}
            alt={ch.name}
            className="w-6 h-6 object-contain rounded-[4px] shrink-0"
          />
        ) : (
          <Fluent3DWatchPreviewIcon className="w-6 h-6 shrink-0" />
        ),
        dragPayload: {
          kind: "channel",
          channelId: ch.id,
          slug: ch.slug,
          name: ch.name,
          logo: ch.logo,
          category: ch.category,
        },
        onClick: () => {
          onSelectChannel(ch);
          onLaunchRoute(`/live-tv?channel=${ch.slug}`);
          onClose();
        },
      });
    });

    NEWS_DATA.slice(0, 3).forEach((art) => {
      const cleanTitle = art.title.replace(/^#\s*/, "");
      items.push({
        id: `rec-art-${art.id}`,
        title: cleanTitle,
        subtitle: art.publishedAt || "Update blog",
        icon: <Fluent3DArticlesIcon className="w-6 h-6 shrink-0" />,
        dragPayload: {
          kind: "article",
          articleId: art.id,
          slug: art.slug,
          title: cleanTitle,
          coverImage: art.coverImage,
        },
        onClick: () => {
          onLaunchRoute(`/news/${art.slug}`);
          onClose();
        },
      });
    });

    return items.slice(0, 6);
  }, [isOpen, notes, channels, setActiveNoteId, onLaunchRoute, onClose, onSelectChannel]);

  useEffect(() => {
    let active = true;
    const syncGalleryCache = () => {
      Promise.all([galleryDB.getAll(), galleryDB.getFolders()])
        .then(([items, folders]) => {
          if (!active) return;
          if (items.length > 0) galleryItemsRef.current = items;
          galleryFoldersRef.current = folders;
        })
        .catch(() => {});
    };
    syncGalleryCache();
    const unsubscribe = galleryDB.subscribe(syncGalleryCache);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const pool = pinnedApps.map((app) => app.id);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
      }
      setSuggestedAppIds(pool.slice(0, 6));
      setForYouItems(
        buildStartForYouSuggestions({
          channels,
          notes,
          pinnedApps,
          galleryItems: galleryItemsRef.current,
          galleryFolders: galleryFoldersRef.current,
          onLaunchApp: (app) => {
            if (app.externalUrl) {
              window.open(app.externalUrl, "_blank", "noopener,noreferrer");
              onClose();
            } else if (app.route) {
              onLaunchRoute(app.route);
              onClose();
            }
          },
          onSelectChannel,
          onSelectNote: setActiveNoteId,
          onLaunchRoute,
          onClose,
        }),
      );
    }
  }, [
    isOpen,
    pinnedApps,
    channels,
    notes,
    onSelectChannel,
    setActiveNoteId,
    onLaunchRoute,
    onClose,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setShowAllApps(false);
      setConceptTabState("for-you");
      setIsPowerMenuOpen(false);
      setStartContextMenu(null);
      setAppContextMenu(null);
      setOpenFolderId(null);
      setDragState(null);
      setDropTarget(null);
      setFolderAppDropTarget(null);
      return;
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("#btn-taskbar-start") || target.closest("[data-windows-context-menu]"))
        return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
        return;
      }
      if (isPowerMenuOpen && powerMenuRef.current && !powerMenuRef.current.contains(target)) {
        setIsPowerMenuOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPowerMenuOpen) {
          setIsPowerMenuOpen(false);
          return;
        }
        if (openFolderId) {
          setOpenFolderId(null);
          return;
        }
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, openFolderId, isPowerMenuOpen]);

  const handleLaunchApp = (app: StartMenuAppItem) => {
    if (app.externalUrl) {
      window.open(app.externalUrl, "_blank", "noopener,noreferrer");
      onClose();
      return;
    }
    if (app.route) {
      onLaunchRoute(app.route);
      onClose();
    }
  };

  if (typeof document === "undefined") return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="windows-start-menu-wrapper"
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
                paddingBottom: taskbarLocation === "bottom" ? `${taskbarEdgeOffset}px` : undefined,
                paddingTop: taskbarLocation === "top" ? `${taskbarEdgeOffset}px` : undefined,
                paddingLeft: taskbarLocation === "left" ? `${taskbarEdgeOffset}px` : undefined,
                paddingRight: taskbarLocation === "right" ? `${taskbarEdgeOffset}px` : undefined,
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
                ref={menuRef}
                id="windows-start-menu"
                data-start-concept={isStartConcept ? "true" : "false"}
                role="dialog"
                aria-label="Start Menu"
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStartContextMenu({ x: e.clientX, y: e.clientY });
                }}
                style={{
                  backgroundColor: isLightMode
                    ? "rgba(243, 243, 243, 0.86)"
                    : "rgba(30, 32, 37, 0.86)",
                  backdropFilter: "blur(42px) saturate(180%)",
                  WebkitBackdropFilter: "blur(42px) saturate(180%)",
                  zoom: uiScaleMult,
                }}
                className={`pointer-events-auto w-full ${isStartConcept ? "max-w-[760px] !border-0 !outline-none" : "max-w-[620px] border border-black/10 dark:border-white/[0.12]"} max-h-[calc(100vh-76px)] rounded-[12px] shadow-none flex flex-col overflow-hidden select-none text-[#111827] dark:text-white`}
              >
                {/* Search Bar */}
                <div
                  className={`px-6 ${isStartConcept ? "pt-4 pb-2.5 flex items-center gap-2" : "pt-5 pb-3"} shrink-0`}
                >
                  {isStartConcept && (
                    <button
                      type="button"
                      id="btn-start-concept-direct-command"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        if (onOpenDirectCommand) {
                          onOpenDirectCommand();
                        } else if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("vplay:open-direct-command"));
                        }
                      }}
                      aria-label="Direct Command"
                      title="Direct Command"
                      className="w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.12] transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <span
                        role="img"
                        aria-hidden="true"
                        className="inline-block w-4 h-4 shrink-0 home-icon-themed pointer-events-none select-none"
                        style={{
                          maskImage: "url('/assets/aistudio/image_141d85b6.png')",
                          WebkitMaskImage: "url('/assets/aistudio/image_141d85b6.png')",
                          maskSize: "contain",
                          WebkitMaskSize: "contain",
                          maskRepeat: "no-repeat",
                          WebkitMaskRepeat: "no-repeat",
                          maskPosition: "center",
                          WebkitMaskPosition: "center",
                        }}
                      />
                    </button>
                  )}
                  <form
                    id="windows-start-search-box"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (filteredApps.length > 0) {
                        handleLaunchApp(filteredApps[0]);
                      } else if (matchedChannels.length > 0) {
                        const ch = matchedChannels[0];
                        onSelectChannel(ch);
                        onLaunchRoute(`/live-tv?channel=${ch.slug}`);
                        onClose();
                      }
                    }}
                    className={`relative flex items-center ${isStartConcept ? "flex-1 min-w-0 h-[36px]" : "h-[42px]"} px-3.5 rounded-[6px] gap-2.5 overflow-hidden transition-colors`}
                  >
                    <FluentSearchIcon className="w-[15px] h-[15px] text-[#374151] dark:text-white/85 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        isStartConcept ? "Type here to search" : "Type here to search for stuff"
                      }
                      className="flex-1 min-w-0 !bg-transparent text-[13.5px] text-[#111827] dark:text-white placeholder-black/55 dark:placeholder-white/75 !outline-none !border-0 !border-b-0 !shadow-none"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </form>

                  {isStartConcept && (
                    <div ref={powerMenuRef} className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsPowerMenuOpen((prev) => !prev)}
                        aria-label="Power"
                        aria-haspopup="menu"
                        aria-expanded={isPowerMenuOpen}
                        className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                          isPowerMenuOpen
                            ? "bg-black/10 dark:bg-white/15"
                            : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {isPowerMenuOpen && (
                          <div
                            style={{ overflow: "clip" }}
                            className="absolute right-0 top-full mt-2 z-50 fluent-context-menu-wrapper pointer-events-auto"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <motion.div
                              {...(settings.reduceAllMotion
                                ? {
                                    initial: { opacity: 1 },
                                    animate: { opacity: 1 },
                                    exit: { opacity: 0, transition: { duration: 0 } },
                                  }
                                : contextMenuMotionProps)}
                            >
                              <div
                                role="menu"
                                aria-label="Power"
                                style={flyoutPanelStyle}
                                className={`w-[228px] p-1.5 ${flyoutPanelClassName} fluent-context-menu shadow-none`}
                              >
                                <div className="w-full flex flex-col space-y-0.5">
                                  {onLockScreen && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setIsPowerMenuOpen(false);
                                        onClose();
                                        onLockScreen();
                                      }}
                                      className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] border-none"
                                    >
                                      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-black dark:text-white">
                                        <Lock className="w-4 h-4" />
                                      </span>
                                      <span className="truncate flex-1">Lock session</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setIsPowerMenuOpen(false);
                                      onClose();
                                      if (onRestartSystem) {
                                        onRestartSystem();
                                      } else {
                                        window.location.reload();
                                      }
                                    }}
                                    className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] border-none"
                                  >
                                    <span className="w-4 h-4 shrink-0 flex items-center justify-center text-black dark:text-white">
                                      <RotateCcw className="w-4 h-4" />
                                    </span>
                                    <span className="truncate flex-1">Restart session</span>
                                  </button>

                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setIsPowerMenuOpen(false);
                                      onClose();
                                      if (onEndSession) {
                                        onEndSession();
                                      } else {
                                        updateSetting("windowsMode", false);
                                      }
                                    }}
                                    className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] border-none"
                                  >
                                    <span className="w-4 h-4 shrink-0 flex items-center justify-center text-black dark:text-white">
                                      <LogOut className="w-4 h-4" />
                                    </span>
                                    <span className="truncate flex-1">End session</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Scrollable Body: Pinned + Recommended (StartLayoutConcept adds a widgets column) */}
                <div
                  className={
                    isStartConcept ? "flex-1 min-h-0 flex gap-3.5 px-6 pt-1 pb-4" : "contents"
                  }
                >
                  <div
                    className={`flex-1 overflow-y-auto space-y-5 no-scrollbar ${
                      isStartConcept
                        ? "min-w-0 pr-3.5 border-r border-black/[0.08] dark:border-white/[0.08]"
                        : "px-6 py-2"
                    }`}
                  >
                    {/* Pinned / All Apps Section */}
                    <div>
                      {isStartConcept && !query.trim() && (
                        <StartConceptTabs value={conceptTab} onChange={setConceptTab} />
                      )}
                      <div
                        className={`flex items-center justify-between mb-3 px-1 ${
                          isStartConcept && !query.trim() ? "hidden" : ""
                        }`}
                      >
                        <h3 className="text-[13.5px] font-semibold text-[#111827] dark:text-white">
                          {query.trim() ? "Search results" : showAllApps ? "All apps" : "Pinned"}
                        </h3>
                        {!query.trim() && (
                          <button
                            type="button"
                            onClick={() => setShowAllApps((prev) => !prev)}
                            className="h-[26px] px-2.5 rounded-[5px] bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-black/[0.05] dark:border-white/[0.06]"
                          >
                            {showAllApps ? (
                              <>
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Back</span>
                              </>
                            ) : (
                              <>
                                <span>All apps</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {isStartConcept && conceptTab === "for-you" && !query.trim() ? (
                        <StartForYouGrid items={forYouItems} />
                      ) : isStartConcept && conceptTab === "recents" && !query.trim() ? (
                        <div id="start-concept-recents" className="flex flex-col gap-0.5">
                          {recommendedItems.length === 0 && (
                            <div className="py-8 text-center text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
                              Nothing recent yet
                            </div>
                          )}
                          {recommendedItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              draggable
                              onDragStart={(e) => setSodiumDragData(e, item.dragPayload)}
                              onClick={item.onClick}
                              className="h-[48px] px-2.5 rounded-[6px] flex items-center gap-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-left border-none"
                            >
                              {item.icon}
                              <div className="min-w-0 flex-1">
                                <div className="text-[12.5px] font-medium truncate">
                                  {item.title}
                                </div>
                                <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                                  {item.subtitle}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : showAllApps && !query.trim() ? (
                        <div className="flex flex-col gap-0.5">
                          {filteredApps.map((app, index) => {
                            const letter = (app.label.trim().charAt(0) || "#").toUpperCase();
                            const prevLetter =
                              index > 0
                                ? (
                                    filteredApps[index - 1].label.trim().charAt(0) || "#"
                                  ).toUpperCase()
                                : null;
                            const showHeader = letter !== prevLetter;
                            return (
                              <React.Fragment key={app.id}>
                                {showHeader && (
                                  <div
                                    className={`px-3 ${index === 0 ? "pt-0.5" : "pt-2"} pb-0.5 text-[12px] font-semibold text-[#111827]/80 dark:text-white/80 select-none`}
                                  >
                                    {letter}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  draggable
                                  onDragStart={(e) =>
                                    setSodiumDragData(e, {
                                      kind: "app",
                                      appId: app.id,
                                      label: app.label,
                                      route: app.route || "/",
                                      externalUrl: app.externalUrl,
                                    })
                                  }
                                  onClick={() => handleLaunchApp(app)}
                                  onContextMenu={(e) => openAppContextMenu(e, app)}
                                  className="w-full h-[38px] px-3 rounded-[6px] flex items-center gap-3.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.99] transition-all cursor-pointer text-left border-none"
                                >
                                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                    {app.renderIcon("w-6 h-6")}
                                  </div>
                                  <span className="text-[13px] font-normal truncate">
                                    {app.label}
                                  </span>
                                </button>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      ) : query.trim() ? (
                        <div
                          className={`grid grid-cols-4 ${isStartConcept ? "gap-y-3 gap-x-1.5" : "sm:grid-cols-6 gap-1.5"}`}
                        >
                          {filteredApps.map((app) => (
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
                                  externalUrl: app.externalUrl,
                                })
                              }
                              onClick={() => handleLaunchApp(app)}
                              onContextMenu={(e) => openAppContextMenu(e, app)}
                              className="group py-2.5 px-1.5 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer border-none"
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
                      ) : (
                        <div
                          className={`grid grid-cols-4 ${isStartConcept ? "gap-y-3 gap-x-1.5" : "sm:grid-cols-6 gap-1.5"}`}
                        >
                          {pinnedEntries.map((entry) => {
                            const entryKey = getEntryKey(entry);
                            const isDragged =
                              dragState?.kind === "pinned" && dragState.entryKey === entryKey;
                            const activeDrop =
                              dropTarget?.entryKey === entryKey ? dropTarget.zone : null;

                            if (entry.type === "folder") {
                              const folderApps = entry.appIds
                                .map((id) => appById.get(id))
                                .filter((a): a is StartMenuAppItem => Boolean(a));

                              return (
                                <div
                                  key={entry.id}
                                  role="button"
                                  tabIndex={0}
                                  draggable
                                  onClick={() => {
                                    if (!dragState) setOpenFolderId(entry.id);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setOpenFolderId(entry.id);
                                    }
                                  }}
                                  onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = "copyMove";
                                    e.dataTransfer.setData("text/plain", entryKey);
                                    setSodiumDragData(
                                      e,
                                      {
                                        kind: "folder",
                                        name: entry.name,
                                        startFolderId: entry.id,
                                        appIds: entry.appIds,
                                      },
                                      { preserveTextPlain: true },
                                    );
                                    setDragState({ kind: "pinned", entryKey });
                                  }}
                                  onDragOver={(e) => {
                                    if (!dragState || dragState.kind !== "pinned") return;
                                    if (dragState.entryKey === entryKey) return;
                                    e.preventDefault();
                                    const sourceEntry = pinnedEntries.find(
                                      (p) => getEntryKey(p) === dragState.entryKey,
                                    );
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const ratio = (e.clientX - rect.left) / Math.max(1, rect.width);
                                    if (
                                      sourceEntry?.type === "app" &&
                                      ratio >= 0.22 &&
                                      ratio <= 0.78
                                    ) {
                                      setDropTarget({ entryKey, zone: "merge" });
                                    } else {
                                      setDropTarget({
                                        entryKey,
                                        zone: ratio < 0.5 ? "before" : "after",
                                      });
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                      setDropTarget((prev) =>
                                        prev?.entryKey === entryKey ? null : prev,
                                      );
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const zone =
                                      dropTarget?.entryKey === entryKey ? dropTarget.zone : "merge";
                                    handlePinnedEntryDrop(entry, zone);
                                    setDragState(null);
                                    setDropTarget(null);
                                  }}
                                  onDragEnd={() => {
                                    setDragState(null);
                                    setDropTarget(null);
                                  }}
                                  className={`relative group py-2.5 px-1.5 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none ${
                                    isDragged ? "opacity-40 scale-95" : ""
                                  } ${
                                    activeDrop === "merge"
                                      ? "ring-2 ring-[#0078d4] dark:ring-[#4cc2ff] bg-[#0078d4]/15 dark:bg-[#4cc2ff]/15 scale-[1.04]"
                                      : ""
                                  }`}
                                >
                                  {activeDrop === "before" && (
                                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                                  )}
                                  {activeDrop === "after" && (
                                    <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                                  )}
                                  <div
                                    className={`w-9 h-9 rounded-[8px] bg-black/[0.07] dark:bg-white/[0.11] ${
                                      isStartConcept
                                        ? "!border-0 !outline-none"
                                        : "border border-black/[0.08] dark:border-white/[0.14]"
                                    } p-1 grid grid-cols-2 gap-0.5 place-items-center group-hover:scale-105 transition-transform`}
                                  >
                                    {folderApps.slice(0, 4).map((fa) => (
                                      <div
                                        key={fa.id}
                                        className="w-3.5 h-3.5 flex items-center justify-center overflow-hidden"
                                      >
                                        {fa.renderIcon("w-3.5 h-3.5")}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-[11.5px] font-normal text-center leading-tight line-clamp-1 max-w-full">
                                    {entry.name}
                                  </span>
                                </div>
                              );
                            }

                            const app = appById.get(entry.appId);
                            if (!app) return null;

                            return (
                              <div
                                key={app.id}
                                role="button"
                                tabIndex={0}
                                draggable
                                onClick={() => {
                                  if (!dragState) handleLaunchApp(app);
                                }}
                                onContextMenu={(e) => openAppContextMenu(e, app)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleLaunchApp(app);
                                  }
                                }}
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = "copyMove";
                                  e.dataTransfer.setData("text/plain", entryKey);
                                  setSodiumDragData(
                                    e,
                                    {
                                      kind: "app",
                                      appId: app.id,
                                      label: app.label,
                                      route: app.route || "/",
                                      externalUrl: app.externalUrl,
                                    },
                                    { preserveTextPlain: true },
                                  );
                                  setDragState({ kind: "pinned", entryKey });
                                }}
                                onDragOver={(e) => {
                                  if (!dragState || dragState.kind !== "pinned") return;
                                  if (dragState.entryKey === entryKey) return;
                                  e.preventDefault();
                                  const sourceEntry = pinnedEntries.find(
                                    (p) => getEntryKey(p) === dragState.entryKey,
                                  );
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const ratio = (e.clientX - rect.left) / Math.max(1, rect.width);
                                  if (
                                    sourceEntry?.type === "app" &&
                                    ratio >= 0.24 &&
                                    ratio <= 0.76
                                  ) {
                                    setDropTarget({ entryKey, zone: "merge" });
                                  } else {
                                    setDropTarget({
                                      entryKey,
                                      zone: ratio < 0.5 ? "before" : "after",
                                    });
                                  }
                                }}
                                onDragLeave={(e) => {
                                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setDropTarget((prev) =>
                                      prev?.entryKey === entryKey ? null : prev,
                                    );
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const zone =
                                    dropTarget?.entryKey === entryKey ? dropTarget.zone : "before";
                                  handlePinnedEntryDrop(entry, zone);
                                  setDragState(null);
                                  setDropTarget(null);
                                }}
                                onDragEnd={() => {
                                  setDragState(null);
                                  setDropTarget(null);
                                }}
                                className={`relative group py-2.5 px-1.5 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none ${
                                  isDragged ? "opacity-40 scale-95" : ""
                                } ${
                                  activeDrop === "merge"
                                    ? "ring-2 ring-[#0078d4] dark:ring-[#4cc2ff] bg-[#0078d4]/15 dark:bg-[#4cc2ff]/15 scale-[1.04]"
                                    : ""
                                }`}
                              >
                                {activeDrop === "before" && (
                                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                                )}
                                {activeDrop === "after" && (
                                  <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                                )}
                                <div
                                  className={`w-9 h-9 flex items-center justify-center transition-transform ${
                                    activeDrop === "merge"
                                      ? "scale-90 rounded-[8px] bg-black/[0.08] dark:bg-white/[0.14] p-1"
                                      : "group-hover:scale-105"
                                  }`}
                                >
                                  {app.renderIcon("w-8 h-8")}
                                </div>
                                <span className="text-[11.5px] font-normal text-center leading-tight line-clamp-1 max-w-full">
                                  {app.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Matched Live Channels when searching */}
                      {matchedChannels.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                          <div className="text-[12px] font-semibold text-[#6b7280] dark:text-[#9ca3af] mb-2 px-1">
                            Channels
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {matchedChannels.map((ch) => (
                              <button
                                key={ch.id}
                                type="button"
                                draggable
                                onDragStart={(e) =>
                                  setSodiumDragData(e, {
                                    kind: "channel",
                                    channelId: ch.id,
                                    slug: ch.slug,
                                    name: ch.name,
                                    logo: ch.logo,
                                    category: ch.category,
                                  })
                                }
                                onClick={() => {
                                  onSelectChannel(ch);
                                  onLaunchRoute(`/live-tv?channel=${ch.slug}`);
                                  onClose();
                                }}
                                className="h-[44px] px-2.5 rounded-[6px] flex items-center gap-2.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-left border-none"
                              >
                                <img
                                  src={ch.logo}
                                  alt={ch.name}
                                  className="w-6 h-6 object-contain rounded-[4px] shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-[12.5px] font-medium truncate">
                                    {ch.name}
                                  </div>
                                  <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                                    {ch.category}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {query.trim() &&
                        filteredApps.length === 0 &&
                        matchedChannels.length === 0 && (
                          <div className="py-8 text-center text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
                            No apps or channels found for &ldquo;{query}&rdquo;
                          </div>
                        )}
                    </div>

                    {/* Recommended Section */}
                    {!isStartConcept &&
                      !query.trim() &&
                      !showAllApps &&
                      recommendedItems.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2.5 px-1">
                            <h3 className="text-[13.5px] font-semibold text-[#111827] dark:text-white">
                              Recommended
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                onLaunchRoute("/news");
                                onClose();
                              }}
                              className="h-[26px] px-2.5 rounded-[5px] bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-black/[0.05] dark:border-white/[0.06]"
                            >
                              <span>More</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {recommendedItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                draggable
                                onDragStart={(e) => setSodiumDragData(e, item.dragPayload)}
                                onClick={item.onClick}
                                className="h-[48px] px-2.5 rounded-[6px] flex items-center gap-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-left border-none"
                              >
                                {item.icon}
                                <div className="min-w-0 flex-1">
                                  <div className="text-[12.5px] font-medium truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                                    {item.subtitle}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  {isStartConcept && (
                    <div className="w-[292px] shrink-0 overflow-y-auto no-scrollbar">
                      <StartConceptWidgets
                        suggestedApps={suggestedApps}
                        onLaunchApp={handleLaunchApp}
                        onOpenRoute={launchAndClose}
                      />
                    </div>
                  )}
                </div>

                {/* Windows 11 Start Menu Footer */}
                <div className="relative h-[54px] px-6 shrink-0 bg-black/[0.04] dark:bg-black/25 border-t border-black/[0.07] dark:border-white/[0.08] flex items-center justify-between">
                  {/* User Account */}
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchRoute("/auth");
                      onClose();
                    }}
                    className="h-[40px] px-2.5 -ml-2 rounded-[6px] flex items-center gap-2.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none text-left min-w-0"
                  >
                    {isStartConcept ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/20 backdrop-blur-md flex items-center justify-center text-white overflow-hidden shrink-0">
                          {displayAvatar ? (
                            <img
                              src={displayAvatar}
                              alt={displayAccountName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              viewBox="0 0 64 64"
                              fill="none"
                              aria-hidden="true"
                              className="w-[76%] h-[76%] text-white"
                            >
                              <circle cx="32" cy="21.5" r="8.2" fill="currentColor" />
                              <path
                                d="M16.2 40.5c0-4.9 6.3-8.1 15.8-8.1s15.8 3.2 15.8 8.1c0 4.7-6.3 7.7-15.8 7.7s-15.8-3-15.8-7.7z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="text-[12.5px] font-semibold truncate">
                            {displayAccountName}
                          </div>
                          <div className="text-[10.5px] text-[#6b7280] dark:text-white/60 truncate">
                            {displayAccountSubtitle}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0078d4] to-[#4cc2ff] flex items-center justify-center text-white shadow-xs overflow-hidden shrink-0">
                          {displayAvatar ? (
                            <img
                              src={displayAvatar}
                              alt={displayAccountName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-[12.5px] font-medium">{displayAccountName}</span>
                      </>
                    )}
                  </button>

                  {/* Quick Actions: Settings & Power */}
                  <div className="flex items-center gap-1">
                    {isStartConcept && <StartConceptFooterShortcuts onOpenRoute={launchAndClose} />}
                    <button
                      type="button"
                      onClick={() => {
                        onLaunchRoute("/settings");
                        onClose();
                      }}
                      aria-label="Settings"
                      className="w-9 h-9 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none"
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>

                    {!isStartConcept && (
                      <div ref={powerMenuRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPowerMenuOpen((prev) => !prev)}
                          aria-label="Power"
                          aria-haspopup="menu"
                          aria-expanded={isPowerMenuOpen}
                          className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                            isPowerMenuOpen
                              ? "bg-black/10 dark:bg-white/15"
                              : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {isPowerMenuOpen && (
                            <div
                              style={{ overflow: "clip" }}
                              className="absolute right-0 bottom-full mb-2 z-50 fluent-context-menu-wrapper pointer-events-auto"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <motion.div
                                {...(settings.reduceAllMotion
                                  ? {
                                      initial: { opacity: 1 },
                                      animate: { opacity: 1 },
                                      exit: { opacity: 0, transition: { duration: 0 } },
                                    }
                                  : contextMenuUpMotionProps)}
                              >
                                <div
                                  role="menu"
                                  aria-label="Power"
                                  style={flyoutPanelStyle}
                                  className={`w-[228px] p-1.5 ${flyoutPanelClassName} fluent-context-menu shadow-none`}
                                >
                                  <div className="w-full flex flex-col space-y-0.5">
                                    {onLockScreen && (
                                      <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                          setIsPowerMenuOpen(false);
                                          onClose();
                                          onLockScreen();
                                        }}
                                        className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] border-none"
                                      >
                                        <span className="w-4 h-4 shrink-0 flex items-center justify-center text-black dark:text-white">
                                          <Lock className="w-4 h-4" />
                                        </span>
                                        <span className="truncate flex-1">Lock session</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setIsPowerMenuOpen(false);
                                        onClose();
                                        if (onRestartSystem) {
                                          onRestartSystem();
                                        } else {
                                          window.location.reload();
                                        }
                                      }}
                                      className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] border-none"
                                    >
                                      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-black dark:text-white">
                                        <RotateCcw className="w-4 h-4" />
                                      </span>
                                      <span className="truncate flex-1">Restart session</span>
                                    </button>

                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setIsPowerMenuOpen(false);
                                        onClose();
                                        if (onEndSession) {
                                          onEndSession();
                                        } else {
                                          updateSetting("windowsMode", false);
                                        }
                                      }}
                                      className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] border-none"
                                    >
                                      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-black dark:text-white">
                                        <LogOut className="w-4 h-4" />
                                      </span>
                                      <span className="truncate flex-1">End session</span>
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>

                {/* Open Start Folder Modal Overlay */}
                <AnimatePresence>
                  {openFolder && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}
                      onClick={() => setOpenFolderId(null)}
                      onDragOver={(e) => {
                        if (dragState?.kind === "folder-app") {
                          e.preventDefault();
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragState?.kind === "folder-app") {
                          handleRemoveAppFromFolder(dragState.folderId, dragState.appId);
                          setDragState(null);
                          setFolderAppDropTarget(null);
                        }
                      }}
                      className="absolute inset-0 z-30 bg-black/25 dark:bg-black/45 backdrop-blur-[4px] flex items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.94, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        onDragOver={(e) => e.stopPropagation()}
                        style={{
                          backgroundColor: isLightMode
                            ? "rgba(246, 248, 252, 0.94)"
                            : "rgba(36, 39, 46, 0.94)",
                          backdropFilter: "blur(36px) saturate(180%)",
                        }}
                        className="w-full max-w-[380px] rounded-[12px] border border-black/10 dark:border-white/[0.14] p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={openFolder.name}
                            onChange={(e) => handleRenameFolder(openFolder.id, e.target.value)}
                            placeholder="Folder name"
                            className="flex-1 min-w-0 h-8 px-2.5 rounded-[6px] !bg-black/[0.04] dark:!bg-white/[0.07] text-[14px] font-semibold text-[#111827] dark:text-white !outline-none !border-none shadow-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUngroupFolder(openFolder.id)}
                            title="Ungroup folder"
                            className="h-8 px-2.5 rounded-[6px] text-[11.5px] font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] cursor-pointer border-0"
                          >
                            Ungroup
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenFolderId(null)}
                            aria-label="Close folder"
                            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.07] dark:hover:bg-white/[0.1] cursor-pointer border-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto no-scrollbar">
                          {openFolder.appIds.map((appId) => {
                            const fa = appById.get(appId);
                            if (!fa) return null;
                            const isAppDragged =
                              dragState?.kind === "folder-app" && dragState.appId === appId;
                            const appDropSide =
                              folderAppDropTarget?.appId === appId
                                ? folderAppDropTarget.side
                                : null;

                            return (
                              <div
                                key={fa.id}
                                role="button"
                                tabIndex={0}
                                draggable
                                onClick={() => {
                                  if (!dragState) handleLaunchApp(fa);
                                }}
                                onContextMenu={(e) => openAppContextMenu(e, fa)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleLaunchApp(fa);
                                  }
                                }}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.effectAllowed = "copyMove";
                                  e.dataTransfer.setData("text/plain", fa.id);
                                  setSodiumDragData(
                                    e,
                                    {
                                      kind: "app",
                                      appId: fa.id,
                                      label: fa.label,
                                      route: fa.route || "/",
                                      externalUrl: fa.externalUrl,
                                    },
                                    { preserveTextPlain: true },
                                  );
                                  setDragState({
                                    kind: "folder-app",
                                    folderId: openFolder.id,
                                    appId: fa.id,
                                  });
                                }}
                                onDragOver={(e) => {
                                  if (dragState?.kind !== "folder-app" || dragState.appId === fa.id)
                                    return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const side =
                                    e.clientX < rect.left + rect.width / 2 ? "before" : "after";
                                  setFolderAppDropTarget({ appId: fa.id, side });
                                }}
                                onDragLeave={(e) => {
                                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setFolderAppDropTarget((prev) =>
                                      prev?.appId === fa.id ? null : prev,
                                    );
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (dragState?.kind === "folder-app") {
                                    const side =
                                      folderAppDropTarget?.appId === fa.id
                                        ? folderAppDropTarget.side
                                        : "before";
                                    handleReorderFolderApp(
                                      openFolder.id,
                                      dragState.appId,
                                      fa.id,
                                      side,
                                    );
                                  }
                                  setDragState(null);
                                  setFolderAppDropTarget(null);
                                }}
                                onDragEnd={() => {
                                  setDragState(null);
                                  setFolderAppDropTarget(null);
                                }}
                                className={`relative group py-2 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer select-none ${
                                  isAppDragged ? "opacity-40" : ""
                                }`}
                              >
                                {appDropSide === "before" && (
                                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                                )}
                                {appDropSide === "after" && (
                                  <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                                )}
                                <div className="w-8 h-8 flex items-center justify-center">
                                  {fa.renderIcon("w-7 h-7")}
                                </div>
                                <span className="text-[11px] text-center leading-tight line-clamp-1 max-w-full">
                                  {fa.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-[11px] text-center text-black/50 dark:text-white/50">
                          Drag an app outside this box to move it back to Pinned
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <AnimatePresence>
        {appContextMenu &&
          (() => {
            const { app } = appContextMenu;
            const isOnStart = !startUnpinned.includes(app.id);
            const isOnTaskbar = app.route ? isRoutePinnedToTaskbar(taskbarPins, app.route) : false;
            return (
              <WindowsContextMenu
                key={`start-app-ctx-${app.id}-${appContextMenu.x}-${appContextMenu.y}`}
                x={appContextMenu.x}
                y={appContextMenu.y}
                ariaLabel={`${app.label} actions`}
                onClose={() => setAppContextMenu(null)}
                items={[
                  {
                    id: "start-app-open",
                    label: "Open",
                    icon: <ExternalLink className="w-4 h-4" />,
                    onSelect: () => handleLaunchApp(app),
                  },
                  { id: "start-app-div", divider: true },
                  {
                    id: "start-app-start-pin",
                    label: isOnStart ? "Unpin from Start" : "Pin to Start",
                    icon: isOnStart ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
                    onSelect: () =>
                      isOnStart ? pinActions.unpinFromStart(app.id) : pinActions.pinToStart(app.id),
                  },
                  ...(app.route
                    ? [
                        {
                          id: "start-app-taskbar-pin",
                          label: isOnTaskbar ? "Unpin from taskbar" : "Pin to taskbar",
                          icon: isOnTaskbar ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          ),
                          onSelect: () =>
                            isOnTaskbar
                              ? pinActions.unpinFromTaskbar(app.route)
                              : pinActions.pinToTaskbar(app.route, app.label),
                        },
                      ]
                    : []),
                ]}
              />
            );
          })()}
      </AnimatePresence>

      <AnimatePresence>
        {startContextMenu && (
          <WindowsContextMenu
            key={`start-ctx-${startContextMenu.x}-${startContextMenu.y}`}
            x={startContextMenu.x}
            y={startContextMenu.y}
            ariaLabel="Start menu actions"
            onClose={() => setStartContextMenu(null)}
            items={[
              {
                id: "start-toggle-all",
                label: showAllApps ? "Back to Pinned" : "All apps",
                icon: <LayoutGrid className="w-4 h-4" />,
                onSelect: () => setShowAllApps((prev) => !prev),
              },
              {
                id: "start-focus-search",
                label: "Search Start",
                icon: <Search className="w-4 h-4" />,
                onSelect: () => searchInputRef.current?.focus(),
              },
              {
                id: "start-reset-layout",
                label: "Reset Pinned layout",
                icon: <FolderOpen className="w-4 h-4" />,
                onSelect: resetStartLayout,
              },
              { id: "start-div-1", divider: true },
              {
                id: "start-theme",
                label: isLightMode ? "Switch to Dark mode" : "Switch to Light mode",
                icon: isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
                onSelect: () => updateSetting("theme", isLightMode ? "dark" : "light"),
              },
              {
                id: "start-settings",
                label: "Start settings",
                icon: <SettingsIcon className="w-4 h-4" />,
                onSelect: () => {
                  onLaunchRoute("/settings");
                  onClose();
                },
              },
              ...(onRestartOobe
                ? [
                    {
                      id: "start-oobe",
                      label: "Launch OOBE Setup",
                      icon: <Sparkles className="w-4 h-4" />,
                      onSelect: () => {
                        onClose();
                        onRestartOobe();
                      },
                    },
                  ]
                : []),
              { id: "start-div-2", divider: true },
              {
                id: "start-exit-win",
                label: "Exit SodiumOS Mode",
                icon: <LogOut className="w-4 h-4" />,
                danger: true,
                onSelect: () => {
                  updateSetting("windowsMode", false);
                  onClose();
                },
              },
            ]}
          />
        )}
      </AnimatePresence>
    </>
  );
};
