import { START_APPS } from "../data/startApps";
import { showAppToast } from "../utils/toast";
import {
  deleteBlobFromStore,
  extractDeviceDropNodes,
  processImportedDeviceFile,
  type DeviceDropTreeNode,
  type SodiumDragPayload,
} from "../utils/sodiumDragData";

export type DesktopViewSize = "large" | "medium" | "small";
export type DesktopSortBy = "name" | "size" | "type" | "modified";

export interface DesktopIconItem {
  id: string;
  kind:
    | "app"
    | "file"
    | "folder"
    | "channel"
    | "note"
    | "article"
    | "setting"
    | "system-computer"
    | "system-recycle-trash";
  name: string;
  gridCol: number;
  gridRow: number;
  freeX?: number | undefined;
  freeY?: number | undefined;
  route?: string | undefined;
  routeState?: Record<string, unknown> | undefined;
  externalUrl?: string | undefined;
  appId?: string | undefined;
  explorerEntryId?: string | undefined;
  targetDirId?: string | undefined;
  galleryFolderId?: string | undefined;
  fileKind?: string | undefined;
  fileExtension?: string | undefined;
  mimeType?: string | undefined;
  sizeBytes?: number | undefined;
  modifiedAt: number;
  mediaUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
  blobId?: string | undefined;
  textContent?: string | undefined;
  linkedSource?: string | undefined;
  linkedId?: string | undefined;
  isBinary?: boolean | undefined;
  channelId?: string | undefined;
  slug?: string | undefined;
  logo?: string | undefined;
  coverImage?: string | undefined;
  noteId?: string | undefined;
  colorId?: string | undefined;
  articleId?: string | undefined;
}

export interface DesktopGridMetrics {
  cellWidth: number;
  cellHeight: number;
  iconSize: number;
  padLeft: number;
  padTop: number;
  padRight: number;
  padBottom: number;
}

export interface DesktopLayoutConfig {
  workspaceWidth: number;
  workspaceHeight: number;
  viewSize: DesktopViewSize;
  sortBy: DesktopSortBy;
  autoArrange: boolean;
  snapToGrid: boolean;
}

export interface PositionedDesktopIcon {
  item: DesktopIconItem;
  col: number;
  row: number;
  x: number;
  y: number;
}

export const DESKTOP_ICONS_KEY = "sodium_desktop_icons_v1";
export const DESKTOP_SYS_ICONS_SEEDED_KEY = "sodium_desktop_sys_icons_seeded_v1";
export const RECYCLE_TRASH_KEY = "sodium_recycle_trash_v1";
export const DESKTOP_WIDGETS_KEY = "sodium_desktop_widgets_v1";
export const DESKTOP_AUTO_ARRANGE_KEY = "sodium_desktop_auto_arrange";
export const DESKTOP_SNAP_TO_GRID_KEY = "sodium_desktop_snap_to_grid";
export const CUSTOM_FS_STORAGE_KEY = "sparkle_file_explorer_v1";
export const DESKTOP_ICONS_UPDATED_EVENT = "sodium:desktop-icons-updated";
export const RECYCLE_TRASH_UPDATED_EVENT = "sodium:recycle-trash-updated";
export const DESKTOP_WIDGETS_UPDATED_EVENT = "sodium:desktop-widgets-updated";

export interface RecycleTrashItem {
  id: string;
  deletedAt: number;
  originalDesktopIcon: DesktopIconItem;
}

export interface DesktopPinnedWidget {
  id: string;
  widgetId: string;
  x: number;
  y: number;
}

export interface CustomExplorerRecord {
  id: string;
  parentId: string;
  name: string;
  kind: string;
  sizeBytes?: number | undefined;
  modifiedAt: number;
  locationLabel: string;
  pathLabel: string;
  status?: "synced" | "cloud" | "local" | undefined;
  isFavorite?: boolean | undefined;
  thumbnailUrl?: string | undefined;
  mediaUrl?: string | undefined;
  blobId?: string | undefined;
  mimeType?: string | undefined;
  fileExtension?: string | undefined;
  isBinary?: boolean | undefined;
  dimensions?: { width: number; height: number } | undefined;
  textContent?: string | undefined;
  targetRoute?: string | undefined;
  targetRouteState?: Record<string, unknown> | undefined;
  linkedSource?: string | undefined;
  linkedId?: string | undefined;
  targetDirId?: string | undefined;
  isImportedFromDevice?: boolean | undefined;
}

export const COMPUTER_DESKTOP_ICON_ID = "desk-sys-computer";
export const RECYCLE_TRASH_DESKTOP_ICON_ID = "desk-sys-recycle-trash";

