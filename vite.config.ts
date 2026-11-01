import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type TestProjectInlineConfiguration } from "vitest/config";

function stories(theme: "light" | "dark", viewport: { width: number; height: number }): TestProjectInlineConfiguration {
  return {
    extends: true,
    plugins: [storybookTest({ configDir: new URL("./.storybook", import.meta.url).pathname })],
    define: { "import.meta.env.VITE_STORY_THEME": JSON.stringify(theme) },
    test: {
      name: `storybook-${theme}`,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        viewport,
        instances: [{ browser: "chromium" }],
      },
    },
  };
}

export default defineConfig({
  // The app shares cycsail.team with isthmia's portal, which keeps every path sail-team doesn't claim.
  build: { assetsDir: "_app" },
  // Before react(), so the route tree exists when React's transform runs.
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  // Found up front, so Vite doesn't find them mid-run and reload the story tests.
  optimizeDeps: {
    include: ["@base-ui/react/**", "class-variance-authority", "cn", "lucide-react", "sonner", "storybook/test"],
  },
  test: {
    projects: [
      { extends: true, test: { name: "unit", include: ["test/**/*.test.{ts,tsx}"] } },
      // Every story is a test: it renders in Chromium and must pass axe, light at a desk's width and dark at a phone's.
      stories("light", { width: 1280, height: 800 }),
      stories("dark", { width: 390, height: 844 }),
    ],
  },
});
