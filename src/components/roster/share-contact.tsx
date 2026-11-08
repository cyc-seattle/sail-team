import { useId } from "react";
import { Switch } from "@/components/ui/switch";

export type SaveState = "idle" | "saving" | "saved" | "failed";

export interface ShareContactProps {
  shares: boolean;
  /** Whether the person is a guardian of someone on a roster, which changes how the choice is put. */
  guardian: boolean;
  state?: SaveState;
  onChange: (shares: boolean) => void;
}

const said: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved.",
  failed: "That didn't save. Try again, or ask the club office to change it.",
};

/** The signed-in adult's own choice to share their email and phone with the teams. It saves as soon as it changes. */
export function ShareContact({ shares, guardian, state = "idle", onChange }: ShareContactProps) {
  const label = useId();
  const hint = useId();
  return (
    <section className="flex items-start justify-between gap-4 rounded-lg bg-card p-card ring-1 ring-border">
      <div className="grid gap-1">
        <p id={label} className="font-medium">
          Share my email and phone with {guardian ? "my child's team" : "my team"}
        </p>
        <p id={hint} className="text-sm text-muted-foreground">
          Families on a team see the email and phone of the adults who share them. Children's own are never shown. Club
          crew can always reach you.
        </p>
        <p role="status" className={state === "failed" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {said[state]}
        </p>
      </div>
      <Switch
        checked={shares}
        disabled={state === "saving"}
        onCheckedChange={(checked) => onChange(checked)}
        aria-labelledby={label}
        aria-describedby={hint}
        className="mt-1"
      />
    </section>
  );
}