export const DEFAULT_DESKTOP_ICONS: DesktopIconItem[] = [
  {
    id: COMPUTER_DESKTOP_ICON_ID,
    kind: "system-computer",
    name: "Computer",
    route: "/file-explorer",
    targetDirId: "dir-this-pc",
    gridCol: 0,
    gridRow: 0,
    modifiedAt: 1740000000000,
  },
  {
    id: RECYCLE_TRASH_DESKTOP_ICON_ID,
    kind: "system-recycle-trash",
    name: "Recycle Trash",
    route: "/file-explorer",
    targetDirId: "dir-recycle-trash",
    gridCol: 0,
    gridRow: 1,
    modifiedAt: 1740000000500,
  },
  {
    id: "desk-seed-file-explorer",
    kind: "app",
    appId: "app-file-explorer",
    name: "File Explorer",
    route: "/file-explorer",
    gridCol: 0,
    gridRow: 2,
    sizeBytes: 256000,
    modifiedAt: 1740000001000,
  },
  {
    id: "desk-seed-pc-settings",
    kind: "app",
    appId: "app-pc-settings",
    name: "PC Settings",
    route: "/pc-settings",
    gridCol: 0,
    gridRow: 3,
    sizeBytes: 128000,
    modifiedAt: 1740000002000,
  },
  {
    id: "desk-seed-html-writer",
    kind: "app",
    appId: "app-html-writer",
    name: "HTML Writer Studio",
    route: "/html-writer",
    gridCol: 0,
    gridRow: 4,
    sizeBytes: 256000,
    modifiedAt: 1740000003000,
  },
  {
    id: "desk-seed-welcome-txt",
    kind: "file",
    explorerEntryId: "sys-desk-welcome",
    name: "Welcome to Build 26335.txt",
    gridCol: 0,
    gridRow: 5,
    fileKind: "text",
    fileExtension: "txt",
    sizeBytes: 4200,
    modifiedAt: 1740000004000,
    linkedSource: "notepad",
    textContent:
      "Sodium OS — Insider Preview Build 26335\n\nIncludes:\n- WinUI 3 File Explorer with Tabs & Details Pane\n- Mica Widgets Dashboard\n- HTML Writer Live Code Editor\n- PC Settings & Quick Controls\n- Universal Drag & Drop to Desktop and Device File Import",
  },
];

export function getDesktopGridMetrics(viewSize: DesktopViewSize): DesktopGridMetrics {
  switch (viewSize) {
    case "large":
      return {
        cellWidth: 112,
        cellHeight: 118,
        iconSize: 56,
        padLeft: 14,
        padTop: 14,
        padRight: 14,
        padBottom: 14,
      };
    case "small":
      return {
        cellWidth: 78,
        cellHeight: 84,
        iconSize: 32,
        padLeft: 12,
        padTop: 12,
        padRight: 12,
        padBottom: 12,
      };
    case "medium":
    default:
      return {
        cellWidth: 94,
        cellHeight: 102,
        iconSize: 44,
        padLeft: 14,
        padTop: 14,
        padRight: 14,
        padBottom: 14,
      };
  }
}

export function getGridBounds(
  workspaceWidth: number,
  workspaceHeight: number,
  viewSize: DesktopViewSize,
) {
  const m = getDesktopGridMetrics(viewSize);
  const availW = Math.max(m.cellWidth, workspaceWidth - m.padLeft - m.padRight);
  const availH = Math.max(m.cellHeight, workspaceHeight - m.padTop - m.padBottom);
  const cols = Math.max(1, Math.floor(availW / m.cellWidth));
  const rows = Math.max(1, Math.floor(availH / m.cellHeight));
  return { cols, rows, metrics: m };
}

export function pixelToGridCell(
  x: number,
  y: number,
  viewSize: DesktopViewSize,
  workspaceWidth: number,
  workspaceHeight: number,
): { col: number; row: number } {
  const { cols, rows, metrics } = getGridBounds(workspaceWidth, workspaceHeight, viewSize);
  const rawCol = Math.floor((x - metrics.padLeft) / metrics.cellWidth);
  const rawRow = Math.floor((y - metrics.padTop) / metrics.cellHeight);
  return {
    col: Math.max(0, Math.min(cols - 1, rawCol)),
    row: Math.max(0, Math.min(rows - 1, rawRow)),
  };
}

export function findNearestFreeGridCell(
  occupied: Set<string>,
  targetCol: number,
  targetRow: number,
  cols: number,
  rows: number,
): { col: number; row: number } {
  const clampedCol = Math.max(0, Math.min(cols - 1, targetCol));
  const clampedRow = Math.max(0, Math.min(rows - 1, targetRow));
  const startKey = `${clampedCol}:${clampedRow}`;
  if (!occupied.has(startKey)) {
    return { col: clampedCol, row: clampedRow };
  }

  let best: { col: number; row: number; dist: number } | null = null;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const key = `${c}:${r}`;
      if (occupied.has(key)) continue;
      const dc = c - clampedCol;
      const dr = r - clampedRow;
      const dist = dc * dc + dr * dr;
      if (!best || dist < best.dist) {
        best = { col: c, row: r, dist };
      }
    }
  }
  if (best) return { col: best.col, row: best.row };

  // Overflow safely to next column if viewport is packed
  let col = cols;
  while (true) {
    for (let r = 0; r < rows; r++) {
      const key = `${col}:${r}`;
      if (!occupied.has(key)) return { col, row: r };
    }
    col += 1;
  }
}

export function sortDesktopItems(
  items: DesktopIconItem[],
  sortBy: DesktopSortBy,
): DesktopIconItem[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const aIsFolder = a.kind === "folder" ? 0 : 1;
    const bIsFolder = b.kind === "folder" ? 0 : 1;
    if (sortBy === "name") {
      if (aIsFolder !== bIsFolder) return aIsFolder - bIsFolder;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (sortBy === "size") {
      return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
    }
    if (sortBy === "type") {
      const typeA = `${a.kind}:${a.fileExtension ?? a.fileKind ?? ""}`;
      const typeB = `${b.kind}:${b.fileExtension ?? b.fileKind ?? ""}`;
      const cmp = typeA.localeCompare(typeB);
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
    }
    if (sortBy === "modified") {
      return (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0);
    }
    return 0;
  });
  return copy;
}

