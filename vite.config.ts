import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The app shares cycsail.team with isthmia's portal, which keeps every path sail-team doesn't claim.
  build: { assetsDir: "_app" },
  // Before react(), so the route tree exists when React's transform runs.
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react()],
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
