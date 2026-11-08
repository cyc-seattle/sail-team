import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { said, type SaveState } from "./save-state.ts";

export interface ShareContactProps {
  shares: boolean;
  state?: SaveState;
  /** A sailor who signs in sees the choice, but only an adult makes it. */
  disabled?: boolean;
  onChange: (shares: boolean) => void;
}

/** The household's one choice to share its parents' email and phone with its teams. It saves as soon as it changes. */
export function ShareContact({ shares, state = "idle", disabled = false, onChange }: ShareContactProps) {
  const label = useId();
  const hint = useId();
  return (
    <section className="flex items-start justify-between gap-4 rounded-lg bg-card p-card ring-1 ring-border">
      <div className="grid gap-1">
        <p id={label} className="font-medium">
          Share our email and phone numbers with our teams
        </p>
        <p id={hint} className="text-sm text-muted-foreground">
          Families on the same teams see the parents' email and phone on the roster. Sailors' own are never shown. This
          choice is for your whole household.
        </p>
        <p role="status" className={state === "failed" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {said[state]}
        </p>
      </div>
      <Switch
        checked={shares}
        disabled={disabled || state === "saving"}
        onCheckedChange={(checked) => onChange(checked)}
        aria-labelledby={label}
        aria-describedby={hint}
        className="mt-1"
      />
    </section>
  );
}
