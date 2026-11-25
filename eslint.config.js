import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", "src/integrations/supabase/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-nocheck": false }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: [
      "src/sparkle/SparkleApp.tsx",
      "src/sparkle/components/EditChannelModal.tsx",
      "src/sparkle/components/EpgScheduleWidget.tsx",
      "src/sparkle/components/NativeKeyboard.tsx",
      "src/sparkle/components/Sidebar.tsx",
      "src/sparkle/components/SparkleTabBar.tsx",
      "src/sparkle/components/SpotlightModal.tsx",
      "src/sparkle/components/WindowsTaskbar.tsx",
      "src/sparkle/components/WindowsWidgetsBoard.tsx",
      "src/sparkle/screens/Camera.tsx",
      "src/sparkle/screens/FileExplorer.tsx",
      "src/sparkle/screens/Gallery.tsx",
      "src/sparkle/screens/HomePreview.tsx",
      "src/sparkle/screens/VLC.tsx",
      "src/sparkle/screens/WinUI3.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  eslintPluginPrettier,
);
