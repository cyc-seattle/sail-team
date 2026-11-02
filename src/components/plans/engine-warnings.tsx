import type { EngineWarning } from "@cyc-seattle/platform/planning";
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** What the planning engine flagged in a plan, for the planner to check. Nothing when it flagged nothing. */
export function EngineWarnings({ warnings }: { warnings: EngineWarning[] }) {
  if (warnings.length === 0) {
    return null;
  }
  return (
    <Alert className="text-warning">
      <TriangleAlertIcon />
      <AlertTitle>{warnings.length === 1 ? "One thing to check" : `${warnings.length} things to check`}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 text-foreground">
          {warnings.map((warning, i) => (
            <li key={`${warning.code}-${warning.key ?? i}`}>{warning.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
