// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
export interface WallpaperOption {
  id: string;
  label: string;
  mode: "light" | "dark";
  image: string;
  accent: string;
  taskbarBg: string;
  isDefault?: boolean;
  isSpotlight?: boolean;
}

export const DEFAULT_WALLPAPER_ID = "waves-ocean-light";
export const SPOTLIGHT_COLLECTION_THEME_ID = "spotlight-collection";

export const WINDOWS_WALLPAPERS: WallpaperOption[] = [
  {
    id: "waves-ocean-light",
    label: "Waves Ocean Light",
    mode: "light",
    image: "/__l5e/assets-v1/bbd9ec6a-0b4a-415c-af66-792236edc854/light_60c42542.jpg",
    accent: "#0067b8",
    taskbarBg: "bg-white/85",
    isDefault: true,
  },
  {
    id: "waves-ocean-dark",
    label: "Waves Ocean Dark",
    mode: "dark",
    image: "/__l5e/assets-v1/d2204ba4-944f-4310-b125-3c5f22fc6b39/dark_0d3ad39a.jpg",
    accent: "#4cc2ff",
    taskbarBg: "bg-[#1c2026]/90",
  },
  {
    id: "waves-lavender-light",
    label: "Waves Lavender Light",
    mode: "light",
    image: "/__l5e/assets-v1/28b53a7a-dcff-43db-9fb2-b3bca011428e/01-Purple_LM-4K_e12d77d6.png",
    accent: "#0067b8",
    taskbarBg: "bg-white/85",
  },
  {
    id: "waves-lavender-dark",
    label: "Waves Lavender Dark",
    mode: "dark",
    image: "/__l5e/assets-v1/037fdb16-3915-4761-ad12-621dca6bc0b3/01-Purple_DM-4K_b8cfa939.png",
    accent: "#4cc2ff",
    taskbarBg: "bg-[#1c2026]/90",
  },
  {
    id: "waves-emerald-light",
    label: "Waves Emerald Light",
    mode: "light",
    image: "/__l5e/assets-v1/b03d215a-2bc0-4abc-bef1-91974d60ab81/02-Green_Blue_LM-4K_18e2263a.png",
    accent: "#0067b8",
    taskbarBg: "bg-white/85",
  },
  {
    id: "waves-emerald-dark",
    label: "Waves Emerald Dark",
    mode: "dark",
    image: "/__l5e/assets-v1/5d637b7b-1608-4a0d-8dc4-3166e9817ce8/02-Green_Blue_DM-4K_ee0b7443.png",
    accent: "#4cc2ff",
    taskbarBg: "bg-[#1c2026]/90",
  },
  {
    id: "waves-fire-light",
    label: "Waves Fire Light",
    mode: "light",
    image:
      "/__l5e/assets-v1/a70ceb46-f1c9-45cb-be61-61b722806f6a/04-Pink_Orange_LM-4K_2ba4977f.png",
    accent: "#0067b8",
    taskbarBg: "bg-white/85",
  },
  {
    id: "waves-fire-dark",
    label: "Waves Fire Dark",
    mode: "dark",
    image:
      "/__l5e/assets-v1/b5fbf3fe-d362-422d-a93e-b93a3f54bfdc/04-Pink_Orange_DM-4K_4829cf04.png",
    accent: "#4cc2ff",
    taskbarBg: "bg-[#1c2026]/90",
  },
  {
    id: SPOTLIGHT_COLLECTION_THEME_ID,
    label: "Spotlight Collection",
    mode: "dark",
    image:
      "https://windows10spotlight.com/wp-content/uploads/2026/11/cd1c7235eb2abeed54f1175115966672.jpg",
    accent: "#4cc2ff",
    taskbarBg: "bg-[#1c2026]/90",
    isSpotlight: true,
  },
];

export const getWallpaperById = (id?: string | null): WallpaperOption => {
  return WINDOWS_WALLPAPERS.find((w) => w.id === id) || WINDOWS_WALLPAPERS[0];
};

export const getWallpaperForMode = (
  currentWallpaperId: string | undefined | null,
  mode: "light" | "dark",
): string => {
  if (currentWallpaperId === SPOTLIGHT_COLLECTION_THEME_ID) {
    return SPOTLIGHT_COLLECTION_THEME_ID;
  }
  const current = getWallpaperById(currentWallpaperId);
  const baseFamily = current.id.replace(/-(light|dark)$/, "");
  const candidateId = `${baseFamily}-${mode}`;
  if (WINDOWS_WALLPAPERS.some((w) => w.id === candidateId)) {
    return candidateId;
  }
  return mode === "dark" ? "waves-ocean-dark" : "waves-ocean-light";
};
