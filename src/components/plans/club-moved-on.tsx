import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listOf } from "@/model/club-plans";

/** Says which parts of the club's plan have moved on since a club plan, and links to the plan as it stands now. */
export function ClubMovedOn({ setId, moved }: { setId: string; moved: string[] }) {
  if (moved.length === 0) {
    return null;
  }
  return (
    <Alert>
      <AlertDescription>
        <p>
          Since this club plan was saved, {listOf(moved)} {moved.length === 1 ? "has" : "have"} moved on to another
          active version.
        </p>
        <p>
          <Link to="/plans/club/$setId/now" params={{ setId }} className="text-link underline">
            See the club's plan as it stands now
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  );
}
