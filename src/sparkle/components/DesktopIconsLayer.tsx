import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Code2,
  Download,
  Edit3,
  ExternalLink,
  FileArchive,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Film,
  FolderOpen,
  Monitor,
  Music,
  Pin,
  PinOff,
  Presentation,
  Settings,
  StickyNote,
  Trash2,
  Tv,
  Upload,
  X,
} from "lucide-react";
import {
  FILE_EXPLORER_ICON_URL,
  Fluent3DArticlesIcon,
  Fluent3DCalculatorIcon,
  Fluent3DCameraIcon,
  Fluent3DCraftmineIcon,
  Fluent3DDiscordIcon,
  Fluent3DDrawsIcon,
  Fluent3DGalleryIcon,
  Fluent3DHomeIcon,
  Fluent3DHtmlWriterIcon,
  Fluent3DNotepadIcon,
  Fluent3DNotesIcon,
  Fluent3DPcSettingsIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DScreenbugIcon,
  Fluent3DSearchIcon,
  Fluent3DSettingsIcon,
  Fluent3DUpdatesIcon,
  Fluent3DWatchIcon,
  Fluent3DWeatherIcon,
} from "./Fluent3DIcons";
import { WindowsContextMenu, type WindowsContextMenuItem } from "./WindowsContextMenu";
import {
  addSodiumPayloadToDesktop,
  computeDesktopLayout,
  DESKTOP_ICONS_UPDATED_EVENT,
  getGridBounds,
  importDeviceDropToDesktop,
  loadDesktopIcons,
  moveDesktopIcon,
  moveIconIntoDesktopFolder,
  pixelToGridCell,
  removeDesktopIcon,
  renameDesktopIcon,
  snapAllDesktopIconsToGrid,
  type DesktopIconItem,
  type DesktopSortBy,
  type DesktopViewSize,
} from "../services/desktopStore";
import {
  getSodiumDragData,
  hasExternalDeviceFiles,
  hasSodiumDragType,
  resolveBlobUrl,
  setSodiumDragData,
} from "../utils/sodiumDragData";
import { isRoutePinnedToTaskbar, pinActions, usePinState } from "../services/pinStore";
import { useNotes } from "../context/NotesContext";
import { showAppToast } from "../utils/toast";
import type { Channel } from "../types";

interface DesktopIconsLayerProps {
  viewSize: DesktopViewSize;
  sortBy: DesktopSortBy;
  autoArrange: boolean;
  snapToGrid: boolean;
  taskbarLocation: string;
  taskbarThickness: number;
  isTaskbarFloating: boolean;
  onLaunchRoute: (route: string, state?: Record<string, unknown>) => void;
  onSelectChannel?: (channel: Channel) => void;
  channels?: Channel[];
  onClearMenus?: () => void;
}

const SODIUM_LOGO_URL = "/assets/aistudio/image_3602759f.png";

function renderAppIcon(item: DesktopIconItem, sizePx: number) {
  const cls = "w-full h-full";
  const r = (item.route || "").toLowerCase();
  const id = (item.appId || "").toLowerCase();

  if (id === "app-file-explorer" || r.startsWith("/file-explorer")) {
    return (
      <img
        src={FILE_EXPLORER_ICON_URL}
        alt={item.name}
        draggable={false}
        style={{ width: sizePx, height: sizePx }}
        className="object-contain select-none pointer-events-none drop-shadow-sm"
      />
    );
  }
  if (id === "app-home" || r === "/" || r === "/home") {
    return <Fluent3DHomeIcon className={cls} />;
  }
  if (
    id === "app-watch" ||
    r.startsWith("/live-tv") ||
    r.startsWith("/channels") ||
    r.startsWith("/favorites")
  ) {
    return <Fluent3DWatchIcon className={cls} />;
  }
  if (id === "app-feed" || r.startsWith("/news") || r.startsWith("/updates")) {
    return <Fluent3DArticlesIcon className={cls} />;
  }
  if (id === "app-gallery" || r.startsWith("/gallery")) {
    return <Fluent3DGalleryIcon className={cls} />;
  }
  if (id === "app-notes" || r.startsWith("/notes") || r.startsWith("/write")) {
    return <Fluent3DNotesIcon className={cls} />;
  }
  if (id === "app-draws" || r.startsWith("/draws")) {
    return <Fluent3DDrawsIcon className={cls} />;
  }
  if (id === "app-screenbox" || r.startsWith("/screenbox") || r.startsWith("/vlc")) {
    return <Fluent3DScreenbugIcon className={cls} />;
  }
  if (id === "app-camera" || r.startsWith("/camera")) {
    return <Fluent3DCameraIcon className={cls} />;
  }
  if (id === "app-calculator" || r.startsWith("/calculator")) {
    return <Fluent3DCalculatorIcon className={cls} />;
  }
  if (id === "app-weather" || r.startsWith("/weather")) {
    return <Fluent3DWeatherIcon className={cls} />;
  }
  if (id === "app-craftmine" || r.startsWith("/craftmine")) {
    return <Fluent3DCraftmineIcon className={cls} />;
  }
  if (id === "app-photopea" || r.startsWith("/photopea")) {
    return <Fluent3DPhotopeaIcon className={cls} />;
  }
  if (id === "app-notepad" || r.startsWith("/notepad")) {
    return <Fluent3DNotepadIcon className={cls} />;
  }
  if (id === "app-html-writer" || r.startsWith("/html-writer")) {
    return <Fluent3DHtmlWriterIcon className={cls} />;
  }
  if (id === "app-pc-settings" || r.startsWith("/pc-settings")) {
    return <Fluent3DPcSettingsIcon className={cls} />;
  }
  if (id === "app-settings" || r.startsWith("/settings")) {
    return <Fluent3DSettingsIcon className={cls} />;
  }
  if (id === "app-search" || r.startsWith("/search")) {
    return <Fluent3DSearchIcon className={cls} />;
  }
  if (id === "app-discord" || item.externalUrl?.includes("discord")) {
    return <Fluent3DDiscordIcon className={cls} />;
  }
  if (id === "app-insider" || r.startsWith("/test")) {
    return <Fluent3DUpdatesIcon className={cls} />;
  }

  return (
    <img
      src={SODIUM_LOGO_URL}
      alt={item.name}
      draggable={false}
      style={{ width: sizePx, height: sizePx }}
      className="object-contain select-none pointer-events-none rounded-[6px]"
    />
  );
}

