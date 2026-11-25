import { describe, expect, it } from "vitest";
import {
  cascadeFrom,
  getAppGroup,
  getAppLaunchRoute,
  isSingleInstanceApp,
} from "./windowInstances";

describe("window instances", () => {
  it("treats a note page and the notes list as the same app", () => {
    expect(getAppGroup("/notes/abc")).toBe(getAppGroup("/notes"));
  });

  it("starts a new Watch window on the Watch home, not the current channel", () => {
    expect(getAppLaunchRoute("/live-tv?channel=vtv1-hd")).toBe("/live-tv");
  });

  it("starts a new Notes window on the notes list", () => {
    expect(getAppLaunchRoute("/notes/abc")).toBe("/notes");
  });

  it("keeps Settings and PC settings to a single window", () => {
    expect(isSingleInstanceApp("/settings")).toBe(true);
    expect(isSingleInstanceApp("/pc-settings/personalization")).toBe(true);
  });

  it("lets Notepad, File Explorer and Calculator open many windows", () => {
    expect(isSingleInstanceApp("/notepad")).toBe(false);
    expect(isSingleInstanceApp("/file-explorer")).toBe(false);
    expect(isSingleInstanceApp("/calculator")).toBe(false);
  });

  it("offsets a new window 28px right and 24px down from the previous one", () => {
    const area = { minX: 0, minY: 0, maxX: 1440, maxY: 850 };
    expect(
      cascadeFrom({ x: 100, y: 50, width: 800, height: 600 }, { width: 800, height: 600 }, area),
    ).toEqual({ x: 128, y: 74 });
  });

  it("wraps back to the top-left when the next window would leave the screen", () => {
    const area = { minX: 0, minY: 0, maxX: 1000, maxY: 700 };
    expect(
      cascadeFrom({ x: 190, y: 90, width: 800, height: 600 }, { width: 800, height: 600 }, area),
    ).toEqual({ x: 28, y: 24 });
  });
});
