/** Apps that can appear in the Start menu. Icons are attached in WindowsStartMenu. */
export interface StartAppDef {
  id: string;
  label: string;
  route?: string;
  externalUrl?: string;
  keywords: string;
  /** Only listed when developer mode is on. */
  devOnly?: boolean;
}

export const START_APPS: readonly StartAppDef[] = [
  { id: "app-home", label: "Home", route: "/", keywords: "home overview trang chu" },
  {
    id: "app-watch",
    label: "Watch",
    route: "/live-tv",
    keywords: "watch live tv channels truyen hinh",
  },
  {
    id: "app-feed",
    label: "Update blogs",
    route: "/news",
    keywords: "feed news articles update blogs tin tuc",
  },
  {
    id: "app-gallery",
    label: "Photos Gallery",
    route: "/gallery",
    keywords: "gallery photos media album anh",
  },
  { id: "app-notes", label: "Notes", route: "/notes", keywords: "notes notepad write ghi chu" },
  { id: "app-draws", label: "Ink Canvas", route: "/draws", keywords: "ink canvas draws paint ve" },
  {
    id: "app-screenbox",
    label: "Screenbox",
    route: "/screenbox",
    keywords: "screenbox vlc media player video",
  },
  { id: "app-camera", label: "Camera", route: "/camera", keywords: "camera photo webcam may anh" },
  {
    id: "app-calculator",
    label: "Calculator",
    route: "/calculator",
    keywords: "calculator calc may tinh standard scientific math toan",
  },
  {
    id: "app-weather",
    label: "Weather",
    route: "/weather",
    keywords: "weather forecast thoi tiet du bao nhiet do rain wind fluentweather",
  },
  {
    id: "app-craftmine",
    label: "Craftmine",
    route: "/craftmine",
    keywords: "craftmine minecraft game",
  },
  {
    id: "app-photopea",
    label: "Photopea",
    route: "/photopea",
    keywords: "photopea photoshop image editor",
  },
  {
    id: "app-file-explorer",
    label: "File Explorer",
    route: "/file-explorer",
    keywords:
      "file explorer files folders drives documents downloads pictures explorer tep tin thu muc",
  },
  {
    id: "app-notepad",
    label: "Notepad",
    route: "/notepad",
    keywords: "notepad text editor markdown plain text ghi chu winui 3",
  },
  {
    id: "app-html-writer",
    label: "HTML Writer",
    route: "/html-writer",
    keywords: "html writer code editor css js preview winui 3 viet chay html",
  },
  {
    id: "app-channels",
    label: "Channels",
    route: "/channels",
    keywords: "channels tv directory danh sach kenh",
  },
  { id: "app-favorites", label: "Favorites", route: "/favorites", keywords: "favorites yeu thich" },
  {
    id: "app-winui3",
    label: "WinUI 3",
    route: "/winui-3",
    keywords: "winui 3 gallery fluent design",
  },
  { id: "app-search", label: "Search", route: "/search", keywords: "search spotlight tim kiem" },
  { id: "app-feedback", label: "Feedback", route: "/feedback", keywords: "feedback gop y" },
  {
    id: "app-discord",
    label: "Discord",
    externalUrl: "https://discord.gg/wcdjaDDayK",
    keywords: "discord community",
  },
  {
    id: "app-pc-settings",
    label: "PC Settings",
    route: "/pc-settings",
    keywords: "pc settings windows 11 system bluetooth network personalization update",
  },
  {
    id: "app-settings",
    label: "Settings",
    route: "/settings",
    keywords: "settings cai dat preferences",
  },
  {
    id: "app-sodver",
    label: "About Sodium",
    route: "/sodver",
    keywords: "about sodium sodver winver version build os info",
  },
  {
    id: "app-insider",
    label: "Insider Flags",
    route: "/test",
    keywords: "insider flags lab test developer",
    devOnly: true,
  },
];
