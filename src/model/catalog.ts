/** An account in the chart of accounts. */
export interface CatalogAccount {
  id: string;
  number: string;
  name: string;
  type: "revenue" | "expense" | "asset" | "liability" | "net_assets";
  form_990_part: string | null;
  form_990_line: string | null;
  /** The functional-expense column a line booked here takes unless it sets its own. */
  default_function: "program" | "management" | "fundraising" | null;
  parent_id: string | null;
  /** The account this one offsets. */
  contra_account_id: string | null;
  /** Kept for history, and closed to new lines. */
  retired: boolean;
}

export interface CatalogProgram {
  id: string;
  name: string;
  team: boolean;
  color: string | null;
  google_group: { name: string; email: string } | null;
}

/** A lasting thing the club sells, with its program details when it's a program. */
export interface CatalogProduct {
  id: string;
  name: string;
  kind: "program" | "charter" | "storage_lease" | "merchandise" | "event_hosting" | "other";
  program_area_id: string | null;
  /** Its own revenue account, for a product in no program area. */
  revenue_account_id: string | null;
  programs: CatalogProgram[];
}

export interface CatalogArea {
  id: string;
  name: string;
  revenue_account_id: string | null;
}

/** What CSC sells: one product for one dated period, such as Guppies week 3 of summer 2027. */
export interface CatalogOffering {
  id: string;
  name: string | null;
  product_id: string;
  starts_on: string | null;
  ends_on: string | null;
  price_cents: number | null;
  capacity: number | null;
  archived_at: string | null;
}

export interface Qualification {
  id: string;
  name: string;
  /** The qualifications this one also meets a requirement for, by id. */
  covers: string[];
}

export interface CostAccount {
  cost_type: string;
  account_id: string;
}

export const accountTypes: { type: CatalogAccount["type"]; label: string }[] = [
  { type: "revenue", label: "Revenue" },
  { type: "expense", label: "Expenses" },
  { type: "asset", label: "Assets" },
  { type: "liability", label: "Liabilities" },
  { type: "net_assets", label: "Net assets" },
];

export const functionLabels: Record<NonNullable<CatalogAccount["default_function"]>, string> = {
  program: "Program services",
  management: "Management and general",
  fundraising: "Fundraising",
};

export const kindLabels: Record<CatalogProduct["kind"], string> = {
  program: "Program",
  charter: "Charter",
  storage_lease: "Storage lease",
  merchandise: "Merchandise",
  event_hosting: "Event hosting",
  other: "Other",
};

/** Each cost the planning engine works out, in the order a P&L takes them, by its name in the app. */
export const costTypes: { type: string; label: string }[] = [
  { type: "coach_wages", label: "Coach wages" },
  { type: "salaries", label: "Salaries" },
  { type: "payroll_tax", label: "Payroll tax" },
  { type: "ribs", label: "RIBs" },
  { type: "boat_maintenance", label: "Boat upkeep" },
  { type: "resources", label: "Resources" },
  { type: "travel", label: "Travel" },
  { type: "cogs", label: "Cost of goods sold" },
  { type: "card_fees", label: "Card fees" },
];

const byName = new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });

/** Accounts in chart order, by number. */
export const sortAccounts = (accounts: CatalogAccount[]) =>
  [...accounts].sort((a, b) => byName.compare(a.number, b.number));

/** "Part IX, line 7": where an account goes on Form 990, or empty when it doesn't say. */
export function form990(account: Pick<CatalogAccount, "form_990_part" | "form_990_line">): string {
  const part = account.form_990_part ? `Part ${account.form_990_part}` : "";
  const line = account.form_990_line ? `line ${account.form_990_line}` : "";
  return [part, line].filter(Boolean).join(", ");
}

/** A program area, or the products in none, with its products in name order. */
export interface AreaGroup {
  area: CatalogArea | null;
  products: CatalogProduct[];
}

/** Products under their program area, areas by name, then the products in no area. Empty groups are left out. */
export function productsByArea(areas: CatalogArea[], products: CatalogProduct[]): AreaGroup[] {
  const sorted = [...products].sort((a, b) => byName.compare(a.name, b.name));
  const groups: AreaGroup[] = [...areas]
    .sort((a, b) => byName.compare(a.name, b.name))
    .map((area) => ({ area, products: sorted.filter((p) => p.program_area_id === area.id) }));
  groups.push({ area: null, products: sorted.filter((p) => !areas.some((a) => a.id === p.program_area_id)) });
  return groups.filter((g) => g.products.length > 0);
}

/**
 * Offerings that haven't ended by `today` and aren't archived, under their program: programs by name, each program's
 * offerings by the day they start, then by name with numbers in order.
 */
export function offeringsByProgram(
  offerings: CatalogOffering[],
  products: CatalogProduct[],
  today: string,
): { program: CatalogProgram; offerings: CatalogOffering[] }[] {
  const current = offerings.filter((o) => o.archived_at === null && (o.ends_on === null || o.ends_on >= today));
  const programs = products
    .flatMap((p) => p.programs.map((program) => ({ program, productId: p.id })))
    .sort((a, b) => byName.compare(a.program.name, b.program.name));
  return programs
    .map(({ program, productId }) => ({
      program,
      offerings: current
        .filter((o) => o.product_id === productId)
        .sort(
          (a, b) => (a.starts_on ?? "").localeCompare(b.starts_on ?? "") || byName.compare(a.name ?? "", b.name ?? ""),
        ),
    }))
    .filter((g) => g.offerings.length > 0);
}
