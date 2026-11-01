import base from "@cyc-seattle/ts-config/eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["src/routeTree.gen.ts"] },
  ...base,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    ...reactHooks.configs.flat.recommended,
  },
  // A route file exports its `Route`, and the router plugin splits its component out for fast refresh.
  { files: ["src/**/*.tsx"], ignores: ["src/routes/**"], ...reactRefresh.configs.vite },
];
