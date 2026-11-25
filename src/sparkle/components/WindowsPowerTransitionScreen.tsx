import React, { useEffect, useRef, useState } from "react";
import { SpinningRing } from "./SpinningRing";

interface WindowsPowerTransitionScreenProps {
  mode: "restarting" | "ending";
  statusDurationMs?: number;
  blankDurationMs?: number;
  ringSize?: number;
  onFinish?: () => void;
}

export const WindowsPowerTransitionScreen: React.FC<WindowsPowerTransitionScreenProps> = ({
  mode,
  statusDurationMs = 5000,
  blankDurationMs = 3000,
  ringSize = 48,
  onFinish,
}) => {
  const [phase, setPhase] = useState<"status" | "blank" | "done">("status");
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    setPhase("status");
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const blankTimer = setTimeout(() => {
      setPhase("blank");
      finishTimer = setTimeout(() => {
        setPhase("done");
        onFinishRef.current?.();
      }, blankDurationMs);
    }, statusDurationMs);

    return () => {
      clearTimeout(blankTimer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [mode, statusDurationMs, blankDurationMs]);

  if (phase === "done") return null;

  if (phase === "blank") {
    return (
      <div
        id="windows-power-transition-screen"
        className="fixed inset-0 z-[100001] bg-black select-none cursor-none"
        aria-hidden="true"
      />
    );
  }

  const label = mode === "restarting" ? "Restarting" : "Ending session";

  return (
    <div
      id="windows-power-transition-screen"
      role="status"
      aria-live="polite"
      aria-label={label}
      className="fixed inset-0 z-[100001] flex flex-col items-center justify-center select-none cursor-none bg-black text-white"
      style={{
        fontFamily:
          "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', 'Be Vietnam Pro', system-ui, sans-serif",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="power-transition-ring flex items-center justify-center">
          <SpinningRing size={ringSize} strokeWidth={4} ariaLabel={label} />
        </div>
        <div className="text-[20px] sm:text-[22px] font-normal tracking-wide text-white">
          {label}
        </div>
      </div>
    </div>
  );
};
