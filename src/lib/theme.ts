export type ThemeChoice = "light" | "dark" | "device";

/** Where the choice is saved. public/_app/theme.js reads the same key before the first paint. */
export const themeKey = "sail-team:theme";

/** A saved choice, or `device` when there's none or it isn't one we know. */
export function readChoice(saved: string | null): ThemeChoice {
  return saved === "light" || saved === "dark" ? saved : "device";
}

export function isDark(choice: ThemeChoice, deviceIsDark: boolean): boolean {
  return choice === "dark" || (choice === "device" && deviceIsDark);
}
