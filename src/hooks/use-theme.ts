import { useCallback, useSyncExternalStore } from "react";
import { isDark, readChoice, themeKey, type ThemeChoice } from "@/lib/theme";

const media = () => matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function saved(): ThemeChoice {
  try {
    return readChoice(localStorage.getItem(themeKey));
  } catch {
    return "device";
  }
}

function apply() {
  document.documentElement.classList.toggle("dark", isDark(saved(), media().matches));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const query = media();
  query.addEventListener("change", apply);
  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", apply);
  };
}

/** The saved light, dark, or device choice, and a setter that saves and applies it. */
export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribe, saved, () => "device" as const);
  const setChoice = useCallback((next: ThemeChoice) => {
    try {
      if (next === "device") {
        localStorage.removeItem(themeKey);
      } else {
        localStorage.setItem(themeKey, next);
      }
    } catch {
      // Storage can be off; the choice lasts until the page reloads.
    }
    apply();
  }, []);
  return [choice, setChoice];
}
