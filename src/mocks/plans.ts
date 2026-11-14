// A made-up club's 2027 Financial Plans, for local work, stories, and tests. Never real club figures. Their results
// come from platform's own engine, run on these rows the way platform's hook runs it, so they always add up.
import { computePlan, type PlanData } from "@cyc-seattle/platform/planning";

type Row = Record<string, unknown>;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const ids = {
  org: id(1),
  summer: id(11),
  doublehanded: id(12),
  summerPlan: id(101),
  doublehandedPlan: id(102),
  opsPlan: id(103),
  // Budget, active: a copy of each plan.
  budget: id(601),
  summerBudget: id(201),
  doublehandedBudget: id(202),
  opsBudget: id(203),
  summerMember: id(611),
  doublehandedMember: id(612),
  opsMember: id(613),
  // Two coaches and Three coaches, drafts started from Budget, with Summer and the Operations Plan.
  twoCoaches: id(602),
  summerTwo: id(211),
  opsTwo: id(212),
  threeCoaches: id(603),
  firstPass: id(604),
  summerThree: id(221),
  opsThree: id(222),
  // Who saved Budget.
  saver: id(901),
};

const account = (n: number, number: string, name: string, type: string, fn: string | null) => ({
  id: id(n),
  number,
  name,
  type,
  form_990_part: null,
  form_990_line: null,
  default_function: fn,
  parent_id: null,
  contra_account_id: null,
  retired: false,
});
const accounts = {
  summer: account(21, "4100", "Summer tuition", "revenue", "program"),
  doublehanded: account(22, "4200", "Doublehanded tuition", "revenue", "program"),
  storage: account(23, "4300", "Boat storage", "revenue", "program"),
  gifts: account(24, "4500", "Individual gifts", "revenue", "fundraising"),
  wages: account(25, "5010", "Coach wages", "expense", "program"),
  tax: account(26, "5020", "Payroll tax", "expense", "program"),
  salaries: account(27, "5030", "Salaries", "expense", "management"),
  ribs: account(28, "5110", "RIBs", "expense", "program"),
  boats: account(29, "5130", "Boat upkeep", "expense", "program"),
  cards: account(30, "5310", "Card fees", "expense", "program"),
  insurance: account(31, "6110", "Insurance", "expense", "management"),
  rent: account(32, "6310", "Clubhouse rent", "expense", "management"),
  events: account(33, "7010", "Event costs", "expense", "fundraising"),
  equipment: account(34, "1510", "Equipment", "asset", null),
};

const product = (n: number, name: string, kind: string, area: string | null, revenue: string | null = null) => ({
  id: id(n),
  name,
  kind,
  revenue_account_id: revenue,
  program_area_id: area,
});
const products = {
  guppies: product(41, "Guppies", "program", ids.summer),
  opti: product(42, "Opti Camp", "program", ids.summer),
  jpod: product(43, "J-Pod", "program", ids.doublehanded),
  storage: product(44, "Boat storage", "storage_lease", null, accounts.storage.id),
  otters: product(45, "Sea Otters", "program", ids.summer),
  sailqube: product(46, "Sailqube Camp", "program", ids.summer),
  c420: product(47, "420 Camp", "program", ids.summer),
  keelboat: product(48, "Keelboat Camp", "program", ids.summer),
  adventure: product(49, "Adventure Camp", "program", ids.summer),
};

const boatClass = (n: number, name: string, sailors: number) => ({
  id: id(n),
  name,
  sailors_per_boat: sailors,
  footprint_sq_ft: null,
});
const boatClasses = {
  opti: boatClass(51, "Opti", 1),
  sailqube: boatClass(52, "Sailqube", 2),
  c420: boatClass(53, "420", 2),
  keelboat: boatClass(55, "Keelboat", 4),
};
const rib = { id: id(54), name: "RIB" };

