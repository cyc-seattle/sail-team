import { useState } from "react";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlanSync } from "@/directus/plan-sync";
import {
  describeRow,
  syncGroups,
  tickable,
  ticked as tickedAtFirst,
  type SyncAreaGroup,
  type SyncRow,
} from "@/model/plan-sync";

const ALL = "all";

/** Every row under a group, an offering, or the whole review. */
const rowsIn = (groups: SyncAreaGroup[]) =>
  groups.flatMap((a) => a.forms.flatMap((f) => f.offerings.flatMap((o) => o.rows)));

/**
 * The plan-to-catalog sync's review (cyc-seattle/platform#395): what the frozen plan in force lacks in the catalog,
 * by program area, then registration form, then offering. The Catalog Writer ticks what to apply.
 */
export function PlanSyncReview({
  sync,
  onYear,
  onApply,
}: {
  sync: PlanSync;
  onYear: (year: number) => void;
  /** Applies the ticked rows in order, and gives back each one that failed, with why. */
  onApply: (rows: SyncRow[]) => Promise<Map<string, string>>;
}) {
  const groups = sync.state === "ready" ? syncGroups(sync.difference, sync.names) : [];
  const [ticked, setTicked] = useState(() => tickedAtFirst(groups));
  const [area, setArea] = useState(ALL);
  const [errors, setErrors] = useState(new Map<string, string>());
  const [applying, setApplying] = useState(false);
  const shown = area === ALL ? groups : groups.filter((g) => (g.area?.id ?? "none") === area);
  const toApply = rowsIn(shown).filter((r) => ticked.has(r.id));

  const tick = (rows: SyncRow[], on: boolean) =>
    setTicked((was) => {
      const next = new Set(was);
      for (const r of rows.filter(tickable)) {
        if (on) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  const apply = async () => {
    setApplying(true);
    try {
      setErrors(await onApply(toApply));
    } finally {
      setApplying(false);
    }
  };

  const years = sync.years.length > 0 ? sync.years : [sync.year];
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={years.map((y) => ({ label: String(y), value: String(y) }))}
        value={String(sync.year)}
        onValueChange={(value) => onYear(Number(value))}
      >
        <SelectTrigger aria-label="Year" className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {groups.length > 1 && (
        <Select
          items={[
            { label: "Every area", value: ALL },
            ...groups.map((g) => ({ label: g.area?.name ?? "No program area", value: g.area?.id ?? "none" })),
          ]}
          value={area}
          onValueChange={(value) => setArea(String(value))}
        >
          <SelectTrigger aria-label="Program area" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Every area</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.area?.id ?? "none"} value={g.area?.id ?? "none"}>
                {g.area?.name ?? "No program area"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {sync.state === "ready" && groups.length > 0 && (
        <Button onClick={apply} disabled={applying || toApply.length === 0}>
          {applying ? "Applying…" : `Apply ${toApply.length} ${toApply.length === 1 ? "change" : "changes"}`}
        </Button>
      )}
    </div>
  );

  return (
    <ReportSection id="sync" title="Sync from plan" actions={controls}>
      {sync.state === "none" && (
        <p className="text-sm text-muted-foreground">No Financial Plan is in force for {sync.year}.</p>
      )}
      {sync.state === "draft" && (
        <p className="text-sm text-muted-foreground">
          The plan in force for {sync.year}, “{sync.plan.name}”, is a draft. Freeze it to sync it.
        </p>
      )}
      {sync.state === "ready" && (
        <div className="grid gap-6">
          <p className="text-sm text-muted-foreground">
            Compares “{sync.plan.name}”, the plan in force for {sync.year}, with the catalog. Rows you don't apply show
            again next time.
          </p>
          {groups.length === 0 && <p className="text-sm">No differences.</p>}
          {shown.map((g) => (
            <section key={g.area?.id ?? "none"} aria-label={g.area?.name ?? "No program area"} className="grid gap-4">
              <GroupHeading
                level="area"
                label={g.area?.name ?? "No program area"}
                rows={rowsIn([g])}
                ticked={ticked}
                onTick={tick}
              />
              {g.forms.map((f) => (
                <div key={f.form?.id ?? "none"} className="grid gap-3 border-l pl-3 sm:pl-4">
                  <GroupHeading
                    level="form"
                    label={f.form?.name ?? "No form yet"}
                    rows={f.offerings.flatMap((o) => o.rows)}
                    ticked={ticked}
                    onTick={tick}
                  />
                  {f.offerings.map((o) => (
                    <div key={o.offering.id} className="grid gap-1.5 rounded-md border bg-card p-3">
                      <GroupHeading level="offering" label={o.label} rows={o.rows} ticked={ticked} onTick={tick} />
                      <ul className="grid gap-1">
                        {o.rows
                          .filter((r) => !ACTIVITY_KINDS.includes(r.kind))
                          .map((r) => (
                            <Row key={r.id} row={r} ticked={ticked.has(r.id)} error={errors.get(r.id)} onTick={tick} />
                          ))}
                        {ACTIVITY_KINDS.map((kind) => {
                          const rows = o.rows.filter((r) => r.kind === kind);
                          return (
                            rows.length > 0 && (
                              <Activities
                                key={kind}
                                kind={kind}
                                rows={rows}
                                ticked={ticked}
                                errors={errors}
                                onTick={tick}
                              />
                            )
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </ReportSection>
  );
}

/** A group's name, with a box that ticks every row under it. */
function GroupHeading({
  level,
  label,
  rows,
  ticked,
  onTick,
}: {
  level: "area" | "form" | "offering";
  label: string;
  rows: SyncRow[];
  ticked: Set<string>;
  onTick: (rows: SyncRow[], on: boolean) => void;
}) {
  const own = rows.filter(tickable);
  const count = own.filter((r) => ticked.has(r.id)).length;
  const Heading = level === "area" ? "h3" : level === "form" ? "h4" : "h5";
  const text = { area: "text-base font-semibold", form: "text-sm font-semibold", offering: "text-sm font-medium" }[
    level
  ];
  return (
    <label className="flex items-center gap-2">
      <Checkbox
        aria-label={`All of ${label}`}
        checked={own.length > 0 && count === own.length}
        indeterminate={count > 0 && count < own.length}
        disabled={own.length === 0}
        onCheckedChange={(on) => onTick(own, on)}
      />
      <Heading className={text}>{label}</Heading>
    </label>
  );
}

/** Activity rows, shown together under one line for each kind, since a season has dozens. */
const ACTIVITY_KINDS: SyncRow["kind"][] = ["add-activity", "change-activity", "archive-activity", "skipped"];
const ACTIVITY_LINES: Record<string, (n: number) => string> = {
  "add-activity": (n) => `Add ${n} ${n === 1 ? "activity" : "activities"}`,
  "change-activity": (n) => `Change ${n} ${n === 1 ? "activity" : "activities"}`,
  "archive-activity": (n) => `Archive ${n} ${n === 1 ? "activity" : "activities"}`,
  skipped: (n) => `${n} ${n === 1 ? "activity" : "activities"} skipped: no start or end time`,
};

/** An offering's activities of one kind, under one line that ticks them all, opening to each one. */
function Activities({
  kind,
  rows,
  ticked,
  errors,
  onTick,
}: {
  kind: SyncRow["kind"];
  rows: SyncRow[];
  ticked: Set<string>;
  errors: Map<string, string>;
  onTick: (rows: SyncRow[], on: boolean) => void;
}) {
  const own = rows.filter(tickable);
  const count = own.filter((r) => ticked.has(r.id)).length;
  const line = ACTIVITY_LINES[kind]!(rows.length);
  const failed = rows.filter((r) => errors.has(r.id)).length;
  return (
    <li className="flex items-start gap-2">
      <Checkbox
        aria-label={line}
        checked={own.length > 0 && count === own.length}
        indeterminate={count > 0 && count < own.length}
        disabled={own.length === 0}
        onCheckedChange={(on) => onTick(own, on)}
        className="mt-0.5"
      />
      <details open={failed > 0} className="min-w-0 flex-1">
        <summary className="cursor-pointer text-sm">
          <span className={own.length === 0 ? "text-muted-foreground" : undefined}>{line}</span>
          {failed > 0 && <span className="ml-2 text-destructive">{failed} not applied</span>}
        </summary>
        <ul className="mt-1 grid gap-1">
          {rows.map((r) => (
            <Row key={r.id} row={r} ticked={ticked.has(r.id)} error={errors.get(r.id)} onTick={onTick} />
          ))}
        </ul>
      </details>
    </li>
  );
}

const ACTION_STYLE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Add: "default",
  Change: "secondary",
  "Bring back": "secondary",
  Archive: "destructive",
  Skipped: "outline",
};

function Row({
  row,
  ticked,
  error,
  onTick,
}: {
  row: SyncRow;
  ticked: boolean;
  error: string | undefined;
  onTick: (rows: SyncRow[], on: boolean) => void;
}) {
  const { action, what } = describeRow(row);
  return (
    <li className="grid gap-0.5">
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          aria-label={`${action}: ${what}`}
          checked={ticked}
          disabled={!tickable(row)}
          onCheckedChange={(on) => onTick([row], on)}
          className="mt-0.5"
        />
        <Badge variant={ACTION_STYLE[action] ?? "outline"} className="shrink-0">
          {action}
        </Badge>
        <span className={tickable(row) ? undefined : "text-muted-foreground"}>{what}</span>
      </label>
      {error && (
        <p role="alert" className="ml-6 text-sm text-destructive">
          Not applied: {error}
        </p>
      )}
    </li>
  );
}
