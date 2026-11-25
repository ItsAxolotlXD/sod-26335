import type { Channel } from "../types";
import { STICKY_COLORS, type NoteItem } from "../context/NotesContext";
import { NEWS_DATA } from "../data/news";
import {
  DEFAULT_GALLERY_ITEMS,
  type GalleryFolder,
  type GalleryMediaItem,
} from "../services/galleryStorage";
import type { SodiumDragPayload } from "./sodiumDragData";

export type StartForYouKind =
  | "channel"
  | "note"
  | "folder"
  | "html"
  | "imported"
  | "app"
  | "screenbox"
  | "gallery"
  | "article"
  | "setting";

export type PcSettingCategoryId =
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

export interface StartForYouItem {
  id: string;
  kind: StartForYouKind;
  title: string;
  subtitle: string;
  imageUrl?: string;
  isContainImage?: boolean;
  noteExcerpt?: string;
  noteBg?: string;
  noteText?: string;
  htmlSnippet?: string;
  appId?: string;
  settingCategory?: PcSettingCategoryId;
  fileExt?: string;
  dragPayload?: SodiumDragPayload;
  onSelect: () => void;
}

export interface StartForYouAppCandidate {
  id: string;
  label: string;
  route?: string;
  externalUrl?: string;
}

interface BuildStartForYouParams {
  channels: Channel[];
  notes: NoteItem[];
  pinnedApps: StartForYouAppCandidate[];
  galleryItems: GalleryMediaItem[];
  galleryFolders: GalleryFolder[];
  onLaunchApp: (app: StartForYouAppCandidate) => void;
  onSelectChannel: (channel: Channel) => void;
  onSelectNote: (noteId: string) => void;
  onLaunchRoute: (route: string, state?: unknown) => void;
  onClose: () => void;
}

interface StoredHtmlDoc {
  id: string;
  name: string;
  content: string;
  updatedAt?: number;
}

interface StoredScreenboxItem {
  id: string;
  title: string;
  artist?: string;
  url: string;
  embedUrl?: string;
  type?: string;
}

interface StoredExplorerEntry {
  id: string;
  parentId: string;
  name: string;
  kind: string;
  locationLabel?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  fileExtension?: string;
  targetRoute?: string;
  isImportedFromDevice?: boolean;
}

const DEFAULT_HTML_DOCS: StoredHtmlDoc[] = [
  {
    id: "doc-default-1",
    name: "index.html",
    content: `<title>WinUI 3 Demo Card</title>\n<div class="card">\n  <h1>Sodium HTML Writer</h1>\n  <button class="btn-primary">Run preview</button>\n</div>`,
  },
];

const DEFAULT_SCREENBOX_MEDIA: StoredScreenboxItem[] = [
  {
    id: "vlc-sample-track-1",
    title: "NIVIRO - You [NCS Release]",
    artist: "NIVIRO",
    url: "https://www.youtube.com/watch?v=2Nv5juZKhKo",
    type: "embed",
  },
  {
    id: "vlc-sample-track-3",
    title: "Cartoon - On & On (feat. Daniel Levi)",
    artist: "Cartoon",
    url: "https://www.youtube.com/watch?v=K4DyBUG242c",
    type: "embed",
  },
  {
    id: "vlc-sample-track-4",
    title: "Alan Walker - Fade [NCS Release]",
    artist: "Alan Walker",
    url: "https://www.youtube.com/watch?v=J2X5mJ3HDYE",
    type: "embed",
  },
  {
    id: "vlc-sample-track-5",
    title: "DEAF KEV - Invincible [NCS Release]",
    artist: "DEAF KEV",
    url: "https://www.youtube.com/watch?v=pZzSq8WfsKo",
    type: "embed",
  },
  {
    id: "vlc-sample-track-6",
    title: "Janji - Heroes Tonight [NCS Release]",
    artist: "Janji",
    url: "https://www.youtube.com/watch?v=K8DUjObr_tU",
    type: "embed",
  },
  {
    id: "vlc-sample-track-7",
    title: "Elektronomia - Sky High [NCS Release]",
    artist: "Elektronomia",
    url: "https://www.youtube.com/watch?v=yJg-Y5byMMw",
    type: "embed",
  },
];