const catalog = {
  organization: { id: ids.org, name: "Example Sailing Club", fiscal_year_start_month: 1 },
  organization_cost_accounts: (
    [
      ["coach_wages", accounts.wages],
      ["salaries", accounts.salaries],
      ["payroll_tax", accounts.tax],
      ["ribs", accounts.ribs],
      ["boat_maintenance", accounts.boats],
      ["resources", accounts.ribs],
      ["travel", accounts.wages],
      ["cogs", accounts.boats],
    ] as const
  ).map(([cost_type, a], i) => ({ id: id(60 + i), organization_id: ids.org, cost_type, account_id: a.id })),
  products: Object.values(products),
  program_areas: [
    { id: ids.summer, name: "Summer", revenue_account_id: accounts.summer.id },
    { id: ids.doublehanded, name: "Doublehanded", revenue_account_id: accounts.doublehanded.id },
  ],
  accounts: Object.values(accounts),
  qualifications: [],
  qualification_covers: [],
  boat_classes: Object.values(boatClasses),
  resource_kinds: [rib],
};

const plans = [
  { id: ids.summerPlan, name: "Summer 2027", kind: "program_area", program_area_id: ids.summer },
  { id: ids.doublehandedPlan, name: "Doublehanded 2027", kind: "program_area", program_area_id: ids.doublehanded },
  { id: ids.opsPlan, name: "Operations 2027", kind: "operations", program_area_id: null },
].map((p) => ({ ...p, organization_id: ids.org, fiscal_year: 2027 }));

/** Keys stay the same in every copy, as platform keeps them, so rows that name others by key match across copies. */
const key = (name: string) => `key:${name}`;

/** Rows of a plan copy, each with an id of its own, its copy, and its key. */
class Copy {
  rows: Record<string, Row[]> = {};
  constructor(readonly version: string) {}
  add(table: string, name: string, fields: Row): string {
    const row = { id: `${this.version}:${name}`, version_id: this.version, key: key(name), ...fields };
    (this.rows[table] ??= []).push(row);
    return row.id;
  }
}

