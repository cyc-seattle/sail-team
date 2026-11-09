import { useCallback, useSyncExternalStore } from "react";
import { readView, viewKey, type PnlView } from "@/model/pnl-view";

const listeners = new Set<() => void>();

function saved(): PnlView {
  try {
    return readView(localStorage.getItem(viewKey));
  } catch {
    return "year";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab's choice shows here too.
  const onStorage = (event: StorageEvent) => event.key === viewKey && listener();
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

/** How every P&L shows its amounts, saved so it stays the same from page to page, and a setter that saves it. */
export function usePnlView(): [PnlView, (view: PnlView) => void] {
  const view = useSyncExternalStore(subscribe, saved, () => "year" as const);
  const setView = useCallback((next: PnlView) => {
    try {
      localStorage.setItem(viewKey, next);
    } catch {
      // Storage can be off; the choice lasts until the page reloads.
    }
    listeners.forEach((listener) => listener());
  }, []);
  return [view, setView];
}
