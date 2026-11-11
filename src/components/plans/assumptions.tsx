import { Fragment, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  appliesTo,
  formatShare,
  type Bonus,
  type FixedCost,
  type OperationsAssumptions,
  type StaffTime,
} from "@/model/assumptions";
import { formatDay } from "@/model/dates";
import { formatCents } from "@/model/money";
import { cn } from "@/lib/utils";

const none = <span className="text-muted-foreground">—</span>;
// Prices, salaries and nightly rates are whole dollars; hourly and per-mile rates keep their cents.
const money = (cents: number | null, whole = false) => (cents === null ? none : formatCents(cents, whole));
const share = (value: number | null | undefined) => (value === null || value === undefined ? none : formatShare(value));
const count = (value: number | null) => (value === null ? none : value.toLocaleString("en-US"));
const leftOut = (excluded: boolean) => (excluded ? "Yes" : none);
const mtdc = "Left out of MTDC";

function Note({ children }: { children: string | null }) {
  return <TableCell className="min-w-48 whitespace-normal text-muted-foreground">{children ?? none}</TableCell>;
}

function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn("text-right tabular-nums", className)}>{children}</TableCell>;
}

/**
 * A small titled table of one kind of rate, such as each staff level's pay. Columns after the first are numbers, on
 * the right, unless named in `text`.
 */