const date = (start: string, days: number) => {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const budgetLine = (
  c: Copy,
  name: string,
  a: { id: string },
  cents: number,
  type: string,
  center: string | null,
  more: Row = {},
) =>
  c.add("plan_budget_lines", name, {
    name,
    account_id: a.id,
    function: null,
    cost_center_type: type,
    cost_center_key: center,
    amount_cents: cents,
    fiscal_year: 2027,
    excluded_from_mtdc: false,
    note: null,
    ...more,
  });

const laborLine = (
  c: Copy,
  name: string,
  level: string,
  hours: number,
  type: string,
  center: string | null,
  a: { id: string },
) =>
  c.add("plan_labor_lines", name, {
    name,
    cost_center_type: type,
    cost_center_key: center,
    staff_level_key: key(level),
    hours,
    account_id: a.id,
    function: null,
    note: null,
  });

/** The Operations Plan: the year's rates, the shared costs, boat storage, fundraising, and a coach boat. */
function operations(version: string): Copy {
  const c = new Copy(version);
  c.add("plan_rates", "rates", {
    payroll_tax_rate: 0.1,
    lodging_per_night_cents: 15_000,
    mileage_rate_cents: 70,
    rib_resource_kind_id: rib.id,
  });
  const level = (name: string, cents: number) =>
    c.add("plan_staff_levels", name, { name, pay_type: "hourly", hourly_rate_cents: cents });
  level("Junior Instructor", 1_900);
  level("Level 1 Instructor", 2_200);
  level("Level 3 Coach", 3_200);
  const ga = c.add("plan_pools", "G&A", { name: "G&A" });
  const admin = c.add("plan_pools", "Program admin", { name: "Program admin" });
  const position = (name: string, salary: number, share: number, pool: string, coaching: number | null = null) =>
    c.add("plan_salaried_positions", name, {
      name,
      annual_salary_cents: salary,
      paid_hours_per_year: 2_080,
      ga_share: share,
      remainder_pool_id: pool,
      hourly_coaching_rate_cents: coaching,
    });
  position("Executive Director", 5_500_000, 0.6, ga);
  const director = position("Program Director", 4_500_000, 0.1, admin, 3_000);
  c.add("plan_salaried_bookings", "Program Director on Guppies", {
    position_id: director,
    product_id: products.guppies.id,
    program_area_id: null,
    kind: "management",
    hours: 200,
  });
  c.add("plan_resources", "RIBs", {
    resource_kind_id: rib.id,
    name: "RIBs",
    quantity: 8,
    cost_per_hour_cents: 0,
    cost_per_day_cents: 1_000,
    fuel_per_hour_cents: 1_500,
    maintenance_per_hour_cents: 800,
    excluded_from_mtdc: false,
  });
  for (const [boat, cents, quantity] of [
    [boatClasses.opti, 150, 20],
    [boatClasses.sailqube, 200, 12],
    [boatClasses.keelboat, 900, 2],
    [boatClasses.c420, 300, 10],
  ] as const) {
    c.add("plan_boat_rates", boat.name, { boat_class_id: boat.id, maintenance_per_boat_hour_cents: cents, quantity });
  }
  c.add("plan_revenue_charges", "Card fees", {
    name: "Card fees",
    rate: 0.03,
    product_kinds: ["program"],
    account_id: accounts.cards.id,
    excluded_from_mtdc: false,
    note: "What the card processor charged last year.",
  });
  const bonus = c.add("plan_bonus_owners", "Program Director bonus", {
    role_name: "Program Director",
    bonus_rate: 0.05,
    account_id: accounts.salaries.id,
    basis: "after_shared_costs",
    position_key: key("Program Director"),
  });
  for (const p of [products.guppies, products.opti, products.jpod]) {
    c.add("plan_bonus_owner_products", `bonus ${p.name}`, { bonus_owner_id: bonus, product_id: p.id });
  }
  const line = (name: string, a: { id: string }, cents: number, type: string, center: string | null, more: Row = {}) =>
    budgetLine(c, name, a, cents, type, center, more);
  line("Insurance", accounts.insurance, 900_000, "pool", key("G&A"), { note: "Renews in March." });
  line("Audit", accounts.insurance, 400_000, "pool", key("G&A"), { excluded_from_mtdc: true });
  line("Clubhouse rent", accounts.rent, 600_000, "pool", key("G&A"));
  line("Spring gala gifts", accounts.gifts, 2_000_000, "org", null);
  line("Spring gala costs", accounts.events, 300_000, "org", null);
  const capital = (name: string, cents: number, sort: number, more: Row = {}) =>
    c.add("plan_capital_items", name, {
      name,
      amount_cents: cents,
      account_id: accounts.equipment.id,
      sort,
      note: null,
      link: null,
      ...more,
    });
  capital("Coach boat", 3_500_000, 1, {
    note: "Replaces the oldest RIB, which failed its survey.",
    link: "https://example.org/coach-boat-quote",
  });
  capital("Six Optis", 2_100_000, 2);
  capital("Float repairs", 1_200_000, 3);
  capital("Sail locker", 500_000, 4);
  // Capital entered the old way, as a budget line, which has no rank.
  line("Trailer", accounts.equipment, 500_000, "org", null);
  line("Storage dock upkeep", accounts.boats, 300_000, "offering", key("Boat storage"));
  laborLine(c, "Winter boat repairs", "Level 1 Instructor", 120, "pool", key("Program admin"), accounts.boats);
  c.add("plan_closed_dates", "Fourth of July", { date: "2027-07-05", name: "Independence Day, observed" });
  c.add("plan_offerings", "Boat storage", {
    product_id: products.storage.id,
    name: "Boat storage 2027",
    season_term: null,
    starts_on: "2027-01-01",
    ends_on: "2027-12-31",
    capacity: 40,
    target_enrollment: 36,
    fill_rate: null,
    price_cents: 60_000,
    cogs_rate: null,
    note: null,
  });
  return c;
}

const offering = (
  c: Copy,
  name: string,
  p: { id: string },
  session: string,
  starts_on: string,
  ends_on: string,
  fields: { capacity: number; target: number; price: number; cogs?: number; note?: string },
) =>
  c.add("plan_offerings", name, {
    product_id: p.id,
    name,
    season_term: session,
    starts_on,
    ends_on,
    capacity: fields.capacity,
    target_enrollment: fields.target,
    fill_rate: null,
    price_cents: fields.price,
    cogs_rate: fields.cogs ?? null,
    note: fields.note ?? null,
  });

const activity = (
  c: Copy,
  name: string,
  offeringId: string,
  on: string,
  start: string,
  end: string,
  block: string | null,
) =>
  c.add("plan_activities", name, {
    offering_id: offeringId,
    trip_id: null,
    date: on,
    start_time: start,
    end_time: end,
    on_water_minutes: null,
    setup_minutes: 30,
    putaway_minutes: 30,
    kind: "practice",
    uses_boats: true,
    block_id: block,
  });

/** A block on a date, with its staff at one level, its RIBs, and its boats: the club's, and any sailors bring. */
function block(
  c: Copy,
  name: string,
  on: string,
  staff: [level: string, count: number],
  ribs: number,
  boats: [boat: { id: string; name: string }, count: number, owned?: number][],
): string {
  const b = c.add("plan_activity_blocks", name, { date: on, name });
  c.add("plan_block_staff", `${name} staff`, {
    block_id: b,
    staff_level_key: key(staff[0]),
    position_key: null,
    count: staff[1],
    pay: null,
  });
  c.add("plan_block_resources", `${name} RIBs`, {
    block_id: b,
    resource_key: key("RIBs"),
    quantity: ribs,
    hours: null,
  });
  for (const [boat, count, owned] of boats) {
    c.add("plan_block_boats", `${name} ${boat.name}`, {
      block_id: b,
      boat_class_id: boat.id,
      count,
      sailor_owned: owned ?? null,
    });
  }
  return b;
}

/**
 * Summer: seven camps in four blocks each weekday for nine weeks. Week 3 starts on a closed day, week 2 has an
 * instructor too few on the dock, and week 4 takes more Sailqubes than the club has. `instructors` is how many the
 * morning dock gets.
 */
function summer(version: string, instructors: number): Copy {
  const c = new Copy(version);
  const settings = (p: { id: string; name: string }, level: string, perCoach: number, rules: string | null) =>
    c.add("plan_programs", `${p.name} settings`, {
      product_id: p.id,
      staff_level_key: key(level),
      sailors_per_coach: perCoach,
      rules,
    });
  settings(
    products.guppies,
    "Level 1 Instructor",
    10,
    "If there are more than 12 Guppies, add a Junior Instructor.\nGuppies sail Sailqubes.",
  );
  settings(products.otters, "Level 1 Instructor", 10, null);
  settings(products.opti, "Level 1 Instructor", 8, "Never fewer than 2 instructors on the water.");
  settings(products.sailqube, "Level 1 Instructor", 8, null);
  settings(products.c420, "Level 3 Coach", 8, null);
  settings(products.keelboat, "Level 3 Coach", 6, null);
  settings(products.adventure, "Level 1 Instructor", 8, null);
  budgetLine(c, "Tent rental", accounts.boats, 180_000, "program_area", ids.summer, { excluded_from_mtdc: true });
  laborLine(c, "Camp setup", "Level 1 Instructor", 40, "program_area", ids.summer, accounts.wages);
  // Each camp: its product, the weeks it runs, its sailors, its fee, and its time of day.
  const camps = [
    { p: products.guppies, weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9], max: 10, target: 9, price: 39_500, end: "12:00:00" },
    { p: products.otters, weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9], max: 12, target: 10, price: 39_500, end: "12:00:00" },
    { p: products.opti, weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9], max: 16, target: 14, price: 52_500, end: "15:00:00" },
    { p: products.sailqube, weeks: [1, 2, 3, 4, 5, 6, 7, 8], max: 12, target: 10, price: 52_500, end: "15:00:00" },
    { p: products.c420, weeks: [2, 3, 4, 5, 6, 7, 8], max: 12, target: 9, price: 61_000, end: "15:00:00" },
    { p: products.keelboat, weeks: [2, 4, 6, 8], max: 8, target: 6, price: 65_000, end: "15:00:00" },
    { p: products.adventure, weeks: [1, 3, 5, 7, 9], max: 16, target: 12, price: 48_000, end: "15:00:00" },
  ];
  // The camps that share each block, and what the block has.
  const blocks: {
    name: string;
    camps: string[];
    staff: [string, number];
    ribs: number;
    boats: (week: number) => [{ id: string; name: string }, number][];
  }[] = [
    {
      name: "Morning dock",
      camps: ["Guppies", "Sea Otters"],
      staff: ["Level 1 Instructor", instructors],
      ribs: 2,
      boats: (week) => [[boatClasses.sailqube, week === 4 ? 9 : 6]],
    },
    {
      name: "Day camps",
      camps: ["Opti Camp", "Sailqube Camp"],
      staff: ["Level 1 Instructor", 4],
      ribs: 2,
      boats: () => [
        [boatClasses.opti, 14],
        [boatClasses.sailqube, 5],
      ],
    },
    {
      name: "Big boats",
      camps: ["420 Camp", "Keelboat Camp"],
      staff: ["Level 3 Coach", 2],
      ribs: 2,
      boats: () => [
        [boatClasses.c420, 6],
        [boatClasses.keelboat, 2],
      ],
    },
    { name: "Adventure", camps: ["Adventure Camp"], staff: ["Level 1 Instructor", 2], ribs: 1, boats: () => [] },
  ];
  for (let week = 1; week <= 9; week++) {
    const monday = date("2027-06-21", 7 * (week - 1));
    const session = `Week ${week}`;
    const running = camps
      .filter((camp) => camp.weeks.includes(week))
      .map((camp) => ({
        ...camp,
        id: offering(c, `${camp.p.name} ${session}`, camp.p, session, monday, date(monday, 4), {
          capacity: camp.max,
          target: week === 1 && camp.p === products.guppies ? 6 : camp.target,
          price: camp.price,
          ...(camp.p === products.opti && { cogs: 0.04 }),
          ...(camp.p === products.opti && week === 1 && { note: "Lunch is included." }),
        }),
      }));
    for (let day = 0; day < 5; day++) {
      const on = date(monday, day);
      for (const shared of blocks) {
        const own = running.filter((camp) => shared.camps.includes(camp.p.name));
        if (own.length === 0) {
          continue;
        }
        const staff: [string, number] =
          shared.name === "Morning dock" && week === 2 ? [shared.staff[0], shared.staff[1] - 1] : shared.staff;
        const b = block(c, `${shared.name} ${on}`, on, staff, shared.ribs, shared.boats(week));
        for (const camp of own) {
          activity(c, `${camp.p.name} ${on}`, camp.id, on, "09:00:00", camp.end, b);
        }
      }
    }
  }
  return c;
}

