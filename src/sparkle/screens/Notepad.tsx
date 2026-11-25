import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, Reorder, type MotionStyle, type Variants } from "motion/react";
import {
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Code,
  Columns2,
  Download,
  Eye,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Heading,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  MessageSquare,
  Minus,
  Monitor,
  PenLine,
  Plus,
  Quote,
  RemoveFormatting,
  Replace,
  RotateCcw,
  Save,
  Search,
  Strikethrough,
  Table2,
  X,
} from "lucide-react";
import { WindowTitleBarPortalContext } from "../components/WindowFrame";
import { Fluent3DNotepadIcon } from "../components/Fluent3DIcons";
import { FluentSettingsIcon } from "../components/FluentIcons";
import {
  contextMenuMotionProps,
  flyoutPanelClassName,
  flyoutPanelStyle,
} from "../components/FlyoutDropdown";
import { modalBackdropVariants, modalDialogVariants } from "../utils/animations";
import { useSettings } from "../hooks/useSettings";
import { showAppToast } from "../utils/toast";
import { setSodiumDragData } from "../utils/sodiumDragData";

interface NotepadProps {
  navigate?: (route: string, state?: unknown) => void;
}

type LineEnding = "CRLF" | "LF";
type DocFormat = "plain" | "markdown";
type ViewDisplayMode = "formatted" | "source" | "split" | "preview";
type NotepadFontFamily = "Consolas" | "Cascadia Mono" | "JetBrains Mono" | "Segoe UI";

interface HistorySnapshot {
  content: string;
  htmlContent: string;
}

interface NotepadTab {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
  savedContent: string;
  dirty: boolean;
  lineEnding: LineEnding;
  format: DocFormat;
  encoding: string;
  zoom: number;
  explorerEntryId?: string | undefined;
  explorerParentId?: string | undefined;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
}

interface NotepadPrefs {
  showFormattingBar: boolean;
  showStatusBar: boolean;
  wordWrap: boolean;
  defaultFormat: DocFormat;
  fontFamily: NotepadFontFamily;
  fontSize: number;
  themeOverride: "system" | "dark" | "light";
}

interface ActiveFormattingState {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  headingLevel: number;
  bulletList: boolean;
  numberedList: boolean;
  blockquote: boolean;
  canOutdent: boolean;
}

interface ExplorerFsEntry {
  id: string;
  parentId: string;
  name: string;
  kind: string;
  sizeBytes?: number;
  modifiedAt: number;
  locationLabel: string;
  pathLabel: string;
  status?: "synced" | "cloud" | "local";
  fileExtension?: string;
  linkedSource?: string;
  textContent?: string;
  targetDirId?: string;
}

interface PendingNotepadOpenPayload {
  id?: string | undefined;
  parentId?: string | undefined;
  name: string;
  textContent?: string | undefined;
  fileExtension?: string | undefined;
}

interface ExplorerFolderLocation {
  id: string;
  name: string;
  parentId: string | null;
  pathLabel: string;
  icon:
    | "desktop"
    | "documents"
    | "downloads"
    | "images"
    | "music"
    | "videos"
    | "personal"
    | "cloud"
    | "drive"
    | "folder";
}

const TABS_STORAGE_KEY = "sparkle_notepad_tabs_v2";
const ACTIVE_TAB_STORAGE_KEY = "sparkle_notepad_active_tab_v2";
const PREFS_STORAGE_KEY = "sparkle_notepad_prefs_v1";
const EXPLORER_FS_STORAGE_KEY = "sparkle_file_explorer_v1";
const EXPLORER_OPEN_PAYLOAD_KEY = "sparkle_notepad_open_entry_v1";
const motionFlyoutStyle = flyoutPanelStyle as MotionStyle;

const DEFAULT_PREFS: NotepadPrefs = {
  showFormattingBar: true,
  showStatusBar: true,
  wordWrap: true,
  defaultFormat: "markdown",
  fontFamily: "Segoe UI",
  fontSize: 14,
  themeOverride: "system",
};

const EXPLORER_DIRECTORIES: Record<string, ExplorerFolderLocation> = {
  "dir-home": {
    id: "dir-home",
    name: "Home",
    parentId: null,
    pathLabel: "Home",
    icon: "folder",
  },
  "dir-this-pc": {
    id: "dir-this-pc",
    name: "This PC",
    parentId: "dir-home",
    pathLabel: "This PC",
    icon: "drive",
  },
  "dir-desktop": {
    id: "dir-desktop",
    name: "Desktop",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium\\Desktop",
    icon: "desktop",
  },
  "dir-documents": {
    id: "dir-documents",
    name: "Documents",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium\\Documents",
    icon: "documents",
  },
  "dir-downloads": {
    id: "dir-downloads",
    name: "Downloads",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium\\Downloads",
    icon: "downloads",
  },
  "dir-pictures": {
    id: "dir-pictures",
    name: "Images",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium\\Pictures",
    icon: "images",
  },
  "dir-music": {
    id: "dir-music",
    name: "Music",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium\\Music",
    icon: "music",
  },
  "dir-videos": {
    id: "dir-videos",
    name: "Videos",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium\\Videos",
    icon: "videos",
  },
  "dir-personal": {
    id: "dir-personal",
    name: "Personal folder",
    parentId: "dir-this-pc",
    pathLabel: "C:\\Users\\Sodium",
    icon: "personal",
  },
  "dir-cloud": {
    id: "dir-cloud",
    name: "Sodium - Personal",
    parentId: "dir-home",
    pathLabel: "Sodium Cloud\\Personal",
    icon: "cloud",
  },
  "dir-drive-c": {
    id: "dir-drive-c",
    name: "Local Disk (C:)",
    parentId: "dir-this-pc",
    pathLabel: "C:\\",
    icon: "drive",
  },
  "dir-drive-d": {
    id: "dir-drive-d",
    name: "Data (D:)",
    parentId: "dir-this-pc",
    pathLabel: "D:\\",
    icon: "drive",
  },
};

const QUICK_FOLDER_IDS = [
  "dir-desktop",
  "dir-documents",
  "dir-downloads",
  "dir-pictures",
  "dir-music",
  "dir-videos",
  "dir-personal",
  "dir-cloud",
  "dir-drive-c",
  "dir-drive-d",
];

function loadExplorerCustomEntries(): ExplorerFsEntry[] {
  try {
    const raw = localStorage.getItem(EXPLORER_FS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExplorerFsEntry[]) : [];
  } catch {
    return [];
  }
}

function saveExplorerCustomEntries(entries: ExplorerFsEntry[]) {
  try {
    localStorage.setItem(EXPLORER_FS_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent("sparkle:file-explorer-fs-updated"));
  } catch {
    // ignore storage errors
  }
}

function resolveExplorerDirectory(
  dirId: string,
  entries: ExplorerFsEntry[],
): ExplorerFolderLocation {
  const core = EXPLORER_DIRECTORIES[dirId];
  if (core) return core;
  const folderEntry = entries.find(
    (entry) => entry.kind === "folder" && (entry.targetDirId === dirId || entry.id === dirId),
  );
  if (folderEntry) {
    return {
      id: folderEntry.targetDirId || folderEntry.id,
      name: folderEntry.name,
      parentId: folderEntry.parentId,
      pathLabel: folderEntry.pathLabel,
      icon: "folder",
    };
  }
  return EXPLORER_DIRECTORIES["dir-documents"]!;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeLinkUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^(https?:|mailto:|#)/i.test(trimmed)) return trimmed;
  return "#";
}

function inlineMarkdownToHtml(text: string): string {
  const tokenRegex = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let out = "";
  let lastIdx = 0;
  let match: RegExpExecArray | null = null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      out += escapeHtml(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      out += `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      out += `<s>${escapeHtml(token.slice(2, -2))}</s>`;
    } else if (token.startsWith("`") && token.endsWith("`")) {
      out += `<code>${escapeHtml(token.slice(1, -1))}</code>`;
    } else if (token.startsWith("*") && token.endsWith("*")) {
      out += `<em>${escapeHtml(token.slice(1, -1))}</em>`;
    } else if (match[2] && match[3]) {
      const safeHref = escapeHtml(sanitizeLinkUrl(match[3]));
      out += `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(match[2])}</a>`;
    } else {
      out += escapeHtml(token);
    }
    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    out += escapeHtml(text.slice(lastIdx));
  }
  return out;
}

function markdownToEditorHtml(markdown: string): string {
  if (!markdown) return "";
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push("<hr>");
      i += 1;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const lvl = Math.min(6, Math.max(1, headingMatch[1]?.length ?? 1));
      const content = inlineMarkdownToHtml(headingMatch[2] ?? "");
      blocks.push(`<h${lvl}>${content || "<br>"}</h${lvl}>`);
      i += 1;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith(">")) {
        quoteLines.push(inlineMarkdownToHtml((lines[i] ?? "").replace(/^\s*>\s?/, "")));
        i += 1;
      }
      blocks.push(`<blockquote>${quoteLines.map((q) => q || "<br>").join("<br>")}</blockquote>`);
      continue;
    }

    // GFM Table
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1] ?? "")
    ) {
      const parseRow = (raw: string) =>
        raw
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const headers = parseRow(line);
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").includes("|") && (lines[i] ?? "").trim() !== "") {
        bodyRows.push(parseRow(lines[i] ?? ""));
        i += 1;
      }
      const headHtml = `<thead><tr>${headers
        .map((h) => `<th>${inlineMarkdownToHtml(h)}</th>`)
        .join("")}</tr></thead>`;
      const bodyHtml = `<tbody>${bodyRows
        .map(
          (row) =>
            `<tr>${headers
              .map((_, cIdx) => `<td>${inlineMarkdownToHtml(row[cIdx] ?? "")}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</tbody>`;
      blocks.push(`<table>${headHtml}${bodyHtml}</table>`);
      continue;
    }

    // Unordered or task list
    if (/^\s*[-*+]\s+/.test(line)) {
      const taskItems: { checked: boolean; text: string }[] = [];
      const bulletItems: string[] = [];
      let hasTask = false;
      const startIdx = i;
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? "")) {
        const rawItem = (lines[i] ?? "").replace(/^\s*[-*+]\s+/, "");
        const taskMatch = rawItem.match(/^\[( |x|X)\]\s+(.*)$/);
        if (taskMatch) {
          hasTask = true;
          taskItems.push({
            checked: (taskMatch[1] ?? " ").toLowerCase() === "x",
            text: taskMatch[2] ?? "",
          });
        } else {
          bulletItems.push(rawItem);
        }
        i += 1;
      }

      if (hasTask && bulletItems.length === 0) {
        blocks.push(
          `<ul data-task-list="true" style="list-style:none;padding-left:2px;">${taskItems
            .map(
              (item) =>
                `<li data-task="true" data-checked="${item.checked ? "true" : "false"}"><input type="checkbox"${
                  item.checked ? " checked" : ""
                } /> <span>${inlineMarkdownToHtml(item.text) || "<br>"}</span></li>`,
            )
            .join("")}</ul>`,
        );
      } else {
        i = startIdx;
        const plainBullets: string[] = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? "")) {
          const rawItem = (lines[i] ?? "").replace(/^\s*[-*+]\s+/, "");
          plainBullets.push(`<li>${inlineMarkdownToHtml(rawItem) || "<br>"}</li>`);
          i += 1;
        }
        blocks.push(`<ul>${plainBullets.join("")}</ul>`);
      }
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push(
          `<li>${inlineMarkdownToHtml((lines[i] ?? "").replace(/^\s*\d+\.\s+/, "")) || "<br>"}</li>`,
        );
        i += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (line.trim() === "") {
      blocks.push("<p><br></p>");
      i += 1;
      continue;
    }

    blocks.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
    i += 1;
  }

  return blocks.join("");
}

function serializeInlineNodes(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\u00A0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") return "\n";
  if (tag === "input") return "";

  const inner = Array.from(el.childNodes).map(serializeInlineNodes).join("");
  if (tag === "strong" || tag === "b") {
    return inner.trim() ? `**${inner}**` : inner;
  }
  if (tag === "em" || tag === "i") {
    return inner.trim() ? `*${inner}*` : inner;
  }
  if (tag === "del" || tag === "s" || tag === "strike") {
    return inner.trim() ? `~~${inner}~~` : inner;
  }
  if (tag === "code") {
    return inner ? `\`${inner}\`` : "";
  }
  if (tag === "a") {
    const href = el.getAttribute("href") ?? "#";
    return `[${inner || href}](${href})`;
  }
  if (tag === "span") {
    let styled = inner;
    const fw = el.style.fontWeight;
    const fs = el.style.fontStyle;
    const td = el.style.textDecoration || el.style.textDecorationLine;
    if (styled.trim()) {
      if (td.includes("line-through")) styled = `~~${styled}~~`;
      if (fs === "italic") styled = `*${styled}*`;
      if (fw === "bold" || Number(fw) >= 600) styled = `**${styled}**`;
    }
    return styled;
  }
  return inner;
}

function serializeListElement(listEl: HTMLElement, ordered: boolean, depth: number): string[] {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  let itemNum = 1;

  Array.from(listEl.children).forEach((child) => {
    const tag = child.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      lines.push(...serializeListElement(child as HTMLElement, tag === "ol", depth + 1));
      return;
    }
    if (tag !== "li") return;

    const li = child as HTMLElement;
    const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    const nestedLists: HTMLElement[] = [];
    const inlineParts: string[] = [];

    Array.from(li.childNodes).forEach((sub) => {
      if (sub.nodeType === Node.ELEMENT_NODE) {
        const subTag = (sub as HTMLElement).tagName.toLowerCase();
        if (subTag === "ul" || subTag === "ol") {
          nestedLists.push(sub as HTMLElement);
          return;
        }
      }
      inlineParts.push(serializeInlineNodes(sub));
    });

    const text = inlineParts.join("").replace(/\n+/g, " ").trim();
    if (checkbox) {
      const checked = checkbox.checked || li.getAttribute("data-checked") === "true";
      lines.push(`${indent}- [${checked ? "x" : " "}] ${text}`);
    } else if (ordered) {
      lines.push(`${indent}${itemNum}. ${text}`);
      itemNum += 1;
    } else {
      lines.push(`${indent}- ${text}`);
    }

    nestedLists.forEach((nested) => {
      lines.push(...serializeListElement(nested, nested.tagName.toLowerCase() === "ol", depth + 1));
    });
  });

  return lines;
}

function editorElementToMarkdown(root: HTMLElement): string {
  const lines: string[] = [];

  const pushBlock = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node.textContent ?? "").replace(/\u00A0/g, " ");
      if (txt.trim() !== "") {
        lines.push(txt);
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "hr") {
      lines.push("---");
      return;
    }

    if (tag === "pre") {
      const code = (el.textContent ?? "").replace(/\u00A0/g, " ").replace(/\n+$/, "");
      lines.push("```", code, "```");
      return;
    }

    if (/^h[1-6]$/.test(tag)) {
      const lvl = Number(tag[1] ?? "1");
      const text = Array.from(el.childNodes).map(serializeInlineNodes).join("").trim();
      lines.push(`${"#".repeat(lvl)} ${text}`);
      return;
    }

    if (tag === "blockquote") {
      const inner = Array.from(el.childNodes).map(serializeInlineNodes).join("").trimEnd();
      const bqLines = inner ? inner.split("\n") : [""];
      bqLines.forEach((l) => lines.push(`> ${l}`));
      return;
    }

    if (tag === "ul") {
      lines.push(...serializeListElement(el, false, 0));
      return;
    }

    if (tag === "ol") {
      lines.push(...serializeListElement(el, true, 0));
      return;
    }

    if (tag === "table") {
      const rows = Array.from(el.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.children).map((cell) =>
          Array.from(cell.childNodes)
            .map(serializeInlineNodes)
            .join("")
            .replace(/\|/g, "\\|")
            .trim(),
        ),
      );
      if (rows.length > 0) {
        const header = rows[0] ?? [];
        const cols = Math.max(1, header.length);
        lines.push(`| ${header.join(" | ")} |`);
        lines.push(`| ${Array.from({ length: cols }, () => "---").join(" | ")} |`);
        rows.slice(1).forEach((r) => {
          const padded = Array.from({ length: cols }, (_, idx) => r[idx] ?? "");
          lines.push(`| ${padded.join(" | ")} |`);
        });
      }
      return;
    }

    if (tag === "p" || tag === "div") {
      const hasOnlyBr =
        el.childNodes.length === 1 &&
        el.firstChild?.nodeType === Node.ELEMENT_NODE &&
        (el.firstChild as HTMLElement).tagName.toLowerCase() === "br";
      if (hasOnlyBr || el.childNodes.length === 0) {
        lines.push("");
        return;
      }
      const hasBlockChildren = Array.from(el.children).some((c) =>
        /^(p|div|h[1-6]|ul|ol|blockquote|pre|table|hr)$/i.test(c.tagName),
      );
      if (hasBlockChildren) {
        Array.from(el.childNodes).forEach(pushBlock);
        return;
      }
      const text = Array.from(el.childNodes).map(serializeInlineNodes).join("").replace(/\n+$/, "");
      lines.push(text);
      return;
    }

    const fallback = serializeInlineNodes(el);
    if (fallback) lines.push(fallback);
  };

  Array.from(root.childNodes).forEach(pushBlock);
  return lines.join("\n").replace(/\n+$/, "");
}

