import React from "react";
import { FlaskConical, Heart, Tv } from "lucide-react";
import {
  Fluent3DCalculatorIcon,
  Fluent3DCraftmineIcon,
  Fluent3DDiscordIcon,
  Fluent3DFileExplorerIcon,
  Fluent3DFolderSearchIcon,
  Fluent3DHtmlWriterIcon,
  Fluent3DNotepadIcon,
  Fluent3DSettingsIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DWeatherIcon,
} from "./Fluent3DIcons";
import { FluentHomeIcon } from "./FluentIcons";

export type StartAppIconRenderer = (sizeClass?: string) => React.ReactNode;

const appImageIcon =
  (src: string, alt: string): StartAppIconRenderer =>
  (cls = "w-8 h-8") => <img src={src} alt={alt} className={`${cls} object-contain`} />;

export const START_APP_ICONS: Record<string, StartAppIconRenderer> = {
  "app-home": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ZkW8gYbSOXj2vgvZb3KwsPVHC3z8uy.png",
    "Discover",
  ),
  "app-watch": (cls = "w-8 h-8") => <Fluent3DWatchPreviewIcon className={cls} />,
  "app-feed": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-uZtj2tHC6HSOCvdUp8IAmfMmA9456S.png",
    "Update blogs",
  ),
  "app-gallery": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-TnqrgXOfnDg1aPlJr3i2qlHcw75dZC.png",
    "Gallery",
  ),
  "app-notes": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AthSjl2Q87IEHjfIyfr3mwB41ko0Pd.png",
    "Notes",
  ),
  "app-draws": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hURcXa7yZPxSQsqoDzdGzSohclQ4mk.png",
    "Ink Canvas",
  ),
  "app-screenbox": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yFsTpTPG1lZgiY9JMZ2gFT7H1Yms4O.png",
    "Screenbox",
  ),
  "app-camera": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-63RIjirtx6IOfDgFlIWmuL2UmB8Gj6.png",
    "Camera",
  ),
  "app-calculator": (cls = "w-8 h-8") => <Fluent3DCalculatorIcon className={cls} />,
  "app-weather": (cls = "w-8 h-8") => <Fluent3DWeatherIcon className={cls} />,
  "app-craftmine": (cls = "w-8 h-8") => <Fluent3DCraftmineIcon className={cls} />,
  "app-photopea": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-liT43Z2X1KHycJisfOT0yIzYRTUIZy.png",
    "Photopea",
  ),
  "app-file-explorer": (cls = "w-8 h-8") => <Fluent3DFileExplorerIcon className={cls} />,
  "app-notepad": (cls = "w-8 h-8") => <Fluent3DNotepadIcon className={cls} />,
  "app-html-writer": (cls = "w-8 h-8") => <Fluent3DHtmlWriterIcon className={cls} />,
  "app-channels": (cls = "w-7 h-7") => (
    <div
      className={`${cls} rounded-[24%] bg-[#0078d4]/15 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#0078d4] dark:text-[#4cc2ff]`}
    >
      <Tv className="w-[64%] h-[64%]" />
    </div>
  ),
  "app-favorites": (cls = "w-7 h-7") => (
    <div
      className={`${cls} rounded-[24%] bg-rose-500/15 flex items-center justify-center text-rose-500`}
    >
      <Heart className="w-[64%] h-[64%]" />
    </div>
  ),
  "app-winui3": (cls = "w-7 h-7") => (
    <img
      src="https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/WinUI.svg/120px-WinUI.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail&_=20241127184612"
      alt="WinUI 3"
      className={`${cls} object-contain`}
    />
  ),
  "app-search": (cls = "w-8 h-8") => <Fluent3DFolderSearchIcon className={cls} />,
  "app-feedback": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icons8-communication-96-5wEu3hOVRFfgq39AsZHYx0R9ZznwDJ.png",
    "Feedback",
  ),
  "app-discord": (cls = "w-8 h-8") => <Fluent3DDiscordIcon className={cls} />,
  "app-pc-settings": appImageIcon(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-zfDz9NVOBwmlGlx2KF0FO7QCd8MhM8.png",
    "Settings",
  ),
  "app-settings": (cls = "w-8 h-8") => <Fluent3DSettingsIcon className={cls} />,
  "app-insider": (cls = "w-7 h-7") => (
    <div
      className={`${cls} rounded-[24%] bg-violet-500/15 flex items-center justify-center text-violet-500`}
    >
      <FlaskConical className="w-[64%] h-[64%]" />
    </div>
  ),
};