/** Doublehanded: J-Pod's spring and fall seasons, one practice a week. Its last fall practice has no block yet. */
function doublehanded(version: string): Copy {
  const c = new Copy(version);
  c.add("plan_programs", "J-Pod settings", {
    product_id: products.jpod.id,
    staff_level_key: key("Level 3 Coach"),
    sailors_per_coach: 8,
    rules: "Most sailors bring their own 420s.",
  });
  for (const [session, first, weeks, target] of [
    ["Spring", "2027-03-02", 12, 12],
    ["Fall", "2027-09-07", 10, 10],
  ] as const) {
    const o = offering(c, `J-Pod ${session}`, products.jpod, session, first, date(first, 7 * (weeks - 1)), {
      capacity: 16,
      target,
      price: 145_000,
    });
    if (session === "Fall") {
      c.add("plan_trips", "Fall regatta", {
        offering_id: o,
        name: "Fall regatta",
        nights: 2,
        airfare_cents: null,
        miles: 240,
      });
    }
    for (let week = 0; week < weeks; week++) {
      const on = date(first, 7 * week);
      const last = session === "Fall" && week === weeks - 1;
      const b = last ? null : block(c, `J-Pod ${on}`, on, ["Level 3 Coach", 2], 2, [[boatClasses.c420, 3, 3]]);
      activity(c, `J-Pod ${on}`, o, on, "16:00:00", "19:00:00", b);
    }
  }
  return c;
}

