import React from "react";
import { LayoutGrid, Tv } from "lucide-react";
import { AppSettingsPage } from "./AppSettingsPage";
import { useSettings } from "../hooks/useSettings";
import {
  resetAppPreferenceSection,
  updateAppPreferenceSection,
  useAppPreferences,
} from "../services/appPreferences";
import { showAppToast } from "../utils/toast";

interface WatchSettingsViewProps {
  navigate?: (route: string) => void;
}

export const WatchSettingsView: React.FC<WatchSettingsViewProps> = ({ navigate }) => {
  const { settings, updateSetting } = useSettings();
  const prefs = useAppPreferences().watch;

  return (
    <AppSettingsPage
      appName="Watch"
      versionLabel="Version: 22631.26335.0 · Live TV & Channels"
      className="py-1 max-w-[760px] mx-auto"
      primaryCards={[
        {
          kind: "segmented",
          id: "watch-aspect-ratio",
          icon: <Tv className="w-5 h-5 text-[#0063B8] dark:text-[#4CC2FF]" />,
          title: "Stream aspect ratio",
          description: "Choose the default player aspect ratio for broadcast streams",
          value: settings.streamAspectRatio,
          options: [
            { value: "16:9", label: "16:9 Widescreen" },
            { value: "4:3", label: "4:3 Classic" },
          ],
          onChange: (val) => updateSetting("streamAspectRatio", val as "16:9" | "4:3"),
        },
        {
          kind: "toggle",
          id: "watch-category-tabs",
          title: "Category filter bar",
          description: "Show channel category tabs and quick filter controls below the player",
          checked: prefs.showCategoryTabs,
          onChange: () =>
            updateAppPreferenceSection("watch", (p) => ({
              ...p,
              showCategoryTabs: !p.showCategoryTabs,
            })),
        },
      ]}
      moreAccordionTitle="Playback & guide options"
      moreAccordionDescription="Manage EPG TV schedule access, channel badges, and Watch layout"
      moreItems={[
        {
          id: "watch-epg-button",
          label: "Show EPG schedule button",
          checked: prefs.showEpgSchedule,
          onChange: () =>
            updateAppPreferenceSection("watch", (p) => ({
              ...p,
              showEpgSchedule: !p.showEpgSchedule,
            })),
        },
        {
          id: "watch-channel-badges",
          label: "Show channel numbers & live badges",
          checked: prefs.showChannelBadges,
          onChange: () =>
            updateAppPreferenceSection("watch", (p) => ({
              ...p,
              showChannelBadges: !p.showChannelBadges,
            })),
        },
        {
          id: "watch-modern-layout",
          label: "Use updated Watch tab layout",
          checked: settings.newWatchTab,
          onChange: () => updateSetting("newWatchTab", !settings.newWatchTab),
        },
      ]}
      extraMoreCards={[
        {
          kind: "toggle",
          id: "watch-compact-grid",
          icon: <LayoutGrid className="w-4 h-4" />,
          title: "Use compact channel grid",
          description: "Show more channels per row in Watch and Channels",
          checked: prefs.compactGrid,
          onChange: () =>
            updateAppPreferenceSection("watch", (p) => ({
              ...p,
              compactGrid: !p.compactGrid,
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
          label: "Restore default Watch preferences",
          onClick: () => {
            resetAppPreferenceSection("watch");
            updateSetting("streamAspectRatio", "16:9");
            showAppToast("Watch settings restored to defaults", { appName: "Watch" });
          },
        },
      ]}
    />
  );
};
