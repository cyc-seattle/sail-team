import { useSyncExternalStore } from "react";

// Tailwind's md, where the sidebar shows beside the page and the tab bar goes away.
const query = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const list = window.matchMedia(query);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/** Whether the screen is phone-sized. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