const copies = {
  [ids.summerBudget]: summer(ids.summerBudget, 3),
  [ids.doublehandedBudget]: doublehanded(ids.doublehandedBudget),
  [ids.opsBudget]: operations(ids.opsBudget),
  [ids.summerTwo]: summer(ids.summerTwo, 4),
  [ids.opsTwo]: operations(ids.opsTwo),
  [ids.summerThree]: summer(ids.summerThree, 5),
  [ids.opsThree]: operations(ids.opsThree),
};

const rules: Record<string, string | null> = {
  [ids.summerBudget]: "Guppies and Opti Camp share the dock in the morning.\nNo sailing on Monday, July 5.",
  [ids.doublehandedBudget]: null,
  [ids.opsBudget]: "No more than 4 RIBs on the water at once.\nKeep one RIB ashore for repairs on summer weekdays.",
};

const set = (setId: string, fields: Row) => ({
  id: setId,
  organization_id: ids.org,
  fiscal_year: 2027,
  saved_at: null,
  saved_by: null,
  platform_version: null,
  message: null,
  parent_id: null,
  archived_at: null,
  ...fields,
});
const budget = set(ids.budget, {
  name: "Budget",
  status: "active",
  message: "Reviewed with the board",
  saved_at: "2027-03-10T18:00:00Z",
  saved_by: ids.saver,
  platform_version: "1.38.1+engine.0a1b2c3d4e5f",
});
const parent = { id: ids.budget, name: "Budget" };
const twoCoaches = set(ids.twoCoaches, {
  name: "Two coaches",
  status: "draft",
  parent_id: parent,
  message: "A fourth instructor on every summer morning.",
});
const threeCoaches = set(ids.threeCoaches, { name: "Three coaches", status: "draft", parent_id: parent });
// Frozen before Budget, then archived. It holds no plans, so only Planning's list shows it.
const firstPass = set(ids.firstPass, {
  name: "First pass",
  status: "saved",
  saved_at: "2027-02-14T18:00:00Z",
  saved_by: ids.saver,
  platform_version: "1.37.0+engine.0a1b2c3d4e5f",
  archived_at: "2027-03-10T18:05:00Z",
});

