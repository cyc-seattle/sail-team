import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./directus/queries.ts";
import { makeRouter } from "./router.ts";
import "./styles/index.css";

const router = makeRouter();

if (import.meta.env.DEV) {
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