const SUGGESTED_PC_SETTINGS: Array<{
  category: PcSettingCategoryId;
  title: string;
  subtitle: string;
}> = [
  {
    category: "personalization",
    title: "Themes & Background",
    subtitle: "PC Settings · Personalization",
  },
  { category: "system", title: "Display & Sound", subtitle: "PC Settings · System" },
  { category: "update", title: "Sodium Update", subtitle: "PC Settings · Updates" },
  { category: "accounts", title: "Your Account & Profile", subtitle: "PC Settings · Accounts" },
  { category: "accessibility", title: "Accessibility", subtitle: "PC Settings · Visual effects" },
  { category: "bluetooth", title: "Bluetooth & devices", subtitle: "PC Settings · Devices" },
  { category: "privacy", title: "Privacy & security", subtitle: "PC Settings · Security" },
  { category: "apps", title: "Installed apps", subtitle: "PC Settings · Apps" },
];

const DEFAULT_EXPLORER_FOLDERS: Array<{ id: string; name: string; location: string }> = [
  { id: "dir-downloads-school", name: "School project", location: "Downloads" },
  { id: "dir-downloads-insp", name: "Inspiration", location: "Downloads" },
  { id: "dir-documents", name: "Documents", location: "This PC" },
  { id: "dir-pictures", name: "Pictures", location: "This PC" },
  { id: "dir-cloud-backups", name: "Cloud Backups", location: "Sodium Cloud" },
];

const DEFAULT_WORKSPACE_FILES: Array<{ id: string; name: string; location: string; ext: string }> =
  [
    { id: "sys-doc-ui-trends", name: "UI Trends 2026.docx", location: "Documents", ext: "DOCX" },
    { id: "sys-doc-reports-july", name: "Reports July.xlsx", location: "Documents", ext: "XLSX" },
    { id: "sys-doc-history-ux", name: "History of UX.pptx", location: "Documents", ext: "PPTX" },
    {
      id: "sys-cloud-design-spec",
      name: "Designs for printing.pdf",
      location: "Sodium Cloud",
      ext: "PDF",
    },
    { id: "sys-desk-welcome", name: "Welcome to Build 26335.txt", location: "Desktop", ext: "TXT" },
  ];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = tmp!;
  }
  return arr;
}

function stripHtmlText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractYouTubeThumbnail(url: string): string | undefined {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  return m?.[1] ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : undefined;
}

function readStoredJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function buildStartForYouSuggestions({
  channels,
  notes,
  pinnedApps,
  galleryItems,
  galleryFolders,
  onLaunchApp,
  onSelectChannel,
  onSelectNote,
  onLaunchRoute,
  onClose,
}: BuildStartForYouParams): StartForYouItem[] {
  const pools: StartForYouItem[][] = [];

  // 1. Channels
  const channelCandidates = shuffleArray(channels)
    .slice(0, 6)
    .map<StartForYouItem>((ch) => ({
      id: `fy-ch-${ch.id}`,
      kind: "channel",
      title: ch.name,
      subtitle: `${ch.category || "Live TV"} · Live now`,
      ...(ch.logo ? { imageUrl: ch.logo, isContainImage: true } : {}),
      dragPayload: {
        kind: "channel",
        channelId: ch.id,
        slug: ch.slug,
        name: ch.name,
        logo: ch.logo,
        category: ch.category,
      },
      onSelect: () => {
        onSelectChannel(ch);
        onLaunchRoute(`/live-tv?channel=${ch.slug}`);
        onClose();
      },
    }));
  if (channelCandidates.length > 0) pools.push(channelCandidates);

  // 2. Notes (Files)
  const noteCandidates = shuffleArray(notes)
    .slice(0, 6)
    .map<StartForYouItem>((note) => {
      const sticky = STICKY_COLORS.find((c) => c.id === note.colorId) ?? STICKY_COLORS[0]!;
      const excerpt = stripHtmlText(note.content || "") || note.title || "Empty note";
      const title = note.title?.trim() || "Untitled note";
      return {
        id: `fy-note-${note.id}`,
        kind: "note",
        title,
        subtitle: "Sodium Notes",
        noteExcerpt: excerpt,
        noteBg: sticky.bg,
        noteText: sticky.text,
        dragPayload: {
          kind: "note",
          noteId: note.id,
          title,
          colorId: note.colorId,
        },
        onSelect: () => {
          onSelectNote(note.id);
          onLaunchRoute("/notes");
          onClose();
        },
      };
    });
  if (noteCandidates.length > 0) pools.push(noteCandidates);

  // 3. Folders (Gallery folders + File Explorer folders)
  const customFs = readStoredJson<StoredExplorerEntry[]>("sparkle_file_explorer_v1") ?? [];
  const customFolders = customFs.filter((entry) => entry && entry.kind === "folder");
  const folderCandidates: StartForYouItem[] = [
    ...galleryFolders.map<StartForYouItem>((folder) => ({
      id: `fy-gal-folder-${folder.id}`,
      kind: "folder",
      title: folder.name,
      subtitle: "Gallery · Folder",
      dragPayload: {
        kind: "folder",
        name: folder.name,
        galleryFolderId: folder.id,
      },
      onSelect: () => {
        onLaunchRoute("/gallery", { folderId: folder.id });
        window.dispatchEvent(
          new CustomEvent("vplay:gallery:folder_selected", { detail: { folderId: folder.id } }),
        );
        onClose();
      },
    })),
    ...customFolders.map<StartForYouItem>((folder) => ({
      id: `fy-fe-custom-folder-${folder.id}`,
      kind: "folder",
      title: folder.name,
      subtitle: `${folder.locationLabel || "File Explorer"} · Folder`,
      dragPayload: {
        kind: "folder",
        name: folder.name,
        targetDirId: folder.id,
        explorerEntryId: folder.id,
      },
      onSelect: () => {
        onLaunchRoute("/file-explorer", { targetDirId: folder.id });
        onClose();
      },
    })),
    ...DEFAULT_EXPLORER_FOLDERS.map<StartForYouItem>((folder) => ({
      id: `fy-fe-folder-${folder.id}`,
      kind: "folder",
      title: folder.name,
      subtitle: `${folder.location} · Folder`,
      dragPayload: {
        kind: "folder",
        name: folder.name,
        targetDirId: folder.id,
      },
      onSelect: () => {
        onLaunchRoute("/file-explorer", { targetDirId: folder.id });
        onClose();
      },
    })),
  ];
  if (folderCandidates.length > 0) pools.push(shuffleArray(folderCandidates));

  // 4. HTML files (HTML Writer)
  const storedHtml = readStoredJson<StoredHtmlDoc[]>("sparkle_html_writer_files_v1");
  const htmlDocs =
    Array.isArray(storedHtml) && storedHtml.length > 0 ? storedHtml : DEFAULT_HTML_DOCS;
  const htmlCandidates = shuffleArray(htmlDocs).map<StartForYouItem>((doc) => {
    const cleanCode = (doc.content || "").trim().slice(0, 180);
    const docName = doc.name || "index.html";
    return {
      id: `fy-html-${doc.id}`,
      kind: "html",
      title: docName,
      subtitle: "HTML Writer · HTML file",
      htmlSnippet: cleanCode,
      fileExt: "HTML",
      dragPayload: {
        kind: "file",
        name: docName,
        fileKind: "html",
        fileExtension: "html",
        textContent: doc.content,
        linkedSource: "html-writer",
        linkedId: doc.id,
        targetRoute: "/html-writer",
      },
      onSelect: () => {
        try {
          localStorage.setItem("sparkle_html_writer_active_id_v1", doc.id);
        } catch {
          // ignore storage errors
        }
        onLaunchRoute("/html-writer");
        onClose();
      },
    };
  });
  if (htmlCandidates.length > 0) pools.push(htmlCandidates);

  // 5. Imported / Custom files (prioritize real user imports from Gallery / File Explorer)
  const importedGalleryFiles = galleryItems.filter(
    (item) => item.source === "upload" || item.source === "draws",
  );
  const customFiles = customFs.filter((entry) => entry && entry.kind !== "folder");

  const importedCandidates: StartForYouItem[] = [
    ...importedGalleryFiles.map<StartForYouItem>((item) => {
      const extMatch = item.title.match(/\.([a-z0-9]+)$/i);
      const thumb = item.thumbnailUrl || (item.type === "image" ? item.url : undefined);
      const fileExt = (extMatch?.[1] || item.type || "FILE").toUpperCase();
      return {
        id: `fy-imp-gal-${item.id}`,
        kind: "imported",
        title: item.title,
        subtitle: item.source === "draws" ? "Ink Canvas · Drawing" : "Imported file · Gallery",
        ...(thumb ? { imageUrl: thumb, isContainImage: false } : {}),
        fileExt,
        dragPayload: {
          kind: "file",
          name: item.title,
          fileKind: item.type,
          fileExtension: extMatch?.[1]?.toLowerCase() || item.type,
          mediaUrl: item.url,
          thumbnailUrl: thumb,
          linkedSource: "gallery",
          linkedId: item.id,
          targetRoute: `/gallery?preview=${encodeURIComponent(item.id)}`,
        },
        onSelect: () => {
          onLaunchRoute("/gallery", { itemId: item.id });
          window.dispatchEvent(
            new CustomEvent("vplay:gallery:item_selected", { detail: { itemId: item.id } }),
          );
          onClose();
        },
      };
    }),
    ...customFiles.map<StartForYouItem>((file) => {
      const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
      const thumb = file.thumbnailUrl || file.mediaUrl;
      const extUpper = (file.fileExtension || extMatch?.[1] || file.kind || "FILE").toUpperCase();
      return {
        id: `fy-imp-fe-${file.id}`,
        kind: "imported",
        title: file.name,
        subtitle: file.isImportedFromDevice
          ? "Imported from device"
          : `${file.locationLabel || "File Explorer"} · File`,
        ...(thumb ? { imageUrl: thumb, isContainImage: false } : {}),
        fileExt: extUpper,
        dragPayload: {
          kind: "file",
          name: file.name,
          explorerEntryId: file.id,
          parentId: file.parentId,
          fileKind: file.kind,
          fileExtension: (file.fileExtension || extMatch?.[1] || "").toLowerCase() || undefined,
          mediaUrl: file.mediaUrl,
          thumbnailUrl: thumb,
          targetRoute: file.targetRoute || "/file-explorer",
        },
        onSelect: () => {
          onLaunchRoute(file.targetRoute || "/file-explorer");
          onClose();
        },
      };
    }),
  ];

  if (importedCandidates.length === 0) {
    importedCandidates.push(
      ...DEFAULT_WORKSPACE_FILES.map<StartForYouItem>((file) => ({
        id: `fy-file-${file.id}`,
        kind: "imported",
        title: file.name,
        subtitle: `File Explorer · ${file.location}`,
        fileExt: file.ext,
        dragPayload: {
          kind: "file",
          name: file.name,
          explorerEntryId: file.id,
          fileKind: file.ext.toLowerCase(),
          fileExtension: file.ext.toLowerCase(),
          targetRoute: "/file-explorer",
        },
        onSelect: () => {
          onLaunchRoute("/file-explorer");
          onClose();
        },
      })),
    );
  }
  pools.push(shuffleArray(importedCandidates));

  // 6. Apps
  const eligibleApps = pinnedApps.filter((app) => app.id !== "app-pc-settings");
  const appCandidates = shuffleArray(eligibleApps).map<StartForYouItem>((app) => ({
    id: `fy-app-${app.id}`,
    kind: "app",
    title: app.label,
    subtitle: "Suggested app",
    appId: app.id,
    dragPayload: {
      kind: "app",
      appId: app.id,
      label: app.label,
      route: app.route || "/",
      externalUrl: app.externalUrl,
    },
    onSelect: () => {
      onLaunchApp(app);
    },
  }));
  if (appCandidates.length > 0) pools.push(appCandidates);

  // 7. Screenbox media
  const savedScreenbox = readStoredJson<StoredScreenboxItem[]>("vone_screenbox_playlist_v5");
  const screenboxSource =
    Array.isArray(savedScreenbox) && savedScreenbox.length > 0
      ? savedScreenbox
      : DEFAULT_SCREENBOX_MEDIA;
  const screenboxCandidates = shuffleArray(screenboxSource).map<StartForYouItem>((media) => {
    const cleanTitle = media.title.replace(/^Track\s+\d+:\s*/i, "");
    const thumb = extractYouTubeThumbnail(media.embedUrl || media.url || "");
    return {
      id: `fy-sb-${media.id}`,
      kind: "screenbox",
      title: cleanTitle,
      subtitle: media.artist ? `Screenbox · ${media.artist}` : "Screenbox media",
      ...(thumb ? { imageUrl: thumb, isContainImage: false } : {}),
      dragPayload: {
        kind: "file",
        name: cleanTitle,
        fileKind: media.type === "audio" ? "audio" : "video",
        mediaUrl: media.url,
        thumbnailUrl: thumb,
        linkedSource: "screenbox",
        linkedId: media.id,
        targetRoute: "/screenbox",
      },
      onSelect: () => {
        onLaunchRoute("/screenbox");
        onClose();
      },
    };
  });
  if (screenboxCandidates.length > 0) pools.push(screenboxCandidates);

  // 8. Random photo in Gallery
  const galleryPool =
    galleryItems.length > 0
      ? galleryItems.filter((item) => item.type === "image")
      : DEFAULT_GALLERY_ITEMS.filter((item) => item.type === "image");
  const galleryCandidates = shuffleArray(galleryPool).map<StartForYouItem>((item) => ({
    id: `fy-gal-img-${item.id}`,
    kind: "gallery",
    title: item.title,
    subtitle: item.dateLabel ? `Photos Gallery · ${item.dateLabel}` : "Photos Gallery",
    imageUrl: item.thumbnailUrl || item.url,
    isContainImage: false,
    dragPayload: {
      kind: "file",
      name: item.title,
      fileKind: "image",
      mediaUrl: item.url,
      thumbnailUrl: item.thumbnailUrl || item.url,
      linkedSource: "gallery",
      linkedId: item.id,
      targetRoute: `/gallery?preview=${encodeURIComponent(item.id)}`,
    },
    onSelect: () => {
      onLaunchRoute("/gallery", { itemId: item.id });
      window.dispatchEvent(
        new CustomEvent("vplay:gallery:item_selected", { detail: { itemId: item.id } }),
      );
      onClose();
    },
  }));
  if (galleryCandidates.length > 0) pools.push(galleryCandidates);

  // 9. Random article in Update blogs
  const articleCandidates = shuffleArray(NEWS_DATA).map<StartForYouItem>((article) => ({
    id: `fy-art-${article.id}`,
    kind: "article",
    title: article.title.replace(/^#\s*/, ""),
    subtitle: `Update blogs · ${article.category || article.publishedAt}`,
    ...(article.coverImage ? { imageUrl: article.coverImage, isContainImage: false } : {}),
    dragPayload: {
      kind: "article",
      articleId: article.id,
      slug: article.slug,
      title: article.title.replace(/^#\s*/, ""),
      coverImage: article.coverImage,
    },
    onSelect: () => {
      onLaunchRoute(`/news/${article.slug}`);
      onClose();
    },
  }));
  if (articleCandidates.length > 0) pools.push(articleCandidates);

  // 10. Suggested settings in PC Settings
  const settingCandidates = shuffleArray(SUGGESTED_PC_SETTINGS).map<StartForYouItem>((setting) => ({
    id: `fy-set-${setting.category}`,
    kind: "setting",
    title: setting.title,
    subtitle: setting.subtitle,
    settingCategory: setting.category,
    dragPayload: {
      kind: "setting",
      title: setting.title,
      route: `/pc-settings/${setting.category}`,
      routeState: { initialCategory: setting.category },
      category: setting.category,
    },
    onSelect: () => {
      onLaunchRoute(`/pc-settings/${setting.category}`, { initialCategory: setting.category });
      window.dispatchEvent(
        new CustomEvent("sparkle:pc-settings-category", {
          detail: { category: setting.category },
        }),
      );
      onClose();
    },
  }));
  pools.push(settingCandidates);

  // Pick 1 representative from each shuffled pool first to ensure wide variety across 9 slots
  const shuffledPools = shuffleArray(pools);
  const picked: StartForYouItem[] = [];
  const usedIds = new Set<string>();

  for (const pool of shuffledPools) {
    if (picked.length >= 9) break;
    const item = pool.find((candidate) => !usedIds.has(candidate.id));
    if (item) {
      usedIds.add(item.id);
      picked.push(item);
    }
  }

  // If fewer than 9 pools produced items, backfill from remaining shuffled candidates
  if (picked.length < 9) {
    const extras = shuffleArray(shuffledPools.flat());
    for (const candidate of extras) {
      if (picked.length >= 9) break;
      if (!usedIds.has(candidate.id)) {
        usedIds.add(candidate.id);
        picked.push(candidate);
      }
    }
  }

  return shuffleArray(picked).slice(0, 9);
}
