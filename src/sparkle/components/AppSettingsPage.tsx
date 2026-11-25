import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";

export const AppSettingsToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex items-center w-[42px] h-[22px] rounded-full transition-colors cursor-pointer shrink-0 border ${
      checked
        ? "bg-[#0063B8] dark:bg-[#4CC2FF] border-transparent"
        : "bg-black/[0.06] dark:bg-white/[0.08] border-black/30 dark:border-white/35"
    }`}
  >
    <span
      className={`inline-block w-[14px] h-[14px] rounded-full transition-transform ${
        checked
          ? "translate-x-[23px] bg-white dark:bg-[#000000]"
          : "translate-x-[3px] bg-black/60 dark:bg-white/75"
      }`}
    />
  </button>
);

export type AppSettingsCardItem =
  | {
      kind: "toggle";
      id: string;
      title: string;
      description: string;
      icon?: React.ReactNode;
      checked: boolean;
      onChange: () => void;
      ariaLabel?: string;
    }
  | {
      kind: "segmented";
      id: string;
      title: string;
      description: string;
      icon?: React.ReactNode;
      value: string;
      options: Array<{ value: string; label: string }>;
      onChange: (value: string) => void;
    };

export interface AppSettingsMoreItem {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

export interface AppSettingsAboutAction {
  label: string;
  onClick: () => void;
}

interface AppSettingsPageProps {
  appName: string;
  versionLabel?: string;
  primaryCards: AppSettingsCardItem[];
  moreAccordionTitle?: string;
  moreAccordionDescription?: string;
  moreItems?: AppSettingsMoreItem[];
  extraMoreCards?: AppSettingsCardItem[];
  aboutActions?: AppSettingsAboutAction[];
  className?: string;
}

const slideItemVariant = {
  hidden: { opacity: 0, x: 24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.34,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: Math.min(i * 0.04, 0.25),
    },
  }),
};

export const AppSettingsPage: React.FC<AppSettingsPageProps> = ({
  appName,
  versionLabel = "Version: 22631.26335.0 · Build 26335",
  primaryCards,
  moreAccordionTitle = "Display & behavior options",
  moreAccordionDescription = "Manage layout visibility, metadata, and visual preferences",
  moreItems = [],
  extraMoreCards = [],
  aboutActions = [],
  className = "px-4 sm:px-6 py-5 max-w-[760px] mx-auto",
}) => {
  const { settings } = useSettings();
  const isLight = settings.theme === "light";
  const reduceMotion = settings.reduceAllMotion;
  const accentColor = isLight ? "#0063B8" : "#4CC2FF";
  const accentForeground = isLight ? "#FFFFFF" : "#000000";

  const [moreExpanded, setMoreExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const initialAnim = reduceMotion ? false : ("hidden" as const);

  const renderCard = (card: AppSettingsCardItem, index: number) => {
    if (card.kind === "toggle") {
      return (
        <motion.div
          key={card.id}
          variants={slideItemVariant}
          initial={initialAnim}
          animate="visible"
          custom={index}
          className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3.5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {card.icon && <div className="shrink-0 flex items-center">{card.icon}</div>}
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-[#111827] dark:text-white">
                {card.title}
              </div>
              <div className="text-[11.5px] text-black/60 dark:text-white/60">
                {card.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <AppSettingsToggle
              checked={card.checked}
              onChange={card.onChange}
              ariaLabel={card.ariaLabel || card.title}
            />
            <span className="text-[12.5px] w-7 text-[#111827] dark:text-white">
              {card.checked ? "On" : "Off"}
            </span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={card.id}
        variants={slideItemVariant}
        initial={initialAnim}
        animate="visible"
        custom={index}
        className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3.5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {card.icon && <div className="shrink-0 flex items-center">{card.icon}</div>}
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-[#111827] dark:text-white">
              {card.title}
            </div>
            <div className="text-[11.5px] text-black/60 dark:text-white/60">{card.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {card.options.map((opt) => {
            const active = card.value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => card.onChange(opt.value)}
                className={`h-8 px-3.5 rounded-[6px] border text-[12.5px] font-medium cursor-pointer transition-colors ${
                  active
                    ? "fluent-btn-primary border-transparent"
                    : "bg-white dark:bg-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.12] border-black/15 dark:border-white/15 text-[#111827] dark:text-white"
                }`}
                style={
                  active ? { backgroundColor: accentColor, color: accentForeground } : undefined
                }
              >
                <span style={active ? { color: accentForeground } : undefined}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  let step = 0;

  return (
    <motion.div
      variants={slideItemVariant}
      initial={initialAnim}
      animate="visible"
      custom={step++}
      className={`${className} space-y-5 text-[#111827] dark:text-white select-none`}
    >
      <h2 className="text-[18px] font-semibold tracking-tight">Settings</h2>

      <div className="space-y-2.5">
        {primaryCards.map((card) => renderCard(card, step++))}

        {(moreItems.length > 0 || extraMoreCards.length > 0) && (
          <motion.div
            variants={slideItemVariant}
            initial={initialAnim}
            animate="visible"
            custom={step++}
            className="pt-2 space-y-2"
          >
            <h3 className="text-[13px] font-semibold">More settings</h3>

            {moreItems.length > 0 && (
              <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMoreExpanded((v) => !v)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <SlidersHorizontal className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium">{moreAccordionTitle}</div>
                      <div className="text-[11.5px] text-black/60 dark:text-white/60">
                        {moreAccordionDescription}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${moreExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {moreExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-black/[0.06] dark:border-white/[0.07]"
                    >
                      <div className="px-11 py-3 space-y-3 text-[12.5px]">
                        {moreItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-4">
                            <span>{item.label}</span>
                            <AppSettingsToggle
                              checked={item.checked}
                              onChange={item.onChange}
                              ariaLabel={item.label}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {extraMoreCards.map((card) => renderCard(card, step++))}
          </motion.div>
        )}

        <motion.div
          variants={slideItemVariant}
          initial={initialAnim}
          animate="visible"
          custom={step++}
          className="pt-2 space-y-2"
        >
          <h3 className="text-[13px] font-semibold">About</h3>

          <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            <button
              type="button"
              onClick={() => setAboutExpanded((v) => !v)}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Info className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">{appName}</div>
                  <div className="text-[11.5px] tabular-nums text-black/60 dark:text-white/60">
                    {versionLabel}
                  </div>
                </div>
              </div>
              {aboutExpanded ? (
                <ChevronUp className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" />
              )}
            </button>

            {aboutExpanded &&
              aboutActions.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={row.onClick}
                  className="w-full px-11 py-3 flex items-center justify-between text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                >
                  <span>{row.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </button>
              ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