const members: { id: string; set: Row; version: string; plan: string }[] = [
  { id: ids.summerMember, set: budget, version: ids.summerBudget, plan: ids.summerPlan },
  { id: ids.doublehandedMember, set: budget, version: ids.doublehandedBudget, plan: ids.doublehandedPlan },
  { id: ids.opsMember, set: budget, version: ids.opsBudget, plan: ids.opsPlan },
  { id: id(621), set: twoCoaches, version: ids.summerTwo, plan: ids.summerPlan },
  { id: id(622), set: twoCoaches, version: ids.opsTwo, plan: ids.opsPlan },
  { id: id(631), set: threeCoaches, version: ids.summerThree, plan: ids.summerPlan },
  { id: id(632), set: threeCoaches, version: ids.opsThree, plan: ids.opsPlan },
];

const versioned = [
  "plan_programs",
  "plan_offerings",
  "plan_trips",
  "plan_activities",
  "plan_activity_blocks",
  "plan_block_staff",
  "plan_block_resources",
  "plan_block_boats",
  "plan_labor_lines",
  "plan_budget_lines",
  "plan_rates",
  "plan_revenue_charges",
  "plan_staff_levels",
  "plan_salaried_positions",
  "plan_salaried_bookings",
  "plan_resources",
  "plan_boat_rates",
  "plan_pools",
  "plan_bonus_owners",
  "plan_bonus_owner_products",
  "plan_closed_dates",
  "plan_capital_items",
] as const;

const rowsOf = (versions: string[], table: string) => versions.flatMap((v) => copies[v]?.rows[table] ?? []);

