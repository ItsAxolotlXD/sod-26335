import { describe, expect, it, vi } from "vitest";
import { buildStartForYouSuggestions } from "./startForYouSuggestions";
import { DEFAULT_GALLERY_ITEMS } from "../services/galleryStorage";
import type { Channel } from "../types";
import type { NoteItem } from "../context/NotesContext";

describe("buildStartForYouSuggestions", () => {
  it("returns 9 unique suggestion items across multiple content categories", () => {
    const channels: Channel[] = [
      {
        id: "ch-1",
        slug: "vtv1",
        name: "VTV1 HD",
        category: "Kênh VTV",
        quality: "HD",
        isLive: true,
        streamUrl: "https://example.com/vtv1.m3u8",
        logo: "/logos/vtv1.png",
        description: "Test channel",
        currentProgram: {
          title: "News",
          startTime: "19:00",
          endTime: "20:00",
          progress: 50,
          description: "Evening news",
        },
      },
    ];
    const notes: NoteItem[] = [
      {
        id: "note-1",
        title: "Daily Checklist",
        content: "<p>Finish Start concept grid</p>",
        colorId: "yellow",
        createdAt: 1,
        updatedAt: 2,
      },
    ];
    const pinnedApps = [
      { id: "app-feedback", label: "Feedback", route: "/feedback" },
      { id: "app-feed", label: "Update blogs", route: "/news" },
    ];

    const items = buildStartForYouSuggestions({
      channels,
      notes,
      pinnedApps,
      galleryItems: DEFAULT_GALLERY_ITEMS,
      galleryFolders: [{ id: "fld-1", name: "Vacations", dateCreated: "2026-01-01" }],
      onLaunchApp: vi.fn(),
      onSelectChannel: vi.fn(),
      onSelectNote: vi.fn(),
      onLaunchRoute: vi.fn(),
      onClose: vi.fn(),
    });

    expect(items).toHaveLength(9);
    const ids = new Set(items.map((item) => item.id));
    expect(ids.size).toBe(9);
    const kinds = new Set(items.map((item) => item.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(8);
  });
});