function RateTable({
  title,
  head,
  text = [],
  children,
}: {
  title: string;
  head: string[];
  text?: string[];
  children: ReactNode;
}) {
  return (
    <section className="grid content-start gap-1">
      <h3 className="text-sm font-medium">{title}</h3>
      {/* Its own scroller, not Table's, so a keyboard can reach it to scroll a wide one on a phone. */}
      <div
        tabIndex={0}
        className="overflow-x-auto rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <table aria-label={title} className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              {head.map((h, i) => (
                <TableHead key={h} className={cn("whitespace-normal", i > 0 && !text.includes(h) && "text-right")}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </table>
      </div>
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
    <div className={stacked ? "grid max-w-5xl gap-10" : "grid gap-card md:grid-cols-2"}>
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
          <TableRow>
            <TableCell>Coach boat (RIB) hours, priced as</TableCell>
            <Num>{a.rates.rib_kind ?? none}</Num>
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
      {a.positions.length > 0 && (
        <RateTable
          title="Salaried staff"
          head={[
            "Position",
            "Salary",
            "Paid hours a year",
            "Per hour",
            "Coaching, per hour",
            "G&A share",
            "Rest of salary goes to",
            "Bonus, share of net",
          ]}
          text={["Rest of salary goes to"]}
        >
          {a.positions.map((p) => (
            <TableRow key={p.key}>
              <TableCell>{p.name}</TableCell>
              <Num>{money(p.annual_salary_cents, true)}</Num>
              <Num>{count(p.paid_hours_per_year)}</Num>
              <Num>
                {p.paid_hours_per_year ? money(Math.round(p.annual_salary_cents / p.paid_hours_per_year)) : none}
              </Num>
              <Num>{money(p.hourly_coaching_rate_cents)}</Num>
              <Num>{share(p.ga_share)}</Num>
              <TableCell>{p.remainder_pool ?? none}</TableCell>
              <BonusCell bonuses={p.bonuses} />
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.salariedHours.length > 0 && (
        <RateTable title="Salaried hours on programs" head={["Position", "Program", "Hours"]} text={["Program"]}>
          {a.salariedHours.map((h) => (
            <TableRow key={h.key}>
              <TableCell>{h.position}</TableCell>
              <TableCell>{h.booked_to}</TableCell>
              <Num>{count(h.hours)}</Num>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.bonuses.length > 0 && (
        <RateTable
          title="Bonuses"
          head={["Role", "Share of net", "Counted", "On the net of", "Account", "Pays"]}
          text={["Counted", "On the net of", "Account", "Pays"]}
        >
          {a.bonuses.map((b) => (
            <TableRow key={b.key}>
              <TableCell>{b.role_name}</TableCell>
              <Num>{share(b.bonus_rate)}</Num>
              <TableCell>{b.basis === "before_shared_costs" ? "Before shared costs" : "After shared costs"}</TableCell>
              <TableCell className="min-w-48 whitespace-normal">
                {b.products.length > 0 ? b.products.join(", ") : none}
              </TableCell>
              <TableCell>{b.account}</TableCell>
              <TableCell>{b.position ?? none}</TableCell>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.charges.length > 0 && (
        <RateTable
          title="Charges on revenue"
          head={["Charge", "Share of revenue", "Applies to", "Account", mtdc, "Note"]}
          text={["Account", mtdc, "Note"]}
        >
          {a.charges.map((c) => (
            <TableRow key={c.key}>
              <TableCell>{c.name}</TableCell>
              <Num>{share(c.rate)}</Num>
              <TableCell className="text-right">{appliesTo(c.product_kinds)}</TableCell>
              <TableCell>{c.account}</TableCell>
              <TableCell>{leftOut(c.excluded_from_mtdc)}</TableCell>
              <Note>{c.note}</Note>
            </TableRow>
          ))}
        </RateTable>
      )}
      {a.resources.length > 0 && (
        <RateTable
          title="Boats and equipment"
          head={["Item", "How many", "Per hour", "Per day", "Fuel per hour", "Upkeep per hour", mtdc]}
          text={[mtdc]}
        >
          {a.resources.map((r) => (
            <TableRow key={r.key}>
              <TableCell>{r.name}</TableCell>
              <Num>{count(r.quantity)}</Num>
              <Num>{money(r.cost_per_hour_cents)}</Num>
              <Num>{money(r.cost_per_day_cents, true)}</Num>
              <Num>{money(r.fuel_per_hour_cents)}</Num>
              <Num>{money(r.maintenance_per_hour_cents)}</Num>
              <TableCell>{leftOut(r.excluded_from_mtdc)}</TableCell>
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
      <BudgetLines costsTitle="Fixed costs and G&A" lines={a.fixedCosts} />
      {a.staffTime.length > 0 && <StaffTimeTable lines={a.staffTime} />}
      {a.closedDays.length > 0 && (
        <RateTable title="Closed days" head={["Date", "Closed for"]} text={["Closed for"]}>
          {a.closedDays.map((d) => (
            <TableRow key={d.key}>
              <TableCell className="tabular-nums">{formatDay(d.date)}</TableCell>
              <TableCell>{d.name}</TableCell>
            </TableRow>
          ))}
        </RateTable>
      )}
    </div>
  );
}

/**
 * A plan's budget lines: its fixed costs, then any revenue, each under what it's charged to, such as G&A, in the order
 * they first appear. Leaving MTDC out applies only to a cost.
 */
export function BudgetLines({ costsTitle, lines }: { costsTitle: string; lines: FixedCost[] }) {
  return (
    <>
      <BudgetTable title={costsTitle} lines={lines.filter((l) => !l.revenue)} first="Cost" />
      <BudgetTable title="Other revenue" lines={lines.filter((l) => l.revenue)} first="Revenue" />
    </>
  );
}

function BudgetTable({ title, lines, first }: { title: string; lines: FixedCost[]; first: string }) {
  if (lines.length === 0) {
    return null;
  }
  const cost = first === "Cost";
  const head = [first, "Account", "Amount", ...(cost ? [mtdc] : []), "Note"];
  const groups = [...new Set(lines.map((c) => c.charged_to))];
  return (
    <RateTable title={title} head={head} text={["Account", mtdc, "Note"]}>
      {groups.map((group) => (
        <Fragment key={group}>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={head.length} className="pt-4 font-medium">
              {group}
            </TableCell>
          </TableRow>
          {lines
            .filter((c) => c.charged_to === group)
            .map((c) => (
              <TableRow key={c.key}>
                <TableCell className="pl-6">{c.name}</TableCell>
                <TableCell>{c.account}</TableCell>
                <Num>{money(c.amount_cents, true)}</Num>
                {cost && <TableCell>{leftOut(c.excluded_from_mtdc)}</TableCell>}
                <Note>{c.note}</Note>
              </TableRow>
            ))}
        </Fragment>
      ))}
    </RateTable>
  );
}

/** Hourly staff time outside the programs, at a staff level's rate. */
export function StaffTimeTable({ lines }: { lines: StaffTime[] }) {
  return (
    <RateTable
      title="Staff time outside programs"
      head={["Work", "Staff level", "Hours", "Charged to", "Account", "Note"]}
      text={["Staff level", "Charged to", "Account", "Note"]}
    >
      {lines.map((l) => (
        <TableRow key={l.key}>
          <TableCell>{l.name}</TableCell>
          <TableCell>{l.staff_level ?? none}</TableCell>
          <Num>{count(l.hours)}</Num>
          <TableCell>{l.charged_to}</TableCell>
          <TableCell>{l.account}</TableCell>
          <Note>{l.note}</Note>
        </TableRow>
      ))}
    </RateTable>
  );
}
