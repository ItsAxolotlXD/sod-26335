// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, { useEffect, useRef } from "react";
import { Sparkles, Shield, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { slideUpVariant } from "../utils/animations";
import { AppSettingsPage } from "../components/AppSettingsPage";
import {
  resetAppPreferenceSection,
  updateAppPreferenceSection,
  useAppPreferences,
} from "../services/appPreferences";
import { showAppToast } from "../utils/toast";

export const About: React.FC<{
  navigate?: (route: string) => void;
  routeState?: { appSection?: string; sectionNonce?: number };
}> = ({ navigate, routeState }) => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const aboutPrefs = useAppPreferences().about;
  let animIdx = 0;

  useEffect(() => {
    const section = routeState?.appSection;
    if (!section) return;
    const root = pageRef.current;
    if (!root) return;
    if (section === "top") {
      const scroller = root.closest(".window-content-area");
      if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    requestAnimationFrame(() => {
      root.querySelector(`#${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [routeState?.appSection, routeState?.sectionNonce]);

  if (routeState?.appSection === "settings") {
    return (
      <AppSettingsPage
        appName="Sodium"
        versionLabel="Version: 22631.26335.0 · About & Information"
        className="py-1 max-w-[760px] mx-auto"
        primaryCards={[
          {
            kind: "toggle",
            id: "about-compact-header",
            title: "Compact introduction header",
            description:
              "Use tighter vertical spacing and smaller display headline on the About page",
            checked: aboutPrefs.compactHeader,
            onChange: () =>
              updateAppPreferenceSection("about", (p) => ({
                ...p,
                compactHeader: !p.compactHeader,
              })),
          },
          {
            kind: "toggle",
            id: "about-show-disclaimer",
            title: "Copyright & source disclaimer card",
            description: "Show broadcast attribution and academic archive disclaimer information",
            checked: aboutPrefs.showDisclaimer,
            onChange: () =>
              updateAppPreferenceSection("about", (p) => ({
                ...p,
                showDisclaimer: !p.showDisclaimer,
              })),
          },
        ]}
        moreAccordionTitle="Community & info blocks"
        moreAccordionDescription="Manage community links and About page sections"
        moreItems={[
          {
            id: "about-show-community",
            label: "Show Join the Waves Community card",
            checked: aboutPrefs.showCommunity,
            onChange: () =>
              updateAppPreferenceSection("about", (p) => ({
                ...p,
                showCommunity: !p.showCommunity,
              })),
          },
        ]}
        aboutActions={[
          {
            label: "Open Sodium Settings",
            onClick: () => navigate?.("/settings"),
          },
          {
            label: "Give feedback",
            onClick: () => navigate?.("/feedback"),
          },
          {
            label: "Restore default About preferences",
            onClick: () => {
              resetAppPreferenceSection("about");
              showAppToast("About settings restored to defaults", { appName: "About" });
            },
          },
        ]}
      />
    );
  }

  return (
    <div
      ref={pageRef}
      className={`max-w-4xl mx-auto pb-20 ${aboutPrefs.compactHeader ? "space-y-6" : "space-y-10"}`}
    >
      {/* Hero Intro */}
      <motion.div
        variants={slideUpVariant}
        initial="hidden"
        animate="visible"
        custom={animIdx++}
        className={`text-center space-y-4 ${aboutPrefs.compactHeader ? "pt-1" : "pt-4"}`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6005A]/15 border border-[#E6005A]/30 text-[#E6005A] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About Sodium</span>
        </div>

        <h1
          className={`font-bold text-[#111827] dark:text-white tracking-tight ${
            aboutPrefs.compactHeader ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl md:text-5xl"
          }`}
        >
          Sodium -{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2020] via-[#FF3366] to-[#E6005A]">
            Bringing Vietnam to Your Screen
          </span>
        </h1>

        <div className="text-sm sm:text-base text-[#4B5563] dark:text-[#9CA3AF] max-w-3xl mx-auto leading-relaxed text-left space-y-3 pt-2">
          <p className="flex items-start gap-2">
            <span className="text-[#E6005A] font-bold select-none">•</span>
            <span>
              Sodium is a non-profit online television platform providing users with high-quality
              streaming experiences across diverse broadcast channels, completely free of charge.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#E6005A] font-bold select-none">•</span>
            <span>
              In addition, Sodium provides comprehensive updates on broadcasting technology,
              television branding & motion graphics, and media culture in Vietnam.
            </span>
          </p>
        </div>
      </motion.div>

      {/* Disclaimer and Ethics Card */}
      {aboutPrefs.showDisclaimer && (
        <motion.div
          id="about-disclaimer-card"
          variants={slideUpVariant}
          initial="hidden"
          animate="visible"
          custom={animIdx++}
          className="p-8 rounded-[30px] bg-white dark:bg-[#38383d] border border-[#E5E7EB] dark:border-[#34343E] shadow-sm dark:shadow-xl space-y-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#E6005A] shrink-0" />
            <h3
              id="about-disclaimer-title"
              className="text-lg font-bold text-[#111827] dark:text-white"
            >
              Copyright & Broadcast Source Disclaimer
            </h3>
          </div>
          <p
            id="about-disclaimer-text"
            className="text-xs sm:text-sm text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed"
          >
            All television logos, trademarks, studio images, and broadcast feeds are the
            intellectual property of their respective broadcasters (Vietnam Television VTV, Ho Chi
            Minh City Television HTV, VTC Digital Television, and local radio-television stations).
            Sodium serves non-commercial, academic research, and technical archive purposes only.
          </p>
        </motion.div>
      )}

      {/* Community Connect */}
      {aboutPrefs.showCommunity && (
        <motion.div
          id="about-community-card"
          variants={slideUpVariant}
          initial="hidden"
          animate="visible"
          custom={animIdx++}
          className="text-center p-8 rounded-[30px] bg-white dark:bg-[#38383d] border border-[#E5E7EB] dark:border-[#2D2D35] shadow-sm dark:shadow-none space-y-4 transition-all"
        >
          <h3 className="text-xl font-bold text-[#111827] dark:text-white">
            Join the Waves Community
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#9CA3AF] max-w-lg mx-auto">
            Exchange insights on virtual studio production, DVB-T2 digital transmission, On-Air
            Graphics design, and rare television broadcasting archives.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="https://discord.gg/wcdjaDDayK"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-lg transition-all"
            >
              <span>Join Community Discord</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] dark:bg-[#27121d] dark:hover:bg-[#331726] text-[#111827] dark:text-white text-xs font-bold border border-[#E5E7EB] dark:border-white/10 transition-all"
            >
              <span>Television Facebook Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};
