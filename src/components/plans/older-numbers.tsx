import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface OlderNumbersProps {
  /** Works the draft's numbers out again with today's planner. Absent for someone who can't edit the plan. */
  onWorkOut?: (() => Promise<void>) | undefined;
}

/** Says a draft's numbers came from an older planner, with a button to work them out again for those who may. */
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
    <Alert className="gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
      <AlertDescription>
        These numbers are from an older version of the planner.
        {state === "failed" && <span className="block text-destructive">That didn't work. Try again.</span>}
      </AlertDescription>
      {onWorkOut && (
        <Button
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={state === "working"}
          onClick={workOut}
        >
          {state === "working" ? "Working…" : "Work them out again"}
        </Button>
      )}
    </Alert>
  );
}
