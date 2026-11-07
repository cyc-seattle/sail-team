import { Link } from "@tanstack/react-router";
import type { VersionInFinancialModel } from "@/directus/financial-models";
import { formatDate } from "@/model/dates";
import { savedPnl } from "@/model/saved-results";
import { PnlTable } from "./pnl-table";

/** A saved version's offerings as the newest financial model that holds it counts them. */
export function VersionInFinancialModelSection({ held }: { held: VersionInFinancialModel }) {
  const rows = held.pnl.filter((p) => p.level === "offering").map(savedPnl);
  return (
    <section aria-labelledby="in-financial-model" className="grid gap-2">
      <h2 id="in-financial-model" className="text-base font-medium">
        In the financial model{" "}
        <Link to="/plans/model/$setId" params={{ setId: held.set.id }} className="text-link underline">
          {held.set.name}
        </Link>
      </h2>
      <p className="text-sm text-muted-foreground">
        Saved {formatDate(held.set.saved_at)}. It counts the other areas' versions the financial model holds, so its
        numbers can differ from the version's own.
      </p>
      {rows.length > 0 ? (
        <PnlTable rows={rows} label="Offering" />
      ) : (
        <p className="text-sm text-muted-foreground">The financial model holds no offerings for this version.</p>
      )}
    </section>
  );
}
