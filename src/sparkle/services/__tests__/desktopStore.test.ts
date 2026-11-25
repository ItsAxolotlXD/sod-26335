// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  DESKTOP_AUTO_ARRANGE_KEY,
  DESKTOP_ICONS_KEY,
  DESKTOP_SNAP_TO_GRID_KEY,
  addSodiumPayloadToDesktop,
  computeDesktopLayout,
  loadAutoArrange,
  loadDesktopIcons,
  loadSnapToGrid,
  moveDesktopIcon,
  saveAutoArrange,
  saveDesktopIcons,
  saveSnapToGrid,
  type DesktopIconItem,
  type DesktopLayoutConfig,
} from "../desktopStore";

const BASE_CONFIG: DesktopLayoutConfig = {
  workspaceWidth: 1200,
  workspaceHeight: 800,
  viewSize: "medium",
  sortBy: "name",
  autoArrange: false,
  snapToGrid: true,
};

function makeIcon(id: string, name: string, gridCol = 0, gridRow = 0): DesktopIconItem {
  return {
    id,
    kind: "file",
    name,
    gridCol,
    gridRow,
    modifiedAt: 1740000000000,
    sizeBytes: 1024,
  };
}

describe("desktopStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults autoArrange to false and snapToGrid to true", () => {
    expect(loadAutoArrange()).toBe(false);
    expect(loadSnapToGrid()).toBe(true);

    saveAutoArrange(true);
    saveSnapToGrid(false);
    expect(localStorage.getItem(DESKTOP_AUTO_ARRANGE_KEY)).toBe("true");
    expect(localStorage.getItem(DESKTOP_SNAP_TO_GRID_KEY)).toBe("false");
    expect(loadAutoArrange()).toBe(true);
    expect(loadSnapToGrid()).toBe(false);
  });

  it("computes column-major sorted layout when autoArrange is true", () => {
    const items = [makeIcon("a", "Zebra.txt", 3, 2), makeIcon("b", "Alpha.txt", 2, 4)];
    const layout = computeDesktopLayout(items, {
      ...BASE_CONFIG,
      autoArrange: true,
      sortBy: "name",
    });

    expect(layout.map((p) => p.item.name)).toEqual(["Alpha.txt", "Zebra.txt"]);
    expect(layout[0]?.col).toBe(0);
    expect(layout[0]?.row).toBe(0);
    expect(layout[1]?.col).toBe(0);
    expect(layout[1]?.row).toBe(1);
  });

  it("avoids cell collisions when snapToGrid is true", () => {
    const items = [makeIcon("a", "First.txt", 1, 1), makeIcon("b", "Second.txt", 1, 1)];
    const layout = computeDesktopLayout(items, {
      ...BASE_CONFIG,
      autoArrange: false,
      snapToGrid: true,
    });

    const coords = new Set(layout.map((p) => `${p.col}:${p.row}`));
    expect(coords.size).toBe(2);
    expect(layout[0]?.col).toBe(1);
    expect(layout[0]?.row).toBe(1);
  });

  it("moves desktop icon to nearest free grid cell or free coordinates", () => {
    saveDesktopIcons([makeIcon("one", "One.txt", 0, 0), makeIcon("two", "Two.txt", 2, 2)]);

    const snapped = moveDesktopIcon("one", 220, 220, {
      ...BASE_CONFIG,
      autoArrange: false,
      snapToGrid: true,
    });
    const movedOne = snapped.find((it) => it.id === "one");
    expect(movedOne).toBeDefined();
    expect(`${movedOne?.gridCol}:${movedOne?.gridRow}`).not.toBe("2:2");

    const freeMoved = moveDesktopIcon("one", 315, 190, {
      ...BASE_CONFIG,
      autoArrange: false,
      snapToGrid: false,
    });
    const freeOne = freeMoved.find((it) => it.id === "one");
    expect(freeOne?.freeX).toBe(315);
    expect(freeOne?.freeY).toBe(190);
  });

  it("adds dropped app and file payloads onto the desktop and deduplicates app shortcuts", () => {
    saveDesktopIcons([]);
    expect(JSON.parse(localStorage.getItem(DESKTOP_ICONS_KEY) || "[]")).toEqual([]);

    const afterApp = addSodiumPayloadToDesktop(
      {
        kind: "app",
        appId: "app-notepad",
        label: "Notepad",
        route: "/notepad",
      },
      BASE_CONFIG,
      150,
      150,
    );
    expect(afterApp).toHaveLength(1);
    expect(afterApp[0]?.name).toBe("Notepad");

    // Dropping same app again repositions rather than duplicating
    const afterSameApp = addSodiumPayloadToDesktop(
      {
        kind: "app",
        appId: "app-notepad",
        label: "Notepad",
        route: "/notepad",
      },
      BASE_CONFIG,
      300,
      250,
    );
    expect(afterSameApp).toHaveLength(1);

    const afterFile = addSodiumPayloadToDesktop(
      {
        kind: "file",
        name: "Notes.txt",
        fileKind: "text",
        fileExtension: "txt",
      },
      BASE_CONFIG,
      150,
      150,
    );
    expect(afterFile).toHaveLength(2);
    expect(loadDesktopIcons()).toHaveLength(2);
  });
});
