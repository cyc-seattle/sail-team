import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./directus/queries.ts";
import { nextPath } from "./directus/session.ts";
import { makeRouter } from "./router.ts";
import "./styles/index.css";

// Sign-in comes back to the landing page, with the page it left in `next`.
const next = nextPath(window.location.search, window.location.origin);
if (next) {
  window.history.replaceState(null, "", next);
}

const router = makeRouter();

// Made-up data, unless the dev server is pointed at a real Directus, such as a CI stack's (AGENTS.md).
if (import.meta.env.DEV && !import.meta.env.VITE_DIRECTUS_URL) {
  const { startMocks } = await import("./mocks/browser.ts");
  await startMocks();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
