import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appliesTo, formatShare, type Bonus, type OperationsAssumptions } from "@/model/assumptions";
import { formatCents } from "@/model/money";
import { cn } from "@/lib/utils";

const none = <span className="text-muted-foreground">—</span>;
// Prices, salaries and nightly rates are whole dollars; hourly and per-mile rates keep their cents.
const money = (cents: number | null, whole = false) => (cents === null ? none : formatCents(cents, whole));
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

/** What a bonus is, in words: "Summer Director: 10% of net, after shared costs". */
const bonusTerms = (b: Bonus) =>
  `${b.role_name}: ${formatShare(b.bonus_rate)} of net, ${b.basis === "before_shared_costs" ? "before" : "after"} shared costs`;

/** A position's bonuses as their shares of net, each bonus's role and basis on hover, or on a tap on a phone. */
function BonusCell({ bonuses }: { bonuses: Bonus[] }) {
  if (bonuses.length === 0) {
    return <Num>{none}</Num>;
  }
  return (
    <Num>
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={100}
          className="cursor-default underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {bonuses.map((b) => formatShare(b.bonus_rate)).join(", ")}
        </PopoverTrigger>
        <PopoverContent side="top" className="w-auto" aria-label="Bonus">
          {bonuses.map((b) => (
            <p key={b.key}>{bonusTerms(b)}</p>
          ))}
        </PopoverContent>
      </Popover>
    </Num>
  );
}

/**
 * The rates the Operations Plan sets for the year: each kind in its own small table, when it has any, side by side on a
 * laptop unless `stacked`.
 */
export function OperationsAssumptionsView({
  assumptions: a,
  stacked = false,
}: {
  assumptions: OperationsAssumptions;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "grid max-w-3xl gap-10" : "grid gap-card md:grid-cols-2"}>
      {a.rates && (
        <RateTable title="Rates" head={["Rate", "Amount"]}>
          <TableRow>
            <TableCell>Payroll tax, as a share of wages</TableCell>
            <Num>{share(a.rates.payroll_tax_rate)}</Num>
          </TableRow>
          <TableRow>
            <TableCell>Lodging, per night</TableCell>
            <Num>{money(a.rates.lodging_per_night_cents, true)}</Num>
          </TableRow>
          <TableRow>
            <TableCell>Mileage, per mile</TableCell>
            <Num>{money(a.rates.mileage_rate_cents)}</Num>
          </TableRow>
        </RateTable>
      )}
      {a.staffLevels.length > 0 && (
        <RateTable title="Staff levels" head={["Level", "Per hour"]}>
          {a.staffLevels.map((l) => (
            <TableRow key={l.key}>
              <TableCell>{l.name}</TableCell>
              <Num>{l.pay_type === "volunteer" ? "Volunteer" : money(l.hourly_rate_cents)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {(a.positions.length > 0 || a.bonuses.length > 0) && (
        <RateTable
          title="Salaried staff"
          head={["Position", "Salary", "Paid hours a year", "Per hour", "G&A share", "Bonus, share of net"]}
        >
          {a.positions.map((p) => (
            <TableRow key={p.key}>
              <TableCell>{p.name}</TableCell>
              <Num>{money(p.annual_salary_cents, true)}</Num>
              <Num>{count(p.paid_hours_per_year)}</Num>
              <Num>
                {p.paid_hours_per_year ? money(Math.round(p.annual_salary_cents / p.paid_hours_per_year)) : none}
              </Num>
              <Num>{share(p.ga_share)}</Num>
              <BonusCell bonuses={p.bonuses} />
            </TableRow>
          ))}
          {a.bonuses.map((b) => (
            <TableRow key={b.key}>
              <TableCell colSpan={6} className="whitespace-normal text-muted-foreground">
                {bonusTerms(b)}, paying no salaried position
              </TableCell>
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
              <Num>{money(r.cost_per_day_cents, true)}</Num>
              <Num>{money(r.fuel_per_hour_cents)}</Num>
              <Num>{money(r.maintenance_per_hour_cents)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.boatRates.length > 0 && (
        <RateTable
          title="Boat upkeep"
          head={["Boat class", "Boats", "Sailors per boat", "Per boat, per hour on the water"]}
        >
          {a.boatRates.map((b) => (
            <TableRow key={b.key}>
              <TableCell>{b.boat_class}</TableCell>
              <Num>{count(b.quantity)}</Num>
              <Num>{count(b.sailors_per_boat)}</Num>
              <Num>{money(b.maintenance_per_boat_hour_cents)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
    </div>
  );
}
