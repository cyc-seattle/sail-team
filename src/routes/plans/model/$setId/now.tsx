import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EngineWarnings } from "@/components/plans/engine-warnings";
import { Money } from "@/components/plans/money";
import { PageHeader } from "@/components/plans/page-header";
import { PnlTable } from "@/components/plans/pnl-table";
import { SummaryTiles } from "@/components/plans/summary-tiles";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { canRead } from "@/directus/access";
import { financialModelQuery } from "@/directus/financial-models";
import { modelNowQuery } from "@/directus/plans";
import { useSession } from "@/directus/use-session";

export const Route = createFileRoute("/plans/model/$setId/now")({
  component: ModelNowPage,
});

function ModelNowPage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canRead(session.permissions, "plans")) {
    return <NoAccess what="plans" />;
  }
  return <ModelNow />;
}

function ModelNow() {
  const { setId } = Route.useParams();
  const { data: model } = useSuspenseQuery(financialModelQuery(setId));
  if (!model) {
    return <NoticePage title="There's no such financial model" />;
  }
  return (
    <main className="mx-auto max-w-6xl p-card">
      <PageHeader
        title={`The ${model.set.fiscal_year} financial model as it stands now`}
        description="Today's active Operations Plan version and each program area's active version."
        back={{ to: `/plans/model/${setId}`, label: `Financial model: ${model.set.name}` }}
      />
      <Calculated organizationId={model.set.organization_id} year={model.set.fiscal_year} />
    </main>
  );
}

function Calculated({ organizationId, year }: { organizationId: string; year: number }) {
  const { data } = useSuspenseQuery(modelNowQuery({ organization_id: organizationId, fiscal_year: year }));
  const { output, names, areaOfOffering } = data;
  const areas = data.areas
    .map((id) => ({ id, name: names.get(id) ?? "A program area" }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const org = output.organization;
  return (
    <div className="grid gap-card">
      <Alert>
        <AlertDescription>
          These numbers are calculated now, by this app, and change as planners change the active plans. No financial
          model holds them until a planner saves one.
        </AlertDescription>
      </Alert>
      <SummaryTiles
        tiles={[
          { label: "Operating net", value: <Money cents={org.operating.net_cents} colored /> },
          { label: "Fundraising net", value: <Money cents={org.fundraising.net_cents} colored /> },
          { label: "Capital", value: <Money cents={org.capital_cents} />, hint: "Spent on lasting things" },
          { label: "Total", value: <Money cents={org.total_cents} colored /> },
        ]}
      />
      <EngineWarnings warnings={output.warnings} />
      {areas.map((area) => {
        const rows = output.pnl
          .filter((p) => p.level === "offering" && areaOfOffering.get(p.key) === area.id)
          .map((pnl) => ({ name: names.get(pnl.key) ?? "Unnamed", pnl }));
        return (
          <section key={area.id} aria-labelledby={`now-${area.id}`} className="grid gap-2">
            <h2 id={`now-${area.id}`} className="text-base font-medium">
              {area.name}
            </h2>
            {rows.length > 0 ? (
              <PnlTable rows={rows} label="Offering" />
            ) : (
              <p className="text-sm text-muted-foreground">This area's active plan has no offerings.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
