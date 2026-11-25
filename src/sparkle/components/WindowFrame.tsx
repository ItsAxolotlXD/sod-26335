// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  createContext,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Square, X, ArrowLeft, Menu } from "lucide-react";
import { TabIcon, type AppTab } from "./SparkleTabBar";
import { StartMenuRouteIcon } from "./StartAppIcons";
import { SpinningRing } from "./SpinningRing";
import {
  useSettings,
  getTaskbarThicknessPx,
  getWindowsUiScaleMultiplier,
  FLOAT_BAR_BOTTOM_GAP_PX,
} from "../hooks/useSettings";
import { getWindowMainContentSurfaceStyle, getWindowSidebarSurfaceStyle } from "./WindowAppSidebar";

export function isWindowSidebarExcludedRoute(route: string): boolean {
  const base = (route || "/").split(/[?#]/)[0].toLowerCase();
  if (base === "/file-explorer" || base.startsWith("/file-explorer/")) return true;
  if (base === "/notepad" || base.startsWith("/notepad/")) return true;
  if (base === "/html-writer" || base.startsWith("/html-writer/")) return true;
  if (
    base === "/notes" ||
    base.startsWith("/notes/") ||
    base === "/write" ||
    base === "/present" ||
    base === "/table"
  ) {
    return true;
  }
  if (base === "/draws" || base.startsWith("/draws/")) return true;
  if (
    base === "/screenbox" ||
    base.startsWith("/screenbox/") ||
    base === "/vlc" ||
    base.startsWith("/vlc/") ||
    base === "/screenbug" ||
    base.startsWith("/screenbug/")
  ) {
    return true;
  }
  if (base === "/calculator" || base.startsWith("/calculator/")) return true;
  if (base === "/weather" || base.startsWith("/weather/")) return true;
  if (base === "/camera" || base.startsWith("/camera/")) return true;
  if (base === "/craftmine" || base === "/photopea") return true;
  if (base === "/sodver" || base === "/sodver/") return true;
  if (base.startsWith("/sodver/")) return true;
  if (base === "/auth" || base === "/reset-password" || base === "/search") return true;
  return false;
}

export const WindowTitleBarPortalContext = createContext<{
  titleBarSlotEl: HTMLDivElement | null;
  isInsideWindowFrame: boolean;
  isCompactWindow?: boolean;
  isWindowSidebarCollapsed?: boolean;
  isWindowSidebarDrawerOpen?: boolean;
  onToggleWindowSidebar?: () => void;
  onCloseWindowSidebarDrawer?: () => void;
}>({
  titleBarSlotEl: null,
  isInsideWindowFrame: false,
});

export interface AppWindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface WindowFrameProps {
  tab: AppTab;
  windowState: AppWindowState;
  isActive: boolean;
  sidebarOffset: number;
  isRightSidebar: boolean;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onUpdateBounds: (bounds: Partial<AppWindowState>) => void;
  isTaskbarFloating?: boolean;
  renderWindowSidebar?: (opts: {
    isCompactWindow: boolean;
    isDrawerOpen: boolean;
    onCloseDrawer: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
  }) => React.ReactNode;
  renderBody?: () => React.ReactNode;
  children?: React.ReactNode;
}

const MIN_WIDTH = 360;
const MIN_HEIGHT = 260;

const WindowFrameInner: React.FC<WindowFrameProps> = ({
  tab,
  windowState,
  isActive,
  sidebarOffset,
  isRightSidebar,
  canGoBack = false,
  onGoBack,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onUpdateBounds,
  isTaskbarFloating = false,
  renderWindowSidebar,
  renderBody,
  children,
}) => {
  const { settings } = useSettings();
  const dynamicIcons = settings.dynamicSidebarIcons !== false;
  const reduceMotion = settings.reduceAllMotion;
  const isSodverRoute = tab.route === "/sodver" || tab.route.startsWith("/sodver/");
  const canMaximize = !isSodverRoute;
  const effectiveIsMaximized = canMaximize ? windowState.isMaximized : false;
  const taskbarLocation = settings.taskbarLocation || "bottom";
  const taskbarThickness = getTaskbarThicknessPx(
    settings.taskbarScale,
    !effectiveIsMaximized && isTaskbarFloating,
    taskbarLocation,
  );
  const uiScaleMult = getWindowsUiScaleMultiplier(settings.windowsUiScale);
  const titleBarHeight =
    settings.windowsUiScale === "small" ? 38 : settings.windowsUiScale === "large" ? 48 : 42;

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [isWinSidebarCollapsed, setIsWinSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("waves_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [isWinSidebarDrawerOpen, setIsWinSidebarDrawerOpen] = useState(false);

  const toggleWinSidebarCollapse = useCallback(() => {
    setIsWinSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("waves_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    setIsWinSidebarDrawerOpen(false);
  }, [tab.route]);

  useLayoutEffect(() => {
    setShowLaunchSplash(true);
    const timer = window.setTimeout(() => setShowLaunchSplash(false), 3000);
    return () => window.clearTimeout(timer);
  }, [tab.id]);

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDesktop = viewport.width >= 768;
  const floatingGap = !effectiveIsMaximized && isTaskbarFloating ? FLOAT_BAR_BOTTOM_GAP_PX : 0;
  const taskbarOffset = settings.windowsMode ? taskbarThickness + floatingGap : 0;
  const baseDesktopMinX = isDesktop && !isRightSidebar ? sidebarOffset : 0;
  const baseDesktopMaxX =
    isDesktop && isRightSidebar ? viewport.width - sidebarOffset : viewport.width;
  const desktopMinX =
    settings.windowsMode && taskbarLocation === "left"
      ? Math.max(baseDesktopMinX, taskbarOffset)
      : baseDesktopMinX;
  const desktopMaxX =
    settings.windowsMode && taskbarLocation === "right"
      ? Math.min(baseDesktopMaxX, viewport.width - taskbarOffset)
      : baseDesktopMaxX;
  const desktopMinY = settings.windowsMode && taskbarLocation === "top" ? taskbarOffset : 0;
  const desktopMaxY =
    settings.windowsMode && taskbarLocation === "bottom"
      ? viewport.height - taskbarOffset
      : settings.windowsMode
        ? viewport.height
        : viewport.height - taskbarThickness - floatingGap;

  // Dragging state
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    wasMaximized: boolean;
    restoredWidth: number;
    restoredHeight: number;
    hasUnmaximized: boolean;
  } | null>(null);

  // Resizing state
  const resizeRef = useRef<{
    dir: ResizeDirection;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [titleBarSlotEl, setTitleBarSlotEl] = useState<HTMLDivElement | null>(null);
  const titleBarRef = useRef<HTMLDivElement | null>(null);
  const hasMergedTabBar =
    tab.route === "/file-explorer" ||
    tab.route.startsWith("/file-explorer/") ||
    tab.route === "/notepad" ||
    tab.route.startsWith("/notepad/");
  const effectiveTitleBarHeight = hasMergedTabBar ? Math.max(titleBarHeight, 44) : titleBarHeight;

  const latestRef = useRef({
    windowState,
    canMaximize,
    effectiveIsMaximized,
    desktopMinX,
    desktopMaxX,
    desktopMinY,
    desktopMaxY,
    onFocus,
    onUpdateBounds,
    onToggleMaximize,
  });
  latestRef.current = {
    windowState,
    canMaximize,
    effectiveIsMaximized,
    desktopMinX,
    desktopMaxX,
    desktopMinY,
    desktopMaxY,
    onFocus,
    onUpdateBounds,
    onToggleMaximize,
  };

  // Native DOM listeners on titleBarRef ensure merged React Portal tab bars (like File Explorer)
  // still drag and double-click-maximize the window cleanly.
  useEffect(() => {
    const titleEl = titleBarRef.current;
    if (!titleEl) return;

    const NO_DRAG_SELECTOR =
      'button, input, textarea, select, a, [role="tab"], [data-window-no-drag]';

    const onNativePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(NO_DRAG_SELECTOR)) return;

      const {
        windowState: ws,
        effectiveIsMaximized: wasMax,
        onFocus: focusWin,
      } = latestRef.current;
      focusWin();
      setIsInteracting(true);

      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        origX: ws.x,
        origY: ws.y,
        wasMaximized: wasMax,
        restoredWidth: ws.width,
        restoredHeight: ws.height,
        hasUnmaximized: false,
      };
    };

    const onNativeDblClick = (e: MouseEvent) => {
      if (!latestRef.current.canMaximize) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(NO_DRAG_SELECTOR)) return;
      latestRef.current.onToggleMaximize();
    };

    titleEl.addEventListener("pointerdown", onNativePointerDown);
    titleEl.addEventListener("dblclick", onNativeDblClick);
    return () => {
      titleEl.removeEventListener("pointerdown", onNativePointerDown);
      titleEl.removeEventListener("dblclick", onNativeDblClick);
    };
  }, []);

  // Global pointermove / pointerup listeners for smooth dragging & resizing even if pointer leaves frame
  useEffect(() => {
    if (!isInteracting) return;

    const onWindowPointerMove = (e: PointerEvent) => {
      const {
        windowState: ws,
        desktopMinX: minX,
        desktopMaxX: maxX,
        desktopMinY: minY,
        desktopMaxY: maxY,
        onUpdateBounds: updateBounds,
      } = latestRef.current;

      const drag = dragRef.current;
      if (drag && drag.active) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;

        if (drag.wasMaximized && !drag.hasUnmaximized) {
          if (Math.hypot(dx, dy) < 6) return;
          const availableW = maxX - minX;
          const availableH = maxY - minY;
          const targetW = Math.min(drag.restoredWidth, availableW - 16);
          const targetH = Math.min(drag.restoredHeight, availableH - 16);
          const newX = Math.max(minX, Math.min(e.clientX - targetW / 2, maxX - targetW));
          const newY = Math.max(minY, Math.min(e.clientY - 18, maxY - 40));
          drag.origX = newX;
          drag.origY = newY;
          drag.startX = e.clientX;
          drag.startY = e.clientY;
          drag.hasUnmaximized = true;
          updateBounds({
            isMaximized: false,
            x: newX,
            y: newY,
            width: targetW,
            height: targetH,
          });
          return;
        }

        const nextX = Math.max(minX - ws.width + 120, Math.min(drag.origX + dx, maxX - 120));
        const nextY = Math.max(minY, Math.min(drag.origY + dy, maxY - 36));
        updateBounds({ x: nextX, y: nextY });
      }

      const r = resizeRef.current;
      if (r) {
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;

        let nextX = r.origX;
        let nextY = r.origY;
        let nextW = r.origW;
        let nextH = r.origH;

        const minW = Math.min(MIN_WIDTH, maxX - minX);
        const minH = Math.min(MIN_HEIGHT, maxY - minY);

        if (r.dir.includes("e")) {
          nextW = Math.max(minW, Math.min(r.origW + dx, maxX - r.origX));
        }
        if (r.dir.includes("s")) {
          nextH = Math.max(minH, Math.min(r.origH + dy, maxY - r.origY));
        }
        if (r.dir.includes("w")) {
          const rawW = r.origW - dx;
          const clampedW = Math.max(minW, Math.min(rawW, r.origX + r.origW - minX));
          nextX = r.origX + (r.origW - clampedW);
          nextW = clampedW;
        }
        if (r.dir.includes("n")) {
          const rawH = r.origH - dy;
          const clampedH = Math.max(minH, Math.min(rawH, r.origY + r.origH - minY));
          nextY = r.origY + (r.origH - clampedH);
          nextH = clampedH;
        }

        updateBounds({ x: nextX, y: nextY, width: nextW, height: nextH });
      }
    };

    const onWindowPointerEnd = () => {
      if (dragRef.current?.active || resizeRef.current) {
        if (dragRef.current) dragRef.current.active = false;
        resizeRef.current = null;
        document.documentElement.classList.remove(
          "window-resizing-ns",
          "window-resizing-ew",
          "window-resizing-nwse",
          "window-resizing-nesw",
        );
        setIsInteracting(false);
      }
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerEnd);
    window.addEventListener("pointercancel", onWindowPointerEnd);
    window.addEventListener("blur", onWindowPointerEnd);
    return () => {
      document.documentElement.classList.remove(
        "window-resizing-ns",
        "window-resizing-ew",
        "window-resizing-nwse",
        "window-resizing-nesw",
      );
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerEnd);
      window.removeEventListener("pointercancel", onWindowPointerEnd);
      window.removeEventListener("blur", onWindowPointerEnd);
    };
  }, [isInteracting]);

  const handleResizePointerDown = useCallback(
    (dir: ResizeDirection, e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || effectiveIsMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unavailable
      }
      const cursorClass =
        dir === "n" || dir === "s"
          ? "window-resizing-ns"
          : dir === "e" || dir === "w"
            ? "window-resizing-ew"
            : dir === "nw" || dir === "se"
              ? "window-resizing-nwse"
              : "window-resizing-nesw";
      document.documentElement.classList.add(cursorClass);
      setIsInteracting(true);

      resizeRef.current = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        origX: windowState.x,
        origY: windowState.y,
        origW: windowState.width,
        origH: windowState.height,
      };
    },
    [
      effectiveIsMaximized,
      windowState.x,
      windowState.y,
      windowState.width,
      windowState.height,
      onFocus,
    ],
  );

  // Compute displayed geometry
  const maxWidth = Math.max(320, desktopMaxX - desktopMinX);
  const maxHeight = Math.max(240, desktopMaxY - desktopMinY);

  const computedLeft = effectiveIsMaximized
    ? desktopMinX
    : Math.max(desktopMinX - windowState.width + 120, Math.min(windowState.x, desktopMaxX - 120));
  const computedTop = effectiveIsMaximized
    ? desktopMinY
    : Math.max(desktopMinY, Math.min(windowState.y, Math.max(desktopMinY, desktopMaxY - 36)));
  const computedWidth = effectiveIsMaximized ? maxWidth : Math.min(windowState.width, maxWidth);
  const computedHeight = effectiveIsMaximized ? maxHeight : Math.min(windowState.height, maxHeight);

  const resizeHandles: Array<{ dir: ResizeDirection; className: string; cursor: string }> = [
    { dir: "n", className: "-top-[5px] left-3 right-3 h-[9px] z-[120]", cursor: "ns-resize" },
    { dir: "s", className: "-bottom-[5px] left-3 right-3 h-[10px] z-[120]", cursor: "ns-resize" },
    { dir: "w", className: "-left-[5px] top-3 bottom-3 w-[10px] z-[120]", cursor: "ew-resize" },
    { dir: "e", className: "-right-[5px] top-3 bottom-3 w-[10px] z-[120]", cursor: "ew-resize" },
    { dir: "nw", className: "-top-[6px] -left-[6px] w-4 h-4 z-[121]", cursor: "nwse-resize" },
    { dir: "ne", className: "-top-[6px] -right-[6px] w-4 h-4 z-[121]", cursor: "nesw-resize" },
    { dir: "sw", className: "-bottom-[6px] -left-[6px] w-4 h-4 z-[121]", cursor: "nesw-resize" },
    { dir: "se", className: "-bottom-[6px] -right-[6px] w-4 h-4 z-[121]", cursor: "nwse-resize" },
  ];

  const isWeatherRoute = tab.route === "/weather" || tab.route.startsWith("/weather/");

  const isCustomRouteFull =
    tab.route === "/craftmine" ||
    tab.route === "/photopea" ||
    tab.route === "/calculator" ||
    tab.route.startsWith("/calculator/") ||
    tab.route.startsWith("/draws/") ||
    tab.route === "/html-writer" ||
    tab.route.startsWith("/html-writer/") ||
    tab.route === "/pc-settings" ||
    tab.route.startsWith("/pc-settings/") ||
    tab.route === "/notepad" ||
    tab.route.startsWith("/notepad/") ||
    tab.route === "/file-explorer" ||
    tab.route.startsWith("/file-explorer/") ||
    isWeatherRoute;

  const showEmbeddedSidebar = Boolean(
    settings.windowsMode && renderWindowSidebar && !isWindowSidebarExcludedRoute(tab.route),
  );
  const showTitleBarHamburger = showEmbeddedSidebar || (settings.windowsMode && isWeatherRoute);
  const isCompactWindow = computedWidth < 680;
  const embeddedSidebarNode = showEmbeddedSidebar
    ? renderWindowSidebar?.({
        isCompactWindow,
        isDrawerOpen: isWinSidebarDrawerOpen,
        onCloseDrawer: () => setIsWinSidebarDrawerOpen(false),
        isCollapsed: isWinSidebarCollapsed,
        onToggleCollapse: toggleWinSidebarCollapse,
      })
    : null;

  return (
    <motion.section
      role="dialog"
      aria-label={tab.title}
      aria-hidden={windowState.isMinimized}
      data-window-id={tab.id}
      data-window-frame="true"
      data-window-active={isActive ? "true" : "false"}
      onPointerDownCapture={onFocus}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 1,
              scale: 0.86,
              y: 16,
              left: computedLeft,
              top: computedTop,
              width: computedWidth,
              height: computedHeight,
            }
      }
      animate={
        windowState.isMinimized
          ? {
              opacity: 0,
              scale: 0.72,
              y: 110,
              left: computedLeft,
              top: computedTop,
              width: computedWidth,
              height: computedHeight,
            }
          : {
              opacity: 1,
              scale: 1,
              y: 0,
              left: computedLeft,
              top: computedTop,
              width: computedWidth,
              height: computedHeight,
            }
      }
      exit={
        reduceMotion
          ? undefined
          : {
              opacity: 0,
              scale: 0.84,
              y: 14,
              transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            }
      }
      transition={
        reduceMotion || isInteracting
          ? { duration: 0 }
          : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      }
      style={{
        position: "fixed",
        zIndex: windowState.zIndex,
        transformOrigin: "center center",
      }}
      className={`overflow-visible select-text ${
        windowState.isMinimized ? "pointer-events-none" : "pointer-events-auto"
      } ${isInteracting ? "select-none" : ""}`}
    >
      {/* 8-Direction Resize Handles when restored (straddle perimeter outside clipped frame) */}
      {!effectiveIsMaximized &&
        resizeHandles.map((handle) => (
          <div
            key={handle.dir}
            data-window-resize={handle.dir}
            data-window-no-drag="true"
            onPointerDown={(e) => handleResizePointerDown(handle.dir, e)}
            style={{ cursor: handle.cursor, backgroundColor: "rgba(0, 0, 0, 0.001)" }}
            className={`absolute ${handle.className} pointer-events-auto select-none touch-none`}
          />
        ))}

      <div
        data-window-active={isActive ? "true" : "false"}
        data-window-interacting={isInteracting ? "true" : "false"}
        data-window-minimized={windowState.isMinimized ? "true" : "false"}
        className={`windows-mica-frame relative w-full h-full flex flex-col overflow-hidden ${
          effectiveIsMaximized
            ? "rounded-none border-0"
            : "rounded-[10px] border border-black/15 dark:border-white/[0.14]"
        } ${
          isActive
            ? "shadow-[0_24px_64px_rgba(0,0,0,0.48),0_4px_16px_rgba(0,0,0,0.22)] ring-1 ring-black/5 dark:ring-white/[0.08]"
            : "shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
        } ${isInteracting ? "select-none" : "transition-[border-radius,box-shadow] duration-200"}`}
      >
        {/* Windows 11 Title Bar */}
        <div
          ref={titleBarRef}
          style={{
            height: `${effectiveTitleBarHeight}px`,
            ...(showTitleBarHamburger ? getWindowSidebarSurfaceStyle(settings.theme) : {}),
          }}
          className={`relative z-10 shrink-0 flex items-center justify-between pl-2.5 pr-0 select-none cursor-default ${
            showTitleBarHamburger ? "" : "bg-transparent"
          } ${isActive ? "text-[#111827] dark:text-white" : "text-[#6b7280] dark:text-[#9ca3af]"}`}
        >
          {/* Left: Hamburger (left edge) + optional Back + Merged Tab Bar OR App Icon + Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 h-full pr-2">
            {showTitleBarHamburger && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCompactWindow) {
                    setIsWinSidebarDrawerOpen((prev) => !prev);
                  } else {
                    toggleWinSidebarCollapse();
                  }
                }}
                aria-label={
                  isCompactWindow
                    ? isWinSidebarDrawerOpen
                      ? "Close navigation"
                      : "Open navigation"
                    : isWinSidebarCollapsed
                      ? "Expand navigation"
                      : "Collapse navigation"
                }
                className="w-8 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/[0.07] dark:hover:bg-white/[0.09] active:bg-black/10 dark:active:bg-white/15 text-current transition-colors cursor-pointer shrink-0 border-none"
              >
                <Menu className="w-4 h-4 stroke-[1.75]" />
              </motion.button>
            )}
            {canGoBack && onGoBack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoBack();
                }}
                aria-label="Back in window"
                className="w-6 h-6 rounded-[5px] flex items-center justify-center hover:bg-black/[0.07] dark:hover:bg-white/[0.09] text-current transition-colors cursor-pointer shrink-0 border-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {hasMergedTabBar ? (
              <div ref={setTitleBarSlotEl} className="flex-1 min-w-0 h-full flex items-end pt-1" />
            ) : (
              <>
                <div className="w-4 h-4 flex items-center justify-center shrink-0 ml-0.5">
                  <TabIcon
                    route={tab.route}
                    active={isActive}
                    dynamicIcons={dynamicIcons}
                    className="w-4 h-4 shrink-0"
                  />
                </div>
                <span className="text-[12px] font-medium truncate leading-none">{tab.title}</span>
              </>
            )}
          </div>

          {/* Right: Windows 11 Caption Controls */}
          <div className="flex items-stretch justify-end h-full shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
              aria-label={`Minimize ${tab.title}`}
              className="w-[42px] h-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer border-none"
            >
              <Minus className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>

            {canMaximize && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMaximize();
                }}
                aria-label={effectiveIsMaximized ? `Restore ${tab.title}` : `Maximize ${tab.title}`}
                className="w-[42px] h-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer border-none"
              >
                {effectiveIsMaximized ? (
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <rect x="1.5" y="3.5" width="7" height="7" rx="1" />
                    <path d="M3.5 3.5V2.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H8.5" />
                  </svg>
                ) : (
                  <Square className="w-3 h-3 stroke-[1.75]" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={`Close ${tab.title}`}
              className="w-[44px] h-full flex items-center justify-center hover:bg-[#c42b1c] hover:text-white active:bg-[#b32619] active:text-white transition-colors cursor-pointer border-none"
            >
              <X className="w-3.5 h-3.5 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Window Workspace: Optional Embedded Sidebar + Scrollable Window Body */}
        <div
          style={{ contentVisibility: windowState.isMinimized ? "hidden" : "visible" }}
          className="relative flex-1 min-h-0 flex overflow-hidden bg-transparent"
        >
          {showEmbeddedSidebar &&
            (isCompactWindow || settings.sidebarPosition !== "right") &&
            embeddedSidebarNode}

          <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
            <div
              data-has-embedded-sidebar={showEmbeddedSidebar ? "true" : "false"}
              style={
                showEmbeddedSidebar ? getWindowMainContentSurfaceStyle(settings.theme) : undefined
              }
              className={`window-content-area w-full h-full ${
                hasMergedTabBar ||
                tab.route === "/calculator" ||
                tab.route.startsWith("/calculator/") ||
                tab.route === "/sodver" ||
                tab.route.startsWith("/sodver/") ||
                isWeatherRoute
                  ? "overflow-hidden flex flex-col"
                  : "overflow-y-auto overflow-x-hidden"
              } relative ${
                showEmbeddedSidebar ? "rounded-tl-[5px]" : "bg-transparent"
              } ${isCustomRouteFull ? "p-0" : ""}`}
            >
              {!showLaunchSplash && (
                <div
                  style={{ zoom: uiScaleMult }}
                  className={`w-full ${
                    hasMergedTabBar ||
                    tab.route === "/calculator" ||
                    tab.route.startsWith("/calculator/") ||
                    tab.route === "/sodver" ||
                    tab.route.startsWith("/sodver/") ||
                    isWeatherRoute
                      ? "h-full overflow-hidden"
                      : "min-h-full"
                  } ${
                    tab.route === "/" ||
                    tab.route === "/home" ||
                    tab.route === "/news" ||
                    tab.route === "/updates" ||
                    tab.route.startsWith("/notes") ||
                    tab.route === "/write" ||
                    tab.route === "/craftmine" ||
                    tab.route === "/photopea" ||
                    tab.route === "/vlc" ||
                    tab.route === "/screenbox" ||
                    tab.route === "/screenbug" ||
                    tab.route === "/gallery" ||
                    tab.route === "/draws" ||
                    tab.route.startsWith("/draws/") ||
                    tab.route === "/camera" ||
                    tab.route === "/calculator" ||
                    tab.route.startsWith("/calculator/") ||
                    tab.route === "/sodver" ||
                    tab.route.startsWith("/sodver/") ||
                    tab.route === "/weather" ||
                    tab.route.startsWith("/weather/") ||
                    tab.route === "/html-writer" ||
                    tab.route.startsWith("/html-writer/") ||
                    tab.route === "/pc-settings" ||
                    tab.route.startsWith("/pc-settings/") ||
                    tab.route === "/notepad" ||
                    tab.route.startsWith("/notepad/") ||
                    tab.route === "/file-explorer" ||
                    tab.route.startsWith("/file-explorer/")
                      ? "p-0 h-full"
                      : "px-4 sm:px-6 py-5 max-w-7xl mx-auto"
                  }`}
                >
                  <WindowTitleBarPortalContext.Provider
                    value={{
                      titleBarSlotEl,
                      isInsideWindowFrame: true,
                      isCompactWindow,
                      isWindowSidebarCollapsed: isWinSidebarCollapsed,
                      isWindowSidebarDrawerOpen: isWinSidebarDrawerOpen,
                      onToggleWindowSidebar: isCompactWindow
                        ? () => setIsWinSidebarDrawerOpen((prev) => !prev)
                        : toggleWinSidebarCollapse,
                      onCloseWindowSidebarDrawer: () => setIsWinSidebarDrawerOpen(false),
                    }}
                  >
                    {showEmbeddedSidebar ? (
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={tab.route}
                          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, x: -40 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="w-full h-full"
                        >
                          {renderBody ? renderBody() : children}
                        </motion.div>
                      </AnimatePresence>
                    ) : renderBody ? (
                      renderBody()
                    ) : (
                      children
                    )}
                  </WindowTitleBarPortalContext.Provider>
                </div>
              )}
            </div>
          </div>

          {showEmbeddedSidebar &&
            !isCompactWindow &&
            settings.sidebarPosition === "right" &&
            embeddedSidebarNode}
        </div>
        {showLaunchSplash && (
          <div
            role="status"
            aria-label={`Loading ${tab.title}`}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-5"
            style={{
              backgroundColor: settings.theme === "light" ? "#ffffff" : "#202020",
              backgroundImage: "none",
              opacity: 1,
              isolation: "isolate",
            }}
          >
            <StartMenuRouteIcon route={tab.route} className="w-16 h-16 shrink-0 drop-shadow-sm" />
            <SpinningRing size={34} ariaLabel={`Loading ${tab.title}`} />
          </div>
        )}
      </div>
    </motion.section>
  );
};

export const WindowFrame = React.memo(WindowFrameInner);
