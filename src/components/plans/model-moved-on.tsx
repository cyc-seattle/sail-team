import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listOf } from "@/model/financial-models";

/** Says which plans have moved on since a financial model was saved, and links to the model as it stands now. */
export function ModelMovedOn({ setId, moved }: { setId: string; moved: string[] }) {
  if (moved.length === 0) {
    return null;
  }
  return (
    <Alert>
      <AlertDescription>
        <p>
          Since this financial model was saved, {listOf(moved)} {moved.length === 1 ? "has" : "have"} moved on to
          another active version.
        </p>
        <p>
          <Link to="/plans/model/$setId/now" params={{ setId }} className="text-link underline">
            See the financial model as it stands now
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  );
}
