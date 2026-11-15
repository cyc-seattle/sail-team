import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface OlderNumbersProps {
  /** Recalculates the draft's numbers with today's engine. Absent for someone who can't edit the plan. */
  onWorkOut?: (() => Promise<void>) | undefined;
}

/** Says a draft's numbers came from an older engine, with a button to recalculate them for those who may. */
export function OlderNumbers({ onWorkOut }: OlderNumbersProps) {
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  const workOut = async () => {
    setState("working");
    try {
      await onWorkOut!();
      setState("idle");
    } catch {
      setState("failed");
    }
  };
  return (
    <Alert className="grid-cols-[1fr_auto] items-center gap-2">
      <AlertDescription>
        Calculated with an older engine.
        {state === "failed" && <span className="block text-destructive">That didn't work. Try again.</span>}
      </AlertDescription>
      {onWorkOut && (
        <Button variant="outline" size="sm" disabled={state === "working"} onClick={workOut}>
          {/* An easter egg the maintainer chose, so keep it even though the Words guide would flag it. */}
          {state === "working" ? "Reticulating splines…" : "Recalculate"}
        </Button>
      )}
    </Alert>
  );
}
