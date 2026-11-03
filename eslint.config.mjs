import base from "@cyc-seattle/ts-config/eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";

export default [
  { ignores: ["src/routeTree.gen.ts", "storybook-static", ".features-gen", "test-results", "playwright-report"] },
  ...base,
  {
    files: ["src/**/*.{ts,tsx}", "public/**/*.js", ".storybook/**/*.tsx"],
    languageOptions: { globals: globals.browser },
  },
  { files: ["src/**/*.{ts,tsx}"], ...reactHooks.configs.flat.recommended },
  // A route file exports its `Route`, shadcn's components export their variants, and a story exports its meta.
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/routes/**", "src/components/ui/**", "src/**/*.stories.tsx"],
    ...reactRefresh.configs.vite,
  },
  ...storybook.configs["flat/recommended"],
];
