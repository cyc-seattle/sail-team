export type SaveState = "idle" | "saving" | "saved" | "failed";

/** What a card's status line says about its last save. */
export const said: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved.",
  failed: "That didn't save. Try again.",
};