export function getStartAppIdForRoute(route: string): string {
  const cleanRoute = (route || "/").split(/[?#]/)[0]?.toLowerCase() || "/";

  if (cleanRoute === "/" || cleanRoute === "/home" || cleanRoute === "/home-preview") {
    return "app-home";
  }
  if (cleanRoute.startsWith("/live-tv") || cleanRoute.startsWith("/watch")) {
    return "app-watch";
  }
  if (
    cleanRoute.startsWith("/news") ||
    cleanRoute.startsWith("/article") ||
    cleanRoute.startsWith("/updates")
  ) {
    return "app-feed";
  }
  if (cleanRoute.startsWith("/gallery")) {
    return "app-gallery";
  }
  if (
    cleanRoute.startsWith("/notes") ||
    cleanRoute.startsWith("/write") ||
    cleanRoute.startsWith("/present") ||
    cleanRoute.startsWith("/table")
  ) {
    return "app-notes";
  }
  if (cleanRoute.startsWith("/draws")) {
    return "app-draws";
  }
  if (
    cleanRoute.startsWith("/vlc") ||
    cleanRoute.startsWith("/screenbox") ||
    cleanRoute.startsWith("/screenbug")
  ) {
    return "app-screenbox";
  }
  if (cleanRoute.startsWith("/camera")) {
    return "app-camera";
  }
  if (cleanRoute.startsWith("/calculator")) {
    return "app-calculator";
  }
  if (cleanRoute.startsWith("/weather")) {
    return "app-weather";
  }
  if (cleanRoute.startsWith("/craftmine")) {
    return "app-craftmine";
  }
  if (cleanRoute.startsWith("/photopea")) {
    return "app-photopea";
  }
  if (cleanRoute.startsWith("/file-explorer")) {
    return "app-file-explorer";
  }
  if (cleanRoute.startsWith("/notepad")) {
    return "app-notepad";
  }
  if (cleanRoute.startsWith("/html-writer")) {
    return "app-html-writer";
  }
  if (cleanRoute.startsWith("/channels")) {
    return "app-channels";
  }
  if (cleanRoute.startsWith("/favorites")) {
    return "app-favorites";
  }
  if (cleanRoute.startsWith("/winui-3") || cleanRoute.startsWith("/winui")) {
    return "app-winui3";
  }
  if (cleanRoute.startsWith("/search")) {
    return "app-search";
  }
  if (cleanRoute.startsWith("/feedback")) {
    return "app-feedback";
  }
  if (cleanRoute.startsWith("/pc-settings")) {
    return "app-pc-settings";
  }
  if (cleanRoute.startsWith("/settings")) {
    return "app-settings";
  }
  if (cleanRoute.startsWith("/test")) {
    return "app-insider";
  }
  return "app-home";
}

export const StartMenuRouteIcon: React.FC<{
  route: string;
  className?: string;
}> = ({ route, className = "w-6 h-6 shrink-0" }) => {
  const appId = getStartAppIdForRoute(route);
  const renderer = START_APP_ICONS[appId];

  // Ensure wrapper-based 3D icons (Craftmine, Settings) scale proportionally with className
  const scaledClass =
    appId === "app-craftmine" || appId === "app-settings"
      ? `${className} [&_img]:!w-[88%] [&_img]:!h-[88%] [&_svg]:!w-[88%] [&_svg]:!h-[88%]`
      : className;

  if (renderer) {
    return <>{renderer(scaledClass)}</>;
  }
  return <FluentHomeIcon className={className} />;
};
