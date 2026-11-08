import { Fragment, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appliesTo, formatShare, type OfferingAssumptions, type OperationsAssumptions } from "@/model/assumptions";
import { formatDays } from "@/model/dates";
import { formatCents } from "@/model/money";
import { cn } from "@/lib/utils";

const none = <span className="text-muted-foreground">—</span>;
const money = (cents: number | null) => (cents === null ? none : formatCents(cents));
const share = (value: number | null | undefined) => (value === null || value === undefined ? none : formatShare(value));
const count = (value: number | null) => (value === null ? none : value.toLocaleString("en-US"));

function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn("text-right tabular-nums", className)}>{children}</TableCell>;
}

/** A small titled table of one kind of rate, such as each staff level's pay. */
function RateTable({ title, head, children }: { title: string; head: string[]; children: ReactNode }) {
  return (
    <section className="grid content-start gap-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <Table aria-label={title}>
        <TableHeader>
          <TableRow>
            {head.map((h, i) => (
              <TableHead key={h} className={cn("whitespace-normal", i > 0 && "text-right")}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </section>
  );
}

/**
 * What each offering's numbers come from: its dates, price, sailors, days, and how it's coached. On a phone it
 * scrolls sideways, with the offering's name kept in view.
 */
export function OfferingAssumptionsTable({ offerings }: { offerings: OfferingAssumptions[] }) {
  const programs = [...new Set(offerings.map((o) => o.program))];
  const sticky = "sticky left-0 bg-background";
  return (
    <Table aria-label="Each offering's assumptions">
      <TableHeader>
        <TableRow>
          <TableHead className={sticky}>Offering</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Sailors</TableHead>
          <TableHead className="text-right">Days</TableHead>
          <TableHead className="text-right">Sailors per coach</TableHead>
          <TableHead>Coach pay level</TableHead>
          <TableHead className="text-right">RIBs per coach</TableHead>
          <TableHead className="text-right">Bring their own boat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programs.map((program) => (
          <Fragment key={program}>
            {programs.length > 1 && (
              <TableRow className="hover:bg-transparent">
                <TableCell className={cn(sticky, "pt-4 font-medium")}>{program}</TableCell>
                <TableCell colSpan={8} />
              </TableRow>
            )}
            {offerings
              .filter((o) => o.program === program)
              .map((o) => (
                <TableRow key={o.key}>
                  <TableCell className={cn(sticky, programs.length > 1 && "pl-6")}>{o.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDays(o.starts_on, o.ends_on)}</TableCell>
                  <Num>{money(o.price_cents)}</Num>
                  <Num>
                    {count(o.enrollment)}
                    {o.capacity !== null && <span className="text-muted-foreground"> of {o.capacity}</span>}
                  </Num>
                  <Num>{count(o.days)}</Num>
                  <Num>
                    {count(o.sailors_per_coach)}
                    {o.min_coaches !== null && (
                      <span className="text-muted-foreground">, at least {o.min_coaches}</span>
                    )}
                  </Num>
                  <TableCell>{o.coach_level ?? none}</TableCell>
                  <Num>{count(o.ribs_per_coach)}</Num>
                  <Num>{share(o.byob_share)}</Num>
                </TableRow>
              ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

/** The rates the Operations Plan sets for the year: each kind in its own small table, when it has any. */
export function OperationsAssumptionsView({ assumptions: a }: { assumptions: OperationsAssumptions }) {
  return (
    <div className="grid gap-card md:grid-cols-2">
      {a.rates && (
        <RateTable title="Rates" head={["Rate", "Amount"]}>
          <TableRow>
            <TableCell>Payroll tax, as a share of wages</TableCell>
            <Num>{share(a.rates.payroll_tax_rate)}</Num>
          </TableRow>
          <TableRow>
            <TableCell>Lodging, per night</TableCell>
            <Num>{money(a.rates.lodging_per_night_cents)}</Num>
          </TableRow>
          <TableRow>
            <TableCell>Mileage, per mile</TableCell>
            <Num>{money(a.rates.mileage_rate_cents)}</Num>
          </TableRow>
        </RateTable>
      )}
      {a.staffLevels.length > 0 && (
        <RateTable title="Coach and staff pay" head={["Level", "Per hour"]}>
          {a.staffLevels.map((l) => (
            <TableRow key={l.key}>
              <TableCell>{l.name}</TableCell>
              <Num>{l.pay_type === "volunteer" ? "Volunteer" : money(l.hourly_rate_cents)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.positions.length > 0 && (
        <RateTable title="Salaried staff" head={["Position", "Salary", "Paid hours a year", "Per hour", "G&A share"]}>
          {a.positions.map((p) => (
            <TableRow key={p.key}>
              <TableCell>{p.name}</TableCell>
              <Num>{money(p.annual_salary_cents)}</Num>
              <Num>{count(p.paid_hours_per_year)}</Num>
              <Num>
                {p.paid_hours_per_year ? money(Math.round(p.annual_salary_cents / p.paid_hours_per_year)) : none}
              </Num>
              <Num>{share(p.ga_share)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.charges.length > 0 && (
        <RateTable title="Charges on revenue" head={["Charge", "Share of revenue", "Applies to"]}>
          {a.charges.map((c) => (
            <TableRow key={c.key}>
              <TableCell>{c.name}</TableCell>
              <Num>{share(c.rate)}</Num>
              <TableCell className="text-right">{appliesTo(c.product_kinds)}</TableCell>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.resources.length > 0 && (
        <RateTable
          title="Boats and equipment"
          head={["Item", "How many", "Per hour", "Per day", "Fuel per hour", "Upkeep per hour"]}
        >
          {a.resources.map((r) => (
            <TableRow key={r.key}>
              <TableCell>{r.name}</TableCell>
              <Num>{count(r.quantity)}</Num>
              <Num>{money(r.cost_per_hour_cents)}</Num>
              <Num>{money(r.cost_per_day_cents)}</Num>
              <Num>{money(r.fuel_per_hour_cents)}</Num>
              <Num>{money(r.maintenance_per_hour_cents)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.boatRates.length > 0 && (
        <RateTable title="Boat upkeep" head={["Boat class", "Per boat, per hour on the water"]}>
          {a.boatRates.map((b) => (
            <TableRow key={b.key}>
              <TableCell>{b.boat_class}</TableCell>
              <Num>{money(b.maintenance_per_boat_hour_cents)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.bonuses.length > 0 && (
        <RateTable title="Bonuses" head={["Role", "Share of net", "Counted"]}>
          {a.bonuses.map((b) => (
            <TableRow key={b.key}>
              <TableCell>{b.role_name}</TableCell>
              <Num>{share(b.bonus_rate)}</Num>
              <TableCell className="text-right">
                {b.basis === "before_shared_costs" ? "Before shared costs" : "After shared costs"}
              </TableCell>
            </TableRow>
          ))}
        </RateTable>
      )}
    </div>
  );
}
