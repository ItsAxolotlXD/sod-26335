import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { getAccountLabel, useAuthSession } from "../services/authSession";
import { showAppToast } from "../utils/toast";

interface SodverProps {
  navigate?: (path: string, state?: unknown) => void;
  onClose?: () => void;
}

const SODIUM_VERSION_TEXT = "Sodium 27 (Milestone 1) — Version 27M1 (OS Build 26335.Milestone 1)";

export const Sodver: React.FC<SodverProps> = ({ navigate, onClose }) => {
  const session = useAuthSession();
  const accountLabel = getAccountLabel(session);
  const [copied, setCopied] = useState(false);
  const [pcProfile, setPcProfile] = useState<{
    userName: string;
    userEmail: string;
  }>(() => {
    try {
      const raw = localStorage.getItem("sparkle_pc_settings_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { userName?: string; userEmail?: string };
        return {
          userName: typeof parsed.userName === "string" ? parsed.userName : "",
          userEmail: typeof parsed.userEmail === "string" ? parsed.userEmail : "",
        };
      }
    } catch {
      // ignore storage errors
    }
    return { userName: "", userEmail: "" };
  });

  useEffect(() => {
    const syncProfile = () => {
      try {
        const raw = localStorage.getItem("sparkle_pc_settings_v1");
        if (raw) {
          const parsed = JSON.parse(raw) as { userName?: string; userEmail?: string };
          setPcProfile({
            userName: typeof parsed.userName === "string" ? parsed.userName : "",
            userEmail: typeof parsed.userEmail === "string" ? parsed.userEmail : "",
          });
        }
      } catch {
        // ignore storage errors
      }
    };
    window.addEventListener("sparkle:pc-settings-updated", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("sparkle:pc-settings-updated", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (navigate) {
      navigate("/");
    }
  }, [onClose, navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const handleCopyVersion = async () => {
    try {
      await navigator.clipboard.writeText(SODIUM_VERSION_TEXT);
      setCopied(true);
      showAppToast("Copied Sodium version info", { appName: "About Sodium" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showAppToast("Sodium 27 · Version 27M1 (Build 26335.Milestone 1)", {
        appName: "About Sodium",
      });
    }
  };

  const licensedUser = accountLabel || pcProfile.userName?.trim() || "Sodium User";
  const licensedOrg =
    session?.user?.email || pcProfile.userEmail?.trim() || "Sodium Insider Preview";

  return (
    <div
      id="sodver-dialog"
      className="flex flex-col h-full w-full select-none text-[#1a1a1a] dark:text-[#f5f5f5]"
      style={{
        fontFamily: '"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* WinUI 3 Brand Header Banner */}
      <div className="shrink-0 px-7 pt-6 pb-5 flex items-center justify-center border-b border-black/[0.08] dark:border-white/[0.09] bg-white/35 dark:bg-white/[0.02]">
        <img
          src="/assets/aistudio/image_7c79c743.png"
          alt="Sodium 27"
          draggable={false}
          className="w-full max-w-[295px] h-auto max-h-[68px] object-contain pointer-events-none select-none"
        />
      </div>

      {/* WinUI 3 Version & Licensing Details */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3.5 text-[13px] leading-[1.52] sidebar-scroller">
        <div className="space-y-0.5 select-text">
          <div className="text-[14px] font-semibold text-[#111827] dark:text-white">
            Sodium 27 (Milestone 1)
          </div>
          <div className="text-[13px] text-black/80 dark:text-white/85">
            Version 27M1 (OS Build 26335.Milestone 1)
          </div>
          <div className="text-[12px] text-black/60 dark:text-white/60 pt-0.5">
            © 2026–2027 Sodium Project. All rights reserved.
          </div>
        </div>

        <p className="text-[12.5px] leading-[1.55] text-black/75 dark:text-white/75">
          The Sodium 27 operating system and its WinUI 3 user interface provide live television
          streaming, productivity tools, and web desktop multitasking across the Sparkle shell.
        </p>

        {/* WinUI 3 Content Card (Licensee Info) */}
        <div className="rounded-[8px] border border-black/[0.07] dark:border-white/[0.08] bg-white/55 dark:bg-white/[0.04] px-3.5 py-3 space-y-2">
          <p className="text-[12px] text-black/70 dark:text-white/70">
            This product is licensed under the Sodium Project Terms to:
          </p>
          <div className="pl-3 border-l-2 border-[#005fb8] dark:border-[#4cc2ff] space-y-0.5 select-text">
            <div className="text-[13px] font-semibold text-[#111827] dark:text-white truncate">
              {licensedUser}
            </div>
            <div className="text-[12px] text-black/65 dark:text-white/65 truncate">
              {licensedOrg}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-1 text-[11.5px] text-black/55 dark:text-white/55">
          <span>Edition: Sodium 27 Insider Preview</span>
          <span className="font-mono">WinUI 3 · 26335</span>
        </div>
      </div>

      {/* WinUI 3 Footer Action Bar */}
      <div className="shrink-0 px-6 py-3.5 border-t border-black/[0.07] dark:border-white/[0.08] bg-black/[0.025] dark:bg-black/20 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCopyVersion}
          className="h-8 px-3 rounded-[5px] inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1a1a1a] dark:text-[#f5f5f5] bg-white/75 dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.11] active:bg-black/[0.07] dark:active:bg-white/[0.04] border border-black/[0.09] dark:border-white/[0.1] transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#0f7b0f] dark:text-[#6ccb5f]" />
          ) : (
            <Copy className="w-3.5 h-3.5 opacity-75" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>

        <button
          type="button"
          autoFocus
          onClick={handleClose}
          className="fluent-btn-primary h-8 min-w-[92px] px-5 rounded-[5px] text-[13px] font-medium bg-[#005fb8] hover:bg-[#196ec0] active:bg-[#004c96] text-white dark:bg-[#4cc2ff] dark:hover:bg-[#6bd0ff] dark:active:bg-[#3aa8e0] dark:text-[#0a0a0a] border border-black/[0.08] dark:border-white/[0.12] transition-colors cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
};
