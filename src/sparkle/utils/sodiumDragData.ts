import type React from "react";
import { galleryDB, getMediaDimensions, type GalleryMediaItem } from "../services/galleryStorage";

export const SODIUM_DRAG_MIME = "application/x-sodium-item";
const BLOB_DB_NAME = "Sodium_Desktop_Blobs_DB";
const BLOB_DB_VERSION = 1;
const BLOB_STORE = "blobs";

export type SodiumDragPayload =
  | {
      kind: "app";
      appId?: string | undefined;
      label: string;
      route: string;
      routeState?: Record<string, unknown> | undefined;
      externalUrl?: string | undefined;
    }
  | {
      kind: "file";
      name: string;
      explorerEntryId?: string | undefined;
      parentId?: string | undefined;
      fileKind: string;
      fileExtension?: string | undefined;
      mimeType?: string | undefined;
      sizeBytes?: number | undefined;
      modifiedAt?: number | undefined;
      mediaUrl?: string | undefined;
      thumbnailUrl?: string | undefined;
      blobId?: string | undefined;
      textContent?: string | undefined;
      linkedSource?: string | undefined;
      linkedId?: string | undefined;
      targetRoute?: string | undefined;
      targetRouteState?: Record<string, unknown> | undefined;
      isBinary?: boolean | undefined;
    }
  | {
      kind: "folder";
      name: string;
      targetDirId?: string | undefined;
      galleryFolderId?: string | undefined;
      startFolderId?: string | undefined;
      appIds?: string[] | undefined;
      explorerEntryId?: string | undefined;
    }
  | {
      kind: "channel";
      channelId: string;
      slug: string;
      name: string;
      logo?: string | undefined;
      category?: string | undefined;
    }
  | {
      kind: "note";
      noteId: string;
      title: string;
      colorId?: string | undefined;
    }
  | {
      kind: "article";
      articleId: string;
      slug: string;
      title: string;
      coverImage?: string | undefined;
    }
  | {
      kind: "setting";
      title: string;
      route: string;
      routeState?: Record<string, unknown> | undefined;
      category?: string | undefined;
    }
  | {
      kind: "desktop-icon";
      desktopIconId: string;
      name: string;
      itemKind: string;
      dragOffsetX?: number | undefined;
      dragOffsetY?: number | undefined;
    };

export function setSodiumDragData(
  e: React.DragEvent,
  payload: SodiumDragPayload,
  options?: { preserveTextPlain?: boolean },
): void {
  try {
    e.dataTransfer.setData(SODIUM_DRAG_MIME, JSON.stringify(payload));
    if (!options?.preserveTextPlain) {
      const label =
        payload.kind === "app"
          ? payload.label
          : payload.kind === "setting" || payload.kind === "article" || payload.kind === "note"
            ? payload.title
            : payload.name;
      e.dataTransfer.setData("text/plain", label);
    }
    e.dataTransfer.effectAllowed = "copyMove";
  } catch {
    // Ignore drag-data write restriction errors
  }
}

export function getSodiumDragData(e: React.DragEvent): SodiumDragPayload | null {
  try {
    const raw = e.dataTransfer.getData(SODIUM_DRAG_MIME);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("kind" in parsed)) return null;
    return parsed as SodiumDragPayload;
  } catch {
    return null;
  }
}

export function hasSodiumDragType(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  try {
    return Array.from(dt.types).includes(SODIUM_DRAG_MIME);
  } catch {
    return false;
  }
}

export function hasExternalDeviceFiles(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  try {
    const types = Array.from(dt.types);
    if (types.includes(SODIUM_DRAG_MIME)) return false;
    return types.includes("Files");
  } catch {
    return false;
  }
}

// ============================================================================
// Persistent Blob Store for Large Imported Files
// ============================================================================

interface StoredBlobRecord {
  id: string;
  name: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}

const objectUrlCache = new Map<string, string>();
let blobDbPromise: Promise<IDBDatabase> | null = null;

function openBlobDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (blobDbPromise) return blobDbPromise;
  blobDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(BLOB_DB_NAME, BLOB_DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open Sodium Blob DB"));
  });
  return blobDbPromise;
}

export async function saveBlobToStore(
  id: string,
  blob: Blob,
  name: string,
  mimeType: string,
): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  objectUrlCache.set(id, objectUrl);
  try {
    const db = await openBlobDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, "readwrite");
      const store = tx.objectStore(BLOB_STORE);
      const record: StoredBlobRecord = {
        id,
        name,
        mimeType,
        blob,
        createdAt: Date.now(),
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Blob save error"));
    });
  } catch {
    // Fallback cleanly to in-memory objectUrl
  }
  return objectUrl;
}

