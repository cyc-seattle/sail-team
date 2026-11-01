import { setupWorker } from "msw/browser";
import { directusUrl } from "@/directus/app";
import { handlers } from "./handlers";

/** Answers Directus's requests from made-up data in `mise run dev`. vite.config.ts serves the worker in dev only. */
export async function startMocks() {
  await setupWorker(...handlers(directusUrl)).start({
    serviceWorker: { url: "/_app/mockServiceWorker.js", options: { scope: "/" } },
    onUnhandledFrame: "bypass",
  });
}