function createInitialTab(): NotepadTab {
  return {
    id: "notepad-tab-initial",
    title: "Untitled",
    content: "",
    htmlContent: "",
    savedContent: "",
    dirty: false,
    lineEnding: "CRLF",
    format: "markdown",
    encoding: "UTF-8",
    zoom: 100,
    undoStack: [],
    redoStack: [],
  };
}

function createBlankTab(index: number, defaultFormat: DocFormat): NotepadTab {
  return {
    id: `notepad-tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: index <= 1 ? "Untitled" : `Untitled ${index}`,
    content: "",
    htmlContent: "",
    savedContent: "",
    dirty: false,
    lineEnding: "CRLF",
    format: defaultFormat,
    encoding: "UTF-8",
    zoom: 100,
    undoStack: [],
    redoStack: [],
  };
}

function loadPrefs(): NotepadPrefs {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotepadPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function normalizeSnapshotArray(raw: unknown): HistorySnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-40).map((item) => {
    if (typeof item === "string") {
      return { content: item, htmlContent: markdownToEditorHtml(item) };
    }
    if (item && typeof item === "object") {
      const obj = item as Partial<HistorySnapshot>;
      const content = typeof obj.content === "string" ? obj.content : "";
      const htmlContent =
        typeof obj.htmlContent === "string" ? obj.htmlContent : markdownToEditorHtml(content);
      return { content, htmlContent };
    }
    return { content: "", htmlContent: "" };
  });
}

function loadInitialTabs(): NotepadTab[] {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    if (!raw) return [createInitialTab()];
    const parsed = JSON.parse(raw) as NotepadTab[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [createInitialTab()];
    return parsed.map((t) => {
      const content = typeof t.content === "string" ? t.content : "";
      const htmlContent =
        typeof t.htmlContent === "string" ? t.htmlContent : markdownToEditorHtml(content);
      return {
        ...createBlankTab(1, "markdown"),
        ...t,
        content,
        htmlContent,
        undoStack: normalizeSnapshotArray(t.undoStack),
        redoStack: normalizeSnapshotArray(t.redoStack),
      };
    });
  } catch {
    return [createInitialTab()];
  }
}

function deriveTabTitle(content: string, fallbackTitle: string, isCustomFilename: boolean): string {
  if (isCustomFilename) return fallbackTitle;
  const firstNonEmpty = content
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find((line) => line.length > 0);
  if (!firstNonEmpty) return fallbackTitle.startsWith("Untitled") ? fallbackTitle : "Untitled";
  return firstNonEmpty.length > 36 ? `${firstNonEmpty.slice(0, 36)}…` : firstNonEmpty;
}

function computeLineAndColumn(content: string, caretOffset: number): { line: number; col: number } {
  const clamped = Math.max(0, Math.min(caretOffset, content.length));
  const before = content.slice(0, clamped);
  const lines = before.split("\n");
  return {
    line: lines.length,
    col: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}

function formatLineNumbered(line: string, index: number): string {
  const clean = line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+|-\s+\[[ xX]\]\s+)/, "");
  return `${index + 1}. ${clean}`;
}

function getCaretTextOffsetInElement(root: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return 0;
  try {
    const preRange = document.createRange();
    preRange.selectNodeContents(root);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  } catch {
    return 0;
  }
}

function selectTextRangeInElement(
  root: HTMLElement,
  startOffset: number,
  endOffset: number,
): boolean {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = 0;
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;

  let node = walker.nextNode() as Text | null;
  while (node) {
    const len = node.nodeValue?.length ?? 0;
    if (!startNode && current + len >= startOffset) {
      startNode = node;
      startNodeOffset = Math.max(0, startOffset - current);
    }
    if (!endNode && current + len >= endOffset) {
      endNode = node;
      endNodeOffset = Math.max(0, endOffset - current);
      break;
    }
    current += len;
    node = walker.nextNode() as Text | null;
  }

  if (!startNode || !endNode) return false;
  const sel = window.getSelection();
  if (!sel) return false;
  const range = document.createRange();
  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `md-inl-${keyCounter++}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      nodes.push(
        <del key={key} className="line-through opacity-75">
          {token.slice(2, -2)}
        </del>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded-[4px] bg-black/[0.06] dark:bg-white/[0.1] font-mono text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (match[2] && match[3]) {
      const safeHref = sanitizeLinkUrl(match[3]);
      nodes.push(
        <a
          key={key}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0067b8] dark:text-[#4cc2ff] underline underline-offset-2"
        >
          {match[2]}
        </a>,
      );
    } else {
      nodes.push(token);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

const MarkdownPreviewPane: React.FC<{ content: string; fontSize: number }> = ({
  content,
  fontSize,
}) => {
  const blocks = useMemo(() => {
    const lines = content.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i] ?? "";

      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i += 1;
        while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
          codeLines.push(lines[i] ?? "");
          i += 1;
        }
        i += 1;
        elements.push(
          <div
            key={`code-${i}`}
            className="my-2.5 rounded-[6px] border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.04] dark:bg-[#1e1e1e] overflow-hidden"
          >
            {lang && (
              <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider opacity-60 border-b border-black/[0.06] dark:border-white/[0.06]">
                {lang}
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-[13px] font-mono leading-relaxed">
              <code>{codeLines.join("\n")}</code>
            </pre>
          </div>,
        );
        continue;
      }

      if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
        elements.push(<hr key={`hr-${i}`} className="my-4 border-black/10 dark:border-white/10" />);
        i += 1;
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1]?.length ?? 1;
        const text = headingMatch[2] ?? "";
        const headingClasses: Record<number, string> = {
          1: "text-[1.75em] font-semibold mt-4 mb-2 pb-1 border-b border-black/[0.08] dark:border-white/[0.08]",
          2: "text-[1.45em] font-semibold mt-3.5 mb-1.5",
          3: "text-[1.22em] font-semibold mt-3 mb-1",
          4: "text-[1.08em] font-semibold mt-2.5 mb-1",
          5: "text-[0.98em] font-semibold mt-2 mb-0.5",
          6: "text-[0.9em] font-semibold opacity-80 mt-2 mb-0.5",
        };
        elements.push(
          <div key={`h-${i}`} className={headingClasses[level]}>
            {renderInlineMarkdown(text)}
          </div>,
        );
        i += 1;
        continue;
      }

      if (line.trim().startsWith(">")) {
        const quoteLines: string[] = [];
        while (i < lines.length && (lines[i] ?? "").trim().startsWith(">")) {
          quoteLines.push((lines[i] ?? "").replace(/^\s*>\s?/, ""));
          i += 1;
        }
        elements.push(
          <blockquote
            key={`bq-${i}`}
            className="my-2 pl-3.5 border-l-[3px] border-[#0067b8] dark:border-[#4cc2ff] opacity-90 space-y-1"
          >
            {quoteLines.map((ql, idx) => (
              <p key={idx}>{renderInlineMarkdown(ql)}</p>
            ))}
          </blockquote>,
        );
        continue;
      }

      if (
        line.includes("|") &&
        i + 1 < lines.length &&
        /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1] ?? "")
      ) {
        const parseRow = (raw: string) =>
          raw
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim());
        const headers = parseRow(line);
        i += 2;
        const bodyRows: string[][] = [];
        while (
          i < lines.length &&
          (lines[i] ?? "").includes("|") &&
          (lines[i] ?? "").trim() !== ""
        ) {
          bodyRows.push(parseRow(lines[i] ?? ""));
          i += 1;
        }
        elements.push(
          <div
            key={`tbl-${i}`}
            className="my-3 overflow-x-auto rounded-[6px] border border-black/[0.08] dark:border-white/[0.1]"
          >
            <table className="w-full text-left border-collapse text-[0.92em]">
              <thead>
                <tr className="bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/[0.08] dark:border-white/[0.09]">
                  {headers.map((h, idx) => (
                    <th key={idx} className="px-3 py-1.5 font-semibold">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {headers.map((_, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5">
                        {renderInlineMarkdown(row[cIdx] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const listItems: { checked?: boolean; text: string }[] = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? "")) {
          const itemLine = (lines[i] ?? "").replace(/^\s*[-*+]\s+/, "");
          const taskMatch = itemLine.match(/^\[( |x|X)\]\s+(.*)$/);
          if (taskMatch) {
            listItems.push({
              checked: (taskMatch[1] ?? " ").toLowerCase() === "x",
              text: taskMatch[2] ?? "",
            });
          } else {
            listItems.push({ text: itemLine });
          }
          i += 1;
        }
        elements.push(
          <ul key={`ul-${i}`} className="my-2 pl-5 space-y-1 list-disc">
            {listItems.map((it, idx) =>
              it.checked !== undefined ? (
                <li key={idx} className="list-none -ml-4 flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                      it.checked
                        ? "bg-[#0067b8] dark:bg-[#4cc2ff] border-transparent text-white dark:text-black"
                        : "border-black/30 dark:border-white/35"
                    }`}
                  >
                    {it.checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span className={it.checked ? "line-through opacity-65" : ""}>
                    {renderInlineMarkdown(it.text)}
                  </span>
                </li>
              ) : (
                <li key={idx}>{renderInlineMarkdown(it.text)}</li>
              ),
            )}
          </ul>,
        );
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
          listItems.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
          i += 1;
        }
        elements.push(
          <ol key={`ol-${i}`} className="my-2 pl-5 space-y-1 list-decimal">
            {listItems.map((it, idx) => (
              <li key={idx}>{renderInlineMarkdown(it)}</li>
            ))}
          </ol>,
        );
        continue;
      }

      if (line.trim() === "") {
        elements.push(<div key={`sp-${i}`} className="h-3" />);
        i += 1;
        continue;
      }

      elements.push(
        <p key={`p-${i}`} className="leading-relaxed my-1">
          {renderInlineMarkdown(line)}
        </p>,
      );
      i += 1;
    }

    return elements;
  }, [content]);

  return (
    <div
      style={{ fontSize }}
      className="w-full h-full overflow-y-auto sidebar-scroller px-6 py-4 select-text text-black dark:text-white"
    >
      {blocks.length === 0 ? (
        <div className="opacity-45 italic text-[13px]">Nothing to preview yet.</div>
      ) : (
        blocks
      )}
    </div>
  );
};

export const Notepad: React.FC<NotepadProps> = ({ navigate }) => {
  const { settings } = useSettings();
  const { titleBarSlotEl, isInsideWindowFrame } = useContext(WindowTitleBarPortalContext);

  const [prefs, setPrefs] = useState<NotepadPrefs>(loadPrefs);
  const [tabs, setTabs] = useState<NotepadTab[]>(loadInitialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore storage errors
    }
    return "notepad-tab-initial";
  });

  const [openMenu, setOpenMenu] = useState<
    null | "file" | "edit" | "view" | "heading" | "list" | "insert" | "link"
  >(null);
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [viewDisplayMode, setViewDisplayMode] = useState<ViewDisplayMode>("formatted");
  const [externalSyncNonce, setExternalSyncNonce] = useState(0);
  const [caretOffset, setCaretOffset] = useState<number>(0);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const [activeFormats, setActiveFormats] = useState<ActiveFormattingState>({
    bold: false,
    italic: false,
    strikethrough: false,
    headingLevel: 0,
    bulletList: false,
    numberedList: false,
    blockquote: false,
    canOutdent: false,
  });

  // Find & Replace
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceVisible, setIsReplaceVisible] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  // Link popover
  const [linkTitleInput, setLinkTitleInput] = useState("");
  const [linkUrlInput, setLinkUrlInput] = useState("https://");

  // File Explorer Save As / Open Dialog state
  const [explorerDialogMode, setExplorerDialogMode] = useState<null | "save" | "open">(null);
  const [explorerDirId, setExplorerDirId] = useState<string>("dir-documents");
  const [explorerEntries, setExplorerEntries] =
    useState<ExplorerFsEntry[]>(loadExplorerCustomEntries);
  const [saveFileNameInput, setSaveFileNameInput] = useState("Untitled.md");
  const [saveFileExt, setSaveFileExt] = useState<"md" | "txt">("md");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedDialogEntryId, setSelectedDialogEntryId] = useState<string | null>(null);

  const [tabContextMenu, setTabContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);
  const [customTitledIds, setCustomTitledIds] = useState<Record<string, boolean>>({});

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const savedRichRangeRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const saveFileNameInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );

  // Persist prefs, tabs, active tab
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage quota errors
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    } catch {
      // ignore storage quota errors
    }
  }, [tabs]);

  useEffect(() => {
    try {
      if (activeTab?.id) {
        localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab.id);
      }
    } catch {
      // ignore storage errors
    }
  }, [activeTab?.id]);

  // Synchronize rich editor DOM ONLY on tab switch, view mode switch, or explicit external mutations
  useEffect(() => {
    if (viewDisplayMode !== "formatted" || isSettingsView || !activeTab) return;
    const el = richEditorRef.current;
    if (!el) return;
    if (el.innerHTML !== activeTab.htmlContent) {
      el.innerHTML = activeTab.htmlContent;
    }
  }, [activeTab?.id, viewDisplayMode, externalSyncNonce, isSettingsView]);

  // Listen for File Explorer FS updates while dialog is open
  useEffect(() => {
    const syncFs = () => setExplorerEntries(loadExplorerCustomEntries());
    window.addEventListener("sparkle:file-explorer-fs-updated", syncFs);
    window.addEventListener("storage", syncFs);
    return () => {
      window.removeEventListener("sparkle:file-explorer-fs-updated", syncFs);
      window.removeEventListener("storage", syncFs);
    };
  }, []);

  // Open pending entry sent from File Explorer
  const openExplorerPayloadInTab = useCallback((payload: PendingNotepadOpenPayload) => {
    const raw = payload.textContent ?? "";
    const hasCrlf = raw.includes("\r\n");
    const normalized = raw.replace(/\r\n/g, "\n");
    const isMd = /\.(md|markdown)$/i.test(payload.name) || payload.fileExtension === "md";
    const html = markdownToEditorHtml(normalized);

    setTabs((prev) => {
      const existing = payload.id ? prev.find((t) => t.explorerEntryId === payload.id) : undefined;
      if (existing) {
        setActiveTabId(existing.id);
        if (!existing.dirty) {
          return prev.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  title: payload.name,
                  content: normalized,
                  htmlContent: html,
                  savedContent: normalized,
                  format: isMd ? "markdown" : "plain",
                }
              : t,
          );
        }
        return prev;
      }

      const newTab: NotepadTab = {
        id: `notepad-tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: payload.name,
        content: normalized,
        htmlContent: html,
        savedContent: normalized,
        dirty: false,
        lineEnding: hasCrlf ? "CRLF" : "LF",
        format: isMd ? "markdown" : "plain",
        encoding: "UTF-8",
        zoom: 100,
        explorerEntryId: payload.id,
        explorerParentId: payload.parentId,
        undoStack: [],
        redoStack: [],
      };
      setCustomTitledIds((m) => ({ ...m, [newTab.id]: true }));
      setActiveTabId(newTab.id);
      return [...prev, newTab];
    });
    setIsSettingsView(false);
    setExternalSyncNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const checkPendingOpen = () => {
      try {
        const raw = localStorage.getItem(EXPLORER_OPEN_PAYLOAD_KEY);
        if (!raw) return;
        localStorage.removeItem(EXPLORER_OPEN_PAYLOAD_KEY);
        const parsed = JSON.parse(raw) as PendingNotepadOpenPayload;
        if (parsed && parsed.name) {
          openExplorerPayloadInTab(parsed);
        }
      } catch {
        // ignore parse errors
      }
    };

    checkPendingOpen();
    const onOpenEvent = (e: Event) => {
      const custom = e as CustomEvent<PendingNotepadOpenPayload | undefined>;
      try {
        localStorage.removeItem(EXPLORER_OPEN_PAYLOAD_KEY);
      } catch {
        // ignore
      }
      if (custom.detail?.name) {
        openExplorerPayloadInTab(custom.detail);
      } else {
        checkPendingOpen();
      }
    };
    window.addEventListener("sparkle:open-in-notepad", onOpenEvent);
    return () => window.removeEventListener("sparkle:open-in-notepad", onOpenEvent);
  }, [openExplorerPayloadInTab]);

  // Close menus on outside pointerdown
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-notepad-menu-root]")) return;
      setOpenMenu(null);
      setTabContextMenu(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const updateActiveTab = useCallback(
    (updater: (prev: NotepadTab) => NotepadTab) => {
      setTabs((prev) => prev.map((t) => (t.id === (activeTab?.id ?? "") ? updater(t) : t)));
    },
    [activeTab?.id],
  );

  const updateTabContent = useCallback(
    (nextContent: string, pushUndo = true, nextHtmlOverride?: string) => {
      if (!activeTab) return;
      const isCustom = Boolean(customTitledIds[activeTab.id] || activeTab.explorerEntryId);
      const nextTitle = deriveTabTitle(nextContent, activeTab.title, isCustom);
      const nextHtml =
        nextHtmlOverride !== undefined ? nextHtmlOverride : markdownToEditorHtml(nextContent);
      updateActiveTab((prev) => ({
        ...prev,
        content: nextContent,
        htmlContent: nextHtml,
        title: nextTitle,
        dirty: nextContent !== prev.savedContent,
        undoStack: pushUndo
          ? [...prev.undoStack.slice(-39), { content: prev.content, htmlContent: prev.htmlContent }]
          : prev.undoStack,
        redoStack: pushUndo ? [] : prev.redoStack,
      }));
    },
    [activeTab, customTitledIds, updateActiveTab],
  );

  const inspectRichSelectionAndFormats = useCallback(() => {
    const el = richEditorRef.current;
    if (!el || viewDisplayMode !== "formatted") return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    savedRichRangeRef.current = range.cloneRange();
    setCaretOffset(getCaretTextOffsetInElement(el));

    let headingLevel = 0;
    let inBullet = false;
    let inNumbered = false;
    let inBlockquote = false;
    let cursor: Node | null = range.startContainer;

    while (cursor && cursor !== el) {
      if (cursor.nodeType === Node.ELEMENT_NODE) {
        const tag = (cursor as HTMLElement).tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag) && headingLevel === 0) {
          headingLevel = Number(tag[1] ?? "0");
        } else if (tag === "ul") {
          inBullet = true;
        } else if (tag === "ol") {
          inNumbered = true;
        } else if (tag === "blockquote") {
          inBlockquote = true;
        }
      }
      cursor = cursor.parentNode;
    }

    let bold = false;
    let italic = false;
    let strikethrough = false;
    let canOutdent = false;
    try {
      bold = document.queryCommandState("bold");
      italic = document.queryCommandState("italic");
      strikethrough = document.queryCommandState("strikeThrough");
      canOutdent =
        document.queryCommandEnabled("outdent") || inBullet || inNumbered || inBlockquote;
    } catch {
      // ignore unsupported queryCommandState
    }

    setActiveFormats({
      bold,
      italic,
      strikethrough,
      headingLevel,
      bulletList: inBullet,
      numberedList: inNumbered,
      blockquote: inBlockquote,
      canOutdent,
    });
  }, [viewDisplayMode]);

  useEffect(() => {
    const onSelectionChange = () => {
      inspectRichSelectionAndFormats();
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [inspectRichSelectionAndFormats]);

  const syncFromRichDom = useCallback(
    (pushUndo = true, markMarkdown = true) => {
      const el = richEditorRef.current;
      if (!el || !activeTab) return;
      const html = el.innerHTML;
      const md = editorElementToMarkdown(el);
      const isCustom = Boolean(customTitledIds[activeTab.id] || activeTab.explorerEntryId);
      const nextTitle = deriveTabTitle(md, activeTab.title, isCustom);

      updateActiveTab((prev) => {
        if (prev.htmlContent === html && prev.content === md) return prev;
        return {
          ...prev,
          content: md,
          htmlContent: html,
          title: nextTitle,
          format: markMarkdown ? "markdown" : prev.format,
          dirty: md !== prev.savedContent,
          undoStack: pushUndo
            ? [
                ...prev.undoStack.slice(-39),
                { content: prev.content, htmlContent: prev.htmlContent },
              ]
            : prev.undoStack,
          redoStack: pushUndo ? [] : prev.redoStack,
        };
      });
      inspectRichSelectionAndFormats();
    },
    [activeTab, customTitledIds, inspectRichSelectionAndFormats, updateActiveTab],
  );

  const restoreRichSelection = useCallback(() => {
    const el = richEditorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (
      savedRichRangeRef.current &&
      el.contains(savedRichRangeRef.current.commonAncestorContainer)
    ) {
      sel.removeAllRanges();
      sel.addRange(savedRichRangeRef.current);
    } else if (sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  const runRichCommand = useCallback(
    (command: string, value?: string) => {
      const el = richEditorRef.current;
      if (!el) return;
      restoreRichSelection();
      document.execCommand(command, false, value);
      syncFromRichDom(true, true);
    },
    [restoreRichSelection, syncFromRichDom],
  );

  const handleSyncSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    setCaretOffset(el.selectionStart ?? 0);
    setSelectionRange({
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    });
  }, []);

  // Selected lines inspection for source mode indent enable/disable state
  const selectedLinesInfo = useMemo(() => {
    const content = activeTab?.content ?? "";
    const start = Math.max(0, Math.min(selectionRange.start, content.length));
    const end = Math.max(start, Math.min(selectionRange.end, content.length));
    const lineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const rawLineEnd = content.indexOf("\n", end);
    const lineEnd = rawLineEnd === -1 ? content.length : rawLineEnd;
    const slice = content.slice(lineStart, lineEnd);
    const lines = slice.split("\n");
    const canDecreaseIndent = lines.some((l) => /^(?: {2}|\t)/.test(l));
    return { lineStart, lineEnd, lines, canDecreaseIndent };
  }, [activeTab?.content, selectionRange]);

  const applySelectionReplacement = useCallback(
    (nextContent: string, nextSelStart: number, nextSelEnd: number, markMarkdown = false) => {
      if (!activeTab) return;
      const isCustom = Boolean(customTitledIds[activeTab.id] || activeTab.explorerEntryId);
      const nextTitle = deriveTabTitle(nextContent, activeTab.title, isCustom);
      const nextHtml = markdownToEditorHtml(nextContent);
      updateActiveTab((prev) => ({
        ...prev,
        content: nextContent,
        htmlContent: nextHtml,
        title: nextTitle,
        format: markMarkdown ? "markdown" : prev.format,
        dirty: nextContent !== prev.savedContent,
        undoStack: [
          ...prev.undoStack.slice(-39),
          { content: prev.content, htmlContent: prev.htmlContent },
        ],
        redoStack: [],
      }));
      setExternalSyncNonce((n) => n + 1);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(nextSelStart, nextSelEnd);
        setCaretOffset(nextSelStart);
        setSelectionRange({ start: nextSelStart, end: nextSelEnd });
      });
    },
    [activeTab, customTitledIds, updateActiveTab],
  );

  const wrapSelection = useCallback(
    (
      prefix: string,
      suffix: string,
      placeholder: string,
      richExec?: "bold" | "italic" | "strikeThrough",
    ) => {
      if (viewDisplayMode === "formatted" && richExec) {
        runRichCommand(richExec);
        return;
      }
      if (!activeTab) return;
      const el = textareaRef.current;
      const start = el ? el.selectionStart : selectionRange.start;
      const end = el ? el.selectionEnd : selectionRange.end;
      const content = activeTab.content;
      const selected = content.slice(start, end);

      if (
        selected.startsWith(prefix) &&
        selected.endsWith(suffix) &&
        selected.length >= prefix.length + suffix.length
      ) {
        const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
        const next = content.slice(0, start) + unwrapped + content.slice(end);
        applySelectionReplacement(next, start, start + unwrapped.length, true);
        return;
      }

      const inner = selected || placeholder;
      const wrapped = `${prefix}${inner}${suffix}`;
      const next = content.slice(0, start) + wrapped + content.slice(end);
      applySelectionReplacement(
        next,
        start + prefix.length,
        start + prefix.length + inner.length,
        true,
      );
    },
    [viewDisplayMode, runRichCommand, activeTab, selectionRange, applySelectionReplacement],
  );

  const transformSelectedLines = useCallback(
    (transformer: (lines: string[]) => string[], markMarkdown = true) => {
      if (!activeTab) return;
      const { lineStart, lineEnd, lines } = selectedLinesInfo;
      const transformed = transformer(lines).join("\n");
      const next =
        activeTab.content.slice(0, lineStart) + transformed + activeTab.content.slice(lineEnd);
      applySelectionReplacement(next, lineStart, lineStart + transformed.length, markMarkdown);
    },
    [activeTab, selectedLinesInfo, applySelectionReplacement],
  );

  const handleApplyHeading = (level: number) => {
    if (viewDisplayMode === "formatted") {
      runRichCommand("formatBlock", level === 0 ? "p" : `h${level}`);
      setOpenMenu(null);
      return;
    }
    transformSelectedLines((lines) =>
      lines.map((line) => {
        const stripped = line.replace(/^#{1,6}\s+/, "");
        return level === 0 ? stripped : `${"#".repeat(level)} ${stripped}`;
      }),
    );
    setOpenMenu(null);
  };

  const handleBulletedList = () => {
    if (viewDisplayMode === "formatted") {
      runRichCommand("insertUnorderedList");
      setOpenMenu(null);
      return;
    }
    transformSelectedLines((lines) => {
      const allBulleted = lines.every((l) => /^\s*[-*+]\s+/.test(l));
      return lines.map((line) => {
        if (allBulleted) return line.replace(/^\s*[-*+]\s+/, "");
        const clean = line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, "");
        return `- ${clean}`;
      });
    });
    setOpenMenu(null);
  };

  const handleNumberedList = () => {
    if (viewDisplayMode === "formatted") {
      runRichCommand("insertOrderedList");
      setOpenMenu(null);
      return;
    }
    transformSelectedLines((lines) => {
      const allNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
      return lines.map((line, idx) =>
        allNumbered ? line.replace(/^\s*\d+\.\s+/, "") : formatLineNumbered(line, idx),
      );
    });
    setOpenMenu(null);
  };

  const handleIncreaseIndent = () => {
    if (viewDisplayMode === "formatted") {
      runRichCommand("indent");
      setOpenMenu(null);
      return;
    }
    transformSelectedLines((lines) => lines.map((line) => `  ${line}`), false);
    setOpenMenu(null);
  };

  const handleDecreaseIndent = () => {
    if (viewDisplayMode === "formatted") {
      runRichCommand("outdent");
      setOpenMenu(null);
      return;
    }
    if (!selectedLinesInfo.canDecreaseIndent) return;
    transformSelectedLines((lines) => lines.map((line) => line.replace(/^(?: {2}|\t)/, "")), false);
    setOpenMenu(null);
  };

  const handleClearFormatting = () => {
    if (!activeTab) return;
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      const el = richEditorRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        // Select current block so removeFormat clears it cleanly
        let node: Node | null = sel.anchorNode;
        while (node && node.parentNode !== el) {
          node = node.parentNode;
        }
        if (node) {
          const r = document.createRange();
          r.selectNodeContents(node);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      document.execCommand("removeFormat", false);
      document.execCommand("formatBlock", false, "p");
      if (activeFormats.bulletList) document.execCommand("insertUnorderedList", false);
      if (activeFormats.numberedList) document.execCommand("insertOrderedList", false);
      syncFromRichDom(true, false);
      return;
    }

    const el = textareaRef.current;
    const start = el ? el.selectionStart : selectionRange.start;
    const end = el ? el.selectionEnd : selectionRange.end;
    if (start !== end) {
      const selected = activeTab.content.slice(start, end);
      const cleaned = selected
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^\s*(?:[-*+]\s+|\d+\.\s+|>\s+)/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/~~([^~]+)~~/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      const next = activeTab.content.slice(0, start) + cleaned + activeTab.content.slice(end);
      applySelectionReplacement(next, start, start + cleaned.length, false);
    } else {
      transformSelectedLines(
        (lines) =>
          lines.map((l) =>
            l
              .replace(/^#{1,6}\s+/, "")
              .replace(/^\s*(?:[-*+]\s+|\d+\.\s+|>\s+)/, "")
              .replace(/\*\*([^*]+)\*\*/g, "$1")
              .replace(/~~([^~]+)~~/g, "$1")
              .replace(/`([^`]+)`/g, "$1")
              .replace(/\*([^*]+)\*/g, "$1")
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
          ),
        false,
      );
    }
  };

  const handleOpenInsertLink = () => {
    if (openMenu === "link") {
      setOpenMenu(null);
      return;
    }
    let selectedText = "";
    if (viewDisplayMode === "formatted") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && richEditorRef.current?.contains(sel.anchorNode)) {
        savedRichRangeRef.current = sel.getRangeAt(0).cloneRange();
        selectedText = sel.toString();
      }
    } else if (textareaRef.current && activeTab) {
      selectedText = activeTab.content.slice(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd,
      );
    }
    setLinkTitleInput(selectedText);
    setLinkUrlInput("https://");
    setOpenMenu("link");
  };

  const handleConfirmInsertLink = () => {
    const safeUrl = sanitizeLinkUrl(linkUrlInput || "https://example.com");
    const displayText = linkTitleInput.trim() || safeUrl;
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      const html = `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        displayText,
      )}</a>&nbsp;`;
      document.execCommand("insertHTML", false, html);
      syncFromRichDom(true, true);
      setOpenMenu(null);
      return;
    }

    const el = textareaRef.current;
    const start = el ? el.selectionStart : selectionRange.start;
    const end = el ? el.selectionEnd : selectionRange.end;
    const snippet = `[${displayText}](${safeUrl})`;
    const next =
      (activeTab?.content ?? "").slice(0, start) + snippet + (activeTab?.content ?? "").slice(end);
    applySelectionReplacement(next, start + snippet.length, start + snippet.length, true);
    setOpenMenu(null);
  };

  const handleInsertTable = () => {
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      const tableHtml =
        "<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>Value 1</td><td>Value 2</td></tr></tbody></table><p><br></p>";
      document.execCommand("insertHTML", false, tableHtml);
      syncFromRichDom(true, true);
      setOpenMenu(null);
      return;
    }
    const snippet = "\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n";
    const pos = selectionRange.end;
    const next =
      (activeTab?.content ?? "").slice(0, pos) + snippet + (activeTab?.content ?? "").slice(pos);
    applySelectionReplacement(next, pos + 3, pos + 11, true);
    setOpenMenu(null);
  };

  const handleInsertCodeBlock = () => {
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      const selText = window.getSelection()?.toString() || "code";
      const html = `<pre><code>${escapeHtml(selText)}</code></pre><p><br></p>`;
      document.execCommand("insertHTML", false, html);
      syncFromRichDom(true, true);
      setOpenMenu(null);
      return;
    }
    wrapSelection("\n```\n", "\n```\n", "code block");
    setOpenMenu(null);
  };

  const handleToggleBlockquote = () => {
    if (viewDisplayMode === "formatted") {
      runRichCommand("formatBlock", activeFormats.blockquote ? "p" : "blockquote");
      setOpenMenu(null);
      return;
    }
    transformSelectedLines((lines) =>
      lines.map((l) => (l.startsWith("> ") ? l.slice(2) : `> ${l}`)),
    );
    setOpenMenu(null);
  };

  const handleInsertTaskChecklist = () => {
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      const selText = window.getSelection()?.toString().trim() || "Task item";
      const html = `<ul data-task-list="true" style="list-style:none;padding-left:2px;"><li data-task="true" data-checked="false"><input type="checkbox" /> <span>${escapeHtml(
        selText,
      )}</span></li></ul><p><br></p>`;
      document.execCommand("insertHTML", false, html);
      syncFromRichDom(true, true);
      setOpenMenu(null);
      return;
    }
    transformSelectedLines((lines) => lines.map((l) => `- [ ] ${l.replace(/^\s*[-*+]\s+/, "")}`));
    setOpenMenu(null);
  };

  const handleInsertHorizontalRule = () => {
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      document.execCommand("insertHTML", false, "<hr><p><br></p>");
      syncFromRichDom(true, true);
      setOpenMenu(null);
      return;
    }
    const pos = selectionRange.end;
    const next =
      (activeTab?.content ?? "").slice(0, pos) + "\n---\n" + (activeTab?.content ?? "").slice(pos);
    applySelectionReplacement(next, pos + 5, pos + 5, true);
    setOpenMenu(null);
  };

  // Auto-markdown shortcuts while typing Space/Enter in Rich Formatted Editor
  const handleRichEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        runRichCommand("outdent");
      } else {
        runRichCommand("indent");
      }
      return;
    }

    if (e.key === " ") {
      const el = richEditorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (range.startContainer.nodeType !== Node.TEXT_NODE) return;

      const textNode = range.startContainer as Text;
      const textBefore = (textNode.nodeValue ?? "").slice(0, range.startOffset);

      // Ensure trigger is at start of current block
      let blockNode: HTMLElement | null = textNode.parentElement;
      while (blockNode && blockNode !== el && !/^(p|div|li|blockquote)$/i.test(blockNode.tagName)) {
        blockNode = blockNode.parentElement;
      }
      if (!blockNode || blockNode === el) return;

      const preBlockRange = document.createRange();
      preBlockRange.selectNodeContents(blockNode);
      preBlockRange.setEnd(textNode, range.startOffset);
      const blockPrefix = preBlockRange.toString().replace(/\u00A0/g, " ");

      const removeTriggerText = () => {
        textNode.deleteData(0, range.startOffset);
      };

      const headingTrigger = blockPrefix.match(/^(#{1,6})$/);
      if (headingTrigger && !/^h[1-6]$/i.test(blockNode.tagName)) {
        e.preventDefault();
        removeTriggerText();
        const lvl = headingTrigger[1]?.length ?? 1;
        document.execCommand("formatBlock", false, `h${lvl}`);
        syncFromRichDom(true, true);
        return;
      }

      if (
        (blockPrefix === "-" || blockPrefix === "*") &&
        blockNode.tagName.toLowerCase() !== "li"
      ) {
        e.preventDefault();
        removeTriggerText();
        document.execCommand("insertUnorderedList", false);
        syncFromRichDom(true, true);
        return;
      }

      if (blockPrefix === "1." && blockNode.tagName.toLowerCase() !== "li") {
        e.preventDefault();
        removeTriggerText();
        document.execCommand("insertOrderedList", false);
        syncFromRichDom(true, true);
        return;
      }

      if (blockPrefix === ">" && blockNode.tagName.toLowerCase() !== "blockquote") {
        e.preventDefault();
        removeTriggerText();
        document.execCommand("formatBlock", false, "blockquote");
        syncFromRichDom(true, true);
        return;
      }

      if (textBefore === "[]" || textBefore === "[ ]") {
        e.preventDefault();
        removeTriggerText();
        const html = `<ul data-task-list="true" style="list-style:none;padding-left:2px;"><li data-task="true" data-checked="false"><input type="checkbox" /> <span>&nbsp;</span></li></ul>`;
        document.execCommand("insertHTML", false, html);
        syncFromRichDom(true, true);
      }
    }
  };

  const addNewTab = useCallback(() => {
    const nextTab = createBlankTab(tabs.length + 1, prefs.defaultFormat);
    setTabs((prev) => [...prev, nextTab]);
    setActiveTabId(nextTab.id);
    setIsSettingsView(false);
    setCaretOffset(0);
    setSelectionRange({ start: 0, end: 0 });
    requestAnimationFrame(() => {
      if (viewDisplayMode === "formatted") {
        richEditorRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
    });
  }, [tabs.length, prefs.defaultFormat, viewDisplayMode]);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) {
          const fresh = createBlankTab(1, prefs.defaultFormat);
          setActiveTabId(fresh.id);
          return [fresh];
        }
        const idx = prev.findIndex((t) => t.id === tabId);
        const filtered = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId) {
          const fallback = filtered[Math.max(0, idx - 1)] ?? filtered[0];
          if (fallback) setActiveTabId(fallback.id);
        }
        return filtered;
      });
      setExternalSyncNonce((n) => n + 1);
    },
    [activeTabId, prefs.defaultFormat],
  );

  const duplicateTab = useCallback(
    (tabId: string) => {
      const source = tabs.find((t) => t.id === tabId);
      if (!source) return;
      const copy: NotepadTab = {
        ...source,
        id: `notepad-tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `${source.title} (Copy)`,
        explorerEntryId: undefined,
        explorerParentId: undefined,
        dirty: true,
      };
      setTabs((prev) => [...prev, copy]);
      setActiveTabId(copy.id);
      setExternalSyncNonce((n) => n + 1);
    },
    [tabs],
  );

  const handleUndo = useCallback(() => {
    if (!activeTab || activeTab.undoStack.length === 0) return;
    const prevSnap = activeTab.undoStack[activeTab.undoStack.length - 1];
    if (!prevSnap) return;
    updateActiveTab((prev) => ({
      ...prev,
      content: prevSnap.content,
      htmlContent: prevSnap.htmlContent,
      dirty: prevSnap.content !== prev.savedContent,
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [
        ...prev.redoStack.slice(-39),
        { content: prev.content, htmlContent: prev.htmlContent },
      ],
    }));
    setExternalSyncNonce((n) => n + 1);
  }, [activeTab, updateActiveTab]);

  const handleRedo = useCallback(() => {
    if (!activeTab || activeTab.redoStack.length === 0) return;
    const nextSnap = activeTab.redoStack[activeTab.redoStack.length - 1];
    if (!nextSnap) return;
    updateActiveTab((prev) => ({
      ...prev,
      content: nextSnap.content,
      htmlContent: nextSnap.htmlContent,
      dirty: nextSnap.content !== prev.savedContent,
      undoStack: [
        ...prev.undoStack.slice(-39),
        { content: prev.content, htmlContent: prev.htmlContent },
      ],
      redoStack: prev.redoStack.slice(0, -1),
    }));
    setExternalSyncNonce((n) => n + 1);
  }, [activeTab, updateActiveTab]);

  const openSaveAsDialog = useCallback(() => {
    if (!activeTab) return;
    const currentExt: "md" | "txt" = activeTab.title.toLowerCase().endsWith(".txt")
      ? "txt"
      : activeTab.format === "plain" && !activeTab.title.toLowerCase().endsWith(".md")
        ? "txt"
        : "md";
    const baseName =
      activeTab.title
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\.(md|txt)$/i, "")
        .trim() || "Untitled";
    setExplorerEntries(loadExplorerCustomEntries());
    setExplorerDirId(activeTab.explorerParentId || "dir-documents");
    setSaveFileExt(currentExt);
    setSaveFileNameInput(`${baseName}.${currentExt}`);
    setSelectedDialogEntryId(null);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setExplorerDialogMode("save");
    setOpenMenu(null);
    requestAnimationFrame(() => {
      saveFileNameInputRef.current?.focus();
      saveFileNameInputRef.current?.select();
    });
  }, [activeTab]);

  const openExplorerBrowserDialog = useCallback(() => {
    setExplorerEntries(loadExplorerCustomEntries());
    setExplorerDirId(activeTab?.explorerParentId || "dir-documents");
    setSelectedDialogEntryId(null);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setExplorerDialogMode("open");
    setOpenMenu(null);
  }, [activeTab?.explorerParentId]);

  const saveTabToExplorerLocation = useCallback(
    (targetDirId: string, rawFileName: string, chosenExt: "md" | "txt", existingId?: string) => {
      if (!activeTab) return;
      const entries = loadExplorerCustomEntries();
      const cleanedName = rawFileName.replace(/[<>:"/\\|?*]/g, "").trim() || "Untitled";
      const explicitExtMatch = cleanedName.match(/\.(md|txt)$/i);
      const ext: "md" | "txt" = explicitExtMatch
        ? (explicitExtMatch[1]?.toLowerCase() as "md" | "txt")
        : chosenExt;
      const finalFileName = explicitExtMatch ? cleanedName : `${cleanedName}.${ext}`;

      const serializedText =
        activeTab.lineEnding === "CRLF"
          ? activeTab.content.replace(/\r?\n/g, "\r\n")
          : activeTab.content.replace(/\r?\n/g, "\n");
      const dirMeta = resolveExplorerDirectory(targetDirId, entries);
      const basePath = dirMeta.pathLabel;
      const pathLabel = basePath.endsWith("\\")
        ? `${basePath}${finalFileName}`
        : `${basePath}\\${finalFileName}`;

      const matchedExisting =
        (existingId ? entries.find((e) => e.id === existingId) : undefined) ??
        entries.find(
          (e) =>
            e.kind !== "folder" &&
            e.parentId === targetDirId &&
            e.name.toLowerCase() === finalFileName.toLowerCase(),
        );

      const entryId =
        matchedExisting?.id ??
        `custom-notepad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const nextEntry: ExplorerFsEntry = {
        id: entryId,
        parentId: targetDirId,
        name: finalFileName,
        kind: "text",
        sizeBytes: new Blob([serializedText]).size,
        modifiedAt: Date.now(),
        locationLabel: dirMeta.name,
        pathLabel,
        status: "local",
        fileExtension: ext,
        linkedSource: "notepad",
        textContent: activeTab.content,
      };

      const nextEntries = matchedExisting
        ? entries.map((e) => (e.id === matchedExisting.id ? nextEntry : e))
        : [...entries, nextEntry];

      saveExplorerCustomEntries(nextEntries);
      setExplorerEntries(nextEntries);

      updateActiveTab((prev) => ({
        ...prev,
        title: finalFileName,
        savedContent: prev.content,
        dirty: false,
        format: ext === "md" ? "markdown" : "plain",
        explorerEntryId: entryId,
        explorerParentId: targetDirId,
      }));
      setCustomTitledIds((prev) => ({ ...prev, [activeTab.id]: true }));
      setExplorerDialogMode(null);
      showAppToast(`Saved "${finalFileName}" to ${dirMeta.name}`, { appName: "Notepad" });
    },
    [activeTab, updateActiveTab],
  );

  const handleSaveSmart = useCallback(() => {
    if (!activeTab) return;
    if (activeTab.explorerEntryId) {
      const targetDirId = activeTab.explorerParentId || "dir-documents";
      const ext: "md" | "txt" =
        activeTab.title.toLowerCase().endsWith(".txt") || activeTab.format === "plain"
          ? "txt"
          : "md";
      saveTabToExplorerLocation(targetDirId, activeTab.title, ext, activeTab.explorerEntryId);
      setOpenMenu(null);
      return;
    }
    openSaveAsDialog();
  }, [activeTab, openSaveAsDialog, saveTabToExplorerLocation]);

  const handleCreateExplorerFolderInDialog = () => {
    const clean = newFolderName.replace(/[<>:"/\\|?*]/g, "").trim();
    if (!clean) return;
    const entries = loadExplorerCustomEntries();
    const dirMeta = resolveExplorerDirectory(explorerDirId, entries);
    const id = `custom-folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const targetDirId = `dir-${id}`;
    const basePath = dirMeta.pathLabel;
    const newFolder: ExplorerFsEntry = {
      id,
      parentId: explorerDirId,
      name: clean,
      kind: "folder",
      modifiedAt: Date.now(),
      locationLabel: dirMeta.name,
      pathLabel: basePath.endsWith("\\") ? `${basePath}${clean}` : `${basePath}\\${clean}`,
      status: "local",
      linkedSource: "custom",
      targetDirId,
    };
    const nextEntries = [...entries, newFolder];
    saveExplorerCustomEntries(nextEntries);
    setExplorerEntries(nextEntries);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setExplorerDirId(targetDirId);
  };

  const handleSaveDownload = useCallback(
    (ext: "md" | "txt") => {
      if (!activeTab) return;
      const cleanBase =
        activeTab.title
          .replace(/[<>:"/\\|?*]/g, "")
          .replace(/\.(md|txt)$/i, "")
          .trim() || "Untitled";
      const fileName = `${cleanBase}.${ext}`;
      const serialized =
        activeTab.lineEnding === "CRLF"
          ? activeTab.content.replace(/\r?\n/g, "\r\n")
          : activeTab.content.replace(/\r?\n/g, "\n");
      const blob = new Blob([serialized], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      updateActiveTab((prev) => ({
        ...prev,
        savedContent: prev.content,
        dirty: false,
        title: fileName,
        format: ext === "md" ? "markdown" : prev.format,
      }));
      setCustomTitledIds((prev) => ({ ...prev, [activeTab.id]: true }));
      showAppToast(`Downloaded ${fileName}`, { appName: "Notepad" });
      setOpenMenu(null);
    },
    [activeTab, updateActiveTab],
  );

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const hasCrlf = raw.includes("\r\n");
      const normalized = raw.replace(/\r\n/g, "\n");
      const isMd = /\.(md|markdown)$/i.test(file.name);
      const newTab: NotepadTab = {
        id: `notepad-tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: file.name,
        content: normalized,
        htmlContent: markdownToEditorHtml(normalized),
        savedContent: normalized,
        dirty: false,
        lineEnding: hasCrlf ? "CRLF" : "LF",
        format: isMd ? "markdown" : "plain",
        encoding: "UTF-8",
        zoom: 100,
        undoStack: [],
        redoStack: [],
      };
      setTabs((prev) => [...prev, newTab]);
      setCustomTitledIds((prev) => ({ ...prev, [newTab.id]: true }));
      setActiveTabId(newTab.id);
      setIsSettingsView(false);
      setExternalSyncNonce((n) => n + 1);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleInsertTimeDate = useCallback(() => {
    if (!activeTab) return;
    const stamp = new Date().toLocaleString();
    if (viewDisplayMode === "formatted") {
      restoreRichSelection();
      document.execCommand("insertText", false, stamp);
      syncFromRichDom(true, false);
      setOpenMenu(null);
      return;
    }
    const el = textareaRef.current;
    const start = el ? el.selectionStart : selectionRange.start;
    const end = el ? el.selectionEnd : selectionRange.end;
    const next = activeTab.content.slice(0, start) + stamp + activeTab.content.slice(end);
    applySelectionReplacement(next, start + stamp.length, start + stamp.length, false);
    setOpenMenu(null);
  }, [
    activeTab,
    viewDisplayMode,
    restoreRichSelection,
    syncFromRichDom,
    selectionRange,
    applySelectionReplacement,
  ]);

  const handleZoomChange = useCallback(
    (delta: number | "reset") => {
      updateActiveTab((prev) => ({
        ...prev,
        zoom: delta === "reset" ? 100 : Math.max(50, Math.min(300, prev.zoom + delta)),
      }));
    },
    [updateActiveTab],
  );

  // Find & Replace matching
  const findMatches = useMemo(() => {
    if (!findQuery || !activeTab) return [] as Array<{ start: number; end: number }>;
    const sourceText =
      viewDisplayMode === "formatted" && richEditorRef.current
        ? (richEditorRef.current.textContent ?? activeTab.content)
        : activeTab.content;
    const haystack = matchCase ? sourceText : sourceText.toLowerCase();
    const needle = matchCase ? findQuery : findQuery.toLowerCase();
    const results: Array<{ start: number; end: number }> = [];
    let pos = 0;
    while (pos <= haystack.length - needle.length) {
      const idx = haystack.indexOf(needle, pos);
      if (idx === -1) break;
      results.push({ start: idx, end: idx + needle.length });
      pos = idx + Math.max(1, needle.length);
    }
    return results;
  }, [findQuery, activeTab, matchCase, viewDisplayMode]);

  const jumpToMatch = useCallback(
    (index: number) => {
      if (findMatches.length === 0) return;
      const wrapped = ((index % findMatches.length) + findMatches.length) % findMatches.length;
      setActiveMatchIdx(wrapped);
      const match = findMatches[wrapped];
      if (!match) return;

      if (viewDisplayMode === "formatted" && richEditorRef.current) {
        richEditorRef.current.focus();
        if (selectTextRangeInElement(richEditorRef.current, match.start, match.end)) {
          setCaretOffset(match.start);
          inspectRichSelectionAndFormats();
        }
        return;
      }

      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(match.start, match.end);
        setCaretOffset(match.start);
        setSelectionRange(match);
      }
    },
    [findMatches, viewDisplayMode, inspectRichSelectionAndFormats],
  );

  const handleReplaceCurrent = () => {
    if (!activeTab || findMatches.length === 0) return;
    const idx = activeMatchIdx % findMatches.length;
    const target = findMatches[idx];
    if (!target) return;

    if (viewDisplayMode === "formatted" && richEditorRef.current) {
      richEditorRef.current.focus();
      if (selectTextRangeInElement(richEditorRef.current, target.start, target.end)) {
        document.execCommand("insertText", false, replaceQuery);
        syncFromRichDom(true, false);
        return;
      }
    }

    const next =
      activeTab.content.slice(0, target.start) + replaceQuery + activeTab.content.slice(target.end);
    applySelectionReplacement(next, target.start, target.start + replaceQuery.length, false);
  };

  const handleReplaceAll = () => {
    if (!activeTab || !findQuery || findMatches.length === 0) return;
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, matchCase ? "g" : "gi");
    const next = activeTab.content.replace(regex, replaceQuery);
    updateTabContent(next, true);
    setExternalSyncNonce((n) => n + 1);
    showAppToast(
      `Replaced ${findMatches.length} occurrence${findMatches.length === 1 ? "" : "s"}`,
      {
        appName: "Notepad",
      },
    );
  };

  // Global Notepad shortcuts
  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (explorerDialogMode) {
      if (e.key === "Escape") {
        e.preventDefault();
        setExplorerDialogMode(null);
      }
      return;
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    if (ctrlOrMeta && e.key.toLowerCase() === "f") {
      e.preventDefault();
      setIsFindOpen(true);
      requestAnimationFrame(() => findInputRef.current?.focus());
    } else if (ctrlOrMeta && e.key.toLowerCase() === "h") {
      e.preventDefault();
      setIsFindOpen(true);
      setIsReplaceVisible(true);
      requestAnimationFrame(() => findInputRef.current?.focus());
    } else if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      openSaveAsDialog();
    } else if (ctrlOrMeta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSaveSmart();
    } else if (ctrlOrMeta && e.key.toLowerCase() === "o") {
      e.preventDefault();
      openExplorerBrowserDialog();
    } else if (ctrlOrMeta && e.key.toLowerCase() === "t") {
      e.preventDefault();
      addNewTab();
    } else if (ctrlOrMeta && e.key.toLowerCase() === "b") {
      e.preventDefault();
      wrapSelection("**", "**", "bold text", "bold");
    } else if (ctrlOrMeta && e.key.toLowerCase() === "i") {
      e.preventDefault();
      wrapSelection("*", "*", "italic text", "italic");
    } else if (ctrlOrMeta && e.key.toLowerCase() === "z" && !e.shiftKey) {
      if (viewDisplayMode === "formatted" || document.activeElement === textareaRef.current) {
        e.preventDefault();
        handleUndo();
      }
    } else if (
      ctrlOrMeta &&
      (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
    ) {
      if (viewDisplayMode === "formatted" || document.activeElement === textareaRef.current) {
        e.preventDefault();
        handleRedo();
      }
    } else if (ctrlOrMeta && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      handleZoomChange(10);
    } else if (ctrlOrMeta && e.key === "-") {
      e.preventDefault();
      handleZoomChange(-10);
    } else if (ctrlOrMeta && e.key === "0") {
      e.preventDefault();
      handleZoomChange("reset");
    } else if (e.key === "F5") {
      e.preventDefault();
      handleInsertTimeDate();
    } else if (e.key === "Escape") {
      setOpenMenu(null);
      setTabContextMenu(null);
      if (isFindOpen) setIsFindOpen(false);
    }
  };

  const effectiveIsDark =
    prefs.themeOverride === "dark"
      ? true
      : prefs.themeOverride === "light"
        ? false
        : settings.theme !== "light";

  const { line: cursorLine, col: cursorCol } = useMemo(
    () => computeLineAndColumn(activeTab?.content ?? "", caretOffset),
    [activeTab?.content, caretOffset],
  );
  const charCount = activeTab?.content.length ?? 0;
  const computedEditorFontSize = Math.round((prefs.fontSize * (activeTab?.zoom ?? 100)) / 100);

  // Save As / Open dialog folder listings
  const dialogDirectoryMeta = useMemo(
    () => resolveExplorerDirectory(explorerDirId, explorerEntries),
    [explorerDirId, explorerEntries],
  );

  const dialogFolderChildren = useMemo(() => {
    const folders: Array<{ id: string; name: string; targetDirId: string; kind: "folder" }> = [];
    const files: ExplorerFsEntry[] = [];

    if (explorerDirId === "dir-home" || explorerDirId === "dir-this-pc") {
      Object.values(EXPLORER_DIRECTORIES).forEach((d) => {
        if (d.parentId === explorerDirId) {
          folders.push({ id: d.id, name: d.name, targetDirId: d.id, kind: "folder" });
        }
      });
    }

    explorerEntries.forEach((entry) => {
      if (entry.parentId !== explorerDirId) return;
      if (entry.kind === "folder") {
        folders.push({
          id: entry.id,
          name: entry.name,
          targetDirId: entry.targetDirId || entry.id,
          kind: "folder",
        });
      } else if (entry.kind === "text" || /\.(md|markdown|txt|log|json)$/i.test(entry.name)) {
        files.push(entry);
      }
    });

    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    return { folders, files };
  }, [explorerDirId, explorerEntries]);

  // Merged WinUI 3 Tab Strip (rendered in WindowFrame title bar or standalone)
  const notepadTabStrip = (
    <div
      data-notepad-menu-root="true"
      className={`flex items-end min-w-0 h-full select-none ${
        isInsideWindowFrame
          ? "flex-1 pr-2"
          : "h-[40px] px-2 pt-1.5 bg-[#ececec] dark:bg-[#202020] border-b border-black/[0.06] dark:border-white/[0.06]"
      }`}
    >
      <div className="h-[34px] flex items-center pl-2.5 pr-2 shrink-0">
        <Fluent3DNotepadIcon className="w-[18px] h-[18px]" />
      </div>

      <Reorder.Group
        axis="x"
        values={tabs}
        onReorder={setTabs}
        role="tablist"
        aria-label="Notepad documents"
        className="flex items-end gap-1 min-w-0 overflow-x-auto no-scrollbar"
      >
        <AnimatePresence initial={false}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab?.id;
            return (
              <Reorder.Item
                key={tab.id}
                value={tab}
                data-window-no-drag="true"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setIsSettingsView(false);
                }}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    closeTab(tab.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTabContextMenu({ x: e.clientX, y: e.clientY + 4, tabId: tab.id });
                }}
                style={{ minWidth: tabs.length > 4 ? 120 : 190, maxWidth: 240 }}
                className={`group relative h-[34px] shrink-0 px-3 rounded-t-[8px] flex items-center gap-2 cursor-pointer transition-colors border outline-none ${
                  isActive
                    ? "bg-[#f9f9f9] dark:bg-[#2c2c2c] text-[#111827] dark:text-[#f3f3f3] border-b-0 border-black/[0.08] dark:border-white/[0.07] z-10"
                    : "border-transparent text-black/70 dark:text-white/75 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                }`}
              >
                <span
                  draggable
                  title="Drag document to Desktop or File Explorer"
                  data-window-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setSodiumDragData(e, {
                      kind: "file",
                      fileKind: "text",
                      fileExtension: tab.format === "markdown" ? "md" : "txt",
                      name: tab.title,
                      textContent: tab.content,
                      explorerEntryId: tab.explorerEntryId,
                      parentId: tab.explorerParentId,
                      linkedSource: "notepad",
                      targetRoute: "/notepad",
                    });
                  }}
                  className="shrink-0 flex items-center justify-center text-black/55 dark:text-white/60 hover:text-[#0067b8] dark:hover:text-[#4cc2ff] cursor-grab active:cursor-grabbing"
                >
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <span
                  className={`text-[12px] truncate flex-1 leading-none ${
                    isActive ? "font-medium" : "font-normal"
                  }`}
                >
                  {tab.title}
                </span>

                {tab.dirty && (
                  <span
                    aria-label="Unsaved changes"
                    title="Unsaved changes"
                    className="w-[5px] h-[5px] rounded-full bg-black/55 dark:bg-white/65 shrink-0"
                  />
                )}

                <button
                  type="button"
                  data-window-no-drag="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  aria-label={`Close ${tab.title}`}
                  className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors border-none bg-transparent cursor-pointer ${
                    isActive
                      ? "opacity-75 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/15"
                      : "opacity-0 group-hover:opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/15"
                  }`}
                >
                  <X className="w-3 h-3 stroke-[2]" />
                </button>
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      <button
        type="button"
        data-window-no-drag="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          addNewTab();
        }}
        title="Add New Tab (Ctrl+T)"
        aria-label="New Notepad tab"
        className="w-7 h-7 self-center ml-1.5 rounded-[5px] flex items-center justify-center text-black/75 dark:text-white/80 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderFolderIcon = (icon: ExplorerFolderLocation["icon"]) => {
    switch (icon) {
      case "desktop":
        return <Monitor className="w-4 h-4 text-[#0067b8] dark:text-[#4cc2ff] shrink-0" />;
      case "drive":
        return <HardDrive className="w-4 h-4 text-black/65 dark:text-white/70 shrink-0" />;
      default:
        return <Folder className="w-4 h-4 text-[#eab308] shrink-0" />;
    }
  };

  return (
    <div
      id="winui-notepad-app"
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      className={`${
        effectiveIsDark ? "dark" : ""
      } w-full h-full flex flex-col overflow-hidden select-none outline-none`}
    >
      <div className="w-full h-full flex flex-col overflow-hidden bg-[#f9f9f9] dark:bg-[#272727] text-black dark:text-white">
        {/* Hidden device file opener */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.log,.json,.csv,.xml,.ini"
          onChange={handleOpenFile}
          className="hidden"
        />

        {/* 1. Tab Strip (Portal into WindowFrame Title Bar when in Windows Mode) */}
        {isInsideWindowFrame && titleBarSlotEl
          ? createPortal(notepadTabStrip, titleBarSlotEl)
          : !isInsideWindowFrame
            ? notepadTabStrip
            : null}

        {/* Tab context menu */}
        <AnimatePresence>
          {tabContextMenu && (
            <div
              data-notepad-menu-root="true"
              style={{
                position: "fixed",
                left: tabContextMenu.x,
                top: tabContextMenu.y,
                zIndex: 200,
              }}
            >
              <motion.div
                {...contextMenuMotionProps}
                style={motionFlyoutStyle}
                className={`${flyoutPanelClassName} w-[176px] p-1`}
              >
                <button
                  type="button"
                  onClick={() => {
                    addNewTab();
                    setTabContextMenu(null);
                  }}
                  className="w-full h-[30px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    duplicateTab(tabContextMenu.tabId);
                    setTabContextMenu(null);
                  }}
                  className="w-full h-[30px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Duplicate tab</span>
                </button>
                <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                <button
                  type="button"
                  onClick={() => {
                    closeTab(tabContextMenu.tabId);
                    setTabContextMenu(null);
                  }}
                  className="w-full h-[30px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close tab</span>
                </button>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTabs((prev) => prev.filter((t) => t.id === tabContextMenu.tabId));
                      setActiveTabId(tabContextMenu.tabId);
                      setTabContextMenu(null);
                    }}
                    className="w-full h-[30px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Close other tabs</span>
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* File Explorer Save As / Open Modal */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {explorerDialogMode && (
                <div
                  className={`${
                    effectiveIsDark ? "dark" : ""
                  } fixed inset-0 z-[9998] flex items-center justify-center p-4`}
                >
                  <motion.div
                    variants={modalBackdropVariants as unknown as Variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={() => setExplorerDialogMode(null)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                  />
                  <motion.div
                    variants={modalDialogVariants as unknown as Variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    role="dialog"
                    aria-modal="true"
                    aria-label={
                      explorerDialogMode === "save" ? "Save as" : "Open from File Explorer"
                    }
                    className="relative w-full max-w-[680px] h-[480px] max-h-[85vh] rounded-[10px] border border-black/15 dark:border-white/15 bg-[#f3f3f3] dark:bg-[#202020] text-[#111827] dark:text-[#ececec] shadow-2xl flex flex-col overflow-hidden"
                  >
                    {/* Dialog Header */}
                    <div className="h-[42px] px-4 flex items-center justify-between border-b border-black/[0.07] dark:border-white/[0.07] shrink-0">
                      <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                        <Fluent3DNotepadIcon className="w-4 h-4" />
                        <span>
                          {explorerDialogMode === "save" ? "Save as" : "Open from File Explorer"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExplorerDialogMode(null)}
                        aria-label="Close dialog"
                        className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Path & New Folder Toolbar */}
                    <div className="h-[40px] px-3 flex items-center gap-2 bg-[#f9f9f9] dark:bg-[#272727] border-b border-black/[0.07] dark:border-white/[0.07] shrink-0">
                      <button
                        type="button"
                        disabled={!dialogDirectoryMeta.parentId}
                        onClick={() => {
                          if (dialogDirectoryMeta.parentId) {
                            setExplorerDirId(dialogDirectoryMeta.parentId);
                            setSelectedDialogEntryId(null);
                          }
                        }}
                        title="Up one level"
                        className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 cursor-pointer disabled:cursor-default shrink-0"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex-1 h-[28px] px-2.5 rounded-[5px] border border-black/10 dark:border-white/12 bg-white dark:bg-[#1f1f1f] flex items-center gap-1.5 text-[12px] truncate">
                        {renderFolderIcon(dialogDirectoryMeta.icon)}
                        <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
                        <span className="truncate font-medium">
                          {dialogDirectoryMeta.pathLabel}
                        </span>
                      </div>

                      {explorerDialogMode === "save" && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingFolder((v) => !v);
                            setNewFolderName("New folder");
                          }}
                          className="h-[28px] px-2.5 rounded-[5px] border border-black/10 dark:border-white/12 bg-white dark:bg-[#2c2c2c] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[12px] flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-[#eab308]" />
                          <span>New folder</span>
                        </button>
                      )}
                    </div>

                    {/* Body: Left Folder Sidebar + Right File Listing */}
                    <div className="flex-1 min-h-0 flex overflow-hidden">
                      <aside className="w-[186px] border-r border-black/[0.07] dark:border-white/[0.07] bg-[#f3f3f3] dark:bg-[#202020] overflow-y-auto sidebar-scroller p-1.5 space-y-0.5 shrink-0 hidden sm:block">
                        {QUICK_FOLDER_IDS.map((fid) => {
                          const meta = EXPLORER_DIRECTORIES[fid];
                          if (!meta) return null;
                          const isCurrent = explorerDirId === fid;
                          return (
                            <button
                              key={fid}
                              type="button"
                              onClick={() => {
                                setExplorerDirId(fid);
                                setSelectedDialogEntryId(null);
                              }}
                              className={`w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2 text-[12.5px] text-left cursor-pointer transition-colors ${
                                isCurrent
                                  ? "bg-black/[0.08] dark:bg-white/[0.11] font-medium"
                                  : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                              }`}
                            >
                              {renderFolderIcon(meta.icon)}
                              <span className="truncate">{meta.name}</span>
                            </button>
                          );
                        })}
                      </aside>

                      <div className="flex-1 min-w-0 bg-white dark:bg-[#1e1e1e] overflow-y-auto sidebar-scroller p-2 flex flex-col gap-0.5">
                        {isCreatingFolder && (
                          <div className="h-[34px] px-2.5 rounded-[5px] bg-[#0067b8]/10 dark:bg-[#4cc2ff]/12 border border-[#0067b8]/35 dark:border-[#4cc2ff]/35 flex items-center gap-2 mb-1">
                            <Folder className="w-4 h-4 text-[#eab308] shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCreateExplorerFolderInDialog();
                                } else if (e.key === "Escape") {
                                  setIsCreatingFolder(false);
                                }
                              }}
                              className="flex-1 h-[24px] px-2 rounded-[4px] bg-white dark:bg-[#2a2a2a] border border-black/15 dark:border-white/20 text-[12.5px] outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleCreateExplorerFolderInDialog}
                              className="h-[24px] px-2.5 rounded-[4px] bg-[#0067b8] dark:bg-[#4cc2ff] text-white dark:text-black text-[11.5px] font-medium cursor-pointer"
                            >
                              Create
                            </button>
                          </div>
                        )}

                        {dialogFolderChildren.folders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => {
                              setExplorerDirId(folder.targetDirId);
                              setSelectedDialogEntryId(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[5px] flex items-center justify-between gap-2 text-[12.5px] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] cursor-pointer text-left"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Folder className="w-4 h-4 text-[#eab308] shrink-0" />
                              <span className="truncate font-medium">{folder.name}</span>
                            </span>
                            <span className="text-[11px] opacity-55 shrink-0">Folder</span>
                          </button>
                        ))}

                        {dialogFolderChildren.files.map((file) => {
                          const isSelected = selectedDialogEntryId === file.id;
                          return (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => {
                                setSelectedDialogEntryId(file.id);
                                if (explorerDialogMode === "save") {
                                  setSaveFileNameInput(file.name);
                                  if (/\.(txt)$/i.test(file.name)) {
                                    setSaveFileExt("txt");
                                  } else {
                                    setSaveFileExt("md");
                                  }
                                }
                              }}
                              onDoubleClick={() => {
                                if (explorerDialogMode === "open") {
                                  openExplorerPayloadInTab({
                                    id: file.id,
                                    parentId: file.parentId,
                                    name: file.name,
                                    textContent: file.textContent,
                                    fileExtension: file.fileExtension,
                                  });
                                  setExplorerDialogMode(null);
                                } else {
                                  saveTabToExplorerLocation(
                                    explorerDirId,
                                    file.name,
                                    file.name.toLowerCase().endsWith(".txt") ? "txt" : "md",
                                    file.id,
                                  );
                                }
                              }}
                              className={`w-full h-[32px] px-2.5 rounded-[5px] flex items-center justify-between gap-2 text-[12.5px] cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#0067b8]/14 dark:bg-[#4cc2ff]/18 text-[#005a9e] dark:text-[#7dd3fc]"
                                  : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                              }`}
                            >
                              <span className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-[#0067b8] dark:text-[#4cc2ff] shrink-0" />
                                <span className="truncate">{file.name}</span>
                              </span>
                              <span className="text-[11px] opacity-55 shrink-0 uppercase">
                                {file.fileExtension || file.name.split(".").pop() || "txt"}
                              </span>
                            </button>
                          );
                        })}

                        {dialogFolderChildren.folders.length === 0 &&
                          dialogFolderChildren.files.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 opacity-50 text-[12.5px]">
                              <FolderOpen className="w-7 h-7 mb-1.5 opacity-60" />
                              <span>This folder has no text or markdown files yet</span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Dialog Footer */}
                    <div className="px-4 py-3 bg-[#f3f3f3] dark:bg-[#202020] border-t border-black/[0.07] dark:border-white/[0.07] space-y-2.5 shrink-0">
                      {explorerDialogMode === "save" && (
                        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] items-center gap-2">
                          <label className="text-[12px] font-medium opacity-80">File name:</label>
                          <input
                            ref={saveFileNameInputRef}
                            type="text"
                            value={saveFileNameInput}
                            onChange={(e) => setSaveFileNameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveTabToExplorerLocation(
                                  explorerDirId,
                                  saveFileNameInput,
                                  saveFileExt,
                                );
                              }
                            }}
                            className="h-[30px] px-2.5 rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#1f1f1f] text-[12.5px] outline-none focus:border-[#0067b8] dark:focus:border-[#4cc2ff]"
                          />
                          <label className="text-[12px] font-medium opacity-80">
                            Save as type:
                          </label>
                          <select
                            value={saveFileExt}
                            onChange={(e) => {
                              const nextExt = e.target.value as "md" | "txt";
                              setSaveFileExt(nextExt);
                              setSaveFileNameInput((prev) => {
                                const stripped = prev.replace(/\.(md|txt)$/i, "");
                                return `${stripped || "Untitled"}.${nextExt}`;
                              });
                            }}
                            className="h-[30px] px-2.5 rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#2b2b2b] text-[12.5px] outline-none cursor-pointer"
                          >
                            <option value="md">Markdown Document (*.md)</option>
                            <option value="txt">Text Document (*.txt)</option>
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[11.5px] opacity-60 truncate">
                          Saving in {dialogDirectoryMeta.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {explorerDialogMode === "save" ? (
                            <button
                              type="button"
                              onClick={() =>
                                saveTabToExplorerLocation(
                                  explorerDirId,
                                  saveFileNameInput,
                                  saveFileExt,
                                )
                              }
                              className="h-[30px] px-5 rounded-[5px] bg-[#0067b8] dark:bg-[#4cc2ff] hover:opacity-95 text-white dark:text-black text-[12.5px] font-medium cursor-pointer"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!selectedDialogEntryId}
                              onClick={() => {
                                const file = dialogFolderChildren.files.find(
                                  (f) => f.id === selectedDialogEntryId,
                                );
                                if (!file) return;
                                openExplorerPayloadInTab({
                                  id: file.id,
                                  parentId: file.parentId,
                                  name: file.name,
                                  textContent: file.textContent,
                                  fileExtension: file.fileExtension,
                                });
                                setExplorerDialogMode(null);
                              }}
                              className="h-[30px] px-5 rounded-[5px] bg-[#0067b8] dark:bg-[#4cc2ff] hover:opacity-95 text-white dark:text-black text-[12.5px] font-medium disabled:opacity-40 cursor-pointer disabled:cursor-default"
                            >
                              Open
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExplorerDialogMode(null)}
                            className="h-[30px] px-4 rounded-[5px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#2c2c2c] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[12.5px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )}

        {isSettingsView ? (
          /* WINUI 3 NOTEPAD SETTINGS PAGE */
          <div className="flex-1 min-h-0 flex flex-col bg-[#f3f3f3] dark:bg-[#202020]">
            <div className="h-[46px] px-4 flex items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsView(false)}
                aria-label="Back to Notepad"
                className="w-8 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[16px] font-semibold tracking-tight">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto sidebar-scroller px-5 sm:px-8 py-6">
              <div className="max-w-[740px] space-y-5">
                <div className="space-y-2">
                  <h2 className="text-[13px] font-semibold text-black/70 dark:text-white/75">
                    Appearance & Formatting
                  </h2>

                  {/* App theme */}
                  <div className="rounded-[8px] border border-black/[0.07] dark:border-white/[0.08] bg-white/85 dark:bg-[#2b2b2b] px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13.5px] font-medium">App theme</div>
                      <div className="text-[12px] text-black/60 dark:text-white/60">
                        Select which theme Notepad displays
                      </div>
                    </div>
                    <select
                      value={prefs.themeOverride}
                      onChange={(e) =>
                        setPrefs((p) => ({
                          ...p,
                          themeOverride: e.target.value as NotepadPrefs["themeOverride"],
                        }))
                      }
                      className="h-[30px] px-2.5 rounded-[5px] border border-black/15 dark:border-white/15 bg-[#f9f9f9] dark:bg-[#333333] text-[12.5px] outline-none cursor-pointer"
                    >
                      <option value="system">Use system setting</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>

                  {/* Formatting toggle */}
                  <div className="rounded-[8px] border border-black/[0.07] dark:border-white/[0.08] bg-white/85 dark:bg-[#2b2b2b] px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13.5px] font-medium">Formatting</div>
                      <div className="text-[12px] text-black/60 dark:text-white/60">
                        Show rich formatting toolbar for headings, lists, and styles
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs.showFormattingBar}
                      onClick={() =>
                        setPrefs((p) => ({ ...p, showFormattingBar: !p.showFormattingBar }))
                      }
                      className={`w-[40px] h-[20px] rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                        prefs.showFormattingBar
                          ? "bg-[#0067b8] dark:bg-[#4cc2ff] justify-end"
                          : "bg-black/20 dark:bg-white/25 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white dark:bg-[#1b1b1b] shadow-xs" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-[13px] font-semibold text-black/70 dark:text-white/75">
                    Font & Editor
                  </h2>

                  <div className="rounded-[8px] border border-black/[0.07] dark:border-white/[0.08] bg-white/85 dark:bg-[#2b2b2b] divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                    <div className="px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[13.5px] font-medium">Font family</div>
                        <div className="text-[12px] text-black/60 dark:text-white/60">
                          Typeface used in Notepad editor
                        </div>
                      </div>
                      <select
                        value={prefs.fontFamily}
                        onChange={(e) =>
                          setPrefs((p) => ({
                            ...p,
                            fontFamily: e.target.value as NotepadFontFamily,
                          }))
                        }
                        className="h-[30px] px-2.5 rounded-[5px] border border-black/15 dark:border-white/15 bg-[#f9f9f9] dark:bg-[#333333] text-[12.5px] outline-none cursor-pointer"
                      >
                        <option value="Segoe UI">Segoe UI</option>
                        <option value="Consolas">Consolas</option>
                        <option value="Cascadia Mono">Cascadia Mono</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                      </select>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[13.5px] font-medium">Font size</div>
                        <div className="text-[12px] text-black/60 dark:text-white/60">
                          Base text size ({prefs.fontSize} px)
                        </div>
                      </div>
                      <select
                        value={prefs.fontSize}
                        onChange={(e) =>
                          setPrefs((p) => ({ ...p, fontSize: Number(e.target.value) }))
                        }
                        className="h-[30px] px-2.5 rounded-[5px] border border-black/15 dark:border-white/15 bg-[#f9f9f9] dark:bg-[#333333] text-[12.5px] outline-none cursor-pointer tabular-nums"
                      >
                        {[12, 13, 14, 15, 16, 18, 20, 22, 24].map((sz) => (
                          <option key={sz} value={sz}>
                            {sz} px
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[13.5px] font-medium">Word wrap</div>
                        <div className="text-[12px] text-black/60 dark:text-white/60">
                          Wrap long lines to fit within window width
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={prefs.wordWrap}
                        onClick={() => setPrefs((p) => ({ ...p, wordWrap: !p.wordWrap }))}
                        className={`w-[40px] h-[20px] rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                          prefs.wordWrap
                            ? "bg-[#0067b8] dark:bg-[#4cc2ff] justify-end"
                            : "bg-black/20 dark:bg-white/25 justify-start"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white dark:bg-[#1b1b1b] shadow-xs" />
                      </button>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[13.5px] font-medium">Status bar</div>
                        <div className="text-[12px] text-black/60 dark:text-white/60">
                          Show line/column, character count, zoom, and encoding
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={prefs.showStatusBar}
                        onClick={() => setPrefs((p) => ({ ...p, showStatusBar: !p.showStatusBar }))}
                        className={`w-[40px] h-[20px] rounded-full p-0.5 transition-colors cursor-pointer shrink-0 flex items-center ${
                          prefs.showStatusBar
                            ? "bg-[#0067b8] dark:bg-[#4cc2ff] justify-end"
                            : "bg-black/20 dark:bg-white/25 justify-start"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white dark:bg-[#1b1b1b] shadow-xs" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[8px] border border-black/[0.07] dark:border-white/[0.08] bg-white/85 dark:bg-[#2b2b2b] px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13.5px] font-medium">Windows Notepad</div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      Version 11.2504 · WinUI 3 Rich Text & Markdown
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrefs(DEFAULT_PREFS);
                      showAppToast("Notepad preferences restored", { appName: "Notepad" });
                    }}
                    className="h-[30px] px-3 rounded-[5px] border border-black/15 dark:border-white/15 bg-[#f9f9f9] dark:bg-[#343434] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 2. MENU + RICH FORMATTING TOOLBAR ROW */}
            <div
              data-notepad-menu-root="true"
              className="h-[40px] px-2.5 flex items-center justify-between gap-2 bg-[#f9f9f9] dark:bg-[#2c2c2c] border-b border-black/[0.07] dark:border-white/[0.06] shrink-0 relative z-20"
            >
              {/* Left: File / Edit / View menus */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* File Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu((m) => (m === "file" ? null : "file"))}
                    className={`h-[28px] px-2.5 rounded-[4px] text-[13px] transition-colors cursor-pointer ${
                      openMenu === "file"
                        ? "bg-black/[0.08] dark:bg-white/[0.1]"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    File
                  </button>
                  <AnimatePresence>
                    {openMenu === "file" && (
                      <div className="absolute left-0 top-[33px] z-50" style={{ overflow: "clip" }}>
                        <motion.div
                          {...contextMenuMotionProps}
                          style={motionFlyoutStyle}
                          className={`${flyoutPanelClassName} w-[244px] p-1`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              addNewTab();
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <FilePlus className="w-3.5 h-3.5" />
                              New tab
                            </span>
                            <span className="text-[11px] opacity-55">Ctrl+T</span>
                          </button>
                          <button
                            type="button"
                            onClick={openExplorerBrowserDialog}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <FolderOpen className="w-3.5 h-3.5" />
                              Open from File Explorer...
                            </span>
                            <span className="text-[11px] opacity-55">Ctrl+O</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRef.current?.click();
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <Folder className="w-3.5 h-3.5" />
                            <span>Open from device...</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={handleSaveSmart}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </span>
                            <span className="text-[11px] opacity-55">Ctrl+S</span>
                          </button>
                          <button
                            type="button"
                            onClick={openSaveAsDialog}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" />
                              Save as...
                            </span>
                            <span className="text-[11px] opacity-55">Ctrl+Shift+S</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={() => handleSaveDownload("md")}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Markdown (.md)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDownload("txt")}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Plain text (.txt)</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTab) closeTab(activeTab.id);
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <X className="w-3.5 h-3.5" />
                              Close tab
                            </span>
                            <span className="text-[11px] opacity-55">Ctrl+W</span>
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Edit Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu((m) => (m === "edit" ? null : "edit"))}
                    className={`h-[28px] px-2.5 rounded-[4px] text-[13px] transition-colors cursor-pointer ${
                      openMenu === "edit"
                        ? "bg-black/[0.08] dark:bg-white/[0.1]"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    Edit
                  </button>
                  <AnimatePresence>
                    {openMenu === "edit" && (
                      <div className="absolute left-0 top-[33px] z-50" style={{ overflow: "clip" }}>
                        <motion.div
                          {...contextMenuMotionProps}
                          style={motionFlyoutStyle}
                          className={`${flyoutPanelClassName} w-[224px] p-1`}
                        >
                          <button
                            type="button"
                            disabled={!activeTab || activeTab.undoStack.length === 0}
                            onClick={() => {
                              handleUndo();
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-40 cursor-pointer disabled:cursor-default"
                          >
                            <span>Undo</span>
                            <span className="text-[11px] opacity-55">Ctrl+Z</span>
                          </button>
                          <button
                            type="button"
                            disabled={!activeTab || activeTab.redoStack.length === 0}
                            onClick={() => {
                              handleRedo();
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-40 cursor-pointer disabled:cursor-default"
                          >
                            <span>Redo</span>
                            <span className="text-[11px] opacity-55">Ctrl+Y</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsFindOpen(true);
                              setIsReplaceVisible(false);
                              setOpenMenu(null);
                              requestAnimationFrame(() => findInputRef.current?.focus());
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Find</span>
                            <span className="text-[11px] opacity-55">Ctrl+F</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsFindOpen(true);
                              setIsReplaceVisible(true);
                              setOpenMenu(null);
                              requestAnimationFrame(() => findInputRef.current?.focus());
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Replace</span>
                            <span className="text-[11px] opacity-55">Ctrl+H</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={() => {
                              if (viewDisplayMode === "formatted" && richEditorRef.current) {
                                richEditorRef.current.focus();
                                document.execCommand("selectAll", false);
                                inspectRichSelectionAndFormats();
                              } else if (textareaRef.current) {
                                textareaRef.current.focus();
                                textareaRef.current.select();
                                handleSyncSelection();
                              }
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Select all</span>
                            <span className="text-[11px] opacity-55">Ctrl+A</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleInsertTimeDate}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Time/Date</span>
                            <span className="text-[11px] opacity-55">F5</span>
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenu((m) => (m === "view" ? null : "view"))}
                    className={`h-[28px] px-2.5 rounded-[4px] text-[13px] transition-colors cursor-pointer ${
                      openMenu === "view"
                        ? "bg-black/[0.08] dark:bg-white/[0.1]"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    View
                  </button>
                  <AnimatePresence>
                    {openMenu === "view" && (
                      <div className="absolute left-0 top-[33px] z-50" style={{ overflow: "clip" }}>
                        <motion.div
                          {...contextMenuMotionProps}
                          style={motionFlyoutStyle}
                          className={`${flyoutPanelClassName} w-[238px] p-1`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleZoomChange(10);
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Zoom in</span>
                            <span className="text-[11px] opacity-55">Ctrl+Plus</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleZoomChange(-10);
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Zoom out</span>
                            <span className="text-[11px] opacity-55">Ctrl+Minus</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleZoomChange("reset");
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Restore default zoom</span>
                            <span className="text-[11px] opacity-55">Ctrl+0</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={() => {
                              setPrefs((p) => ({ ...p, wordWrap: !p.wordWrap }));
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Word wrap</span>
                            {prefs.wordWrap && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPrefs((p) => ({ ...p, showStatusBar: !p.showStatusBar }));
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Status bar</span>
                            {prefs.showStatusBar && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPrefs((p) => ({ ...p, showFormattingBar: !p.showFormattingBar }));
                              setOpenMenu(null);
                            }}
                            className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <span>Formatting toolbar</span>
                            {prefs.showFormattingBar && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="my-1 h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />
                          {(
                            [
                              ["formatted", "Formatted (Rich text)", PenLine],
                              ["source", "Markdown source", FileText],
                              ["split", "Split preview", Columns2],
                              ["preview", "Rendered preview", Eye],
                            ] as Array<[ViewDisplayMode, string, React.FC<{ className?: string }>]>
                          ).map(([modeKey, label, Icon]) => (
                            <button
                              key={modeKey}
                              type="button"
                              onClick={() => {
                                setViewDisplayMode(modeKey);
                                setExternalSyncNonce((n) => n + 1);
                                setOpenMenu(null);
                              }}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                              </span>
                              {viewDisplayMode === modeKey && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Center: WinUI 3 Rich Formatting Toolbar */}
              {prefs.showFormattingBar && (
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 min-w-0 overflow-visible">
                  {/* Heading Dropdown (H1 v) */}
                  <div className="relative">
                    <button
                      type="button"
                      title="Heading style"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setOpenMenu((m) => (m === "heading" ? null : "heading"))}
                      className={`h-[28px] px-2 rounded-[4px] flex items-center gap-1 text-[12.5px] font-medium transition-colors cursor-pointer ${
                        openMenu === "heading" || activeFormats.headingLevel > 0
                          ? "bg-black/[0.09] dark:bg-white/[0.13] text-[#0067b8] dark:text-[#4cc2ff]"
                          : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                      }`}
                    >
                      <span>
                        {activeFormats.headingLevel > 0 ? `H${activeFormats.headingLevel}` : "H1"}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                    <AnimatePresence>
                      {openMenu === "heading" && (
                        <div
                          className="absolute left-0 top-[34px] z-50"
                          style={{ overflow: "clip" }}
                        >
                          <motion.div
                            {...contextMenuMotionProps}
                            style={motionFlyoutStyle}
                            className={`${flyoutPanelClassName} w-[184px] p-1`}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleApplyHeading(0)}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Heading className="w-3.5 h-3.5 opacity-60" />
                                <span>Normal text</span>
                              </span>
                              {activeFormats.headingLevel === 0 && <Check className="w-3 h-3" />}
                            </button>
                            {[1, 2, 3, 4, 5, 6].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleApplyHeading(lvl)}
                                className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                              >
                                <span className="font-medium">Heading {lvl}</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-mono opacity-60">
                                  {"#".repeat(lvl)}
                                  {activeFormats.headingLevel === lvl && (
                                    <Check className="w-3 h-3 text-[#0067b8] dark:text-[#4cc2ff]" />
                                  )}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* List Dropdown (Bulleted list / Numbered list / Increase indent / Decrease indent) */}
                  <div className="relative">
                    <button
                      type="button"
                      title="List & Indentation"
                      aria-label="List options"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setOpenMenu((m) => (m === "list" ? null : "list"))}
                      className={`h-[28px] px-2 rounded-[4px] flex items-center gap-1 transition-colors cursor-pointer ${
                        openMenu === "list" ||
                        activeFormats.bulletList ||
                        activeFormats.numberedList
                          ? "bg-black/[0.09] dark:bg-white/[0.13] text-[#0067b8] dark:text-[#4cc2ff]"
                          : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                      }`}
                    >
                      {activeFormats.numberedList ? (
                        <ListOrdered className="w-4 h-4" />
                      ) : (
                        <List className="w-4 h-4" />
                      )}
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                    <AnimatePresence>
                      {openMenu === "list" && (
                        <div
                          className="absolute left-0 top-[34px] z-50"
                          style={{ overflow: "clip" }}
                        >
                          <motion.div
                            {...contextMenuMotionProps}
                            style={motionFlyoutStyle}
                            className={`${flyoutPanelClassName} w-[188px] p-1`}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleBulletedList}
                              className="w-full h-[34px] px-3 rounded-[4px] flex items-center justify-between text-[13px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left"
                            >
                              <span className="flex items-center gap-2.5">
                                <List className="w-3.5 h-3.5 opacity-80" />
                                <span>Bulleted list</span>
                              </span>
                              {activeFormats.bulletList && (
                                <Check className="w-3.5 h-3.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleNumberedList}
                              className="w-full h-[34px] px-3 rounded-[4px] flex items-center justify-between text-[13px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left"
                            >
                              <span className="flex items-center gap-2.5">
                                <ListOrdered className="w-3.5 h-3.5 opacity-80" />
                                <span>Numbered list</span>
                              </span>
                              {activeFormats.numberedList && (
                                <Check className="w-3.5 h-3.5 text-[#0067b8] dark:text-[#4cc2ff]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleIncreaseIndent}
                              className="w-full h-[34px] px-3 rounded-[4px] flex items-center gap-2.5 text-[13px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left"
                            >
                              <IndentIncrease className="w-3.5 h-3.5 opacity-80" />
                              <span>Increase indent</span>
                            </button>
                            <button
                              type="button"
                              disabled={
                                viewDisplayMode === "formatted"
                                  ? !activeFormats.canOutdent
                                  : !selectedLinesInfo.canDecreaseIndent
                              }
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleDecreaseIndent}
                              className="w-full h-[34px] px-3 rounded-[4px] flex items-center gap-2.5 text-[13px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-40 cursor-pointer disabled:cursor-default text-left"
                            >
                              <IndentDecrease className="w-3.5 h-3.5 opacity-80" />
                              <span>Decrease indent</span>
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bold */}
                  <button
                    type="button"
                    title="Bold (Ctrl+B)"
                    aria-label="Bold"
                    aria-pressed={activeFormats.bold}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => wrapSelection("**", "**", "bold text", "bold")}
                    className={`w-7 h-[28px] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                      activeFormats.bold
                        ? "bg-black/[0.1] dark:bg-white/[0.14] text-[#0067b8] dark:text-[#4cc2ff]"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5 stroke-[2.4]" />
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    title="Italic (Ctrl+I)"
                    aria-label="Italic"
                    aria-pressed={activeFormats.italic}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => wrapSelection("*", "*", "italic text", "italic")}
                    className={`w-7 h-[28px] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                      activeFormats.italic
                        ? "bg-black/[0.1] dark:bg-white/[0.14] text-[#0067b8] dark:text-[#4cc2ff]"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  {/* Strikethrough */}
                  <button
                    type="button"
                    title="Strikethrough"
                    aria-label="Strikethrough"
                    aria-pressed={activeFormats.strikethrough}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => wrapSelection("~~", "~~", "strikethrough", "strikeThrough")}
                    className={`w-7 h-[28px] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer hidden sm:flex ${
                      activeFormats.strikethrough
                        ? "bg-black/[0.1] dark:bg-white/[0.14] text-[#0067b8] dark:text-[#4cc2ff]"
                        : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  {/* Link Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      title="Insert Link"
                      aria-label="Insert Link"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleOpenInsertLink}
                      className={`w-7 h-[28px] rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                        openMenu === "link"
                          ? "bg-black/[0.09] dark:bg-white/[0.13]"
                          : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                    <AnimatePresence>
                      {openMenu === "link" && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 top-[34px] z-50"
                          style={{ overflow: "clip" }}
                        >
                          <motion.div
                            {...contextMenuMotionProps}
                            style={motionFlyoutStyle}
                            className={`${flyoutPanelClassName} w-[256px] p-3 space-y-2.5`}
                          >
                            <div className="text-[12.5px] font-semibold">Insert link</div>
                            <input
                              type="text"
                              value={linkTitleInput}
                              onChange={(e) => setLinkTitleInput(e.target.value)}
                              placeholder="Display text"
                              className="w-full h-[28px] px-2 rounded-[4px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#1f1f1f] text-[12px] outline-none focus:border-[#0067b8] dark:focus:border-[#4cc2ff]"
                            />
                            <input
                              type="url"
                              autoFocus
                              value={linkUrlInput}
                              onChange={(e) => setLinkUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleConfirmInsertLink();
                                }
                              }}
                              placeholder="https://example.com"
                              className="w-full h-[28px] px-2 rounded-[4px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#1f1f1f] text-[12px] outline-none focus:border-[#0067b8] dark:focus:border-[#4cc2ff]"
                            />
                            <div className="flex justify-end gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setOpenMenu(null)}
                                className="h-[26px] px-2.5 rounded-[4px] border border-black/15 dark:border-white/15 text-[11.5px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleConfirmInsertLink}
                                className="h-[26px] px-3 rounded-[4px] bg-[#0067b8] dark:bg-[#4cc2ff] text-white dark:text-black text-[11.5px] font-medium cursor-pointer"
                              >
                                Insert
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Insert Block Dropdown (Table, Code block, Quote, Checklist, Divider) */}
                  <div className="relative hidden sm:block">
                    <button
                      type="button"
                      title="Insert block"
                      aria-label="Insert block"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setOpenMenu((m) => (m === "insert" ? null : "insert"))}
                      className={`h-[28px] px-2 rounded-[4px] flex items-center gap-1 transition-colors cursor-pointer ${
                        openMenu === "insert"
                          ? "bg-black/[0.08] dark:bg-white/[0.1]"
                          : "hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                      }`}
                    >
                      <Table2 className="w-3.5 h-3.5" />
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                    <AnimatePresence>
                      {openMenu === "insert" && (
                        <div
                          className="absolute left-0 top-[34px] z-50"
                          style={{ overflow: "clip" }}
                        >
                          <motion.div
                            {...contextMenuMotionProps}
                            style={motionFlyoutStyle}
                            className={`${flyoutPanelClassName} w-[184px] p-1`}
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleInsertTable}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <Table2 className="w-3.5 h-3.5" />
                              <span>Table</span>
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleInsertCodeBlock}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <Code className="w-3.5 h-3.5" />
                              <span>Code block</span>
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleToggleBlockquote}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <Quote className="w-3.5 h-3.5" />
                              <span>Blockquote</span>
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleInsertTaskChecklist}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Task checklist</span>
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={handleInsertHorizontalRule}
                              className="w-full h-[32px] px-2.5 rounded-[4px] flex items-center gap-2 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                              <span>Horizontal line</span>
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Clear Formatting */}
                  <button
                    type="button"
                    title="Clear formatting"
                    aria-label="Clear formatting"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearFormatting}
                    className="w-7 h-[28px] rounded-[4px] flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.07] cursor-pointer"
                  >
                    <RemoveFormatting className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Right: Feedback, Settings */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Feedback */}
                <button
                  type="button"
                  title="Send Feedback"
                  aria-label="Send Feedback"
                  onClick={() => {
                    if (navigate) {
                      navigate("/feedback");
                    } else {
                      showAppToast("Notepad feedback noted", { appName: "Notepad" });
                    }
                  }}
                  className="w-7 h-[28px] rounded-[4px] flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.07] cursor-pointer hidden sm:flex"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                {/* Settings Gear */}
                <button
                  type="button"
                  title="Notepad Settings"
                  aria-label="Notepad Settings"
                  onClick={() => {
                    setOpenMenu(null);
                    setIsSettingsView(true);
                  }}
                  className="w-7 h-[28px] rounded-[4px] flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.07] cursor-pointer"
                >
                  <FluentSettingsIcon className="w-4 h-4 settings-spin-icon" />
                </button>
              </div>
            </div>

            {/* 3. FIND & REPLACE FLOATING BAR */}
            <AnimatePresence>
              {isFindOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="px-3 py-2 bg-[#f3f3f3] dark:bg-[#2c2c2c] border-b border-black/[0.07] dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-2 shrink-0"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex items-center h-[28px] rounded-[5px] bg-white dark:bg-[#1f1f1f] border border-black/15 dark:border-white/15 px-2 gap-1.5">
                      <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      <input
                        ref={findInputRef}
                        type="text"
                        value={findQuery}
                        onChange={(e) => {
                          setFindQuery(e.target.value);
                          setActiveMatchIdx(0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            jumpToMatch(e.shiftKey ? activeMatchIdx - 1 : activeMatchIdx + 1);
                          }
                        }}
                        placeholder="Find"
                        className="w-[160px] bg-transparent text-[12.5px] outline-none border-none"
                      />
                      {findQuery && (
                        <span className="text-[11px] opacity-60 tabular-nums shrink-0">
                          {findMatches.length === 0
                            ? "0/0"
                            : `${(activeMatchIdx % findMatches.length) + 1}/${findMatches.length}`}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      title="Previous match"
                      onClick={() => jumpToMatch(activeMatchIdx - 1)}
                      className="w-7 h-7 rounded-[4px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Next match"
                      onClick={() => jumpToMatch(activeMatchIdx + 1)}
                      className="w-7 h-7 rounded-[4px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      title="Match case"
                      onClick={() => setMatchCase((v) => !v)}
                      className={`h-7 px-2 rounded-[4px] text-[11.5px] font-medium cursor-pointer border ${
                        matchCase
                          ? "bg-[#0067b8]/15 dark:bg-[#4cc2ff]/20 border-[#0067b8]/40 dark:border-[#4cc2ff]/45 text-[#0067b8] dark:text-[#4cc2ff]"
                          : "border-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      Aa
                    </button>

                    <button
                      type="button"
                      title="Toggle Replace"
                      onClick={() => setIsReplaceVisible((v) => !v)}
                      className={`w-7 h-7 rounded-[4px] flex items-center justify-center cursor-pointer ${
                        isReplaceVisible
                          ? "bg-black/[0.08] dark:bg-white/[0.12]"
                          : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      <Replace className="w-3.5 h-3.5" />
                    </button>

                    {isReplaceVisible && (
                      <>
                        <input
                          type="text"
                          value={replaceQuery}
                          onChange={(e) => setReplaceQuery(e.target.value)}
                          placeholder="Replace with"
                          className="h-[28px] w-[150px] px-2 rounded-[5px] bg-white dark:bg-[#1f1f1f] border border-black/15 dark:border-white/15 text-[12.5px] outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleReplaceCurrent}
                          className="h-[28px] px-2.5 rounded-[4px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#333333] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[12px] cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleReplaceAll}
                          className="h-[28px] px-2.5 rounded-[4px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#333333] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-[12px] cursor-pointer"
                        >
                          Replace all
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label="Close Find"
                    onClick={() => setIsFindOpen(false)}
                    className="w-7 h-7 rounded-[4px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. MAIN WRITING & FORMATTED EDITOR SURFACE */}
            <div className="flex-1 min-h-0 flex overflow-hidden bg-white dark:bg-[#272727]">
              {viewDisplayMode === "formatted" ? (
                <div className="flex-1 min-w-0 h-full overflow-y-auto sidebar-scroller">
                  <div
                    id="winui-notepad-rich-editor"
                    ref={richEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Notepad rich text editor"
                    spellCheck={false}
                    onInput={() => syncFromRichDom(true, false)}
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (
                        target?.tagName.toLowerCase() === "input" &&
                        (target as HTMLInputElement).type === "checkbox"
                      ) {
                        const cb = target as HTMLInputElement;
                        const li = cb.closest("li");
                        if (li) {
                          li.setAttribute("data-checked", cb.checked ? "true" : "false");
                        }
                        syncFromRichDom(true, true);
                        return;
                      }
                      inspectRichSelectionAndFormats();
                    }}
                    onKeyUp={inspectRichSelectionAndFormats}
                    onMouseUp={inspectRichSelectionAndFormats}
                    onKeyDown={handleRichEditorKeyDown}
                    style={{
                      fontFamily: `"${prefs.fontFamily}", "Segoe UI", system-ui, sans-serif`,
                      fontSize: `${computedEditorFontSize}px`,
                    }}
                    className={`w-full min-h-full px-5 py-4 outline-none border-none select-text leading-[1.6] text-black dark:text-white ${
                      prefs.wordWrap
                        ? "whitespace-pre-wrap break-words"
                        : "whitespace-pre overflow-x-auto"
                    } [&_h1]:text-[1.75em] [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:pb-1 [&_h1]:border-b [&_h1]:border-black/10 dark:[&_h1]:border-white/10 [&_h2]:text-[1.45em] [&_h2]:font-semibold [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:text-[1.22em] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-[1.08em] [&_h4]:font-semibold [&_h4]:mt-1.5 [&_h4]:mb-0.5 [&_h5]:text-[0.98em] [&_h5]:font-semibold [&_h5]:mt-1.5 [&_h5]:mb-0.5 [&_h6]:text-[0.9em] [&_h6]:font-semibold [&_h6]:opacity-80 [&_h6]:mt-1 [&_h6]:mb-0.5 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_s]:line-through [&_del]:line-through [&_strike]:line-through [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1.5 [&_li]:my-0.5 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#0067b8] dark:[&_blockquote]:border-[#4cc2ff] [&_blockquote]:pl-3.5 [&_blockquote]:my-2 [&_blockquote]:opacity-90 [&_pre]:p-3 [&_pre]:my-2 [&_pre]:rounded-[6px] [&_pre]:bg-black/[0.04] dark:[&_pre]:bg-[#1e1e1e] [&_pre]:border [&_pre]:border-black/10 dark:[&_pre]:border-white/10 [&_pre]:font-mono [&_pre]:text-[0.9em] [&_pre]:overflow-x-auto [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-[4px] [&_code]:bg-black/[0.06] dark:[&_code]:bg-white/[0.1] [&_code]:font-mono [&_code]:text-[0.9em] [&_pre_code]:p-0 [&_pre_code]:bg-transparent [&_a]:text-[#0067b8] dark:[&_a]:text-[#4cc2ff] [&_a]:underline [&_a]:underline-offset-2 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5 [&_table]:text-[0.92em] [&_th]:border [&_th]:border-black/15 dark:[&_th]:border-white/15 [&_th]:bg-black/[0.04] dark:[&_th]:bg-white/[0.06] [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:font-semibold [&_th]:text-left [&_td]:border [&_td]:border-black/15 dark:[&_td]:border-white/15 [&_td]:px-2.5 [&_td]:py-1.5 [&_hr]:my-3 [&_hr]:border-black/15 dark:[&_hr]:border-white/15 [&_p]:my-0.5`}
                  />
                </div>
              ) : (
                <>
                  {viewDisplayMode !== "preview" && (
                    <div
                      className={`min-w-0 h-full flex flex-col ${
                        viewDisplayMode === "split"
                          ? "w-1/2 border-r border-black/[0.07] dark:border-white/[0.07]"
                          : "flex-1"
                      }`}
                    >
                      <textarea
                        ref={textareaRef}
                        aria-label="Notepad text editor"
                        value={activeTab?.content ?? ""}
                        onChange={(e) => {
                          updateTabContent(e.target.value, true);
                          setCaretOffset(e.target.selectionStart ?? 0);
                          setSelectionRange({
                            start: e.target.selectionStart ?? 0,
                            end: e.target.selectionEnd ?? 0,
                          });
                        }}
                        onSelect={handleSyncSelection}
                        onClick={handleSyncSelection}
                        onKeyUp={handleSyncSelection}
                        onKeyDown={(e) => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            if (e.shiftKey) {
                              handleDecreaseIndent();
                            } else {
                              const el = e.currentTarget;
                              const start = el.selectionStart;
                              const end = el.selectionEnd;
                              if (start !== end) {
                                handleIncreaseIndent();
                              } else {
                                const next =
                                  (activeTab?.content ?? "").slice(0, start) +
                                  "  " +
                                  (activeTab?.content ?? "").slice(end);
                                applySelectionReplacement(next, start + 2, start + 2, false);
                              }
                            }
                          }
                        }}
                        spellCheck={false}
                        wrap={prefs.wordWrap ? "soft" : "off"}
                        style={{
                          fontFamily: `"${prefs.fontFamily}", ui-monospace, SFMono-Regular, Menlo, monospace`,
                          fontSize: `${computedEditorFontSize}px`,
                        }}
                        className={`w-full h-full resize-none bg-transparent text-black dark:text-white px-4 py-3.5 leading-[1.55] outline-none border-none sidebar-scroller select-text ${
                          prefs.wordWrap
                            ? "overflow-y-auto overflow-x-hidden"
                            : "overflow-auto whitespace-pre"
                        }`}
                      />
                    </div>
                  )}

                  {viewDisplayMode !== "source" && (
                    <div
                      className={
                        viewDisplayMode === "split"
                          ? "w-1/2 min-w-0 h-full"
                          : "flex-1 min-w-0 h-full"
                      }
                    >
                      <MarkdownPreviewPane
                        content={activeTab?.content ?? ""}
                        fontSize={computedEditorFontSize}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 5. BOTTOM WINUI 3 STATUS BAR */}
            {prefs.showStatusBar && (
              <footer className="h-[28px] px-4 flex items-center justify-between gap-4 bg-[#f3f3f3] dark:bg-[#202020] border-t border-black/[0.06] dark:border-white/[0.06] text-[12px] text-black/75 dark:text-white/75 tabular-nums shrink-0">
                <div className="flex items-center min-w-0">
                  <span className="pr-5 whitespace-nowrap">
                    Ln {cursorLine}, Col {cursorCol}
                  </span>
                  <span className="w-[1px] h-3.5 bg-black/12 dark:bg-white/14 shrink-0" />
                  <span className="px-5 whitespace-nowrap">
                    {charCount} {charCount === 1 ? "character" : "characters"}
                  </span>
                  <span className="w-[1px] h-3.5 bg-black/12 dark:bg-white/14 shrink-0 hidden sm:block" />
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode: ViewDisplayMode =
                        viewDisplayMode === "formatted"
                          ? "source"
                          : viewDisplayMode === "source"
                            ? "split"
                            : "formatted";
                      setViewDisplayMode(nextMode);
                      setExternalSyncNonce((n) => n + 1);
                    }}
                    title="Cycle editor mode: Formatted / Source / Split"
                    className="px-5 whitespace-nowrap hover:text-black dark:hover:text-white transition-colors cursor-pointer hidden sm:inline-flex"
                  >
                    {viewDisplayMode === "formatted"
                      ? activeTab?.format === "plain"
                        ? "Rich text"
                        : "Formatted"
                      : viewDisplayMode === "split"
                        ? "Split view"
                        : "Markdown source"}
                  </button>
                </div>

                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleZoomChange("reset")}
                    title="Click to reset zoom to 100%"
                    className="px-5 whitespace-nowrap hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {activeTab?.zoom ?? 100}%
                  </button>
                  <span className="w-[1px] h-3.5 bg-black/12 dark:bg-white/14 shrink-0 hidden md:block" />
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveTab((prev) => ({
                        ...prev,
                        lineEnding: prev.lineEnding === "CRLF" ? "LF" : "CRLF",
                      }))
                    }
                    title="Toggle line ending format"
                    className="px-5 whitespace-nowrap hover:text-black dark:hover:text-white transition-colors cursor-pointer hidden md:inline-flex"
                  >
                    {activeTab?.lineEnding === "LF" ? "Unix (LF)" : "Windows (CRLF)"}
                  </button>
                  <span className="w-[1px] h-3.5 bg-black/12 dark:bg-white/14 shrink-0 hidden sm:block" />
                  <span className="pl-5 whitespace-nowrap hidden sm:inline">
                    {activeTab?.encoding ?? "UTF-8"}
                  </span>
                </div>
              </footer>
            )}
          </>
        )}
      </div>
    </div>
  );
};