export async function resolveBlobUrl(
  blobId?: string,
  fallbackUrl?: string,
): Promise<string | undefined> {
  if (!blobId) return fallbackUrl;
  const cached = objectUrlCache.get(blobId);
  if (cached) return cached;
  try {
    const db = await openBlobDB();
    const record = await new Promise<StoredBlobRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, "readonly");
      const store = tx.objectStore(BLOB_STORE);
      const req = store.get(blobId);
      req.onsuccess = () => resolve(req.result as StoredBlobRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    if (record?.blob) {
      const url = URL.createObjectURL(record.blob);
      objectUrlCache.set(blobId, url);
      return url;
    }
  } catch {
    // Ignore DB lookup errors
  }
  return fallbackUrl;
}

export async function deleteBlobFromStore(blobId?: string): Promise<void> {
  if (!blobId) return;
  const cached = objectUrlCache.get(blobId);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(blobId);
  }
  try {
    const db = await openBlobDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(BLOB_STORE, "readwrite");
      tx.objectStore(BLOB_STORE).delete(blobId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore delete failures
  }
}

// ============================================================================
// Device File / Folder Drop Extractor & Classifier
// ============================================================================

export type DeviceDropTreeNode =
  { type: "file"; file: File } | { type: "folder"; name: string; children: DeviceDropTreeNode[] };

interface WebkitEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (f: File) => void, error?: (err: unknown) => void) => void;
  createReader?: () => {
    readEntries: (
      success: (entries: WebkitEntryLike[]) => void,
      error?: (err: unknown) => void,
    ) => void;
  };
}

function readWebkitEntry(entry: WebkitEntryLike): Promise<DeviceDropTreeNode | null> {
  if (entry.isFile && entry.file) {
    return new Promise((resolve) => {
      entry.file!(
        (file) => resolve({ type: "file", file }),
        () => resolve(null),
      );
    });
  }
  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    const readAllEntries = (): Promise<WebkitEntryLike[]> =>
      new Promise((resolve) => {
        const collected: WebkitEntryLike[] = [];
        const nextBatch = () => {
          reader.readEntries(
            (batch) => {
              if (!batch || batch.length === 0) {
                resolve(collected);
                return;
              }
              collected.push(...batch);
              nextBatch();
            },
            () => resolve(collected),
          );
        };
        nextBatch();
      });

    return readAllEntries().then(async (entries) => {
      const children: DeviceDropTreeNode[] = [];
      for (const child of entries) {
        const parsed = await readWebkitEntry(child);
        if (parsed) children.push(parsed);
      }
      return { type: "folder", name: entry.name, children };
    });
  }
  return Promise.resolve(null);
}

export async function extractDeviceDropNodes(dt: DataTransfer): Promise<DeviceDropTreeNode[]> {
  const items = Array.from(dt.items || []);
  const entryGetters = items
    .map((item) => {
      const withEntry = item as unknown as {
        webkitGetAsEntry?: () => WebkitEntryLike | null;
      };
      return typeof withEntry.webkitGetAsEntry === "function" ? withEntry.webkitGetAsEntry() : null;
    })
    .filter((e): e is WebkitEntryLike => Boolean(e));

  if (entryGetters.length > 0) {
    const results: DeviceDropTreeNode[] = [];
    for (const entry of entryGetters) {
      const node = await readWebkitEntry(entry);
      if (node) results.push(node);
    }
    if (results.length > 0) return results;
  }

  return Array.from(dt.files || []).map((file) => ({ type: "file", file }));
}

export interface ImportedFileMetadata {
  name: string;
  fileKind: string;
  fileExtension: string;
  mimeType: string;
  sizeBytes: number;
  modifiedAt: number;
  mediaUrl?: string | undefined;
  thumbnailUrl?: string | undefined;
  blobId?: string | undefined;
  textContent?: string | undefined;
  dimensions?: { width: number; height: number } | undefined;
  isBinary: boolean;
  linkedSource: "gallery" | "html-writer" | "custom";
  linkedId?: string | undefined;
}

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "log",
  "csv",
  "tsv",
  "json",
  "xml",
  "yaml",
  "yml",
  "ini",
  "cfg",
  "conf",
  "env",
  "html",
  "htm",
  "css",
  "scss",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "py",
  "sh",
  "bat",
  "ps1",
  "sql",
  "svg",
]);

