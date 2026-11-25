import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calculator as CalculatorIcon,
  ChevronDown,
  ChevronUp,
  Delete,
  ExternalLink,
  FlaskConical,
  History,
  Info,
  Menu,
  Trash2,
} from "lucide-react";
import { Fluent3DCalculatorIcon } from "../components/Fluent3DIcons";
import { FluentSettingsIcon } from "../components/FluentIcons";
import { showAppToast } from "../utils/toast";

type CalcMode = "standard" | "scientific";
type BinaryOp = "+" | "-" | "*" | "/" | "pow" | "mod";

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  rawValue: number;
}

interface MemoryItem {
  id: string;
  value: number;
}

interface CalculatorProps {
  navigate?: (path: string, state?: unknown) => void;
}

const MAX_DIGITS = 16;

function formatNumberDisplay(num: number): string {
  if (!Number.isFinite(num)) return "Cannot divide by zero";
  if (Object.is(num, -0) || num === 0) return "0";
  const abs = Math.abs(num);
  if ((abs >= 1e15 || (abs > 0 && abs < 1e-10)) && Number.isFinite(num)) {
    return num.toExponential(8).replace(/\.?0+e/, "e");
  }
  const rounded = Number(num.toPrecision(15));
  return String(rounded);
}

function formatWithCommas(str: string): string {
  if (
    !str ||
    str === "Cannot divide by zero" ||
    str === "Invalid input" ||
    str === "Result is undefined" ||
    str === "Overflow" ||
    str.includes("e")
  ) {
    return str;
  }
  const isNeg = str.startsWith("-");
  const unsigned = isNeg ? str.slice(1) : str;
  const parts = unsigned.split(".");
  const intPart = parts[0] || "0";
  const decPart = parts[1];
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const combined = decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  return isNeg ? `-${combined}` : combined;
}

function opSymbol(op: BinaryOp): string {
  switch (op) {
    case "+":
      return "+";
    case "-":
      return "−";
    case "*":
      return "×";
    case "/":
      return "÷";
    case "pow":
      return "^";
    case "mod":
      return "Mod";
  }
}

function computeBinary(a: number, b: number, op: BinaryOp): { value?: number; error?: string } {
  let result: number;
  switch (op) {
    case "+":
      result = a + b;
      break;
    case "-":
      result = a - b;
      break;
    case "*":
      result = a * b;
      break;
    case "/":
      if (b === 0) {
        return { error: a === 0 ? "Result is undefined" : "Cannot divide by zero" };
      }
      result = a / b;
      break;
    case "pow":
      result = Math.pow(a, b);
      break;
    case "mod":
      if (b === 0) return { error: "Result is undefined" };
      result = a % b;
      break;
  }
  if (!Number.isFinite(result)) return { error: "Overflow" };
  return { value: result };
}

function factorial(n: number): { value?: number; error?: string } {
  if (n < 0 || !Number.isInteger(n)) return { error: "Invalid input" };
  if (n > 170) return { error: "Overflow" };
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return { value: res };
}