export function computeDesktopLayout(
  items: DesktopIconItem[],
  config: DesktopLayoutConfig,
): PositionedDesktopIcon[] {
  const { cols, rows, metrics } = getGridBounds(
    config.workspaceWidth,
    config.workspaceHeight,
    config.viewSize,
  );

  if (config.autoArrange) {
    const sorted = sortDesktopItems(items, config.sortBy);
    return sorted.map((item, idx) => {
      const col = Math.floor(idx / rows);
      const row = idx % rows;
      return {
        item,
        col,
        row,
        x: metrics.padLeft + col * metrics.cellWidth,
        y: metrics.padTop + row * metrics.cellHeight,
      };
    });
  }

  if (config.snapToGrid) {
    const occupied = new Set<string>();
    const result: PositionedDesktopIcon[] = [];
    for (const item of items) {
      const cell = findNearestFreeGridCell(occupied, item.gridCol, item.gridRow, cols, rows);
      occupied.add(`${cell.col}:${cell.row}`);
      result.push({
        item,
        col: cell.col,
        row: cell.row,
        x: metrics.padLeft + cell.col * metrics.cellWidth,
        y: metrics.padTop + cell.row * metrics.cellHeight,
      });
    }
    return result;
  }

  // Free placement mode (snapToGrid === false && autoArrange === false)
  const maxX = Math.max(
    metrics.padLeft,
    config.workspaceWidth - metrics.cellWidth - metrics.padRight,
  );
  const maxY = Math.max(
    metrics.padTop,
    config.workspaceHeight - metrics.cellHeight - metrics.padBottom,
  );
  return items.map((item) => {
    const rawX = item.freeX ?? metrics.padLeft + item.gridCol * metrics.cellWidth;
    const rawY = item.freeY ?? metrics.padTop + item.gridRow * metrics.cellHeight;
    const x = Math.max(metrics.padLeft, Math.min(maxX, rawX));
    const y = Math.max(metrics.padTop, Math.min(maxY, rawY));
    return {
      item,
      col: item.gridCol,
      row: item.gridRow,
      x,
      y,
    };
  });
}

// ============================================================================
// Persistence Helpers
// ============================================================================

export function loadAutoArrange(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DESKTOP_AUTO_ARRANGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // ignore storage errors
  }
  return false; // off by default
}

export function saveAutoArrange(val: boolean): void {
  try {
    localStorage.setItem(DESKTOP_AUTO_ARRANGE_KEY, String(val));
  } catch {
    // ignore
  }
}

export function loadSnapToGrid(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(DESKTOP_SNAP_TO_GRID_KEY);
    if (raw === "false") return false;
    if (raw === "true") return true;
  } catch {
    // ignore
  }
  return true; // on by default
}

export function saveSnapToGrid(val: boolean): void {
  try {
    localStorage.setItem(DESKTOP_SNAP_TO_GRID_KEY, String(val));
  } catch {
    // ignore
  }
}