export function classifyFileKind(
  fileName: string,
  mimeType: string,
): {
  ext: string;
  fileKind: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isText: boolean;
} {
  const ext = fileName.includes(".") ? (fileName.split(".").pop()?.toLowerCase() ?? "") : "";
  const mime = (mimeType || "").toLowerCase();

  const isImage =
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "avif", "svg"].includes(ext);
  const isVideo =
    mime.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi", "m4v"].includes(ext);
  const isAudio =
    mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"].includes(ext);
  const isText =
    !isVideo &&
    !isAudio &&
    (TEXT_EXTENSIONS.has(ext) ||
      mime.startsWith("text/") ||
      mime === "application/json" ||
      mime === "application/javascript" ||
      mime === "application/xml");

  let fileKind = "file";
  if (isImage) fileKind = "image";
  else if (isVideo) fileKind = "video";
  else if (isAudio) fileKind = "audio";
  else if (ext === "html" || ext === "htm") fileKind = "html";
  else if (ext === "pdf" || mime === "application/pdf") fileKind = "pdf";
  else if (["doc", "docx", "rtf", "odt"].includes(ext)) fileKind = "word";
  else if (["xls", "xlsx", "ods", "csv"].includes(ext)) fileKind = "excel";
  else if (["ppt", "pptx", "odp"].includes(ext)) fileKind = "ppt";
  else if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) fileKind = "archive";
  else if (
    [
      "js",
      "mjs",
      "cjs",
      "ts",
      "tsx",
      "jsx",
      "json",
      "css",
      "scss",
      "py",
      "xml",
      "yml",
      "yaml",
      "sql",
      "sh",
    ].includes(ext)
  ) {
    fileKind = "code";
  } else if (["exe", "msi", "app", "apk", "dmg", "deb"].includes(ext)) {
    fileKind = "app";
  } else if (isText) {
    fileKind = "text";
  }

  return { ext, fileKind, isImage, isVideo, isAudio, isText };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}

export async function processImportedDeviceFile(
  file: File,
  options?: { addToGallery?: boolean; addHtmlDoc?: boolean },
): Promise<ImportedFileMetadata> {
  const { ext, fileKind, isImage, isVideo, isAudio, isText } = classifyFileKind(
    file.name,
    file.type,
  );
  const blobId = `blob-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const persistedBlobUrl = await saveBlobToStore(
    blobId,
    file,
    file.name,
    file.type || "application/octet-stream",
  );

  let textContent: string | undefined;
  if (isText && file.size <= 2_500_000) {
    textContent = await file.text().catch(() => "");
  }

  // Inline DataURL for smaller images so thumbnails remain valid cleanly across reloads
  let mediaUrl = persistedBlobUrl;
  if (isImage && file.size <= 2_500_000) {
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl) mediaUrl = dataUrl;
  } else if (!isImage && file.size <= 750_000) {
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl) mediaUrl = dataUrl;
  }

  let dimensions: { width: number; height: number } | undefined;
  if (isImage || isVideo || isAudio) {
    const measured = await getMediaDimensions(file).catch(() => ({
      width: 1280,
      height: 720,
      duration: undefined,
    }));
    dimensions = { width: measured.width, height: measured.height };

    if (options?.addToGallery) {
      const galId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const mediaType: GalleryMediaItem["type"] = isVideo ? "video" : isAudio ? "audio" : "image";
      await galleryDB.add({
        id: galId,
        title: file.name,
        type: mediaType,
        url: mediaUrl,
        ...(mediaType === "image" ? { thumbnailUrl: mediaUrl } : {}),
        mimeType: file.type || `${mediaType}/${ext || "octet-stream"}`,
        size: file.size,
        dateAdded: new Date().toISOString(),
        dateLabel: new Date().toLocaleDateString(),
        dimensions,
        aspectRatio: dimensions.width / Math.max(1, dimensions.height),
        ...(measured.duration !== undefined ? { duration: measured.duration } : {}),
        source: "upload",
      });
      return {
        name: file.name,
        fileKind,
        fileExtension: ext,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        modifiedAt: file.lastModified || Date.now(),
        mediaUrl,
        thumbnailUrl: mediaType === "image" ? mediaUrl : undefined,
        blobId,
        textContent,
        dimensions,
        isBinary: !isText,
        linkedSource: "gallery",
        linkedId: galId,
      };
    }
  }

  if (options?.addHtmlDoc && (ext === "html" || ext === "htm") && textContent !== undefined) {
    const htmlId = `html-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const raw = localStorage.getItem("sparkle_html_writer_files_v1");
      const list = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      const next = [
        { id: htmlId, name: file.name, content: textContent, updatedAt: Date.now() },
        ...(Array.isArray(list) ? list : []),
      ];
      localStorage.setItem("sparkle_html_writer_files_v1", JSON.stringify(next));
      localStorage.setItem("sparkle_html_writer_active_id_v1", htmlId);
    } catch {
      // Ignore storage failures
    }
    return {
      name: file.name,
      fileKind,
      fileExtension: ext,
      mimeType: file.type || "text/html",
      sizeBytes: file.size,
      modifiedAt: file.lastModified || Date.now(),
      mediaUrl,
      blobId,
      textContent,
      isBinary: false,
      linkedSource: "html-writer",
      linkedId: htmlId,
    };
  }

  return {
    name: file.name,
    fileKind,
    fileExtension: ext,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    modifiedAt: file.lastModified || Date.now(),
    mediaUrl,
    thumbnailUrl: isImage ? mediaUrl : undefined,
    blobId,
    textContent,
    dimensions,
    isBinary: !isText,
    linkedSource: "custom",
  };
}
