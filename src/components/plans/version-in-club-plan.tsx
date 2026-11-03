import { Link } from "@tanstack/react-router";
import type { VersionInClubPlan } from "@/directus/club-plans";
import { formatDate } from "@/model/dates";
import { savedPnl } from "@/model/saved-results";
import { PnlTable } from "./pnl-table";

/** A saved version's offerings as the newest club plan that holds it counts them. */
export function VersionInClubPlanSection({ held }: { held: VersionInClubPlan }) {
  const rows = held.pnl.filter((p) => p.level === "offering").map(savedPnl);
  return (
    <section aria-labelledby="in-club-plan" className="grid gap-2">
      <h2 id="in-club-plan" className="text-base font-medium">
        In the club plan{" "}
        <Link to="/plans/club/$setId" params={{ setId: held.set.id }} className="text-link underline">
          {held.set.name}
        </Link>
      </h2>
      <p className="text-sm text-muted-foreground">
        Saved {formatDate(held.set.saved_at)}. It counts the other areas' versions the club plan holds, so its numbers
        can differ from the version's own.
      </p>
      {rows.length > 0 ? (
        <PnlTable rows={rows} label="Offering" />
      ) : (
        <p className="text-sm text-muted-foreground">The club plan holds no offerings for this version.</p>
      )}
    </section>
  );
}