/** A Financial Plan's results, as platform's hook works them out and writes them. */
function results(setRow: Row, calculatedAt: string): Record<string, Row[]> {
  const own = members.filter((m) => m.set === setRow);
  const versions = own.map((m) => m.version);
  const data = {
    ...catalog,
    fiscal_year: 2027,
    rib_resource_kind_id: rib.id,
    plans: plans.filter((p) => own.some((m) => m.plan === p.id)),
    plan_versions: own.map((m) => ({ id: m.version, plan_id: m.plan })),
    ...Object.fromEntries(versioned.map((table) => [table, rowsOf(versions, table)])),
  } as unknown as PlanData;
  const out = computePlan(data);
  const memberOf = (version: string | undefined) => own.find((m) => m.version === version)?.id ?? null;
  const operations = own.find((m) => m.plan === ids.opsPlan)?.version;
  const areaVersion = (area: string | null | undefined) =>
    own.find((m) => plans.find((p) => p.id === m.plan)?.program_area_id === area)?.version ?? operations;
  const offerings = new Map((data.plan_offerings as unknown as Row[]).map((o) => [o["key"], o]));
  const ownerOf = (type: string, subject: string | null) => {
    if (type === "offering") {
      return offerings.get(subject)?.["version_id"] as string | undefined;
    }
    if (type === "product") {
      return areaVersion(catalog.products.find((p) => p.id === subject)?.program_area_id);
    }
    if (type === "program_area") {
      return areaVersion(subject);
    }
    return operations;
  };
  const accountOf = (accountId: string) => {
    const a = catalog.accounts.find((x) => x.id === accountId)!;
    return { id: a.id, type: a.type, number: a.number, name: a.name };
  };
  const setId = setRow["id"];
  return {
    plan_results: [
      {
        version_set_id: setId,
        calculated_at: calculatedAt,
        operating_revenue_cents: out.organization.operating.revenue_cents,
        operating_expense_cents: out.organization.operating.expense_cents,
        operating_net_cents: out.organization.operating.net_cents,
        fundraising_revenue_cents: out.organization.fundraising.revenue_cents,
        fundraising_expense_cents: out.organization.fundraising.expense_cents,
        fundraising_net_cents: out.organization.fundraising.net_cents,
        capital_cents: out.organization.capital_cents,
        total_cents: out.organization.total_cents,
      },
    ],
    plan_result_lines: out.lines.map((l) => ({
      version_set_id: setId,
      version_set_member_id: memberOf(ownerOf(l.cost_center_type, l.cost_center_key)),
      line: l.line_key,
      line_name: l.line_name,
      cost_center_key: l.cost_center_key,
      cost_center_type: l.cost_center_type,
      amount_cents: l.amount_cents,
      function: l.function,
      explanation: l.explanation,
      account_id: accountOf(l.account_id),
    })),
    plan_result_pnl: out.pnl.map((p) => ({
      version_set_id: setId,
      version_set_member_id: memberOf(ownerOf(p.level, p.key)),
      level: p.level,
      subject_key: p.key,
      name: p.key,
      revenue_cents: p.revenue_cents,
      expense_cents: p.expense_cents,
      enrollment: p.enrollment,
      days: p.days,
      sailor_days: p.sailor_days,
      // The engine gives these from cyc-seattle/platform#258 on; an older package leaves them out.
      allocation_holds: (p as { allocation_holds?: number | null }).allocation_holds ?? null,
      breakeven_enrollment: (p as { breakeven_enrollment?: number | null }).breakeven_enrollment ?? null,
    })),
    plan_result_capital: out.capital.map((item) => ({
      version_set_id: setId,
      rank: item.rank,
      item_key: item.key,
      name: item.name,
      amount_cents: item.amount_cents,
      running_cents: item.running_cents,
      funded: item.funded,
    })),
    plan_result_warnings: out.warnings.map((w) => ({
      version_set_id: setId,
      version_set_member_id: memberOf(w.version_id),
      code: w.code,
      message: w.message,
      category: w.category,
      date: w.date ?? null,
    })),
  };
}

// Budget's results, as platform worked them out when it was saved, and Two coaches', after its latest change. Three
// coaches' are still being worked out.
const worked = [results(budget, "2027-03-10T18:00:00Z"), results(twoCoaches, "2027-04-02T23:05:00Z")];
const resultTables = Object.fromEntries(
  ["plan_results", "plan_result_lines", "plan_result_pnl", "plan_result_warnings", "plan_result_capital"].map(
    (table) => [table, worked.flatMap((r) => r[table] ?? [])],
  ),
);
resultTables["plan_results"]!.push({ ...worked[0]!["plan_results"]![0]!, version_set_id: ids.firstPass });

const versions = Object.keys(copies);
const named = (row: { id: string; name: string }) => ({ id: row.id, name: row.name });