export const Calculator: React.FC<CalculatorProps> = ({ navigate }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<CalcMode>("standard");
  const [angleUnit, setAngleUnit] = useState<"DEG" | "RAD">("DEG");
  const [isSecondFn, setIsSecondFn] = useState(false);
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);

  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<BinaryOp | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastRepeatOp, setLastRepeatOp] = useState<{ op: BinaryOp; operand: number } | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [memoryStack, setMemoryStack] = useState<MemoryItem[]>([]);

  const [isModeDrawerOpen, setIsModeDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isCompactOverlay, setIsCompactOverlay] = useState(false);

  const numericValue = useMemo(() => {
    const n = Number(display);
    return Number.isFinite(n) ? n : 0;
  }, [display]);

  const hasMemory = memoryStack.length > 0;

  const clearAll = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setErrorMsg(null);
    setAccumulator(null);
    setPendingOp(null);
    setWaitingForOperand(false);
    setLastRepeatOp(null);
  }, []);

  const clearEntry = useCallback(() => {
    if (errorMsg) {
      clearAll();
      return;
    }
    setDisplay("0");
    setWaitingForOperand(false);
  }, [errorMsg, clearAll]);

  const inputDigit = useCallback(
    (digit: string) => {
      if (errorMsg) {
        setErrorMsg(null);
        setExpression("");
        setAccumulator(null);
        setPendingOp(null);
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
      }
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
      }
      const rawDigits = display.replace(/[-.]/g, "");
      if (rawDigits.length >= MAX_DIGITS) return;
      setDisplay((prev) => (prev === "0" ? digit : `${prev}${digit}`));
    },
    [errorMsg, waitingForOperand, display],
  );

  const inputDecimal = useCallback(() => {
    if (errorMsg) {
      setErrorMsg(null);
      setExpression("");
      setAccumulator(null);
      setPendingOp(null);
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay((prev) => `${prev}.`);
    }
  }, [errorMsg, waitingForOperand, display]);

  const handleBackspace = useCallback(() => {
    if (errorMsg) {
      clearAll();
      return;
    }
    if (waitingForOperand) return;
    setDisplay((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith("-"))) return "0";
      return prev.slice(0, -1);
    });
  }, [errorMsg, waitingForOperand, clearAll]);

  const toggleSign = useCallback(() => {
    if (errorMsg || display === "0") return;
    setDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
  }, [errorMsg, display]);

  const pushHistory = useCallback((exprText: string, rawVal: number) => {
    const formatted = formatWithCommas(formatNumberDisplay(rawVal));
    setHistory((prev) =>
      [
        {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          expression: exprText,
          result: formatted,
          rawValue: rawVal,
        },
        ...prev,
      ].slice(0, 50),
    );
  }, []);

  const handleOperator = useCallback(
    (nextOp: BinaryOp) => {
      if (errorMsg) return;
      const current = numericValue;

      if (accumulator !== null && pendingOp && !waitingForOperand) {
        const res = computeBinary(accumulator, current, pendingOp);
        if (res.error || res.value === undefined) {
          setErrorMsg(res.error || "Error");
          setAccumulator(null);
          setPendingOp(null);
          setWaitingForOperand(true);
          return;
        }
        const nextStr = formatNumberDisplay(res.value);
        setDisplay(nextStr);
        setAccumulator(res.value);
        setExpression(`${formatNumberDisplay(res.value)} ${opSymbol(nextOp)}`);
      } else {
        setAccumulator(current);
        setExpression(`${formatNumberDisplay(current)} ${opSymbol(nextOp)}`);
      }

      setPendingOp(nextOp);
      setWaitingForOperand(true);
      setLastRepeatOp(null);
    },
    [errorMsg, numericValue, accumulator, pendingOp, waitingForOperand],
  );

  const handleEquals = useCallback(() => {
    if (errorMsg) {
      clearAll();
      return;
    }
    const current = numericValue;

    if (accumulator !== null && pendingOp) {
      const res = computeBinary(accumulator, current, pendingOp);
      if (res.error || res.value === undefined) {
        setErrorMsg(res.error || "Error");
        setAccumulator(null);
        setPendingOp(null);
        setWaitingForOperand(true);
        return;
      }
      const exprText = `${formatNumberDisplay(accumulator)} ${opSymbol(pendingOp)} ${formatNumberDisplay(current)} =`;
      setExpression(exprText);
      setDisplay(formatNumberDisplay(res.value));
      pushHistory(exprText, res.value);
      setLastRepeatOp({ op: pendingOp, operand: current });
      setAccumulator(null);
      setPendingOp(null);
      setWaitingForOperand(true);
      return;
    }

    if (lastRepeatOp) {
      const res = computeBinary(current, lastRepeatOp.operand, lastRepeatOp.op);
      if (res.error || res.value === undefined) {
        setErrorMsg(res.error || "Error");
        setWaitingForOperand(true);
        return;
      }
      const exprText = `${formatNumberDisplay(current)} ${opSymbol(lastRepeatOp.op)} ${formatNumberDisplay(lastRepeatOp.operand)} =`;
      setExpression(exprText);
      setDisplay(formatNumberDisplay(res.value));
      pushHistory(exprText, res.value);
      setWaitingForOperand(true);
      return;
    }

    const exprText = `${formatNumberDisplay(current)} =`;
    setExpression(exprText);
    setWaitingForOperand(true);
  }, [errorMsg, clearAll, numericValue, accumulator, pendingOp, lastRepeatOp, pushHistory]);

  const applyUnary = useCallback(
    (
      fnLabel: string,
      compute: (val: number) => { value?: number; error?: string },
      recordHistory = false,
    ) => {
      if (errorMsg) return;
      const val = numericValue;
      const res = compute(val);
      if (res.error || res.value === undefined || !Number.isFinite(res.value)) {
        setErrorMsg(res.error || "Invalid input");
        setWaitingForOperand(true);
        return;
      }
      const exprLabel = `${fnLabel}(${formatNumberDisplay(val)})`;
      if (pendingOp && accumulator !== null) {
        setExpression(`${formatNumberDisplay(accumulator)} ${opSymbol(pendingOp)} ${exprLabel}`);
      } else {
        setExpression(exprLabel);
      }
      setDisplay(formatNumberDisplay(res.value));
      setWaitingForOperand(true);
      if (recordHistory) {
        pushHistory(`${exprLabel} =`, res.value);
      }
    },
    [errorMsg, numericValue, pendingOp, accumulator, pushHistory],
  );

  const handlePercent = useCallback(() => {
    if (errorMsg) return;
    if (accumulator !== null && pendingOp) {
      const pctVal =
        pendingOp === "+" || pendingOp === "-"
          ? (accumulator * numericValue) / 100
          : numericValue / 100;
      const formatted = formatNumberDisplay(pctVal);
      setDisplay(formatted);
      setExpression(`${formatNumberDisplay(accumulator)} ${opSymbol(pendingOp)} ${formatted}`);
      setWaitingForOperand(true);
    } else {
      setDisplay("0");
      setExpression("0");
      setWaitingForOperand(true);
    }
  }, [errorMsg, accumulator, pendingOp, numericValue]);

  const handleConstant = useCallback((val: number) => {
    setErrorMsg(null);
    setDisplay(formatNumberDisplay(val));
    setWaitingForOperand(true);
  }, []);

  // Memory operations
  const handleMemoryClear = () => {
    setMemoryStack([]);
    setIsMemoryDrawerOpen(false);
  };

  const handleMemoryRecall = () => {
    const top = memoryStack[0];
    if (!top) return;
    setErrorMsg(null);
    setDisplay(formatNumberDisplay(top.value));
    setWaitingForOperand(true);
  };

  const handleMemoryStore = () => {
    if (errorMsg) return;
    setMemoryStack((prev) => [{ id: `mem-${Date.now()}`, value: numericValue }, ...prev]);
    setWaitingForOperand(true);
  };

  const handleMemoryAdd = () => {
    if (errorMsg) return;
    if (!hasMemory) {
      handleMemoryStore();
      return;
    }
    setMemoryStack((prev) =>
      prev.map((item, idx) => (idx === 0 ? { ...item, value: item.value + numericValue } : item)),
    );
    setWaitingForOperand(true);
  };

  const handleMemorySubtract = () => {
    if (errorMsg) return;
    if (!hasMemory) {
      setMemoryStack([{ id: `mem-${Date.now()}`, value: -numericValue }]);
      setWaitingForOperand(true);
      return;
    }
    setMemoryStack((prev) =>
      prev.map((item, idx) => (idx === 0 ? { ...item, value: item.value - numericValue } : item)),
    );
    setWaitingForOperand(true);
  };

  // Keyboard support scoped to focused calculator container
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    if (k >= "0" && k <= "9") {
      e.preventDefault();
      inputDigit(k);
    } else if (k === ".") {
      e.preventDefault();
      inputDecimal();
    } else if (k === "+") {
      e.preventDefault();
      handleOperator("+");
    } else if (k === "-") {
      e.preventDefault();
      handleOperator("-");
    } else if (k === "*") {
      e.preventDefault();
      handleOperator("*");
    } else if (k === "/") {
      e.preventDefault();
      handleOperator("/");
    } else if (k === "%") {
      e.preventDefault();
      handlePercent();
    } else if (k === "Enter" || k === "=") {
      e.preventDefault();
      handleEquals();
    } else if (k === "Backspace") {
      e.preventDefault();
      handleBackspace();
    } else if (k === "Delete") {
      e.preventDefault();
      clearEntry();
    } else if (k === "Escape") {
      e.preventDefault();
      if (isModeDrawerOpen) setIsModeDrawerOpen(false);
      else if (isHistoryOpen) setIsHistoryOpen(false);
      else if (isMemoryDrawerOpen) setIsMemoryDrawerOpen(false);
      else clearAll();
    }
  };

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const toRad = (v: number) => (angleUnit === "DEG" ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (angleUnit === "DEG" ? (v * 180) / Math.PI : v);

  const formattedDisplay = errorMsg ? errorMsg : formatWithCommas(display);
  const displayFontSizeClass = errorMsg
    ? "text-[24px] sm:text-[26px]"
    : formattedDisplay.length > 17
      ? "text-[24px]"
      : formattedDisplay.length > 13
        ? "text-[30px]"
        : formattedDisplay.length > 10
          ? "text-[36px]"
          : isCompactOverlay
            ? "text-[38px]"
            : "text-[44px] sm:text-[46px]";

  const funcBtnClass =
    "h-full min-h-[42px] rounded-[5px] bg-[#f9f9f9] hover:bg-[#f0f0f0] active:bg-[#e5e5e5] dark:bg-[#323232] dark:hover:bg-[#3b3b3b] dark:active:bg-[#2a2a2a] border border-black/[0.06] dark:border-white/[0.06] text-[#111827] dark:text-white text-[14px] font-normal flex items-center justify-center transition-colors cursor-pointer select-none shadow-[0_1px_0_rgba(0,0,0,0.03)]";

  const digitBtnClass =
    "h-full min-h-[42px] rounded-[5px] bg-white hover:bg-[#f9f9f9] active:bg-[#efefef] dark:bg-[#3b3b3b] dark:hover:bg-[#343434] dark:active:bg-[#2d2d2d] border border-black/[0.06] dark:border-white/[0.06] text-[#111827] dark:text-white text-[17px] font-medium flex items-center justify-center transition-colors cursor-pointer select-none shadow-[0_1px_0_rgba(0,0,0,0.03)]";

  const equalsBtnClass =
    "h-full min-h-[42px] rounded-[5px] bg-[#0067c0] hover:bg-[#005fb8] active:bg-[#0053a6] dark:bg-[#4cc2ff] dark:hover:bg-[#47b1e8] dark:active:bg-[#3da0d4] text-white dark:text-[#0b1220] text-[19px] font-normal flex items-center justify-center transition-colors cursor-pointer select-none border border-transparent";

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      id="windows-calculator-app"
      style={{
        fontFamily: "'Segoe UI Variable Text', 'Segoe UI', 'Be Vietnam Pro', system-ui, sans-serif",
      }}
      className="relative w-full h-full min-h-[420px] flex flex-col bg-[#f3f3f3] dark:bg-[#202020] text-[#111827] dark:text-white select-none outline-none overflow-hidden"
    >
      {/* Top Calculator Header matching Windows 11 Calculator */}
      <header className="h-[44px] px-2.5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            id="btn-calc-mode-menu"
            onClick={() => {
              setIsModeDrawerOpen((p) => !p);
              setIsHistoryOpen(false);
              setIsMemoryDrawerOpen(false);
            }}
            aria-label="Open Navigation"
            className="w-9 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer border-none"
          >
            <Menu className="w-4 h-4 stroke-[1.75]" />
          </button>

          <h1 className="text-[18px] font-semibold tracking-tight px-1 truncate">
            {isSettingsView ? "Settings" : mode === "standard" ? "Standard" : "Scientific"}
          </h1>

          {!isSettingsView && (
            <button
              type="button"
              onClick={() => setIsCompactOverlay((p) => !p)}
              title={isCompactOverlay ? "Exit Always on Top size" : "Keep on top view"}
              aria-label={isCompactOverlay ? "Exit Always on Top size" : "Keep on top view"}
              className={`w-8 h-8 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                isCompactOverlay
                  ? "bg-black/[0.08] dark:bg-white/[0.12]"
                  : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              }`}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
              >
                <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
                <rect
                  x="7.5"
                  y="7"
                  width="5.5"
                  height="5"
                  rx="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M5 5.5h3M5 5.5v3M5 5.5l2.5 2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {!isSettingsView && (
          <button
            type="button"
            id="btn-calc-history"
            onClick={() => {
              setIsHistoryOpen((p) => !p);
              setIsModeDrawerOpen(false);
              setIsMemoryDrawerOpen(false);
            }}
            aria-label="History"
            title="History"
            className={`w-9 h-8 rounded-[5px] flex items-center justify-center transition-colors cursor-pointer border-none ${
              isHistoryOpen
                ? "bg-black/[0.08] dark:bg-white/[0.12]"
                : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            }`}
          >
            <History className="w-4 h-4 stroke-[1.75]" />
          </button>
        )}
      </header>

      {isSettingsView ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-2 space-y-4">
          <div className="max-w-[760px] mx-auto space-y-3">
            <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-3.5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Fluent3DCalculatorIcon className="w-6 h-6 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">Angle unit</div>
                  <div className="text-[11px] text-black/60 dark:text-white/60">
                    Used for trigonometric functions in Scientific mode
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(["DEG", "RAD"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setAngleUnit(unit)}
                    className={`h-7 px-3 rounded-[6px] border text-[12px] font-medium cursor-pointer transition-colors ${
                      angleUnit === unit
                        ? "bg-[#0063B8] dark:bg-[#4CC2FF] text-white dark:text-black border-transparent"
                        : "bg-white dark:bg-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.12] border-black/15 dark:border-white/15"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-3.5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium">Calculation history</div>
                <div className="text-[11px] text-black/60 dark:text-white/60 tabular-nums">
                  {history.length} saved calculation{history.length === 1 ? "" : "s"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  showAppToast("Calculator history cleared", { appName: "Calculator" });
                }}
                className="h-7 px-3 rounded-[6px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.12] text-[12px] font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="pt-1 space-y-2">
              <h3 className="text-[12.5px] font-semibold">About</h3>
              <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setAboutExpanded((v) => !v)}
                  className="w-full px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Info className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">Calculator</div>
                      <div className="text-[11px] tabular-nums text-black/60 dark:text-white/60">
                        Version: 22631.26335.0 · Build 26335
                      </div>
                    </div>
                  </div>
                  {aboutExpanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  )}
                </button>
                {aboutExpanded && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate?.("/pc-settings")}
                      className="w-full px-10 py-2.5 flex items-center justify-between text-[12.5px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                    >
                      <span>Open PC Settings</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate?.("/settings")}
                      className="w-full px-10 py-2.5 flex items-center justify-between text-[12.5px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                    >
                      <span>Open Sodium Settings</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("standard");
                        setAngleUnit("DEG");
                        setIsCompactOverlay(false);
                        showAppToast("Calculator preferences restored", { appName: "Calculator" });
                      }}
                      className="w-full px-10 py-2.5 flex items-center justify-between text-[12.5px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                    >
                      <span>Restore default Calculator preferences</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Calculator Body */
        <div className="flex-1 min-h-0 flex flex-col px-1.5 pb-1.5">
          {/* Expression + Number Display */}
          <div
            className={`px-3 ${
              isCompactOverlay ? "pt-1 pb-2" : "pt-2 pb-3"
            } flex flex-col items-end justify-end shrink-0 min-h-[82px]`}
          >
            <div className="w-full text-right text-[13px] text-[#5e5e5e] dark:text-[#a6a6a6] min-h-[20px] truncate tabular-nums">
              {expression}
            </div>
            <div
              data-testid="calculator-display"
              className={`w-full text-right font-semibold tracking-tight leading-[1.1] tabular-nums truncate ${displayFontSizeClass}`}
            >
              {formattedDisplay}
            </div>
          </div>

          {/* Scientific Mode angle unit & quick trig bar */}
          {mode === "scientific" && (
            <div className="px-1.5 pb-1 flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setAngleUnit((u) => (u === "DEG" ? "RAD" : "DEG"))}
                className="h-7 px-2.5 rounded-[4px] text-[11px] font-semibold hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none"
              >
                {angleUnit}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyUnary(isSecondFn ? "sin⁻¹" : "sin", (v) =>
                    isSecondFn
                      ? v < -1 || v > 1
                        ? { error: "Invalid input" }
                        : { value: fromRad(Math.asin(v)) }
                      : { value: Math.sin(toRad(v)) },
                  )
                }
                className="h-7 px-2 rounded-[4px] text-[11.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none"
              >
                {isSecondFn ? "sin⁻¹" : "sin"}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyUnary(isSecondFn ? "cos⁻¹" : "cos", (v) =>
                    isSecondFn
                      ? v < -1 || v > 1
                        ? { error: "Invalid input" }
                        : { value: fromRad(Math.acos(v)) }
                      : { value: Math.cos(toRad(v)) },
                  )
                }
                className="h-7 px-2 rounded-[4px] text-[11.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none"
              >
                {isSecondFn ? "cos⁻¹" : "cos"}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyUnary(isSecondFn ? "tan⁻¹" : "tan", (v) =>
                    isSecondFn ? { value: fromRad(Math.atan(v)) } : { value: Math.tan(toRad(v)) },
                  )
                }
                className="h-7 px-2 rounded-[4px] text-[11.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none"
              >
                {isSecondFn ? "tan⁻¹" : "tan"}
              </button>
            </div>
          )}

          {/* Memory Bar (MC, MR, M+, M-, MS, M▾) */}
          <div className="grid grid-cols-6 gap-0.5 h-8 mb-1 shrink-0">
            <button
              type="button"
              disabled={!hasMemory}
              onClick={handleMemoryClear}
              className={`rounded-[4px] text-[12px] font-medium flex items-center justify-center border-none transition-colors ${
                hasMemory
                  ? "hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-[#111827] dark:text-white"
                  : "text-black/30 dark:text-white/30 cursor-default"
              }`}
            >
              MC
            </button>
            <button
              type="button"
              disabled={!hasMemory}
              onClick={handleMemoryRecall}
              className={`rounded-[4px] text-[12px] font-medium flex items-center justify-center border-none transition-colors ${
                hasMemory
                  ? "hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-[#111827] dark:text-white"
                  : "text-black/30 dark:text-white/30 cursor-default"
              }`}
            >
              MR
            </button>
            <button
              type="button"
              onClick={handleMemoryAdd}
              className="rounded-[4px] text-[12px] font-medium flex items-center justify-center border-none hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-[#111827] dark:text-white transition-colors"
            >
              M+
            </button>
            <button
              type="button"
              onClick={handleMemorySubtract}
              className="rounded-[4px] text-[12px] font-medium flex items-center justify-center border-none hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-[#111827] dark:text-white transition-colors"
            >
              M−
            </button>
            <button
              type="button"
              onClick={handleMemoryStore}
              className="rounded-[4px] text-[12px] font-medium flex items-center justify-center border-none hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-[#111827] dark:text-white transition-colors"
            >
              MS
            </button>
            <button
              type="button"
              disabled={!hasMemory}
              onClick={() => {
                if (!hasMemory) return;
                setIsMemoryDrawerOpen((p) => !p);
                setIsHistoryOpen(false);
              }}
              className={`rounded-[4px] text-[12px] font-medium flex items-center justify-center gap-0.5 border-none transition-colors ${
                hasMemory
                  ? "hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-[#111827] dark:text-white"
                  : "text-black/30 dark:text-white/30 cursor-default"
              }`}
            >
              <span>M</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Keypad Grid */}
          {mode === "standard" ? (
            <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-6 gap-1">
              {/* Row 1 */}
              <button type="button" onClick={handlePercent} className={funcBtnClass}>
                %
              </button>
              <button type="button" onClick={clearEntry} className={funcBtnClass}>
                CE
              </button>
              <button type="button" onClick={clearAll} className={funcBtnClass}>
                C
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Backspace"
                className={funcBtnClass}
              >
                <Delete className="w-4 h-4 stroke-[1.6]" />
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() =>
                  applyUnary("1/", (v) =>
                    v === 0 ? { error: "Cannot divide by zero" } : { value: 1 / v },
                  )
                }
                className={funcBtnClass}
              >
                <span className="italic font-serif text-[13.5px]">¹⁄ₓ</span>
              </button>
              <button
                type="button"
                onClick={() => applyUnary("sqr", (v) => ({ value: v * v }))}
                className={funcBtnClass}
              >
                <span className="italic font-serif text-[14px]">
                  x<sup className="not-italic text-[10px] ml-0.5">2</sup>
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  applyUnary("√", (v) =>
                    v < 0 ? { error: "Invalid input" } : { value: Math.sqrt(v) },
                  )
                }
                className={funcBtnClass}
              >
                <span className="font-serif text-[14px]">
                  <sup className="text-[9.5px] mr-0.5">2</sup>√<span className="italic">x</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOperator("/")}
                aria-label="Divide"
                className={`${funcBtnClass} text-[18px]`}
              >
                ÷
              </button>

              {/* Row 3 */}
              <button type="button" onClick={() => inputDigit("7")} className={digitBtnClass}>
                7
              </button>
              <button type="button" onClick={() => inputDigit("8")} className={digitBtnClass}>
                8
              </button>
              <button type="button" onClick={() => inputDigit("9")} className={digitBtnClass}>
                9
              </button>
              <button
                type="button"
                onClick={() => handleOperator("*")}
                aria-label="Multiply"
                className={`${funcBtnClass} text-[18px]`}
              >
                ×
              </button>

              {/* Row 4 */}
              <button type="button" onClick={() => inputDigit("4")} className={digitBtnClass}>
                4
              </button>
              <button type="button" onClick={() => inputDigit("5")} className={digitBtnClass}>
                5
              </button>
              <button type="button" onClick={() => inputDigit("6")} className={digitBtnClass}>
                6
              </button>
              <button
                type="button"
                onClick={() => handleOperator("-")}
                aria-label="Subtract"
                className={`${funcBtnClass} text-[18px]`}
              >
                −
              </button>

              {/* Row 5 */}
              <button type="button" onClick={() => inputDigit("1")} className={digitBtnClass}>
                1
              </button>
              <button type="button" onClick={() => inputDigit("2")} className={digitBtnClass}>
                2
              </button>
              <button type="button" onClick={() => inputDigit("3")} className={digitBtnClass}>
                3
              </button>
              <button
                type="button"
                onClick={() => handleOperator("+")}
                aria-label="Add"
                className={`${funcBtnClass} text-[18px]`}
              >
                +
              </button>

              {/* Row 6 */}
              <button
                type="button"
                onClick={toggleSign}
                aria-label="Negate"
                className={`${digitBtnClass} text-[15px] font-normal`}
              >
                +/−
              </button>
              <button type="button" onClick={() => inputDigit("0")} className={digitBtnClass}>
                0
              </button>
              <button type="button" onClick={inputDecimal} className={digitBtnClass}>
                .
              </button>
              <button
                type="button"
                onClick={handleEquals}
                aria-label="Equals"
                className={equalsBtnClass}
              >
                =
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 grid grid-cols-5 grid-rows-7 gap-1">
              {/* Row 1 */}
              <button
                type="button"
                onClick={() => setIsSecondFn((p) => !p)}
                className={`${funcBtnClass} text-[12.5px] ${
                  isSecondFn
                    ? "!bg-[#0067c0] !text-white dark:!bg-[#4cc2ff] dark:!text-[#0b1220]"
                    : ""
                }`}
              >
                2<sup>nd</sup>
              </button>
              <button
                type="button"
                onClick={() => handleConstant(Math.PI)}
                className={funcBtnClass}
              >
                π
              </button>
              <button
                type="button"
                onClick={() => handleConstant(Math.E)}
                className={`${funcBtnClass} italic`}
              >
                e
              </button>
              <button type="button" onClick={clearAll} className={funcBtnClass}>
                C
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Backspace"
                className={funcBtnClass}
              >
                <Delete className="w-4 h-4 stroke-[1.6]" />
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() =>
                  applyUnary(isSecondFn ? "cube" : "sqr", (v) => ({
                    value: isSecondFn ? v * v * v : v * v,
                  }))
                }
                className={funcBtnClass}
              >
                {isSecondFn ? "x³" : "x²"}
              </button>
              <button
                type="button"
                onClick={() =>
                  applyUnary("1/", (v) =>
                    v === 0 ? { error: "Cannot divide by zero" } : { value: 1 / v },
                  )
                }
                className={funcBtnClass}
              >
                ¹⁄ₓ
              </button>
              <button
                type="button"
                onClick={() => applyUnary("abs", (v) => ({ value: Math.abs(v) }))}
                className={funcBtnClass}
              >
                |x|
              </button>
              <button
                type="button"
                onClick={() => applyUnary("exp", (v) => ({ value: Math.exp(v) }))}
                className={`${funcBtnClass} text-[12.5px]`}
              >
                eˣ
              </button>
              <button
                type="button"
                onClick={() => handleOperator("mod")}
                className={`${funcBtnClass} text-[12.5px]`}
              >
                mod
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() =>
                  applyUnary(isSecondFn ? "cuberoot" : "√", (v) =>
                    isSecondFn
                      ? { value: Math.cbrt(v) }
                      : v < 0
                        ? { error: "Invalid input" }
                        : { value: Math.sqrt(v) },
                  )
                }
                className={funcBtnClass}
              >
                {isSecondFn ? "³√x" : "²√x"}
              </button>
              <button
                type="button"
                onClick={clearEntry}
                className={`${funcBtnClass} text-[12.5px]`}
              >
                CE
              </button>
              <button type="button" onClick={handlePercent} className={funcBtnClass}>
                %
              </button>
              <button
                type="button"
                onClick={() => applyUnary("fact", factorial)}
                className={funcBtnClass}
              >
                n!
              </button>
              <button
                type="button"
                onClick={() => handleOperator("/")}
                className={`${funcBtnClass} text-[17px]`}
              >
                ÷
              </button>

              {/* Row 4 */}
              <button type="button" onClick={() => handleOperator("pow")} className={funcBtnClass}>
                xʸ
              </button>
              <button type="button" onClick={() => inputDigit("7")} className={digitBtnClass}>
                7
              </button>
              <button type="button" onClick={() => inputDigit("8")} className={digitBtnClass}>
                8
              </button>
              <button type="button" onClick={() => inputDigit("9")} className={digitBtnClass}>
                9
              </button>
              <button
                type="button"
                onClick={() => handleOperator("*")}
                className={`${funcBtnClass} text-[17px]`}
              >
                ×
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={() =>
                  applyUnary(isSecondFn ? "2^" : "10^", (v) => ({
                    value: isSecondFn ? Math.pow(2, v) : Math.pow(10, v),
                  }))
                }
                className={funcBtnClass}
              >
                {isSecondFn ? "2ˣ" : "10ˣ"}
              </button>
              <button type="button" onClick={() => inputDigit("4")} className={digitBtnClass}>
                4
              </button>
              <button type="button" onClick={() => inputDigit("5")} className={digitBtnClass}>
                5
              </button>
              <button type="button" onClick={() => inputDigit("6")} className={digitBtnClass}>
                6
              </button>
              <button
                type="button"
                onClick={() => handleOperator("-")}
                className={`${funcBtnClass} text-[17px]`}
              >
                −
              </button>

              {/* Row 6 */}
              <button
                type="button"
                onClick={() =>
                  applyUnary("log", (v) =>
                    v <= 0 ? { error: "Invalid input" } : { value: Math.log10(v) },
                  )
                }
                className={`${funcBtnClass} text-[13px]`}
              >
                log
              </button>
              <button type="button" onClick={() => inputDigit("1")} className={digitBtnClass}>
                1
              </button>
              <button type="button" onClick={() => inputDigit("2")} className={digitBtnClass}>
                2
              </button>
              <button type="button" onClick={() => inputDigit("3")} className={digitBtnClass}>
                3
              </button>
              <button
                type="button"
                onClick={() => handleOperator("+")}
                className={`${funcBtnClass} text-[17px]`}
              >
                +
              </button>

              {/* Row 7 */}
              <button
                type="button"
                onClick={() =>
                  applyUnary("ln", (v) =>
                    v <= 0 ? { error: "Invalid input" } : { value: Math.log(v) },
                  )
                }
                className={`${funcBtnClass} text-[13px]`}
              >
                ln
              </button>
              <button
                type="button"
                onClick={toggleSign}
                className={`${digitBtnClass} text-[14.5px] font-normal`}
              >
                +/−
              </button>
              <button type="button" onClick={() => inputDigit("0")} className={digitBtnClass}>
                0
              </button>
              <button type="button" onClick={inputDecimal} className={digitBtnClass}>
                .
              </button>
              <button type="button" onClick={handleEquals} className={equalsBtnClass}>
                =
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode Switcher Slide-Out Drawer (Standard / Scientific + Footer Settings) */}
      <AnimatePresence>
        {isModeDrawerOpen && (
          <div className="absolute inset-0 z-30 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModeDrawerOpen(false)}
              className="absolute inset-0 bg-black/25"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 380, mass: 0.7 }}
              className="relative w-[244px] h-full bg-[#f3f3f3]/95 dark:bg-[#2b2b2b]/95 backdrop-blur-xl border-r border-black/10 dark:border-white/10 p-2 flex flex-col gap-1 z-10 shadow-xl"
            >
              <div className="h-9 px-2 flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModeDrawerOpen(false)}
                  aria-label="Close Navigation"
                  className="w-8 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
              <div className="px-2.5 py-1 text-[11px] font-semibold opacity-65">Calculator</div>
              <button
                type="button"
                onClick={() => {
                  setMode("standard");
                  setIsSettingsView(false);
                  setIsModeDrawerOpen(false);
                }}
                className={`relative h-[32px] px-3 rounded-[6px] flex items-center gap-2.5 text-[13px] text-left cursor-pointer border-none ${
                  !isSettingsView && mode === "standard"
                    ? "bg-black/[0.07] dark:bg-white/[0.1] font-semibold"
                    : "hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                }`}
              >
                {!isSettingsView && mode === "standard" && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] bg-[#4cc2ff] rounded-full pointer-events-none"
                  />
                )}
                <CalculatorIcon className="w-4 h-4 shrink-0" />
                <span>Standard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("scientific");
                  setIsSettingsView(false);
                  setIsModeDrawerOpen(false);
                }}
                className={`relative h-[32px] px-3 rounded-[6px] flex items-center gap-2.5 text-[13px] text-left cursor-pointer border-none ${
                  !isSettingsView && mode === "scientific"
                    ? "bg-black/[0.07] dark:bg-white/[0.1] font-semibold"
                    : "hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                }`}
              >
                {!isSettingsView && mode === "scientific" && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] bg-[#4cc2ff] rounded-full pointer-events-none"
                  />
                )}
                <FlaskConical className="w-4 h-4 shrink-0" />
                <span>Scientific</span>
              </button>

              <div className="mt-auto pt-2 border-t border-black/10 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsView(true);
                    setIsModeDrawerOpen(false);
                  }}
                  className={`relative w-full h-[32px] px-3 rounded-[6px] flex items-center gap-2.5 text-[13px] text-left cursor-pointer border-none ${
                    isSettingsView
                      ? "bg-black/[0.07] dark:bg-white/[0.1] font-semibold"
                      : "hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {isSettingsView && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[14px] bg-[#4cc2ff] rounded-full pointer-events-none"
                    />
                  )}
                  <FluentSettingsIcon className="w-[18px] h-[18px] shrink-0 settings-spin-icon text-black dark:text-white" />
                  <span>Settings</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom History / Memory Sheet */}
      <AnimatePresence>
        {(isHistoryOpen || isMemoryDrawerOpen) && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsHistoryOpen(false);
                setIsMemoryDrawerOpen(false);
              }}
              className="absolute inset-0 bg-black/25"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 360, mass: 0.7 }}
              className="relative z-10 h-[68%] bg-[#f7f7f7] dark:bg-[#262626] rounded-t-[10px] border-t border-black/10 dark:border-white/10 p-3 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.07] dark:border-white/[0.08]">
                <span className="text-[13px] font-semibold">
                  {isMemoryDrawerOpen ? "Memory" : "History"}
                </span>
                {(isMemoryDrawerOpen ? memoryStack.length > 0 : history.length > 0) && (
                  <button
                    type="button"
                    onClick={() => (isMemoryDrawerOpen ? setMemoryStack([]) : setHistory([]))}
                    aria-label={isMemoryDrawerOpen ? "Clear memory" : "Clear history"}
                    className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/[0.07] dark:hover:bg-white/[0.08] cursor-pointer border-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pt-2 space-y-1 no-scrollbar">
                {isMemoryDrawerOpen ? (
                  memoryStack.length === 0 ? (
                    <div className="text-[12.5px] opacity-65 py-6 text-center">
                      There's nothing saved in memory.
                    </div>
                  ) : (
                    memoryStack.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setDisplay(formatNumberDisplay(item.value));
                          setWaitingForOperand(true);
                          setIsMemoryDrawerOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-[6px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-right font-semibold text-[16px] tabular-nums cursor-pointer border-none"
                      >
                        {formatWithCommas(formatNumberDisplay(item.value))}
                      </button>
                    ))
                  )
                ) : history.length === 0 ? (
                  <div className="text-[12.5px] opacity-65 py-6 text-center">
                    There's no history yet.
                  </div>
                ) : (
                  history.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setDisplay(formatNumberDisplay(entry.rawValue));
                        setWaitingForOperand(true);
                        setIsHistoryOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-[6px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-right flex flex-col items-end cursor-pointer border-none"
                    >
                      <span className="text-[11.5px] opacity-65 tabular-nums">
                        {entry.expression}
                      </span>
                      <span className="text-[17px] font-semibold tabular-nums">{entry.result}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
