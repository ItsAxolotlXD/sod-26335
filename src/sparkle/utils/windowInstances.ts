// Rules for opening the same app in several windows (Windows mode).

/** Strips the query string from a route. */
const baseOf = (route: string): string => route.split("?")[0] ?? route;

/** Which app a route belongs to; windows of the same app share a group. */
export function getAppGroup(route: string): string {
  const b = baseOf(route);
  if (b === "/" || b === "/home" || b === "/home-preview") return "home";
  if (b === "/live-tv" || b === "/watch-preview" || b.startsWith("/watch")) return "watch";
  if (b === "/news" || b === "/updates" || b.startsWith("/news/") || b.startsWith("/article"))
    return "news";
  if (
    b === "/notes" ||
    b.startsWith("/notes/") ||
    b === "/write" ||
    b === "/present" ||
    b === "/table"
  )
    return "notes";
  if (b === "/vlc" || b === "/screenbox" || b === "/screenbug") return "screenbox";
  if (b === "/draws" || b.startsWith("/draws/")) return "draws";
  if (b === "/notepad" || b.startsWith("/notepad/")) return "notepad";
  if (b === "/html-writer" || b.startsWith("/html-writer/")) return "html-writer";
  if (b === "/pc-settings" || b.startsWith("/pc-settings/")) return "pc-settings";
  if (b === "/file-explorer" || b.startsWith("/file-explorer/")) return "file-explorer";
  if (b === "/calculator" || b.startsWith("/calculator/")) return "calculator";
  if (b === "/weather" || b.startsWith("/weather/")) return "weather";
  if (b === "/settings" || b.startsWith("/settings")) return "settings";
  return b;
}

const GROUP_LAUNCH_ROUTES: Record<string, string> = {
  home: "/",
  watch: "/live-tv",
  news: "/news",
  notes: "/notes",
  screenbox: "/screenbox",
  draws: "/draws",
  notepad: "/notepad",
  "html-writer": "/html-writer",
  "pc-settings": "/pc-settings",
  "file-explorer": "/file-explorer",
  calculator: "/calculator",
  weather: "/weather",
  settings: "/settings",
};

/** The route a fresh window of this app starts on (its home screen, not the current page). */
export function getAppLaunchRoute(route: string): string {
  const group = getAppGroup(route);
  return GROUP_LAUNCH_ROUTES[group] ?? baseOf(route);
}

/** Apps that, like Windows Settings, only ever have one window. */
const SINGLE_INSTANCE_GROUPS = new Set(["settings", "pc-settings"]);

export function isSingleInstanceApp(route: string): boolean {
  return SINGLE_INSTANCE_GROUPS.has(getAppGroup(route));
}

export const CASCADE_STEP_X = 28;
export const CASCADE_STEP_Y = 24;

export interface CascadeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Places a new window one step down-right of the previous window of the same app,
 * wrapping back to the top-left corner of the work area when it would run off screen.
 */
export function cascadeFrom(
  previous: CascadeBounds,
  size: { width: number; height: number },
  area: { minX: number; minY: number; maxX: number; maxY: number },
): { x: number; y: number } {
  let x = previous.x + CASCADE_STEP_X;
  let y = previous.y + CASCADE_STEP_Y;
  if (x + size.width > area.maxX) x = area.minX + CASCADE_STEP_X;
  if (y + size.height > area.maxY) y = area.minY + CASCADE_STEP_Y;
  return { x, y };
}