const Win11FolderGraphic: React.FC<{ sizePx: number }> = ({ sizePx }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    style={{ width: sizePx, height: sizePx }}
    className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none pointer-events-none"
  >
    <defs>
      <linearGradient
        id="desk_win11_folder_back"
        x1="6"
        y1="9"
        x2="42"
        y2="38"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient
        id="desk_win11_folder_front"
        x1="4"
        y1="15"
        x2="44"
        y2="41"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path
      d="M5 12.5C5 10.2909 6.79086 8.5 9 8.5H17.8C19.1 8.5 20.3 9.1 21.1 10.1L23.2 12.8C23.7 13.4 24.4 13.8 25.2 13.8H39C41.2091 13.8 43 15.5909 43 17.8V35.5C43 37.7091 41.2091 39.5 39 39.5H9C6.79086 39.5 5 37.7091 5 35.5V12.5Z"
      fill="url(#desk_win11_folder_back)"
    />
    <rect x="8" y="13" width="32" height="5" rx="1.5" fill="#FFFFFF" fillOpacity="0.9" />
    <path
      d="M4 18.5C4 16.567 5.567 15 7.5 15H40.5C42.433 15 44 16.567 44 18.5V36C44 38.2091 42.2091 40 40 40H8C5.79086 40 4 38.2091 4 36V18.5Z"
      fill="url(#desk_win11_folder_front)"
    />
    <path
      d="M6.5 16H41.5"
      stroke="#FEF9C3"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.75"
    />
  </svg>
);

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "Shortcut";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const DesktopIconsLayer: React.FC<DesktopIconsLayerProps> = ({
  viewSize,
  sortBy,
  autoArrange,
  snapToGrid,
  onLaunchRoute,
  onSelectChannel,
  channels = [],
  onClearMenus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinState = usePinState();
  const { setActiveNoteId } = useNotes();

  const [icons, setIcons] = useState<DesktopIconItem[]>(() => loadDesktopIcons());
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [workspaceSize, setWorkspaceSize] = useState<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight - 64 : 720,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [iconContextMenu, setIconContextMenu] = useState<{
    x: number;
    y: number;
    item: DesktopIconItem;
  } | null>(null);

  const [dragHighlightCell, setDragHighlightCell] = useState<{ col: number; row: number } | null>(
    null,
  );
  const [dragTargetFolderId, setDragTargetFolderId] = useState<string | null>(null);
  const [isExternalDragHover, setIsExternalDragHover] = useState(false);

  const [previewFile, setPreviewFile] = useState<{
    item: DesktopIconItem;
    mediaUrl?: string | undefined;
  } | null>(null);

  // Sync icon list with external updates (File Explorer, multi-tab storage, refresh event)
  useEffect(() => {
    const syncIcons = () => setIcons(loadDesktopIcons());
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "sodium_desktop_icons_v1") {
        syncIcons();
      }
    };
    window.addEventListener(DESKTOP_ICONS_UPDATED_EVENT, syncIcons);
    window.addEventListener("sparkle:desktop-refresh", syncIcons);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DESKTOP_ICONS_UPDATED_EVENT, syncIcons);
      window.removeEventListener("sparkle:desktop-refresh", syncIcons);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Measure workspace dimensions dynamically
  useEffect(() => {
    const el = containerRef.current;
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

  // Resolve persisted IndexedDB blobs for dropped media files
  useEffect(() => {
    let active = true;
    const needed = icons.filter((it) => it.blobId && !resolvedUrls[it.id]);
    if (needed.length === 0) return;

    Promise.all(
      needed.map(async (it) => {
        const url = await resolveBlobUrl(it.blobId, it.mediaUrl || it.thumbnailUrl);
        return { id: it.id, url };
      }),
    )
      .then((results) => {
        if (!active) return;
        const updates: Record<string, string> = {};
        for (const res of results) {
          if (res.url) updates[res.id] = res.url;
        }
        if (Object.keys(updates).length > 0) {
          setResolvedUrls((prev) => ({ ...prev, ...updates }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [icons, resolvedUrls]);

  // Snap icons to grid automatically whenever user turns "Arrange icons to grid" ON
  const prevSnapRef = useRef(snapToGrid);
  useEffect(() => {
    if (!prevSnapRef.current && snapToGrid && !autoArrange) {
      const snapped = snapAllDesktopIconsToGrid({
        workspaceWidth: workspaceSize.width,
        workspaceHeight: workspaceSize.height,
        viewSize,
        sortBy,
        autoArrange,
        snapToGrid,
      });
      setIcons(snapped);
    }
    prevSnapRef.current = snapToGrid;
  }, [snapToGrid, autoArrange, workspaceSize.width, workspaceSize.height, viewSize, sortBy]);

  const layoutConfig = useMemo(
    () => ({
      workspaceWidth: workspaceSize.width,
      workspaceHeight: workspaceSize.height,
      viewSize,
      sortBy,
      autoArrange,
      snapToGrid,
    }),
    [workspaceSize.width, workspaceSize.height, viewSize, sortBy, autoArrange, snapToGrid],
  );

  const positionedIcons = useMemo(
    () => computeDesktopLayout(icons, layoutConfig),
    [icons, layoutConfig],
  );

  const { metrics } = useMemo(
    () => getGridBounds(workspaceSize.width, workspaceSize.height, viewSize),
    [workspaceSize.width, workspaceSize.height, viewSize],
  );

  const openDesktopItem = useCallback(
    async (item: DesktopIconItem) => {
      onClearMenus?.();
      const liveUrl =
        resolvedUrls[item.id] ||
        (item.blobId
          ? await resolveBlobUrl(item.blobId, item.mediaUrl || item.thumbnailUrl)
          : undefined) ||
        item.mediaUrl ||
        item.thumbnailUrl;

      if (item.kind === "app") {
        if (item.externalUrl) {
          showAppToast(`Visit community link: ${item.externalUrl}`, { appName: item.name });
          return;
        }
        if (item.route) {
          onLaunchRoute(item.route, item.routeState);
        }
        return;
      }

      if (item.kind === "setting") {
        onLaunchRoute(item.route || "/pc-settings", item.routeState);
        return;
      }

      if (item.kind === "folder") {
        if (item.galleryFolderId) {
          onLaunchRoute("/gallery", { initialFolderId: item.galleryFolderId });
          return;
        }
        const targetDirId = item.targetDirId || "dir-desktop";
        window.dispatchEvent(
          new CustomEvent("sodium:open-explorer-dir", { detail: { targetDirId } }),
        );
        onLaunchRoute("/file-explorer", { targetDirId });
        return;
      }

      if (item.kind === "channel") {
        const found = channels.find((c) => c.id === item.channelId || c.slug === item.slug);
        if (found && onSelectChannel) onSelectChannel(found);
        onLaunchRoute(`/live-tv?channel=${item.slug || ""}`);
        return;
      }

      if (item.kind === "note") {
        if (item.noteId) setActiveNoteId(item.noteId);
        onLaunchRoute("/notes", { noteId: item.noteId });
        return;
      }

      if (item.kind === "article") {
        onLaunchRoute(`/news/${item.slug || ""}`);
        return;
      }

      // File handling
      const extLower = (item.fileExtension || item.name.split(".").pop() || "").toLowerCase();
      if (
        item.fileKind === "html" ||
        extLower === "html" ||
        extLower === "htm" ||
        item.linkedSource === "html-writer"
      ) {
        let docId = item.linkedId || "";
        try {
          const raw = localStorage.getItem("sparkle_html_writer_files_v1");
          const list = raw
            ? (JSON.parse(raw) as Array<{
                id: string;
                name: string;
                content: string;
                updatedAt: number;
              }>)
            : [];
          if (!docId || !list.some((d) => d.id === docId)) {
            docId = `html-desk-${Date.now()}`;
            const next = [
              {
                id: docId,
                name: item.name,
                content: item.textContent || "",
                updatedAt: Date.now(),
              },
              ...(Array.isArray(list) ? list : []),
            ];
            localStorage.setItem("sparkle_html_writer_files_v1", JSON.stringify(next));
          }
          localStorage.setItem("sparkle_html_writer_active_id_v1", docId);
          window.dispatchEvent(new CustomEvent("sodium:open-html-doc", { detail: { docId } }));
        } catch {
          // ignore
        }
        onLaunchRoute("/html-writer", { htmlDocId: docId });
        return;
      }

      if (
        item.fileKind === "text" ||
        item.fileKind === "code" ||
        item.linkedSource === "notepad" ||
        [
          "txt",
          "md",
          "markdown",
          "json",
          "css",
          "js",
          "ts",
          "tsx",
          "jsx",
          "py",
          "log",
          "csv",
          "xml",
          "yml",
          "yaml",
          "sql",
        ].includes(extLower)
      ) {
        const payload = {
          id: item.explorerEntryId || item.id,
          parentId: "dir-desktop",
          name: item.name,
          textContent: item.textContent ?? "",
          fileExtension: extLower || "txt",
        };
        try {
          localStorage.setItem("sparkle_notepad_open_entry_v1", JSON.stringify(payload));
        } catch {
          // ignore
        }
        window.dispatchEvent(new CustomEvent("sparkle:open-in-notepad", { detail: payload }));
        onLaunchRoute("/notepad");
        return;
      }

      if (item.fileKind === "video" || item.fileKind === "audio") {
        if (liveUrl) {
          const screenboxPayload = {
            id: `desk-media-${item.id}`,
            title: item.name,
            url: liveUrl,
            type: item.fileKind === "audio" ? "audio" : "video",
            format: (item.fileExtension || item.mimeType || "MEDIA").toUpperCase(),
          };
          try {
            localStorage.setItem("sodium_screenbox_open_item_v1", JSON.stringify(screenboxPayload));
          } catch {
            // ignore
          }
          window.dispatchEvent(
            new CustomEvent("sodium:open-in-screenbox", { detail: screenboxPayload }),
          );
        }
        onLaunchRoute("/screenbox");
        return;
      }

      // Images, PDFs, Office docs, Archives, Binaries -> Open in Fluent Desktop Preview modal
      setPreviewFile({ item, mediaUrl: liveUrl });
    },
    [channels, onClearMenus, onLaunchRoute, onSelectChannel, resolvedUrls, setActiveNoteId],
  );

  // Keyboard shortcuts for selected desktop icons (Enter = Open, Delete = Remove, F2 = Rename)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIds.length === 0 || renamingId) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (target?.closest("[data-window-frame]")) return;

      if (e.key === "Enter") {
        const first = icons.find((it) => it.id === selectedIds[0]);
        if (first) {
          e.preventDefault();
          void openDesktopItem(first);
        }
      } else if (e.key === "F2" && selectedIds.length === 1) {
        const targetItem = icons.find((it) => it.id === selectedIds[0]);
        if (targetItem) {
          e.preventDefault();
          setRenamingId(targetItem.id);
          setRenameDraft(targetItem.name);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        let next = icons;
        for (const id of selectedIds) {
          next = removeDesktopIcon(id);
        }
        setIcons(next);
        setSelectedIds([]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [icons, openDesktopItem, renamingId, selectedIds]);

  const handleWorkspaceDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-window-frame]")) {
        setDragHighlightCell(null);
        setIsExternalDragHover(false);
        return;
      }
      const isInternal = hasSodiumDragType(e.dataTransfer);
      const isExternal = hasExternalDeviceFiles(e.dataTransfer);
      if (!isInternal && !isExternal) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = isExternal ? "copy" : "move";
      if (isExternal && !isExternalDragHover) {
        setIsExternalDragHover(true);
      }

      if (!autoArrange && snapToGrid && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const cell = pixelToGridCell(
          relX,
          relY,
          viewSize,
          workspaceSize.width,
          workspaceSize.height,
        );
        setDragHighlightCell(cell);
      } else {
        setDragHighlightCell(null);
      }
    },
    [
      autoArrange,
      isExternalDragHover,
      snapToGrid,
      viewSize,
      workspaceSize.height,
      workspaceSize.width,
    ],
  );

  const handleWorkspaceDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (!related || !containerRef.current?.contains(related)) {
      setDragHighlightCell(null);
      setDragTargetFolderId(null);
      setIsExternalDragHover(false);
    }
  }, []);

  const handleWorkspaceDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-window-frame]")) return;

      const isInternal = hasSodiumDragType(e.dataTransfer);
      const isExternal = hasExternalDeviceFiles(e.dataTransfer);
      if (!isInternal && !isExternal) return;

      e.preventDefault();
      e.stopPropagation();

      setDragHighlightCell(null);
      setDragTargetFolderId(null);
      setIsExternalDragHover(false);
      onClearMenus?.();

      const rect = containerRef.current?.getBoundingClientRect();
      const relX = rect ? e.clientX - rect.left : 24;
      const relY = rect ? e.clientY - rect.top : 24;

      if (isInternal) {
        const payload = getSodiumDragData(e);
        if (!payload) return;
        if (payload.kind === "desktop-icon") {
          const offsetX = payload.dragOffsetX ?? metrics.cellWidth / 2;
          const offsetY = payload.dragOffsetY ?? metrics.cellHeight / 2;
          const next = moveDesktopIcon(
            payload.desktopIconId,
            snapToGrid ? relX : relX - offsetX,
            snapToGrid ? relY : relY - offsetY,
            layoutConfig,
          );
          setIcons(next);
          return;
        }
        const next = addSodiumPayloadToDesktop(payload, layoutConfig, relX, relY);
        setIcons(next);
        return;
      }

      if (isExternal) {
        const next = await importDeviceDropToDesktop(e.dataTransfer, layoutConfig, relX, relY);
        setIcons(next);
      }
    },
    [layoutConfig, metrics.cellHeight, metrics.cellWidth, onClearMenus, snapToGrid],
  );

  const handleFolderDrop = useCallback(
    async (e: React.DragEvent<HTMLButtonElement>, folderItem: DesktopIconItem) => {
      const isInternal = hasSodiumDragType(e.dataTransfer);
      const isExternal = hasExternalDeviceFiles(e.dataTransfer);
      if (!isInternal && !isExternal) return;

      e.preventDefault();
      e.stopPropagation();
      setDragHighlightCell(null);
      setDragTargetFolderId(null);
      setIsExternalDragHover(false);
      onClearMenus?.();

      if (isInternal) {
        const payload = getSodiumDragData(e);
        if (!payload) return;
        if (payload.kind === "desktop-icon") {
          if (payload.desktopIconId === folderItem.id) return;
          const next = moveIconIntoDesktopFolder(payload.desktopIconId, folderItem.id);
          setIcons(next);
          return;
        }
        // Dropping Start/Search/Explorer item directly onto Desktop Folder adds to Desktop unless folder accepts
        const rect = containerRef.current?.getBoundingClientRect();
        const relX = rect ? e.clientX - rect.left : 24;
        const relY = rect ? e.clientY - rect.top : 24;
        const next = addSodiumPayloadToDesktop(payload, layoutConfig, relX, relY);
        setIcons(next);
        return;
      }

      if (isExternal) {
        const next = await importDeviceDropToDesktop(
          e.dataTransfer,
          layoutConfig,
          undefined,
          undefined,
          folderItem.id,
        );
        setIcons(next);
      }
    },
    [layoutConfig, onClearMenus],
  );

  const renderIconGraphic = (item: DesktopIconItem) => {
    const iconPx = metrics.iconSize;
    const liveThumb = resolvedUrls[item.id] || item.thumbnailUrl || item.mediaUrl;

    if (item.kind === "app") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="flex items-center justify-center shrink-0"
        >
          {renderAppIcon(item, iconPx)}
        </div>
      );
    }

    if (item.kind === "folder") {
      return <Win11FolderGraphic sizePx={iconPx} />;
    }

    if (item.kind === "setting") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="flex items-center justify-center shrink-0"
        >
          <Fluent3DPcSettingsIcon className="w-full h-full" />
        </div>
      );
    }

    if (item.kind === "channel") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-white/90 dark:bg-[#23272e]/90 border border-black/10 dark:border-white/15 p-1 flex items-center justify-center shadow-sm overflow-hidden"
        >
          {item.logo ? (
            <img
              src={item.logo}
              alt={item.name}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <Tv className="w-6 h-6 text-[#0078d4]" />
          )}
        </div>
      );
    }

    if (item.kind === "note") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-[#fef08a] to-[#facc15] border border-amber-500/40 flex items-center justify-center shadow-sm"
        >
          <StickyNote className="w-1/2 h-1/2 text-amber-900" />
        </div>
      );
    }

    if (item.kind === "article") {
      return item.coverImage ? (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] overflow-hidden border border-white/25 shadow-sm bg-black/30"
        >
          <img
            src={item.coverImage}
            alt={item.name}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
      ) : (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="flex items-center justify-center shrink-0"
        >
          <Fluent3DArticlesIcon className="w-full h-full" />
        </div>
      );
    }

    // Files
    if (item.fileKind === "image" && liveThumb) {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[6px] overflow-hidden border border-white/35 bg-black/25 shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
        >
          <img
            src={liveThumb}
            alt={item.name}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
      );
    }

    if (item.fileKind === "video") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-sky-500 to-indigo-700 border border-white/20 flex items-center justify-center shadow-sm"
        >
          <Film className="w-1/2 h-1/2 text-white" />
        </div>
      );
    }

    if (item.fileKind === "audio") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-emerald-500 to-teal-700 border border-white/20 flex items-center justify-center shadow-sm"
        >
          <Music className="w-1/2 h-1/2 text-white" />
        </div>
      );
    }

    if (item.fileKind === "html" || item.fileExtension === "html" || item.fileExtension === "htm") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="flex items-center justify-center shrink-0"
        >
          <Fluent3DHtmlWriterIcon className="w-full h-full" />
        </div>
      );
    }

    if (item.fileKind === "code") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-slate-700 to-slate-900 border border-sky-400/40 flex items-center justify-center shadow-sm"
        >
          <FileCode2 className="w-1/2 h-1/2 text-sky-300" />
        </div>
      );
    }

    if (item.fileKind === "pdf") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-rose-500 to-red-700 border border-white/20 flex flex-col items-center justify-center shadow-sm text-white"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[8px] font-bold tracking-wider mt-0.5">PDF</span>
        </div>
      );
    }

    if (item.fileKind === "excel") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-emerald-600 to-green-800 border border-white/20 flex items-center justify-center shadow-sm"
        >
          <FileSpreadsheet className="w-1/2 h-1/2 text-white" />
        </div>
      );
    }

    if (item.fileKind === "ppt") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-orange-500 to-red-600 border border-white/20 flex items-center justify-center shadow-sm"
        >
          <Presentation className="w-1/2 h-1/2 text-white" />
        </div>
      );
    }

    if (item.fileKind === "archive") {
      return (
        <div
          style={{ width: iconPx, height: iconPx }}
          className="rounded-[8px] bg-gradient-to-br from-amber-500 to-amber-700 border border-white/20 flex items-center justify-center shadow-sm"
        >
          <FileArchive className="w-1/2 h-1/2 text-white" />
        </div>
      );
    }

    // Default / text document
    return (
      <div
        style={{ width: iconPx, height: iconPx }}
        className="rounded-[8px] bg-gradient-to-br from-white to-slate-200 border border-slate-400/50 flex flex-col items-center justify-center shadow-sm"
      >
        <FileText className="w-1/2 h-1/2 text-[#0067c0]" />
      </div>
    );
  };

  const buildContextMenuItems = (item: DesktopIconItem): WindowsContextMenuItem[] => {
    const extLower = (item.fileExtension || item.name.split(".").pop() || "").toLowerCase();
    const isHtml = item.fileKind === "html" || extLower === "html" || extLower === "htm";
    const isMedia = item.fileKind === "video" || item.fileKind === "audio";
    const isTextLike =
      item.fileKind === "text" ||
      item.fileKind === "code" ||
      ["txt", "md", "json", "css", "js", "ts", "py", "log", "csv", "xml", "yml"].includes(extLower);

    const list: WindowsContextMenuItem[] = [
      {
        id: "desk-icon-open",
        label: "Open",
        icon: <ExternalLink className="w-4 h-4" />,
        onSelect: () => {
          void openDesktopItem(item);
        },
      },
    ];

    if (isHtml) {
      list.push({
        id: "desk-icon-html",
        label: "Open in HTML Writer",
        icon: <Code2 className="w-4 h-4" />,
        onSelect: () => {
          void openDesktopItem(item);
        },
      });
    } else if (isTextLike) {
      list.push({
        id: "desk-icon-notepad",
        label: "Open with Notepad",
        icon: <FileText className="w-4 h-4" />,
        onSelect: () => {
          void openDesktopItem(item);
        },
      });
    } else if (isMedia) {
      list.push({
        id: "desk-icon-screenbox",
        label: "Open in Screenbox",
        icon: <Film className="w-4 h-4" />,
        onSelect: () => {
          void openDesktopItem(item);
        },
      });
    } else if (item.explorerEntryId || item.targetDirId) {
      list.push({
        id: "desk-icon-explorer",
        label: "Open in File Explorer",
        icon: <FolderOpen className="w-4 h-4" />,
        onSelect: () => {
          const targetDir = item.targetDirId || "dir-desktop";
          window.dispatchEvent(
            new CustomEvent("sodium:open-explorer-dir", { detail: { targetDirId: targetDir } }),
          );
          onLaunchRoute("/file-explorer", { targetDirId: targetDir });
        },
      });
    }

    if (item.appId) {
      const isPinnedStart = !pinState.startUnpinned.includes(item.appId);
      list.push({
        id: "desk-icon-pin-start",
        label: isPinnedStart ? "Unpin from Start" : "Pin to Start",
        icon: isPinnedStart ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
        onSelect: () => {
          if (isPinnedStart) {
            pinActions.unpinFromStart(item.appId!);
            showAppToast(`Unpinned ${item.name} from Start`, { appName: "Start" });
          } else {
            pinActions.pinToStart(item.appId!);
            showAppToast(`Pinned ${item.name} to Start`, { appName: "Start" });
          }
        },
      });
    }

    if (item.route && !item.externalUrl) {
      const isPinnedTaskbar = isRoutePinnedToTaskbar(pinState.taskbarPins, item.route);
      list.push({
        id: "desk-icon-pin-taskbar",
        label: isPinnedTaskbar ? "Unpin from taskbar" : "Pin to taskbar",
        icon: isPinnedTaskbar ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
        onSelect: () => {
          if (isPinnedTaskbar) {
            pinActions.unpinFromTaskbar(item.route!);
            showAppToast(`Unpinned ${item.name} from taskbar`, { appName: "Taskbar" });
          } else {
            pinActions.pinToTaskbar(item.route!, item.name);
            showAppToast(`Pinned ${item.name} to taskbar`, { appName: "Taskbar" });
          }
        },
      });
    }

    list.push(
      { id: "desk-icon-div-1", divider: true },
      {
        id: "desk-icon-rename",
        label: "Rename",
        icon: <Edit3 className="w-4 h-4" />,
        onSelect: () => {
          setRenamingId(item.id);
          setRenameDraft(item.name);
        },
      },
      {
        id: "desk-icon-remove",
        label: "Remove from Desktop",
        icon: <Trash2 className="w-4 h-4" />,
        danger: true,
        onSelect: () => {
          const next = removeDesktopIcon(item.id);
          setIcons(next);
          setSelectedIds((prev) => prev.filter((id) => id !== item.id));
          showAppToast(`Removed "${item.name}" from Desktop`, { appName: "Desktop" });
        },
      },
    );

    return list;
  };

  return (
    <>
      <div
        ref={containerRef}
        data-desktop-icons-layer="true"
        onMouseDown={(e) => {
          const t = e.target as HTMLElement | null;
          if (t && !t.closest("[data-desktop-icon-item]")) {
            setSelectedIds([]);
            setIconContextMenu(null);
            if (renamingId) {
              const next = renameDesktopIcon(renamingId, renameDraft);
              setIcons(next);
              setRenamingId(null);
            }
          }
        }}
        onDragOver={handleWorkspaceDragOver}
        onDragLeave={handleWorkspaceDragLeave}
        onDrop={handleWorkspaceDrop}
        className="absolute inset-0 z-[2] select-none overflow-hidden"
      >
        {/* Grid cell drop highlight */}
        {dragHighlightCell && !autoArrange && snapToGrid && (
          <div
            aria-hidden="true"
            style={{
              left: metrics.padLeft + dragHighlightCell.col * metrics.cellWidth,
              top: metrics.padTop + dragHighlightCell.row * metrics.cellHeight,
              width: metrics.cellWidth - 4,
              height: metrics.cellHeight - 4,
            }}
            className="absolute rounded-[8px] border border-[#60cdff]/80 bg-[#60cdff]/15 backdrop-blur-sm pointer-events-none transition-all duration-75"
          />
        )}

        {/* External file drag overlay banner */}
        {isExternalDragHover && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-[15] px-4 py-2 rounded-[8px] bg-[#20242c]/90 border border-[#60cdff]/60 text-white text-[12.5px] font-medium flex items-center gap-2 shadow-lg backdrop-blur-md"
          >
            <Upload className="w-4 h-4 text-[#60cdff]" />
            <span>Drop files or folders from your device to import onto Desktop</span>
          </div>
        )}

        {/* Positioned Desktop Icons */}
        {positionedIcons.map(({ item, x, y }) => {
          const isSelected = selectedIds.includes(item.id);
          const isRenaming = renamingId === item.id;
          const isFolderDropTarget = dragTargetFolderId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              data-desktop-icon-item="true"
              data-icon-id={item.id}
              draggable={!isRenaming}
              onDragStart={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setSodiumDragData(e, {
                  kind: "desktop-icon",
                  desktopIconId: item.id,
                  name: item.name,
                  itemKind: item.kind,
                  dragOffsetX: e.clientX - rect.left,
                  dragOffsetY: e.clientY - rect.top,
                });
              }}
              onDragOver={
                item.kind === "folder"
                  ? (e) => {
                      const isInternal = hasSodiumDragType(e.dataTransfer);
                      const isExternal = hasExternalDeviceFiles(e.dataTransfer);
                      if (!isInternal && !isExternal) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setDragTargetFolderId(item.id);
                      setDragHighlightCell(null);
                    }
                  : undefined
              }
              onDragLeave={
                item.kind === "folder"
                  ? () => {
                      setDragTargetFolderId((prev) => (prev === item.id ? null : prev));
                    }
                  : undefined
              }
              onDrop={item.kind === "folder" ? (e) => void handleFolderDrop(e, item) : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onClearMenus?.();
                setIconContextMenu(null);
                if (e.ctrlKey || e.metaKey) {
                  setSelectedIds((prev) =>
                    prev.includes(item.id)
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id],
                  );
                } else {
                  setSelectedIds([item.id]);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                void openDesktopItem(item);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearMenus?.();
                setSelectedIds([item.id]);
                setIconContextMenu({ x: e.clientX, y: e.clientY, item });
              }}
              style={{
                left: x,
                top: y,
                width: metrics.cellWidth - 4,
                minHeight: metrics.cellHeight - 4,
              }}
              title={item.name}
              className={`absolute flex flex-col items-center justify-start px-1.5 pt-2 pb-1.5 rounded-[6px] border transition-colors cursor-default outline-none text-center group ${
                isFolderDropTarget
                  ? "bg-[#60cdff]/30 border-[#60cdff] ring-2 ring-[#60cdff]/60"
                  : isSelected
                    ? "bg-white/22 border-white/45 backdrop-blur-[4px]"
                    : "bg-transparent border-transparent hover:bg-white/12 hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-center mb-1.5 pointer-events-none">
                {renderIconGraphic(item)}
              </div>

              {isRenaming ? (
                <input
                  type="text"
                  autoFocus
                  value={renameDraft}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      const next = renameDesktopIcon(item.id, renameDraft);
                      setIcons(next);
                      setRenamingId(null);
                    } else if (e.key === "Escape") {
                      setRenamingId(null);
                    }
                  }}
                  onBlur={() => {
                    const next = renameDesktopIcon(item.id, renameDraft);
                    setIcons(next);
                    setRenamingId(null);
                  }}
                  className="w-full px-1 py-0.5 text-[11.5px] leading-tight text-center bg-black/80 text-white border border-[#60cdff] rounded-[4px] outline-none"
                />
              ) : (
                <span
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,0.8)" }}
                  className={`w-full text-[11.5px] leading-[1.25] font-normal text-white break-words ${
                    isSelected ? "line-clamp-3" : "line-clamp-2"
                  }`}
                >
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Icon Right-Click Context Menu */}
      {iconContextMenu && (
        <WindowsContextMenu
          key={`desk-icon-ctx-${iconContextMenu.item.id}-${iconContextMenu.x}`}
          x={iconContextMenu.x}
          y={iconContextMenu.y}
          ariaLabel={`${iconContextMenu.item.name} actions`}
          items={buildContextMenuItems(iconContextMenu.item)}
          onClose={() => setIconContextMenu(null)}
        />
      )}

      {/* Fluent Desktop Preview Modal for Images, PDFs, Office Docs & Binary Imports */}
      {previewFile &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onMouseDown={() => setPreviewFile(null)}
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-[780px] max-h-[86vh] rounded-[12px] bg-[#f7f7f9] dark:bg-[#20242b] border border-black/10 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden text-[#111827] dark:text-white"
            >
              <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Monitor className="w-4 h-4 text-[#0078d4] dark:text-[#60cdff] shrink-0" />
                  <span className="font-semibold text-[13.5px] truncate">
                    {previewFile.item.name}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-[5px] bg-black/5 dark:bg-white/10 opacity-75 shrink-0">
                    {formatBytes(previewFile.item.sizeBytes)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {previewFile.item.fileKind === "image" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewFile(null);
                        onLaunchRoute("/gallery");
                      }}
                      className="px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      Open in Gallery
                    </button>
                  )}
                  {previewFile.mediaUrl && (
                    <a
                      href={previewFile.mediaUrl}
                      download={previewFile.item.name}
                      className="px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium bg-[#0078d4] text-white hover:bg-[#0067b8] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    aria-label="Close preview"
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/[0.03] dark:bg-black/25">
                {previewFile.item.fileKind === "image" && previewFile.mediaUrl ? (
                  <img
                    src={previewFile.mediaUrl}
                    alt={previewFile.item.name}
                    className="max-w-full max-h-[65vh] object-contain rounded-[8px] shadow"
                  />
                ) : previewFile.item.fileKind === "pdf" && previewFile.mediaUrl ? (
                  <iframe
                    src={previewFile.mediaUrl}
                    title={previewFile.item.name}
                    className="w-full h-[64vh] rounded-[8px] border border-black/10 dark:border-white/10 bg-white"
                  />
                ) : previewFile.item.textContent ? (
                  <pre className="w-full max-h-[60vh] overflow-auto p-4 rounded-[8px] bg-white dark:bg-[#16191f] border border-black/10 dark:border-white/10 text-[12.5px] font-mono whitespace-pre-wrap break-words">
                    {previewFile.item.textContent}
                  </pre>
                ) : (
                  <div className="text-center py-10 px-6 space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-[10px] bg-black/5 dark:bg-white/10 flex items-center justify-center">
                      <Settings className="w-6 h-6 opacity-70" />
                    </div>
                    <div className="text-[14px] font-semibold">{previewFile.item.name}</div>
                    <div className="text-[12px] opacity-70">
                      Type: {previewFile.item.mimeType || previewFile.item.fileKind || "File"} •
                      Size: {formatBytes(previewFile.item.sizeBytes)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
