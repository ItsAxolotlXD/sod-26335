// Page metadata carried over from the original index.html.
export const SPARKLE_TITLE = "Sodium";
export const SPARKLE_DESCRIPTION =
  "Nền tảng cộng đồng dành cho những người yêu thích, theo dõi và lưu trữ nội dung về truyền hình Việt Nam với giao diện streaming hiện đại.";
export const SPARKLE_IMAGE = "/assets/aistudio/image_3602759f.png";

export const sparkleHead = (title: string = SPARKLE_TITLE) => ({
  meta: [
    { title },
    { name: "description", content: SPARKLE_DESCRIPTION },
    { property: "og:title", content: title },
    { property: "og:description", content: SPARKLE_DESCRIPTION },
    { property: "og:type", content: "website" },
    { property: "og:image", content: SPARKLE_IMAGE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: SPARKLE_DESCRIPTION },
    { name: "twitter:image", content: SPARKLE_IMAGE },
  ],
});
