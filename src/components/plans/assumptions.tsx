import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  appliesTo,
  formatShare,
  type Account,
  type Bonus,
  type FixedCost,
  type OperationsAssumptions,
  type StaffTime,
} from "@/model/assumptions";
import { formatDay } from "@/model/dates";
import { formatCents } from "@/model/money";
import { cn } from "@/lib/utils";
import { AccountTable, type AccountTableGroup } from "./account-table";
import { NoteInfo } from "./note-info";

const none = <span className="text-muted-foreground">—</span>;
// Prices, salaries and nightly rates are whole dollars; hourly and per-mile rates keep their cents.
const money = (cents: number | null, whole = false) => (cents === null ? none : formatCents(cents, whole));
const share = (value: number | null | undefined) => (value === null || value === undefined ? none : formatShare(value));
const count = (value: number | null) => (value === null ? none : value.toLocaleString("en-US"));
const leftOut = (excluded: boolean) => (excluded ? "Yes" : none);
const mtdc = "Left out of MTDC";

/** Accounts in the order of the chart of accounts, then by name. */
const byAccount = <T extends { account: Account; name: string }>(rows: T[]) =>
  [...rows].sort(
    (a, b) =>
      (a.account.number ?? "￿").localeCompare(b.account.number ?? "￿", undefined, { numeric: true }) ||
      a.name.localeCompare(b.name),
  );

/** Rows grouped under what they're charged to, such as G&A, in alphabetical order. */
const byChargedTo = <T extends { charged_to: string }>(rows: T[]) =>
  [...new Set(rows.map((r) => r.charged_to))]
    .sort((a, b) => a.localeCompare(b))
    .map((title) => ({ title, rows: rows.filter((r) => r.charged_to === title) }));

function Num({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn("text-right tabular-nums", className)}>{children}</TableCell>;
}

/**
 * A titled part of the assumptions: a section of its own, with an h2, on the Assumptions tab, and a smaller one, with
 * an h3, inside a program area's.
 */
export function TableSection({ title, level, children }: { title: string; level: 2 | 3; children: ReactNode }) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section aria-label={title} className={cn("grid content-start", level === 2 ? "gap-4" : "gap-1")}>
      <Heading className={level === 2 ? "text-lg font-medium" : "text-sm font-medium"}>{title}</Heading>
      {children}
    </section>
  );
}

/**
 * A small table of one kind of rate, such as each staff level's pay. Columns after the first are numbers, on the
 * right, unless named in `text`.
 */