function ensureSystemDesktopIcons(list: DesktopIconItem[]): DesktopIconItem[] {
  if (typeof window === "undefined") return list;
  try {
    if (localStorage.getItem(DESKTOP_SYS_ICONS_SEEDED_KEY) === "1") {
      return list;
    }
    const next = [...list];
    const occupied = new Set(next.map((it) => `${it.gridCol}:${it.gridRow}`));
    const sysTemplates = DEFAULT_DESKTOP_ICONS.filter(
      (it) => it.kind === "system-computer" || it.kind === "system-recycle-trash",
    );
    let mutated = false;
    for (const tpl of sysTemplates) {
      if (!next.some((it) => it.id === tpl.id || it.kind === tpl.kind)) {
        const cell = findNearestFreeGridCell(occupied, tpl.gridCol, tpl.gridRow, 10, 8);
        occupied.add(`${cell.col}:${cell.row}`);
        next.unshift({ ...tpl, gridCol: cell.col, gridRow: cell.row });
        mutated = true;
      }
    }
    localStorage.setItem(DESKTOP_SYS_ICONS_SEEDED_KEY, "1");
    if (mutated) {
      localStorage.setItem(DESKTOP_ICONS_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    return list;
  }
}

export function loadDesktopIcons(): DesktopIconItem[] {
  if (typeof window === "undefined") return [...DEFAULT_DESKTOP_ICONS];
  try {
    const raw = localStorage.getItem(DESKTOP_ICONS_KEY);
    if (!raw) {
      const defaults = [...DEFAULT_DESKTOP_ICONS];
      localStorage.setItem(DESKTOP_SYS_ICONS_SEEDED_KEY, "1");
      return defaults;
    }
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return ensureSystemDesktopIcons(parsed as DesktopIconItem[]);
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_DESKTOP_ICONS];
}

export function saveDesktopIcons(items: DesktopIconItem[]): void {
  try {
    localStorage.setItem(DESKTOP_SYS_ICONS_SEEDED_KEY, "1");
    localStorage.setItem(DESKTOP_ICONS_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(DESKTOP_ICONS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function loadCustomExplorerEntries(): CustomExplorerRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_FS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomExplorerRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomExplorerEntries(entries: CustomExplorerRecord[]): void {
  try {
    localStorage.setItem(CUSTOM_FS_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent("sparkle:file-explorer-fs-updated"));
  } catch {
    // ignore
  }
}

function getTargetPlacement(
  items: DesktopIconItem[],
  config: DesktopLayoutConfig,
  dropX?: number,
  dropY?: number,
): { col: number; row: number; freeX: number; freeY: number } {
  const { cols, rows, metrics } = getGridBounds(
    config.workspaceWidth,
    config.workspaceHeight,
    config.viewSize,
  );
  const occupied = new Set(items.map((it) => `${it.gridCol}:${it.gridRow}`));
  const desired =
    dropX !== undefined && dropY !== undefined
      ? pixelToGridCell(
          dropX,
          dropY,
          config.viewSize,
          config.workspaceWidth,
          config.workspaceHeight,
        )
      : { col: 0, row: 0 };

  const cell = findNearestFreeGridCell(occupied, desired.col, desired.row, cols, rows);
  const freeX =
    dropX !== undefined
      ? Math.max(metrics.padLeft, dropX - metrics.cellWidth / 2)
      : metrics.padLeft + cell.col * metrics.cellWidth;
  const freeY =
    dropY !== undefined
      ? Math.max(metrics.padTop, dropY - metrics.cellHeight / 2)
      : metrics.padTop + cell.row * metrics.cellHeight;
  return { col: cell.col, row: cell.row, freeX, freeY };
}

function findUniqueDesktopName(baseName: string, existingNames: Set<string>): string {
  if (!existingNames.has(baseName)) return baseName;
  const dotIdx = baseName.lastIndexOf(".");
  const hasExt = dotIdx > 0;
  const stem = hasExt ? baseName.slice(0, dotIdx) : baseName;
  const ext = hasExt ? baseName.slice(dotIdx) : "";
  let i = 2;
  while (existingNames.has(`${stem} (${i})${ext}`)) {
    i += 1;
  }
  return `${stem} (${i})${ext}`;
}

export function moveDesktopIcon(
  iconId: string,
  dropX: number,
  dropY: number,
  config: DesktopLayoutConfig,
): DesktopIconItem[] {
  const items = loadDesktopIcons();
  const target = items.find((it) => it.id === iconId);
  if (!target) return items;

  const { cols, rows, metrics } = getGridBounds(
    config.workspaceWidth,
    config.workspaceHeight,
    config.viewSize,
  );

  if (config.autoArrange) {
    return items;
  }

  if (config.snapToGrid) {
    const desired = pixelToGridCell(
      dropX,
      dropY,
      config.viewSize,
      config.workspaceWidth,
      config.workspaceHeight,
    );
    const othersOccupied = new Set(
      items.filter((it) => it.id !== iconId).map((it) => `${it.gridCol}:${it.gridRow}`),
    );
    const cell = findNearestFreeGridCell(othersOccupied, desired.col, desired.row, cols, rows);
    const next = items.map((it) =>
      it.id === iconId
        ? {
            ...it,
            gridCol: cell.col,
            gridRow: cell.row,
            freeX: metrics.padLeft + cell.col * metrics.cellWidth,
            freeY: metrics.padTop + cell.row * metrics.cellHeight,
          }
        : it,
    );
    saveDesktopIcons(next);
    return next;
  }

  const maxX = Math.max(
    metrics.padLeft,
    config.workspaceWidth - metrics.cellWidth - metrics.padRight,
  );
  const maxY = Math.max(
    metrics.padTop,
    config.workspaceHeight - metrics.cellHeight - metrics.padBottom,
  );
  const clampedX = Math.max(metrics.padLeft, Math.min(maxX, dropX));
  const clampedY = Math.max(metrics.padTop, Math.min(maxY, dropY));
  const approxCell = pixelToGridCell(
    clampedX + metrics.cellWidth / 2,
    clampedY + metrics.cellHeight / 2,
    config.viewSize,
    config.workspaceWidth,
    config.workspaceHeight,
  );

  const next = items.map((it) =>
    it.id === iconId
      ? {
          ...it,
          freeX: clampedX,
          freeY: clampedY,
          gridCol: approxCell.col,
          gridRow: approxCell.row,
        }
      : it,
  );
  saveDesktopIcons(next);
  return next;
}

export function snapAllDesktopIconsToGrid(config: DesktopLayoutConfig): DesktopIconItem[] {
  const items = loadDesktopIcons();
  const { cols, rows, metrics } = getGridBounds(
    config.workspaceWidth,
    config.workspaceHeight,
    config.viewSize,
  );
  const occupied = new Set<string>();
  const next = items.map((it) => {
    const rawX = it.freeX ?? metrics.padLeft + it.gridCol * metrics.cellWidth;
    const rawY = it.freeY ?? metrics.padTop + it.gridRow * metrics.cellHeight;
    const desired = pixelToGridCell(
      rawX + metrics.cellWidth / 2,
      rawY + metrics.cellHeight / 2,
      config.viewSize,
      config.workspaceWidth,
      config.workspaceHeight,
    );
    const cell = findNearestFreeGridCell(occupied, desired.col, desired.row, cols, rows);
    occupied.add(`${cell.col}:${cell.row}`);
    return {
      ...it,
      gridCol: cell.col,
      gridRow: cell.row,
      freeX: metrics.padLeft + cell.col * metrics.cellWidth,
      freeY: metrics.padTop + cell.row * metrics.cellHeight,
    };
  });
  saveDesktopIcons(next);
  return next;
}

export function renameDesktopIcon(iconId: string, newName: string): DesktopIconItem[] {
  const trimmed = newName.trim();
  const items = loadDesktopIcons();
  if (!trimmed) return items;

  const target = items.find((it) => it.id === iconId);
  const next = items.map((it) =>
    it.id === iconId ? { ...it, name: trimmed, modifiedAt: Date.now() } : it,
  );
  saveDesktopIcons(next);

  if (target?.explorerEntryId) {
    const entries = loadCustomExplorerEntries();
    const updated = entries.map((e) =>
      e.id === target.explorerEntryId ? { ...e, name: trimmed, modifiedAt: Date.now() } : e,
    );
    saveCustomExplorerEntries(updated);
  }
  return next;
}

export function removeDesktopIcon(iconId: string): DesktopIconItem[] {
  const items = loadDesktopIcons();
  const target = items.find((it) => it.id === iconId);
  if (target && (target.kind === "system-computer" || target.kind === "system-recycle-trash")) {
    return items;
  }
  const next = items.filter((it) => it.id !== iconId);
  saveDesktopIcons(next);
  if (target?.blobId) {
    void deleteBlobFromStore(target.blobId);
  }
  return next;
}

export function loadRecycleTrash(): RecycleTrashItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECYCLE_TRASH_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecycleTrashItem[]) : [];
  } catch {
    return [];
  }
}

export function saveRecycleTrash(items: RecycleTrashItem[]): void {
  try {
    localStorage.setItem(RECYCLE_TRASH_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(RECYCLE_TRASH_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function moveDesktopIconToTrash(iconId: string): {
  icons: DesktopIconItem[];
  trash: RecycleTrashItem[];
  moved?: DesktopIconItem;
} {
  const items = loadDesktopIcons();
  const target = items.find((it) => it.id === iconId);
  const currentTrash = loadRecycleTrash();
  if (!target || target.kind === "system-computer" || target.kind === "system-recycle-trash") {
    return { icons: items, trash: currentTrash };
  }
  const nextIcons = items.filter((it) => it.id !== iconId);
  const trashEntry: RecycleTrashItem = {
    id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deletedAt: Date.now(),
    originalDesktopIcon: target,
  };
  const nextTrash = [trashEntry, ...currentTrash];
  saveDesktopIcons(nextIcons);
  saveRecycleTrash(nextTrash);
  return { icons: nextIcons, trash: nextTrash, moved: target };
}

export function restoreFromRecycleTrash(
  trashId: string,
  config?: DesktopLayoutConfig,
): { icons: DesktopIconItem[]; trash: RecycleTrashItem[] } {
  const currentTrash = loadRecycleTrash();
  const target = currentTrash.find((t) => t.id === trashId);
  const currentIcons = loadDesktopIcons();
  if (!target) return { icons: currentIcons, trash: currentTrash };

  const layoutCfg: DesktopLayoutConfig = config || {
    workspaceWidth: typeof window !== "undefined" ? window.innerWidth : 1280,
    workspaceHeight: typeof window !== "undefined" ? window.innerHeight - 64 : 720,
    viewSize: "medium",
    sortBy: "name",
    autoArrange: loadAutoArrange(),
    snapToGrid: loadSnapToGrid(),
  };
  const { cols, rows, metrics } = getGridBounds(
    layoutCfg.workspaceWidth,
    layoutCfg.workspaceHeight,
    layoutCfg.viewSize,
  );
  const occupied = new Set(currentIcons.map((it) => `${it.gridCol}:${it.gridRow}`));
  const cell = findNearestFreeGridCell(
    occupied,
    target.originalDesktopIcon.gridCol,
    target.originalDesktopIcon.gridRow,
    cols,
    rows,
  );
  const existingNames = new Set(currentIcons.map((it) => it.name));
  const restoredIcon: DesktopIconItem = {
    ...target.originalDesktopIcon,
    name: findUniqueDesktopName(target.originalDesktopIcon.name, existingNames),
    gridCol: cell.col,
    gridRow: cell.row,
    freeX: metrics.padLeft + cell.col * metrics.cellWidth,
    freeY: metrics.padTop + cell.row * metrics.cellHeight,
  };
  const nextIcons = [...currentIcons, restoredIcon];
  const nextTrash = currentTrash.filter((t) => t.id !== trashId);
  saveDesktopIcons(nextIcons);
  saveRecycleTrash(nextTrash);
  return { icons: nextIcons, trash: nextTrash };
}

export function restoreAllRecycleTrash(): {
  icons: DesktopIconItem[];
  trash: RecycleTrashItem[];
} {
  const currentTrash = loadRecycleTrash();
  let icons = loadDesktopIcons();
  for (const item of [...currentTrash].reverse()) {
    const res = restoreFromRecycleTrash(item.id);
    icons = res.icons;
  }
  return { icons, trash: loadRecycleTrash() };
}

export function permanentlyDeleteTrashItem(trashId: string): RecycleTrashItem[] {
  const currentTrash = loadRecycleTrash();
  const target = currentTrash.find((t) => t.id === trashId);
  const next = currentTrash.filter((t) => t.id !== trashId);
  saveRecycleTrash(next);
  if (target?.originalDesktopIcon.blobId) {
    void deleteBlobFromStore(target.originalDesktopIcon.blobId);
  }
  return next;
}

export function emptyRecycleTrash(): RecycleTrashItem[] {
  const currentTrash = loadRecycleTrash();
  for (const item of currentTrash) {
    if (item.originalDesktopIcon.blobId) {
      void deleteBlobFromStore(item.originalDesktopIcon.blobId);
    }
  }
  saveRecycleTrash([]);
  return [];
}

export function loadDesktopWidgets(): DesktopPinnedWidget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DESKTOP_WIDGETS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DesktopPinnedWidget[]) : [];
  } catch {
    return [];
  }
}

export function saveDesktopWidgets(items: DesktopPinnedWidget[]): void {
  try {
    localStorage.setItem(DESKTOP_WIDGETS_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(DESKTOP_WIDGETS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function pinWidgetToDesktop(
  widgetId: string,
  dropX: number,
  dropY: number,
  workspaceWidth = 1280,
  workspaceHeight = 720,
): DesktopPinnedWidget[] {
  const items = loadDesktopWidgets();
  const maxX = Math.max(16, workspaceWidth - 292);
  const maxY = Math.max(16, workspaceHeight - 240);
  const clampedX = Math.max(16, Math.min(maxX, Math.round(dropX - 135)));
  const clampedY = Math.max(16, Math.min(maxY, Math.round(dropY - 36)));

  const existing = items.find((w) => w.widgetId === widgetId);
  const next = existing
    ? items.map((w) => (w.widgetId === widgetId ? { ...w, x: clampedX, y: clampedY } : w))
    : [
        ...items,
        {
          id: `desk-widget-${widgetId}-${Date.now()}`,
          widgetId,
          x: clampedX,
          y: clampedY,
        },
      ];
  saveDesktopWidgets(next);
  return next;
}

export function moveDesktopWidget(
  id: string,
  x: number,
  y: number,
  workspaceWidth = 1280,
  workspaceHeight = 720,
): DesktopPinnedWidget[] {
  const items = loadDesktopWidgets();
  const maxX = Math.max(12, workspaceWidth - 280);
  const maxY = Math.max(12, workspaceHeight - 160);
  const clampedX = Math.max(12, Math.min(maxX, Math.round(x)));
  const clampedY = Math.max(12, Math.min(maxY, Math.round(y)));
  const next = items.map((w) => (w.id === id ? { ...w, x: clampedX, y: clampedY } : w));
  saveDesktopWidgets(next);
  return next;
}

export function unpinDesktopWidget(id: string): DesktopPinnedWidget[] {
  const next = loadDesktopWidgets().filter((w) => w.id !== id);
  saveDesktopWidgets(next);
  return next;
}

function buildDesktopIconFromPayload(
  payload: SodiumDragPayload,
  placement: { col: number; row: number; freeX: number; freeY: number },
  existingIcons: DesktopIconItem[],
): DesktopIconItem | null {
  if (payload.kind === "desktop-icon" || payload.kind === "widget") return null;
  const uid = `desk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const existingNames = new Set(existingIcons.map((it) => it.name));

  if (payload.kind === "app") {
    // Avoid duplicating exact same app shortcut if user didn't drag a custom one? Actually allow or focus?
    // Windows creates shortcut if missing or creates numbered copy; avoid clutter if identical route/appId already exists -> focus/reposition or add numbered shortcut?
    // Creating a shortcut if not present, or telling user if duplicate vs creating copy:
    const dup = existingIcons.find(
      (it) =>
        it.kind === "app" &&
        ((payload.appId && it.appId === payload.appId) ||
          (payload.route && it.route === payload.route) ||
          it.name === payload.label),
    );
    if (dup) {
      // Reposition existing shortcut right where user dropped it!
      return {
        ...dup,
        gridCol: placement.col,
        gridRow: placement.row,
        freeX: placement.freeX,
        freeY: placement.freeY,
      };
    }
    return {
      id: uid,
      kind: "app",
      appId: payload.appId,
      name: payload.label,
      route: payload.route,
      routeState: payload.routeState,
      externalUrl: payload.externalUrl,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
      sizeBytes: 64000,
      modifiedAt: Date.now(),
    };
  }

  if (payload.kind === "folder") {
    const customEntries = loadCustomExplorerEntries();
    let resolvedTargetDirId = payload.targetDirId;
    let resolvedExplorerId = payload.explorerEntryId;

    // If dragging a Start Menu app-group folder onto Desktop, materialize a real File Explorer folder containing its apps
    if (!resolvedTargetDirId && payload.startFolderId) {
      const folderDirId = `dir-custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const folderEntryId = `fe-folder-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const folderEntry: CustomExplorerRecord = {
        id: folderEntryId,
        parentId: "dir-desktop",
        name: payload.name,
        kind: "folder",
        modifiedAt: Date.now(),
        locationLabel: "Desktop",
        pathLabel: `C:\\Users\\Sodium\\Desktop\\${payload.name}`,
        status: "local",
        targetDirId: folderDirId,
        linkedSource: "custom",
      };
      const childEntries: CustomExplorerRecord[] = (payload.appIds ?? [])
        .map((id) => START_APPS.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a && a.route))
        .map((a, idx) => ({
          id: `fe-app-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
          parentId: folderDirId,
          name: a.label,
          kind: "app",
          sizeBytes: 64000,
          modifiedAt: Date.now(),
          locationLabel: payload.name,
          pathLabel: `C:\\Users\\Sodium\\Desktop\\${payload.name}\\${a.label}`,
          status: "local",
          targetRoute: a.route,
          linkedSource: "custom",
        }));
      saveCustomExplorerEntries([...customEntries, folderEntry, ...childEntries]);
      resolvedTargetDirId = folderDirId;
      resolvedExplorerId = folderEntryId;
    }

    const dup = existingIcons.find(
      (it) =>
        it.kind === "folder" &&
        ((resolvedTargetDirId && it.targetDirId === resolvedTargetDirId) ||
          (payload.galleryFolderId && it.galleryFolderId === payload.galleryFolderId)),
    );
    if (dup) {
      return {
        ...dup,
        gridCol: placement.col,
        gridRow: placement.row,
        freeX: placement.freeX,
        freeY: placement.freeY,
      };
    }

    return {
      id: uid,
      kind: "folder",
      name: findUniqueDesktopName(payload.name, existingNames),
      targetDirId: resolvedTargetDirId,
      galleryFolderId: payload.galleryFolderId,
      explorerEntryId: resolvedExplorerId,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
      modifiedAt: Date.now(),
    };
  }

  if (payload.kind === "file") {
    return {
      id: uid,
      kind: "file",
      name: findUniqueDesktopName(payload.name, existingNames),
      explorerEntryId: payload.explorerEntryId,
      fileKind: payload.fileKind,
      fileExtension: payload.fileExtension,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      modifiedAt: payload.modifiedAt ?? Date.now(),
      mediaUrl: payload.mediaUrl,
      thumbnailUrl: payload.thumbnailUrl,
      blobId: payload.blobId,
      textContent: payload.textContent,
      linkedSource: payload.linkedSource,
      linkedId: payload.linkedId,
      route: payload.targetRoute,
      routeState: payload.targetRouteState,
      isBinary: payload.isBinary,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
    };
  }

  if (payload.kind === "channel") {
    const dup = existingIcons.find(
      (it) => it.kind === "channel" && it.channelId === payload.channelId,
    );
    if (dup) {
      return {
        ...dup,
        gridCol: placement.col,
        gridRow: placement.row,
        freeX: placement.freeX,
        freeY: placement.freeY,
      };
    }
    return {
      id: uid,
      kind: "channel",
      name: payload.name,
      channelId: payload.channelId,
      slug: payload.slug,
      logo: payload.logo,
      route: `/live-tv?channel=${payload.slug}`,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
      modifiedAt: Date.now(),
    };
  }

  if (payload.kind === "note") {
    const dup = existingIcons.find((it) => it.kind === "note" && it.noteId === payload.noteId);
    if (dup) {
      return {
        ...dup,
        gridCol: placement.col,
        gridRow: placement.row,
        freeX: placement.freeX,
        freeY: placement.freeY,
      };
    }
    return {
      id: uid,
      kind: "note",
      name: payload.title || "Untitled Note",
      noteId: payload.noteId,
      colorId: payload.colorId,
      route: "/notes",
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
      modifiedAt: Date.now(),
    };
  }

  if (payload.kind === "article") {
    const dup = existingIcons.find(
      (it) => it.kind === "article" && it.articleId === payload.articleId,
    );
    if (dup) {
      return {
        ...dup,
        gridCol: placement.col,
        gridRow: placement.row,
        freeX: placement.freeX,
        freeY: placement.freeY,
      };
    }
    return {
      id: uid,
      kind: "article",
      name: payload.title,
      articleId: payload.articleId,
      slug: payload.slug,
      coverImage: payload.coverImage,
      route: `/news/${payload.slug}`,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
      modifiedAt: Date.now(),
    };
  }

  // setting
  const dup = existingIcons.find(
    (it) => it.kind === "setting" && it.name === payload.title && it.route === payload.route,
  );
  if (dup) {
    return {
      ...dup,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
    };
  }
  return {
    id: uid,
    kind: "setting",
    name: payload.title,
    route: payload.route,
    routeState: payload.routeState,
    gridCol: placement.col,
    gridRow: placement.row,
    freeX: placement.freeX,
    freeY: placement.freeY,
    modifiedAt: Date.now(),
  };
}

export function addSodiumPayloadToDesktop(
  payload: SodiumDragPayload,
  config: DesktopLayoutConfig,
  dropX?: number,
  dropY?: number,
): DesktopIconItem[] {
  if (payload.kind === "desktop-icon") {
    if (dropX !== undefined && dropY !== undefined) {
      return moveDesktopIcon(payload.desktopIconId, dropX, dropY, config);
    }
    return loadDesktopIcons();
  }

  const items = loadDesktopIcons();
  const placement = getTargetPlacement(items, config, dropX, dropY);
  const newIcon = buildDesktopIconFromPayload(payload, placement, items);
  if (!newIcon) return items;

  const existingIdx = items.findIndex((it) => it.id === newIcon.id);
  const next =
    existingIdx >= 0
      ? items.map((it, idx) => (idx === existingIdx ? newIcon : it))
      : [...items, newIcon];

  saveDesktopIcons(next);
  if (existingIdx < 0) {
    showAppToast(`Added "${newIcon.name}" to Desktop`, { appName: "Desktop" });
  }
  return next;
}

export function moveIconIntoDesktopFolder(iconId: string, folderIconId: string): DesktopIconItem[] {
  if (iconId === folderIconId) return loadDesktopIcons();
  const items = loadDesktopIcons();
  const src = items.find((it) => it.id === iconId);
  const folder = items.find((it) => it.id === folderIconId && it.kind === "folder");
  if (
    !src ||
    !folder ||
    !folder.targetDirId ||
    src.kind === "system-computer" ||
    src.kind === "system-recycle-trash"
  ) {
    return items;
  }

  const customEntries = loadCustomExplorerEntries();
  if (src.explorerEntryId && customEntries.some((e) => e.id === src.explorerEntryId)) {
    const updated = customEntries.map((e) =>
      e.id === src.explorerEntryId
        ? {
            ...e,
            parentId: folder.targetDirId!,
            locationLabel: folder.name,
            pathLabel: `C:\\Users\\Sodium\\Desktop\\${folder.name}\\${src.name}`,
          }
        : e,
    );
    saveCustomExplorerEntries(updated);
  } else {
    const newEntry: CustomExplorerRecord = {
      id: src.explorerEntryId || `fe-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      parentId: folder.targetDirId,
      name: src.name,
      kind: src.kind === "folder" ? "folder" : src.kind === "app" ? "app" : src.fileKind || "file",
      sizeBytes: src.sizeBytes,
      modifiedAt: Date.now(),
      locationLabel: folder.name,
      pathLabel: `C:\\Users\\Sodium\\Desktop\\${folder.name}\\${src.name}`,
      status: "local",
      thumbnailUrl: src.thumbnailUrl,
      mediaUrl: src.mediaUrl,
      blobId: src.blobId,
      mimeType: src.mimeType,
      fileExtension: src.fileExtension,
      isBinary: src.isBinary,
      textContent: src.textContent,
      targetRoute: src.route,
      targetRouteState: src.routeState,
      targetDirId: src.targetDirId,
      linkedSource: src.linkedSource || "custom",
      linkedId: src.linkedId,
    };
    saveCustomExplorerEntries([...customEntries, newEntry]);
  }

  const next = items.filter((it) => it.id !== iconId);
  saveDesktopIcons(next);
  showAppToast(`Moved "${src.name}" into "${folder.name}"`, { appName: "Desktop" });
  return next;
}

async function importNodesIntoExplorer(
  nodes: DeviceDropTreeNode[],
  parentId: string,
  parentPath: string,
  parentLabel: string,
  outCustomEntries: CustomExplorerRecord[],
  outTopLevelIcons: Omit<DesktopIconItem, "gridCol" | "gridRow" | "freeX" | "freeY">[],
  isTopLevel: boolean,
): Promise<number> {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "folder") {
      const folderDirId = `dir-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const folderEntryId = `fe-dir-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nextPath = `${parentPath}\\${node.name}`;
      const folderRecord: CustomExplorerRecord = {
        id: folderEntryId,
        parentId,
        name: node.name,
        kind: "folder",
        modifiedAt: Date.now(),
        locationLabel: parentLabel,
        pathLabel: nextPath,
        status: "local",
        targetDirId: folderDirId,
        linkedSource: "custom",
        isImportedFromDevice: true,
      };
      outCustomEntries.push(folderRecord);
      count += 1;
      if (isTopLevel) {
        outTopLevelIcons.push({
          id: `desk-dir-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: "folder",
          name: node.name,
          explorerEntryId: folderEntryId,
          targetDirId: folderDirId,
          modifiedAt: Date.now(),
        });
      }
      count += await importNodesIntoExplorer(
        node.children,
        folderDirId,
        nextPath,
        node.name,
        outCustomEntries,
        outTopLevelIcons,
        false,
      );
    } else {
      const imported = await processImportedDeviceFile(node.file, {
        addToGallery: true,
        addHtmlDoc: true,
      });
      const entryId = `fe-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nextPath = `${parentPath}\\${imported.name}`;
      const record: CustomExplorerRecord = {
        id: entryId,
        parentId,
        name: imported.name,
        kind: imported.fileKind,
        sizeBytes: imported.sizeBytes,
        modifiedAt: imported.modifiedAt,
        locationLabel: parentLabel,
        pathLabel: nextPath,
        status: "local",
        thumbnailUrl: imported.thumbnailUrl,
        mediaUrl: imported.mediaUrl,
        blobId: imported.blobId,
        mimeType: imported.mimeType,
        fileExtension: imported.fileExtension,
        isBinary: imported.isBinary,
        dimensions: imported.dimensions,
        textContent: imported.textContent,
        linkedSource: imported.linkedSource,
        linkedId: imported.linkedId,
        isImportedFromDevice: true,
      };
      outCustomEntries.push(record);
      count += 1;
      if (isTopLevel) {
        outTopLevelIcons.push({
          id: `desk-file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: "file",
          name: imported.name,
          explorerEntryId: entryId,
          fileKind: imported.fileKind,
          fileExtension: imported.fileExtension,
          mimeType: imported.mimeType,
          sizeBytes: imported.sizeBytes,
          modifiedAt: imported.modifiedAt,
          mediaUrl: imported.mediaUrl,
          thumbnailUrl: imported.thumbnailUrl,
          blobId: imported.blobId,
          textContent: imported.textContent,
          linkedSource: imported.linkedSource,
          linkedId: imported.linkedId,
          isBinary: imported.isBinary,
        });
      }
    }
  }
  return count;
}

