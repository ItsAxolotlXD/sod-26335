import React, { useEffect, useRef, useState } from "react";
import { SpinningRing } from "./SpinningRing";

const BOOT_LOGO_SRC = "/assets/aistudio/image_3602759f.png";

interface WindowsBootScreenProps {
  bootDurationMs?: number;
  blankDurationMs?: number;
  ringSize?: number;
  showWatermark?: boolean;
  onFinish?: () => void;
}

export const WindowsBootScreen: React.FC<WindowsBootScreenProps> = ({
  bootDurationMs = 5000,
  blankDurationMs = 3000,
  ringSize = 28,
  showWatermark = true,
  onFinish,
}) => {
  const [phase, setPhase] = useState<"boot" | "blank" | "done">("boot");
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    setPhase("boot");
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const blankTimer = setTimeout(() => {
      setPhase("blank");
      finishTimer = setTimeout(() => {
        setPhase("done");
        onFinishRef.current?.();
      }, blankDurationMs);
    }, bootDurationMs);

    return () => {
      clearTimeout(blankTimer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [bootDurationMs, blankDurationMs]);

  if (phase === "done") return null;

  if (phase === "blank") {
    return (
      <div
        id="windows-boot-screen"
        className="fixed inset-0 z-[100000] bg-black select-none cursor-none"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      id="windows-boot-screen"
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center select-none cursor-none bg-black text-white"
    >
      <div className="flex flex-col items-center justify-center gap-12 sm:gap-16 text-center px-6 max-w-md w-full">
        <div className="flex items-center justify-center">
          <img
            src={BOOT_LOGO_SRC}
            alt="Sodium"
            draggable={false}
            className="h-16 sm:h-20 md:h-24 w-auto max-w-[180px] sm:max-w-[220px] object-contain drop-shadow-md select-none pointer-events-none"
          />
        </div>

        <div className="boot-screen-ring flex flex-col items-center justify-center gap-3 text-center px-4">
          <SpinningRing size={ringSize} strokeWidth={4} ariaLabel="Starting Sodium" />
        </div>
      </div>

      {showWatermark && (
        <div
          id="boot-watermark"
          className="absolute bottom-4 right-5 sm:bottom-6 sm:right-7 z-10 text-right select-none pointer-events-none text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.85)] text-[11px] sm:text-[12px] leading-[1.35] font-normal"
          style={{
            fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif",
            color: "#ffffff",
          }}
        >
          <div style={{ color: "#ffffff" }}>Sodium 27M1 Insider Preview</div>
          <div style={{ color: "#ffffff" }}>Evaluation copy. Build 26335.Milestone 1 (2027)</div>
        </div>
      )}
    </div>
  );
};
