import type { PlanLine } from "./financial-plans.ts";

/** One line item in a category: every line by that name added up, such as coach wages across the offerings. */
export interface LineItem {
  name: string;
  cents: number;
}

/** A category, which is an account in the chart of accounts, with its line items, largest first, and its total. */
export interface Category {
  number: string | null;
  name: string;
  items: LineItem[];
  cents: number;
}

type Line = Pick<PlanLine, "name" | "account_number" | "account_name" | "amount_cents">;

/** Lines by category, in account-number order, each line item added up by name. */
export function categories(lines: Line[]): Category[] {
  const byAccount = new Map<string, { number: string | null; name: string; items: Map<string, number> }>();
  for (const line of lines) {
    const id = `${line.account_number ?? ""} ${line.account_name}`;
    const category = byAccount.get(id) ?? { number: line.account_number, name: line.account_name, items: new Map() };
    category.items.set(line.name, (category.items.get(line.name) ?? 0) + line.amount_cents);
    byAccount.set(id, category);
  }
  return [...byAccount.values()]
    .map(({ number, name, items }) => {
      const sorted = [...items].map(([item, cents]) => ({ name: item, cents })).sort((a, b) => b.cents - a.cents);
      return { number, name, items: sorted, cents: sorted.reduce((sum, i) => sum + i.cents, 0) };
    })
    .sort(
      (a, b) =>
        (a.number ?? "￿").localeCompare(b.number ?? "￿", undefined, { numeric: true }) || a.name.localeCompare(b.name),
    );
}

/** A plan's revenue, its expenses, and its capital, such as a coach boat, which fundraising pays for, each by category. */
export function statement(lines: PlanLine[]): { revenue: Category[]; expenses: Category[]; capital: Category[] } {
  return {
    revenue: categories(lines.filter((l) => l.revenue)),
    expenses: categories(lines.filter((l) => !l.revenue && !l.capital)),
    capital: categories(lines.filter((l) => l.capital)),
  };
}

/**
 * Each shared cost at its full amount, such as G&A's insurance, added back up from every offering's share of it. The
 * engine divides a pool's lines among every offering, so the Operations Plan that holds them has none of its own.
 */
export function sharedCosts(lines: PlanLine[]): PlanLine[] {
  const byKey = new Map<string, PlanLine>();
  for (const line of lines) {
    if (!line.key.startsWith("pool:")) {
      continue;
    }
    const sum = byKey.get(line.key);
    byKey.set(
      line.key,
      sum
        ? { ...sum, amount_cents: sum.amount_cents + line.amount_cents }
        : { ...line, name: line.name.replace(" share: ", ": "), cost_center_name: "Every offering", member: null },
    );
  }
  return [...byKey.values()];
}
