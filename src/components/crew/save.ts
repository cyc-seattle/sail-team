import { refusalOf } from "@/directus/financial-plans";

export type SaveState = { kind: "idle" | "saving" } | { kind: "failed"; reason: string };

/** Runs a dialog's save: closes it when done, and keeps it open saying why when Directus refuses. */
export async function runSave(save: () => Promise<void>, setState: (s: SaveState) => void, onDone: () => void) {
  setState({ kind: "saving" });
  try {
    await save();
    onDone();
  } catch (error) {
    setState({ kind: "failed", reason: refusalOf(error) });
  }
}
