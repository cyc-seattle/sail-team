// A made-up club's 2027 Financial Plans, for local work, stories, and tests. Never real club figures. Their results
// come from platform's own engine, run on these rows the way platform's hook runs it, so they always add up.
import { computePlan, type PlanData } from "@cyc-seattle/platform/planning";

type Row = Record<string, unknown>;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const ids = {
  org: id(1),
  summer: id(11),
  doublehanded: id(12),
  // Budget, active: Summer's, Doublehanded's and the Operations Plan.
  budget: id(601),
  summerBudget: id(201),
  doublehandedBudget: id(202),
  opsBudget: id(203),
  // Two coaches and Three coaches, drafts started from Budget, with Summer and the Operations Plan.
  twoCoaches: id(602),
  summerTwo: id(211),
  opsTwo: id(212),
  threeCoaches: id(603),
  firstPass: id(604),
  summerThree: id(221),
  opsThree: id(222),
  // Who froze Budget.
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
  occupancy: account(35, "7350", "Occupancy/Rent", "expense", null),
  // The Storage sub-account the Storage tab reads (cyc-seattle/platform#251).
  storageCosts: { ...account(36, "7351", "Storage", "expense", null), parent_id: id(35) },
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

const boatClass = (n: number, name: string, sailors: number, account: string | null = null) => ({
  id: id(n),
  name,
  max_capacity: sailors,
  footprint_sq_ft: null,
  account_id: account,
});
const boatClasses = {
  opti: boatClass(51, "Opti", 1),
  sailqube: boatClass(52, "Sailqube", 2),
  c420: boatClass(53, "420", 2),
  rib: boatClass(54, "RIB", 0, accounts.ribs.id),
  keelboat: boatClass(55, "Keelboat", 4),
};

/** The staff levels, a role at a grade, which each Operations Plan sets a rate for. */
const staffRoles = [
  { id: id(91), name: "Instructor", sort: 1 },
  { id: id(92), name: "Coach", sort: 2 },
];
const staffLevels = (
  [
    [94, "Junior Instructor", 0, "junior"],
    [95, "Instructor", 0, "standard"],
    [96, "Senior Instructor", 0, "senior"],
    [97, "Volunteer Coach", 1, "volunteer"],
    [98, "Coach", 1, "standard"],
    [99, "Head Coach", 1, "head"],
  ] as const
).map(([n, name, role, grade]) => ({ id: id(n), name, role_id: staffRoles[role]!.id, grade }));
/** A staff level's id, by its name. */
const levelId = (name: string) => staffLevels.find((l) => l.name === name)!.id;

/** The club's boats of each class, on the asset list, which the engine counts on each day. */
const fleet = (
  [
    [boatClasses.opti, 20, "sailboat"],
    [boatClasses.sailqube, 12, "sailboat"],
    [boatClasses.c420, 10, "sailboat"],
    [boatClasses.keelboat, 2, "sailboat"],
    [boatClasses.rib, 8, "powerboat"],
  ] as const
).flatMap(([boat, count, kind]) =>
  Array.from({ length: count }, (_, i) => ({ boat, kind, name: `${boat.name} ${i + 1}` })),
);
const assets = fleet.map((b, i) => ({
  id: id(7000 + i),
  kind: b.kind,
  name: b.name,
  acquired_on: null,
  disposed_on: null,
}));
const boats = fleet.map((b, i) => ({ id: id(8000 + i), asset_id: id(7000 + i), boat_class_id: b.boat.id }));

const catalog = {
  organization: { id: ids.org, name: "Example Sailing Club", fiscal_year_start_month: 1 },
  organization_cost_accounts: (
    [
      ["coach_wages", accounts.wages],
      ["salaries", accounts.salaries],
      ["payroll_tax", accounts.tax],
      ["ribs", accounts.ribs],
      ["boat_maintenance", accounts.boats],
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
  staff_roles: staffRoles,
  staff_levels: staffLevels,
  assets,
  boats,
};

/** Keys stay the same in every copy, as platform keeps them, so rows that name others by key match across copies. */
const key = (name: string) => `key:${name}`;
/** A term's row name in the Operations Plan, such as "Term Summer 2027", which its key comes from. */
const termRow = (name: string) => `Term ${name}`;

/** Rows of a plan, each with an id of its own, its plan, and its key. */
class Copy {
  rows: Record<string, Row[]> = {};
  constructor(readonly plan: string) {}
  add(table: string, name: string, fields: Row): string {
    const row = { id: `${this.plan}:${name}`, plan_id: this.plan, key: key(name), ...fields };
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
    in_mtdc: true,
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
    staff_level_id: levelId(level),
    hours,
    account_id: a.id,
    function: null,
    note: null,
  });

/** The Operations Plan: the year's rates, the shared costs, boat storage, fundraising, and a coach boat. */
function operations(plan: string): Copy {
  const c = new Copy(plan);
  c.add("plan_rates", "rates", {
    lodging_per_night_cents: 15_000,
    mileage_rate_cents: 70,
  });
  const tax = (name: string, sort: number, fields: Row) =>
    c.add("plan_payroll_taxes", name, { name, wage_share: null, hourly_cents: null, sort, ...fields });
  tax("Social Security", 1, { wage_share: 0.062 });
  tax("Medicare", 2, { wage_share: 0.0145 });
  tax("WA unemployment", 3, { wage_share: 0.0027 });
  tax("L&I", 4, { hourly_cents: 45.235 });
  const level = (name: string, cents: number) =>
    c.add("plan_staff_levels", name, { staff_level_id: levelId(name), hourly_rate_cents: cents });
  level("Junior Instructor", 0);
  level("Instructor", 2_200);
  level("Coach", 3_200);
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
    hours: 200,
  });
  for (const [boat, upkeep, fuel] of [
    [boatClasses.opti, 150, 50],
    [boatClasses.sailqube, 200, 50],
    [boatClasses.keelboat, 900, 400],
    [boatClasses.c420, 300, 50],
    [boatClasses.rib, 800, 1_500],
  ] as const) {
    c.add("plan_boat_rates", boat.name, {
      boat_class_id: boat.id,
      maintenance_per_boat_hour_cents: upkeep,
      fuel_per_hour_cents: fuel,
      charter_per_day_cents: boat === boatClasses.rib ? 10_000 : null,
    });
  }
  c.add("plan_revenue_charges", "Card fees", {
    name: "Card fees",
    rate: 0.03,
    product_kinds: ["program"],
    account_id: accounts.cards.id,
    in_mtdc: true,
    note: "What the card processor charged *last year*.",
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
  line("Audit", accounts.insurance, 400_000, "pool", key("G&A"), { in_mtdc: false });
  line("Clubhouse rent", accounts.rent, 600_000, "pool", key("G&A"));
  // Each area's storage rent, charged to the area, and what's left for every program to share.
  const storage = "Storage (dinghy float and dry storage, by area)";
  line(`${storage}: Summer`, accounts.storageCosts, 980_000, "program_area", ids.summer, {
    in_mtdc: false,
    name: storage,
  });
  line(`${storage}: Doublehanded`, accounts.storageCosts, 700_000, "program_area", ids.doublehanded, {
    in_mtdc: false,
    name: storage,
  });
  line("Self storage facility", accounts.storageCosts, 172_800, "pool", key("G&A"));
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
  laborLine(c, "Winter boat repairs", "Instructor", 120, "pool", key("Program admin"), accounts.boats);
  c.add("plan_closed_dates", "Fourth of July", { date: "2027-07-05", name: "Independence Day, observed" });
  for (const [name, starts_on, ends_on] of [
    ["Spring 2027", "2027-03-01", "2027-06-15"],
    ["Summer 2027", "2027-06-16", "2027-08-31"],
    ["Fall 2027", "2027-09-01", "2027-11-30"],
  ]) {
    c.add("plan_terms", termRow(name!), { name, starts_on, ends_on });
  }
  c.add("plan_offerings", "Boat storage", {
    product_id: products.storage.id,
    name: "Boat storage 2027",
    term_key: null,
    starts_on: "2027-01-01",
    ends_on: "2027-12-31",
    capacity: 40,
    target_enrollment: 36,
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
  term: string | null,
  starts_on: string,
  ends_on: string,
  fields: { capacity: number; target: number; price: number; cogs?: number; note?: string },
) =>
  c.add("plan_offerings", name, {
    product_id: p.id,
    name,
    term_key: term && key(termRow(term)),
    starts_on,
    ends_on,
    capacity: fields.capacity,
    target_enrollment: fields.target,
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
    staff_level_id: levelId(staff[0]),
    position_key: null,
    count: staff[1],
    pay: null,
  });
  for (const [boat, count, owned] of [[boatClasses.rib, ribs] as const, ...boats]) {
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
function summer(plan: string, instructors: number): Copy {
  const c = new Copy(plan);
  const settings = (p: { id: string; name: string }, level: string, perCoach: number, notes: string[] | null) =>
    c.add("plan_programs", `${p.name} settings`, {
      product_id: p.id,
      staff_level_id: levelId(level),
      sailors_per_coach: perCoach,
      indirect_cost_rate: 0.15,
      notes,
    });
  settings(products.guppies, "Instructor", 10, [
    "If there are more than 12 Guppies, add a **Junior Instructor**.",
    "Guppies sail Sailqubes.",
  ]);
  settings(products.otters, "Instructor", 10, null);
  settings(products.opti, "Instructor", 8, ["Never fewer than 2 instructors on the water."]);
  settings(products.sailqube, "Instructor", 8, null);
  settings(products.c420, "Coach", 8, null);
  settings(products.keelboat, "Coach", 6, null);
  settings(products.adventure, "Instructor", 8, null);
  budgetLine(c, "Tent rental", accounts.boats, 180_000, "program_area", ids.summer, { in_mtdc: false });
  laborLine(c, "Camp setup", "Instructor", 40, "program_area", ids.summer, accounts.wages);
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
      staff: ["Instructor", instructors],
      ribs: 2,
      boats: (week) => [[boatClasses.sailqube, week === 4 ? 9 : 6]],
    },
    {
      name: "Day camps",
      camps: ["Opti Camp", "Sailqube Camp"],
      staff: ["Instructor", 4],
      ribs: 2,
      boats: () => [
        [boatClasses.opti, 14],
        [boatClasses.sailqube, 5],
      ],
    },
    {
      name: "Big boats",
      camps: ["420 Camp", "Keelboat Camp"],
      staff: ["Coach", 2],
      ribs: 2,
      boats: () => [
        [boatClasses.c420, 6],
        [boatClasses.keelboat, 2],
      ],
    },
    { name: "Adventure", camps: ["Adventure Camp"], staff: ["Instructor", 2], ribs: 1, boats: () => [] },
  ];
  for (let week = 1; week <= 9; week++) {
    const monday = date("2027-06-21", 7 * (week - 1));
    const session = `Week ${week}`;
    const running = camps
      .filter((camp) => camp.weeks.includes(week))
      .map((camp) => ({
        ...camp,
        id: offering(c, `${camp.p.name} ${session}`, camp.p, "Summer 2027", monday, date(monday, 4), {
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

/** Doublehanded: J-Pod's spring and fall terms, one practice a week. Its last fall practice has no block yet. */
function doublehanded(plan: string): Copy {
  const c = new Copy(plan);
  c.add("plan_programs", "J-Pod settings", {
    product_id: products.jpod.id,
    staff_level_id: levelId("Coach"),
    sailors_per_coach: 8,
    indirect_cost_rate: 0.2,
    notes: ["Most sailors bring their own 420s."],
  });
  for (const [session, first, weeks, target] of [
    ["Spring", "2027-03-02", 12, 12],
    ["Fall", "2027-09-07", 10, 10],
  ] as const) {
    const o = offering(c, `J-Pod ${session}`, products.jpod, `${session} 2027`, first, date(first, 7 * (weeks - 1)), {
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
      const b = last ? null : block(c, `J-Pod ${on}`, on, ["Coach", 2], 2, [[boatClasses.c420, 3, 3]]);
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

const notes: Record<string, string[] | null> = {
  [ids.summerBudget]: ["Guppies and Opti Camp share the dock in the morning.", "No sailing on Monday, July 5."],
  [ids.doublehandedBudget]: null,
  [ids.opsBudget]: ["No more than 4 RIBs on the water at once.", "Keep one RIB ashore for repairs on summer weekdays."],
};

const set = (setId: string, fields: Row) => ({
  id: setId,
  organization_id: ids.org,
  fiscal_year: 2027,
  frozen_at: null,
  frozen_by: null,
  note: null,
  parent_id: null,
  archived_at: null,
  effective_from: null,
  ...fields,
});
const budget = set(ids.budget, {
  name: "Budget",
  status: "frozen",
  effective_from: "2026-07-01",
  note: "Reviewed with the board",
  frozen_at: "2027-03-10T18:00:00Z",
  frozen_by: ids.saver,
});
const parent = { id: ids.budget, name: "Budget" };
const twoCoaches = set(ids.twoCoaches, {
  name: "Two coaches",
  status: "draft",
  effective_from: "2027-09-01",
  parent_id: parent,
  note: "A fourth instructor on every **summer morning**.",
});
const threeCoaches = set(ids.threeCoaches, { name: "Three coaches", status: "draft", parent_id: parent });
// Frozen before Budget, then archived. It holds no plans, so only Planning's list shows it.
const firstPass = set(ids.firstPass, {
  name: "First pass",
  status: "frozen",
  frozen_at: "2027-02-14T18:00:00Z",
  frozen_by: ids.saver,
  archived_at: "2027-03-10T18:05:00Z",
});

/** Each Financial Plan's plans: a program area's Program Plan, or its Operations Plan. */
const plans: { id: string; set: Row; kind: "program_area" | "operations"; program_area_id: string | null }[] = [
  { id: ids.summerBudget, set: budget, kind: "program_area", program_area_id: ids.summer },
  { id: ids.doublehandedBudget, set: budget, kind: "program_area", program_area_id: ids.doublehanded },
  { id: ids.opsBudget, set: budget, kind: "operations", program_area_id: null },
  { id: ids.summerTwo, set: twoCoaches, kind: "program_area", program_area_id: ids.summer },
  { id: ids.opsTwo, set: twoCoaches, kind: "operations", program_area_id: null },
  { id: ids.summerThree, set: threeCoaches, kind: "program_area", program_area_id: ids.summer },
  { id: ids.opsThree, set: threeCoaches, kind: "operations", program_area_id: null },
];

const rowTables = [
  "plan_programs",
  "plan_offerings",
  "plan_trips",
  "plan_activities",
  "plan_activity_blocks",
  "plan_block_staff",
  "plan_block_boats",
  "plan_labor_lines",
  "plan_budget_lines",
  "plan_rates",
  "plan_payroll_taxes",
  "plan_revenue_charges",
  "plan_staff_levels",
  "plan_salaried_positions",
  "plan_salaried_bookings",
  "plan_boat_rates",
  "plan_pools",
  "plan_bonus_owners",
  "plan_bonus_owner_products",
  "plan_closed_dates",
  "plan_capital_items",
  "plan_terms",
] as const;

const rowsOf = (planIds: string[], table: string) => planIds.flatMap((p) => copies[p]?.rows[table] ?? []);

/** A Financial Plan's results, as platform's hook works them out and writes them. */
/** The engine platform runs now. */
export const engine = "1.39.0+engine.0a1b2c3d4e5f";

function results(setRow: Row, calculatedAt: string, platformVersion: string | null): Record<string, Row[]> {
  const own = plans.filter((p) => p.set === setRow);
  const planIds = own.map((p) => p.id);
  const data = {
    ...catalog,
    fiscal_year: 2027,
    plans: own.map(({ id, kind, program_area_id }) => ({ id, kind, program_area_id })),
    ...Object.fromEntries(rowTables.map((table) => [table, rowsOf(planIds, table)])),
  } as unknown as PlanData;
  const out = computePlan(data);
  const operations = own.find((p) => p.kind === "operations")?.id;
  const areaPlan = (area: string | null | undefined) =>
    own.find((p) => p.kind === "program_area" && p.program_area_id === area)?.id ?? operations;
  const offerings = new Map((data.plan_offerings as unknown as Row[]).map((o) => [o["key"], o]));
  const terms = new Map(((data.plan_terms ?? []) as unknown as Row[]).map((t) => [t["key"], t]));
  const resultTerm = (key: string | null | undefined) => ({
    term_key: key ?? null,
    term_name: terms.get(key)?.["name"] ?? null,
    term_starts_on: terms.get(key)?.["starts_on"] ?? null,
  });
  const ownerOf = (type: string, subject: string | null) => {
    if (type === "offering") {
      return offerings.get(subject)?.["plan_id"] as string | undefined;
    }
    if (type === "product") {
      return areaPlan(catalog.products.find((p) => p.id === subject)?.program_area_id);
    }
    if (type === "program_area" || type === "program_area_term") {
      return areaPlan(subject);
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
        financial_plan_id: setId,
        calculated_at: calculatedAt,
        platform_version: platformVersion,
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
      financial_plan_id: setId,
      plan_id: ownerOf(l.cost_center_type, l.cost_center_key) ?? null,
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
      financial_plan_id: setId,
      plan_id: ownerOf(p.level, p.key) ?? null,
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
      ...resultTerm((p as { term_key?: string | null }).term_key),
    })),
    plan_result_capital: out.capital.map((item) => ({
      financial_plan_id: setId,
      rank: item.rank,
      item_key: item.key,
      name: item.name,
      amount_cents: item.amount_cents,
      running_cents: item.running_cents,
      funded: item.funded,
    })),
    plan_result_warnings: out.warnings.map((w) => ({
      financial_plan_id: setId,
      plan_id: w.plan_id ?? null,
      code: w.code,
      message: w.message,
      category: w.category,
      severity: ("severity" in w ? w.severity : null) as "warning" | "error" | null,
      subject_key: w.key ?? null,
      date: w.date ?? null,
    })),
  };
}

// Budget's results, as platform worked them out when it was frozen, and Two coaches', after its latest change, before
// platform's engine changed. Three coaches' are still being worked out.
const worked = [
  results(budget, "2027-03-10T18:00:00Z", "1.38.1+engine.9f8e7d6c5b4a"),
  results(twoCoaches, "2027-04-02T23:05:00Z", "1.38.1+engine.9f8e7d6c5b4a"),
];
const resultTables = Object.fromEntries(
  ["plan_results", "plan_result_lines", "plan_result_pnl", "plan_result_warnings", "plan_result_capital"].map(
    (table) => [table, worked.flatMap((r) => r[table] ?? [])],
  ),
);
resultTables["plan_results"]!.push({
  ...worked[0]!["plan_results"]![0]!,
  financial_plan_id: ids.firstPass,
  platform_version: "1.37.0+engine.9f8e7d6c5b4a",
});

const planIds = Object.keys(copies);
/** A row's staff level, expanded as the app asks for it. */
const staffLevel = (r: Row) => staffLevels.find((l) => l.id === r["staff_level_id"]) ?? null;
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
  assets: catalog.assets,
  boats: catalog.boats,
  financial_plans: [budget, twoCoaches, threeCoaches, firstPass],
  // financial_plan_id and program_area_id are expanded when a request asks for their fields.
  plans: plans.map((p) => {
    const area = catalog.program_areas.find((a) => a.id === p.program_area_id);
    return {
      id: p.id,
      financial_plan_id: p.set,
      kind: p.kind,
      program_area_id: area ? named(area) : null,
      notes: notes[p.id] ?? null,
    };
  }),
  ...Object.fromEntries(rowTables.map((table) => [table, rowsOf(planIds, table)])),
  // Expanded as the app asks for them: the products, accounts, pools and positions rows name.
  plan_programs: rowsOf(planIds, "plan_programs").map((r) => ({
    ...r,
    product_id: named(catalog.products.find((p) => p.id === r["product_id"])!),
    staff_level_id: staffLevel(r),
  })),
  plan_staff_levels: rowsOf(planIds, "plan_staff_levels").map((r) => {
    const level = staffLevels.find((l) => l.id === r["staff_level_id"])!;
    return { ...r, staff_level_id: { ...level, role_id: staffRoles.find((x) => x.id === level.role_id)! } };
  }),
  plan_block_staff: rowsOf(planIds, "plan_block_staff").map((r) => ({ ...r, staff_level_id: staffLevel(r) })),
  // A program's own row, with the color a Catalog Writer gave Guppies; the rest take one from the palette.
  plan_offerings: rowsOf(planIds, "plan_offerings").map((r) => {
    const product = catalog.products.find((p) => p.id === r["product_id"])!;
    const programs =
      product.kind === "program"
        ? [{ id: `program-${product.id}`, color: product.id === products.guppies.id ? "#0274c7" : null }]
        : [];
    return { ...r, product_id: { ...named(product), programs } };
  }),
  plan_boat_rates: rowsOf(planIds, "plan_boat_rates").map((r) => ({
    ...r,
    boat_class_id: catalog.boat_classes.find((b) => b.id === r["boat_class_id"])!,
  })),
  plan_block_boats: rowsOf(planIds, "plan_block_boats").map((r) => ({
    ...r,
    boat_class_id: catalog.boat_classes.find((b) => b.id === r["boat_class_id"])!,
  })),
  plan_salaried_positions: rowsOf(planIds, "plan_salaried_positions").map((r) => ({
    ...r,
    remainder_pool_id: rowsOf(planIds, "plan_pools").find((p) => p["id"] === r["remainder_pool_id"]) ?? null,
  })),
  ...Object.fromEntries(
    ["plan_revenue_charges", "plan_bonus_owners", "plan_budget_lines", "plan_labor_lines"].map((table) => [
      table,
      rowsOf(planIds, table).map((r) => ({
        ...r,
        account_id: catalog.accounts.find((a) => a.id === r["account_id"])!,
        ...(table === "plan_labor_lines" && { staff_level_id: staffLevel(r) }),
      })),
    ]),
  ),
  plan_bonus_owner_products: rowsOf(planIds, "plan_bonus_owner_products").map((r) => ({
    ...r,
    product_id: named(catalog.products.find((p) => p.id === r["product_id"])!),
  })),
  plan_salaried_bookings: rowsOf(planIds, "plan_salaried_bookings").map((r) => ({
    ...r,
    position_id: rowsOf(planIds, "plan_salaried_positions").find((p) => p["id"] === r["position_id"])!,
    product_id: catalog.products.find((p) => p.id === r["product_id"]) ?? null,
    program_area_id: catalog.program_areas.find((a) => a.id === r["program_area_id"]) ?? null,
  })),
  ...resultTables,
};
