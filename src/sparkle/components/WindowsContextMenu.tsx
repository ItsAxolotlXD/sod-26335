import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import {
  contextMenuMotionProps,
  contextMenuUpMotionProps,
  flyoutPanelClassName,
  flyoutPanelStyle,
} from "./FlyoutDropdown";

export interface WindowsContextMenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  checked?: boolean;
  danger?: boolean;
  divider?: boolean;
  onSelect?: () => void;
  submenu?: WindowsContextMenuItem[];
}

interface WindowsContextMenuProps {
  x: number;
  y: number;
  ariaLabel: string;
  items: WindowsContextMenuItem[];
  onClose: () => void;
}

const MENU_MARGIN = 8;
const SUBMENU_WIDTH = 204;

export const WindowsContextMenu: React.FC<WindowsContextMenuProps> = ({
  x,
  y,
  ariaLabel,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const closeSubmenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<{
    id: string;
    items: WindowsContextMenuItem[];
    anchorRect: { left: number; right: number; top: number; bottom: number };
    opensUpward: boolean;
  } | null>(null);
  const [submenuPos, setSubmenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const [opensUpward] = useState(() =>
    typeof window !== "undefined" ? y > window.innerHeight - 240 : false,
  );
  const [position, setPosition] = useState(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 800;
    const vh = typeof window !== "undefined" ? window.innerHeight : 600;
    return {
      left: Math.max(MENU_MARGIN, Math.min(x, vw - 240)),
      top: Math.max(MENU_MARGIN, Math.min(y, vh - 260)),
    };
  });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const safeWidth = width > 60 ? width : 228;
    const safeHeight = height > 40 ? height : 240;
    const vw = typeof window !== "undefined" ? window.innerWidth : 800;
    const vh = typeof window !== "undefined" ? window.innerHeight : 600;
    setPosition({
      left: Math.max(MENU_MARGIN, Math.min(x, vw - safeWidth - MENU_MARGIN)),
      top: Math.max(MENU_MARGIN, Math.min(y, vh - safeHeight - MENU_MARGIN)),
    });
    el.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [x, y, items.length]);

  useLayoutEffect(() => {
    if (!activeSubmenu) return;
    const vw = typeof window !== "undefined" ? window.innerWidth : 800;
    const vh = typeof window !== "undefined" ? window.innerHeight : 600;
    const subRect = submenuRef.current?.getBoundingClientRect();
    const subW = subRect && subRect.width > 40 ? subRect.width : SUBMENU_WIDTH;
    const subH =
      subRect && subRect.height > 30 ? subRect.height : activeSubmenu.items.length * 36 + 16;

    const fitsRight = activeSubmenu.anchorRect.right + subW + MENU_MARGIN <= vw;
    const left = fitsRight
      ? activeSubmenu.anchorRect.right - 2
      : Math.max(MENU_MARGIN, activeSubmenu.anchorRect.left - subW + 2);
    const top = Math.max(
      MENU_MARGIN,
      Math.min(activeSubmenu.anchorRect.top - 4, vh - subH - MENU_MARGIN),
    );
    setSubmenuPos({ left, top });
  }, [activeSubmenu]);

  useEffect(() => {
    return () => {
      if (closeSubmenuTimerRef.current) clearTimeout(closeSubmenuTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-windows-context-menu]")) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeSubmenu) {
          setActiveSubmenu(null);
          return;
        }
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && activeSubmenu) {
        e.preventDefault();
        setActiveSubmenu(null);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const scopeEl =
          activeSubmenu && submenuRef.current?.contains(document.activeElement)
            ? submenuRef.current
            : menuRef.current;
        const buttons: HTMLButtonElement[] = Array.from(
          scopeEl?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
        );
        if (buttons.length === 0) return;
        const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          e.key === "ArrowDown"
            ? (idx + 1) % buttons.length
            : (idx - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("pointerdown", handlePointerDown);
    }, 40);

    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", onClose);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose, activeSubmenu]);

  const cancelSubmenuClose = () => {
    if (closeSubmenuTimerRef.current) {
      clearTimeout(closeSubmenuTimerRef.current);
      closeSubmenuTimerRef.current = null;
    }
  };

  const scheduleSubmenuClose = () => {
    cancelSubmenuClose();
    closeSubmenuTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 140);
  };

  const openSubmenuForItem = (item: WindowsContextMenuItem, targetEl: HTMLElement) => {
    cancelSubmenuClose();
    if (!item.submenu || item.submenu.length === 0) {
      setActiveSubmenu(null);
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 800;
    const vh = typeof window !== "undefined" ? window.innerHeight : 600;
    const estH = item.submenu.length * 36 + 16;
    const fitsRight = rect.right + SUBMENU_WIDTH + MENU_MARGIN <= vw;
    const initialLeft = fitsRight
      ? rect.right - 2
      : Math.max(MENU_MARGIN, rect.left - SUBMENU_WIDTH + 2);
    const initialTop = Math.max(MENU_MARGIN, Math.min(rect.top - 4, vh - estH - MENU_MARGIN));
    const subOpensUpward = rect.top - 4 + estH > vh - MENU_MARGIN;
    setSubmenuPos({ left: initialLeft, top: initialTop });
    setActiveSubmenu({
      id: item.id,
      items: item.submenu,
      anchorRect: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      },
      opensUpward: subOpensUpward,
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        ref={menuRef}
        data-windows-context-menu="true"
        style={{
          position: "fixed",
          left: position.left,
          top: position.top,
          zIndex: 2147483647,
          overflow: "clip",
        }}
        className="fluent-context-menu-wrapper pointer-events-auto"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div {...(opensUpward ? contextMenuUpMotionProps : contextMenuMotionProps)}>
          <div
            role="menu"
            aria-label={ariaLabel}
            style={flyoutPanelStyle}
            className={`w-[228px] p-1.5 ${flyoutPanelClassName} fluent-context-menu shadow-none`}
          >
            <div className="w-full flex flex-col space-y-0.5">
              {items.map((item) =>
                item.divider ? (
                  <div key={item.id} className="h-px bg-black/10 dark:bg-white/10 my-1 mx-1" />
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    aria-haspopup={item.submenu ? "menu" : undefined}
                    aria-expanded={item.submenu ? activeSubmenu?.id === item.id : undefined}
                    onMouseEnter={(e) => {
                      if (item.submenu && item.submenu.length > 0) {
                        openSubmenuForItem(item, e.currentTarget);
                      } else {
                        scheduleSubmenuClose();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" && item.submenu && item.submenu.length > 0) {
                        e.preventDefault();
                        openSubmenuForItem(item, e.currentTarget);
                        setTimeout(() => {
                          submenuRef.current
                            ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
                            ?.focus();
                        }, 20);
                      }
                    }}
                    onClick={(e) => {
                      if (item.submenu && item.submenu.length > 0) {
                        openSubmenuForItem(item, e.currentTarget);
                        return;
                      }
                      onClose();
                      item.onSelect?.();
                    }}
                    className={`w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${
                      activeSubmenu?.id === item.id ? "bg-black/[0.05] dark:bg-white/[0.08]" : ""
                    } ${item.danger ? "text-[#c42b1c] dark:text-[#ff99a4]" : ""}`}
                  >
                    {item.icon && (
                      <span
                        className={`w-4 h-4 shrink-0 flex items-center justify-center ${
                          item.danger
                            ? "text-[#c42b1c] dark:text-[#ff99a4]"
                            : "text-black dark:text-neutral-300"
                        }`}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate flex-1">{item.label}</span>
                    {item.checked && (
                      <Check className="w-4 h-4 shrink-0 text-[#005fb8] dark:text-[#4cc2ff]" />
                    )}
                    {item.submenu && item.submenu.length > 0 && (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeSubmenu && (
          <div
            ref={submenuRef}
            key={`submenu-${activeSubmenu.id}`}
            data-windows-context-menu="true"
            onMouseEnter={cancelSubmenuClose}
            onMouseLeave={scheduleSubmenuClose}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: submenuPos.left,
              top: submenuPos.top,
              zIndex: 2147483647,
              overflow: "clip",
            }}
            className="fluent-context-menu-wrapper pointer-events-auto"
          >
            <motion.div
              {...(activeSubmenu.opensUpward ? contextMenuUpMotionProps : contextMenuMotionProps)}
            >
              <div
                role="menu"
                aria-label={`${ariaLabel} submenu`}
                style={flyoutPanelStyle}
                className={`min-w-[216px] w-max max-w-[260px] p-1.5 ${flyoutPanelClassName} fluent-context-menu shadow-none`}
              >
                <div className="w-full flex flex-col space-y-0.5">
                  {activeSubmenu.items.map((sub) =>
                    sub.divider ? (
                      <div key={sub.id} className="h-px bg-black/10 dark:bg-white/10 my-1 mx-1" />
                    ) : (
                      <button
                        key={sub.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onClose();
                          sub.onSelect?.();
                        }}
                        className={`w-full h-[34px] px-3 rounded-[6px] flex items-center gap-2.5 text-[12.5px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${
                          sub.danger ? "text-[#c42b1c] dark:text-[#ff99a4]" : ""
                        }`}
                      >
                        {sub.icon && (
                          <span
                            className={`w-4 h-4 shrink-0 flex items-center justify-center ${
                              sub.danger
                                ? "text-[#c42b1c] dark:text-[#ff99a4]"
                                : "text-black dark:text-neutral-300"
                            }`}
                          >
                            {sub.icon}
                          </span>
                        )}
                        <span className="truncate flex-1">{sub.label}</span>
                        {sub.checked && (
                          <Check className="w-4 h-4 shrink-0 text-[#005fb8] dark:text-[#4cc2ff]" />
                        )}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};