function RateTable({
  label,
  head,
  text = [],
  children,
}: {
  label: string;
  head: string[];
  text?: string[];
  children: ReactNode;
}) {
  return (
    // Its own scroller, not Table's, so a keyboard can reach it to scroll a wide one on a phone.
    <div
      tabIndex={0}
      className="overflow-x-auto rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <table aria-label={label} className="w-full caption-bottom text-sm">
        <TableHeader>
          <TableRow>
            {head.map((h, i) => (
              <TableHead key={h} className={cn(i > 0 && !text.includes(h) && "text-right")}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </table>
    </div>
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

/** A salary, with what it comes to an hour over its paid hours behind an info icon. */
function SalaryCell({ cents, hours }: { cents: number; hours: number | null }) {
  return (
    <Num>
      <span className="inline-flex items-center gap-1">
        {hours ? (
          <NoteInfo
            label="Per hour"
            note={`${formatCents(Math.round(cents / hours))} an hour, over ${hours.toLocaleString("en-US")} paid hours`}
          />
        ) : null}
        {money(cents, true)}
      </span>
    </Num>
  );
}

/** The salaried positions: what each is paid, and the hours booked to programs. */
function SalariedStaff({ a }: { a: OperationsAssumptions }) {
  const pools = new Set(a.positions.map((p) => p.remainder_pool));
  // Where the rest of each salary goes is said once when it's the same for every position.
  const samePool = pools.size === 1 ? [...pools][0] : undefined;
  const head = ["Position", "Salary", "Paid hours", "Coaching rate", "G&A share", "Bonus"];
  return (
    <TableSection title="Salaried staff" level={2}>
      <RateTable
        label="Salaried staff"
        head={samePool === undefined ? [...head, "Rest goes to"] : head}
        text={["Rest goes to"]}
      >
        {a.positions.map((p) => (
          <TableRow key={p.key}>
            <TableCell>{p.name}</TableCell>
            <SalaryCell cents={p.annual_salary_cents} hours={p.paid_hours_per_year} />
            <Num>{count(p.paid_hours_per_year)}</Num>
            <Num>{money(p.hourly_coaching_rate_cents)}</Num>
            <Num>{share(p.ga_share)}</Num>
            <BonusCell bonuses={p.bonuses} />
            {samePool === undefined && <TableCell>{p.remainder_pool ?? none}</TableCell>}
          </TableRow>
        ))}
      </RateTable>
      {samePool && <p className="text-sm text-muted-foreground">The rest of each salary goes to {samePool}.</p>}
    </TableSection>
  );
}

/**
 * The rates the Operations Plan sets for the year, each kind in its own section when it has any.
 */
export function OperationsAssumptionsView({ assumptions: a }: { assumptions: OperationsAssumptions }) {
  return (
    <div className="grid max-w-4xl gap-12">
      {a.rates && (
        <TableSection title="Rates" level={2}>
          <RateTable label="Rates" head={["Rate", "Amount"]}>
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
              <TableCell>Coach boat hours priced as</TableCell>
              <Num>{a.rates.rib_kind ?? none}</Num>
            </TableRow>
          </RateTable>
        </TableSection>
      )}
      {a.staffLevels.length > 0 && (
        <TableSection title="Staff levels" level={2}>
          <RateTable label="Staff levels" head={["Level", "Per hour"]}>
            {a.staffLevels.map((l) => (
              <TableRow key={l.key}>
                <TableCell>{l.name}</TableCell>
                <Num>{l.pay_type === "volunteer" ? "Volunteer" : money(l.hourly_rate_cents)}</Num>
              </TableRow>
            ))}
          </RateTable>
        </TableSection>
      )}
      {a.positions.length > 0 && <SalariedStaff a={a} />}
      {a.salariedHours.length > 0 && (
        <TableSection title="Salaried hours on programs" level={2}>
          <RateTable label="Salaried hours on programs" head={["Position", "Program", "Hours"]} text={["Program"]}>
            {a.salariedHours.map((h) => (
              <TableRow key={h.key}>
                <TableCell>{h.position}</TableCell>
                <TableCell>{h.booked_to}</TableCell>
                <Num>{count(h.hours)}</Num>
              </TableRow>
            ))}
          </RateTable>
        </TableSection>
      )}
      {a.bonuses.length > 0 && (
        <TableSection title="Bonuses" level={2}>
          <AccountTable
            label="Bonuses"
            nameHead="Role"
            columns={[
              { head: "Share of net" },
              { head: "Counted", text: true },
              { head: "On the net of", text: true },
              { head: "Pays", text: true },
            ]}
            groups={[
              {
                rows: byAccount(a.bonuses.map((b) => ({ ...b, name: b.role_name }))).map((b) => ({
                  key: b.key,
                  number: b.account.number,
                  name: b.role_name,
                  values: [
                    share(b.bonus_rate),
                    b.basis === "before_shared_costs" ? "Before shared costs" : "After shared costs",
                    b.products.length > 0 ? <span className="whitespace-normal">{b.products.join(", ")}</span> : none,
                    b.position ?? none,
                  ],
                })),
              },
            ]}
          />
        </TableSection>
      )}
      {a.charges.length > 0 && (
        <TableSection title="Charges on revenue" level={2}>
          <AccountTable
            label="Charges on revenue"
            nameHead="Charge"
            columns={[{ head: "Rate" }, { head: "Applies to", text: true }, { head: mtdc, text: true }]}
            groups={[
              {
                rows: byAccount(a.charges).map((c) => ({
                  key: c.key,
                  number: c.account.number,
                  name: c.name,
                  note: c.note,
                  values: [share(c.rate), appliesTo(c.product_kinds), leftOut(c.excluded_from_mtdc)],
                })),
              },
            ]}
          />
        </TableSection>
      )}
      {a.resources.length > 0 && (
        <TableSection title="Boats and equipment" level={2}>
          <RateTable
            label="Boats and equipment"
            head={["Item", "Per hour", "Per day", "Fuel per hour", "Upkeep per hour", mtdc]}
            text={[mtdc]}
          >
            {a.resources.map((r) => (
              <TableRow key={r.key}>
                <TableCell>{r.name}</TableCell>
                <Num>{money(r.cost_per_hour_cents)}</Num>
                <Num>{money(r.cost_per_day_cents, true)}</Num>
                <Num>{money(r.fuel_per_hour_cents)}</Num>
                <Num>{money(r.maintenance_per_hour_cents)}</Num>
                <TableCell>{leftOut(r.excluded_from_mtdc)}</TableCell>
              </TableRow>
            ))}
          </RateTable>
        </TableSection>
      )}
      {a.boatRates.length > 0 && (
        <TableSection title="Boat upkeep" level={2}>
          <RateTable label="Boat upkeep" head={["Boat class", "Max capacity", "Upkeep per boat-hour"]}>
            {[...a.boatRates]
              .sort((x, y) => x.boat_class.localeCompare(y.boat_class, undefined, { numeric: true }))
              .map((b) => (
                <TableRow key={b.key}>
                  <TableCell>{b.boat_class}</TableCell>
                  <Num>{count(b.max_capacity)}</Num>
                  <Num>{money(b.maintenance_per_boat_hour_cents)}</Num>
                </TableRow>
              ))}
          </RateTable>
        </TableSection>
      )}
      <BudgetLines costsTitle="Fixed costs and G&A" lines={a.fixedCosts} level={2} />
      {a.staffTime.length > 0 && <StaffTimeTable lines={a.staffTime} level={2} />}
      {a.closedDays.length > 0 && (
        <TableSection title="Closed days" level={2}>
          <RateTable label="Closed days" head={["Date", "Closed for"]} text={["Closed for"]}>
            {a.closedDays.map((d) => (
              <TableRow key={d.key}>
                <TableCell className="tabular-nums">{formatDay(d.date)}</TableCell>
                <TableCell>{d.name}</TableCell>
              </TableRow>
            ))}
          </RateTable>
        </TableSection>
      )}
    </div>
  );
}

/**
 * A plan's budget lines: its fixed costs, then any revenue, each under what it's charged to, such as G&A. Leaving MTDC
 * out applies only to a cost.
 */
export function BudgetLines({ costsTitle, lines, level }: { costsTitle: string; lines: FixedCost[]; level: 2 | 3 }) {
  return (
    <>
      <BudgetTable title={costsTitle} lines={lines.filter((l) => !l.revenue)} cost level={level} />
      <BudgetTable title="Other revenue" lines={lines.filter((l) => l.revenue)} cost={false} level={level} />
    </>
  );
}

function BudgetTable({
  title,
  lines,
  cost,
  level,
}: {
  title: string;
  lines: FixedCost[];
  cost: boolean;
  level: 2 | 3;
}) {
  if (lines.length === 0) {
    return null;
  }
  const groups: AccountTableGroup[] = byChargedTo(lines).map((g) => ({
    title: g.title,
    rows: byAccount(g.rows).map((c) => ({
      key: c.key,
      number: c.account.number,
      name: c.name,
      note: c.note,
      values: [money(c.amount_cents, true), ...(cost ? [leftOut(c.excluded_from_mtdc)] : [])],
    })),
  }));
  return (
    <TableSection title={title} level={level}>
      <AccountTable
        label={title}
        nameHead={cost ? "Cost" : "Revenue"}
        columns={[{ head: "Amount" }, ...(cost ? [{ head: mtdc, text: true }] : [])]}
        groups={groups}
      />
    </TableSection>
  );
}

/** Hourly staff time outside the programs, at a staff level's rate. */
export function StaffTimeTable({ lines, level }: { lines: StaffTime[]; level: 2 | 3 }) {
  const title = "Staff time outside programs";
  return (
    <TableSection title={title} level={level}>
      <AccountTable
        label={title}
        nameHead="Work"
        columns={[{ head: "Staff level", text: true }, { head: "Hours" }, { head: "Charged to", text: true }]}
        groups={[
          {
            rows: byAccount(lines).map((l) => ({
              key: l.key,
              number: l.account.number,
              name: l.name,
              note: l.note,
              values: [l.staff_level ?? none, count(l.hours), l.charged_to],
            })),
          },
        ]}
      />
    </TableSection>
  );
}