/** Each table's rows, as Directus would return them, with relations expanded where the app asks for them. */
export const tables: Record<string, Row[]> = {
  directus_users: [{ id: ids.saver, first_name: "Morgan", last_name: "Keel" }],
  organizations: [catalog.organization],
  organization_cost_accounts: catalog.organization_cost_accounts,
  program_areas: catalog.program_areas,
  accounts: catalog.accounts,
  products: catalog.products,
  boat_classes: catalog.boat_classes,
  resource_kinds: catalog.resource_kinds,
  plans,
  version_sets: [budget, twoCoaches, threeCoaches, firstPass],
  // version_set_id and plan_id are expanded when a request asks for their fields.
  version_set_members: members.map((m) => {
    const p = plans.find((x) => x.id === m.plan)!;
    const area = catalog.program_areas.find((a) => a.id === p.program_area_id);
    return {
      id: m.id,
      version_set_id: m.set,
      version_id: m.version,
      plan_id: { ...p, program_area_id: area ? named(area) : null },
    };
  }),
  plan_versions: members.map((m) => ({
    id: m.version,
    plan_id: m.plan,
    status: m.set["status"] === "draft" ? "draft" : "saved",
    message: null,
    saved_at: m.set["saved_at"],
    rules: rules[m.version] ?? null,
  })),
  ...Object.fromEntries(versioned.map((table) => [table, rowsOf(versions, table)])),
  // Expanded as the app asks for them: the products, accounts, pools and positions rows name.
  plan_programs: rowsOf(versions, "plan_programs").map((r) => ({
    ...r,
    product_id: named(catalog.products.find((p) => p.id === r["product_id"])!),
  })),
  // A program's own row, with the color a Catalog Writer gave Guppies; the rest take one from the palette.
  plan_offerings: rowsOf(versions, "plan_offerings").map((r) => {
    const product = catalog.products.find((p) => p.id === r["product_id"])!;
    const programs =
      product.kind === "program"
        ? [{ id: `program-${product.id}`, color: product.id === products.guppies.id ? "#0274c7" : null }]
        : [];
    return { ...r, product_id: { ...named(product), programs } };
  }),
  plan_boat_rates: rowsOf(versions, "plan_boat_rates").map((r) => ({
    ...r,
    boat_class_id: catalog.boat_classes.find((b) => b.id === r["boat_class_id"])!,
  })),
  plan_block_boats: rowsOf(versions, "plan_block_boats").map((r) => ({
    ...r,
    boat_class_id: catalog.boat_classes.find((b) => b.id === r["boat_class_id"])!,
  })),
  plan_rates: rowsOf(versions, "plan_rates").map((r) => ({
    ...r,
    rib_resource_kind_id: catalog.resource_kinds.find((k) => k.id === r["rib_resource_kind_id"]) ?? null,
  })),
  plan_salaried_positions: rowsOf(versions, "plan_salaried_positions").map((r) => ({
    ...r,
    remainder_pool_id: rowsOf(versions, "plan_pools").find((p) => p["id"] === r["remainder_pool_id"]) ?? null,
  })),
  ...Object.fromEntries(
    ["plan_revenue_charges", "plan_bonus_owners", "plan_budget_lines", "plan_labor_lines"].map((table) => [
      table,
      rowsOf(versions, table).map((r) => ({
        ...r,
        account_id: catalog.accounts.find((a) => a.id === r["account_id"])!,
      })),
    ]),
  ),
  plan_bonus_owner_products: rowsOf(versions, "plan_bonus_owner_products").map((r) => ({
    ...r,
    product_id: named(catalog.products.find((p) => p.id === r["product_id"])!),
  })),
  plan_salaried_bookings: rowsOf(versions, "plan_salaried_bookings").map((r) => ({
    ...r,
    position_id: rowsOf(versions, "plan_salaried_positions").find((p) => p["id"] === r["position_id"])!,
    product_id: catalog.products.find((p) => p.id === r["product_id"]) ?? null,
    program_area_id: catalog.program_areas.find((a) => a.id === r["program_area_id"]) ?? null,
  })),
  ...resultTables,
};