export async function importDeviceDropToDesktop(
  dt: DataTransfer,
  config: DesktopLayoutConfig,
  dropX?: number,
  dropY?: number,
  targetFolderIconId?: string,
): Promise<DesktopIconItem[]> {
  const nodes = await extractDeviceDropNodes(dt);
  if (nodes.length === 0) return loadDesktopIcons();

  const existingIcons = loadDesktopIcons();
  const targetFolder = targetFolderIconId
    ? existingIcons.find((it) => it.id === targetFolderIconId && it.kind === "folder")
    : undefined;

  const targetDirId = targetFolder?.targetDirId || "dir-desktop";
  const targetLabel = targetFolder?.name || "Desktop";
  const targetPath = targetFolder
    ? `C:\\Users\\Sodium\\Desktop\\${targetFolder.name}`
    : "C:\\Users\\Sodium\\Desktop";

  const newExplorerEntries: CustomExplorerRecord[] = [];
  const rawTopIcons: Omit<DesktopIconItem, "gridCol" | "gridRow" | "freeX" | "freeY">[] = [];

  const totalImported = await importNodesIntoExplorer(
    nodes,
    targetDirId,
    targetPath,
    targetLabel,
    newExplorerEntries,
    rawTopIcons,
    !targetFolder,
  );

  if (newExplorerEntries.length > 0) {
    const prevEntries = loadCustomExplorerEntries();
    saveCustomExplorerEntries([...prevEntries, ...newExplorerEntries]);
  }

  if (targetFolder) {
    showAppToast(
      `Imported ${totalImported} item${totalImported === 1 ? "" : "s"} into "${targetFolder.name}"`,
      { appName: "Desktop" },
    );
    return existingIcons;
  }

  const current = [...existingIcons];
  const names = new Set(current.map((it) => it.name));
  const { metrics } = getGridBounds(config.workspaceWidth, config.workspaceHeight, config.viewSize);

  rawTopIcons.forEach((raw, idx) => {
    const offsetDropX =
      dropX !== undefined ? dropX + idx * Math.round(metrics.cellWidth * 0.85) : undefined;
    const offsetDropY = dropY;
    const placement = getTargetPlacement(current, config, offsetDropX, offsetDropY);
    const uniqueName = findUniqueDesktopName(raw.name, names);
    names.add(uniqueName);
    current.push({
      ...raw,
      name: uniqueName,
      gridCol: placement.col,
      gridRow: placement.row,
      freeX: placement.freeX,
      freeY: placement.freeY,
    });
  });

  saveDesktopIcons(current);
  showAppToast(
    `Imported ${totalImported} item${totalImported === 1 ? "" : "s"} from device to Desktop`,
    { appName: "Sodium OS" },
  );
  return current;
}
