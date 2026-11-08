// A made-up club's 2027 Financial Plans, for local work, stories, and tests. Never real club figures.

const org = "00000000-0000-4000-8000-0000000000a1";
const youth = "00000000-0000-4000-8000-0000000000b1";
const adult = "00000000-0000-4000-8000-0000000000b2";
const tuition = "00000000-0000-4000-8000-0000000000c1";
const office = "00000000-0000-4000-8000-0000000000c2";
const camp = "00000000-0000-4000-8000-0000000000d1";
const pool = "00000000-0000-4000-8000-0000000000e1";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const ids = {
  org,
  youth,
  adult,
  youthPlan: id(101),
  opsPlan: id(102),
  adultPlan: id(103),
  // Budget, saved: a copy of each plan.
  budget: id(601),
  youthSaved: id(201),
  adultSaved: id(202),
  opsSaved: id(203),
  youthMember: id(611),
  adultMember: id(612),
  opsMember: id(613),
  // Two coaches and Three coaches, drafts started from Budget.
  twoCoaches: id(602),
  youthTwo: id(211),
  opsTwo: id(212),
  threeCoaches: id(603),
  youthThree: id(221),
  opsThree: id(222),
};

const plan = (planId: string, name: string, kind: string, area: { id: string; name: string } | null) => ({
  id: planId,
  name,
  kind,
  fiscal_year: 2027,
  organization_id: org,
  program_area_id: area,
  archived: false,
});
const youthArea = { id: youth, name: "Youth Racing" };
const adultArea = { id: adult, name: "Adult Programs" };
const plans = {
  youth: plan(ids.youthPlan, "Youth Racing 2027", "program_area", youthArea),
  adult: plan(ids.adultPlan, "Adult Programs 2027", "program_area", adultArea),
  ops: plan(ids.opsPlan, "Operations 2027", "operations", null),
};

const set = (setId: string, fields: Record<string, unknown>) => ({
  id: setId,
  organization_id: org,
  fiscal_year: 2027,
  saved_at: null,
  saved_by: null,
  message: null,
  parent_id: null,
  ...fields,
});
const budget = set(ids.budget, {
  name: "Budget",
  status: "saved",
  message: "Reviewed with the board",
  saved_at: "2027-03-10T18:00:00Z",
});
const parent = { id: ids.budget, name: "Budget" };
const twoCoaches = set(ids.twoCoaches, { name: "Two coaches", status: "draft", parent_id: parent });
const threeCoaches = set(ids.threeCoaches, { name: "Three coaches", status: "draft", parent_id: parent });

const member = (
  memberId: string,
  setRow: Record<string, unknown>,
  version: string,
  planRow: Record<string, unknown>,
) => ({
  id: memberId,
  version_set_id: setRow,
  version_id: version,
  plan_id: planRow,
});

const copy = (copyId: string, planId: string, status: string) => ({
  id: copyId,
  plan_id: planId,
  status,
  message: null,
  saved_at: status === "saved" ? "2027-03-10T18:00:00Z" : null,
});

/** A draft camp offering, at `price` a sailor for 10 sailors. */
const offering = (offeringId: string, version: string, key: string, name: string, price: number) => ({
  id: offeringId,
  version_id: version,
  key,
  product_id: camp,
  catalog_offering_id: null,
  name,
  season_term: null,
  starts_on: "2027-07-05",
  ends_on: "2027-07-09",
  capacity: 10,
  target_enrollment: 10,
  fill_rate: "1",
  price_cents: price,
  sailors_per_coach: null,
  min_coaches: null,
  coach_level_key: null,
  required_qualification: null,
  ribs_per_coach: null,
  byob_share: null,
  fixed_coaches: null,
  fixed_ribs: null,
  fixed_boats: null,
  cogs_rate: null,
  note: null,
});

/** The office, in a draft's Operations Plan: a pool every offering shares. */
const officeRows = (version: string, n: number, amount: number) => ({
  pool: { id: id(700 + n), version_id: version, key: pool, name: "Office" },
  line: {
    id: id(710 + n),
    version_id: version,
    key: id(720 + n),
    name: "Office rent",
    account_id: office,
    function: null,
    cost_center_type: "pool",
    cost_center_key: pool,
    amount_cents: amount,
    fiscal_year: 2027,
    excluded_from_mtdc: false,
    note: null,
  },
});
/** Each draft's camp supplies: a direct cost, so the camp takes its share of the office. */
const supplies = (version: string, n: number) => ({
  id: id(730 + n),
  version_id: version,
  key: id(740 + n),
  name: "Camp supplies",
  account_id: office,
  function: null,
  cost_center_type: "offering",
  cost_center_key: id(311),
  amount_cents: 100_000,
  fiscal_year: 2027,
  excluded_from_mtdc: false,
  note: null,
});
const officeTwo = officeRows(ids.opsTwo, 1, 200_000);
const officeThree = officeRows(ids.opsThree, 2, 200_000);

/** Each table's rows, as Directus would return them, with relations expanded where the app asks for them. */
export const tables: Record<string, Record<string, unknown>[]> = {
  organizations: [{ id: org, name: "Example Sailing Club", fiscal_year_start_month: 1 }],
  organization_cost_accounts: [],
  program_areas: [
    { id: youth, name: "Youth Racing", revenue_account_id: tuition },
    { id: adult, name: "Adult Programs", revenue_account_id: tuition },
  ],
  accounts: [
    {
      id: tuition,
      number: "4000",
      name: "Tuition",
      type: "revenue",
      form_990_part: null,
      form_990_line: null,
      default_function: "program",
      parent_id: null,
      contra_account_id: null,
      retired: false,
    },
    {
      id: office,
      number: "7000",
      name: "Office",
      type: "expense",
      form_990_part: null,
      form_990_line: null,
      default_function: "management",
      parent_id: null,
      contra_account_id: null,
      retired: false,
    },
  ],
  products: [{ id: camp, name: "Beginner camp", kind: "program", revenue_account_id: null, program_area_id: youth }],
  qualifications: [],
  qualification_covers: [],
  boat_classes: [],
  resource_kinds: [],
  plans: Object.values(plans),
  version_sets: [budget, twoCoaches, threeCoaches],
  // version_set_id and plan_id are expanded when a request asks for their fields.
  version_set_members: [
    member(ids.youthMember, budget, ids.youthSaved, plans.youth),
    member(ids.adultMember, budget, ids.adultSaved, plans.adult),
    member(ids.opsMember, budget, ids.opsSaved, plans.ops),
    member(id(621), twoCoaches, ids.youthTwo, plans.youth),
    member(id(622), twoCoaches, ids.opsTwo, plans.ops),
    member(id(631), threeCoaches, ids.youthThree, plans.youth),
    member(id(632), threeCoaches, ids.opsThree, plans.ops),
  ],
  plan_versions: [
    copy(ids.youthSaved, ids.youthPlan, "saved"),
    copy(ids.adultSaved, ids.adultPlan, "saved"),
    copy(ids.opsSaved, ids.opsPlan, "saved"),
    copy(ids.youthTwo, ids.youthPlan, "draft"),
    copy(ids.opsTwo, ids.opsPlan, "draft"),
    copy(ids.youthThree, ids.youthPlan, "draft"),
    copy(ids.opsThree, ids.opsPlan, "draft"),
  ],
  // The same camp in each draft, at a different price.
  plan_offerings: [
    offering(id(301), ids.youthTwo, id(311), "Beginner camp, week 1", 100_000),
    offering(id(302), ids.youthThree, id(311), "Beginner camp, week 1", 90_000),
  ],
  plan_pools: [officeTwo.pool, officeThree.pool],
  plan_budget_lines: [officeTwo.line, officeThree.line, supplies(ids.youthTwo, 1), supplies(ids.youthThree, 2)],
  // The club is closed on the Fourth, and Two coaches' camp has a practice that day.
  plan_closed_dates: [
    { id: id(401), version_id: ids.opsTwo, key: id(411), date: "2027-07-05", name: "the Fourth of July, observed" },
  ],
  plan_activities: [
    {
      id: id(501),
      version_id: ids.youthTwo,
      key: id(511),
      offering_id: id(301),
      trip_id: null,
      date: "2027-07-05",
      start_time: "09:00:00",
      end_time: "12:00:00",
      on_water_minutes: null,
      setup_minutes: null,
      putaway_minutes: null,
      kind: "practice",
      uses_boats: false,
      fixed_coaches: null,
      fixed_ribs: null,
      fixed_boats: null,
    },
  ],
  // Budget's results, as platform worked them out when it was saved.
  plan_results: [
    {
      version_set_id: budget,
      calculated_at: "2027-03-10T18:00:00Z",
      operating_net_cents: 500_000,
      fundraising_net_cents: 120_000,
      capital_cents: 300_000,
      total_cents: 320_000,
    },
  ],
  plan_result_pnl: [
    {
      version_set_id: budget,
      version_set_member_id: ids.youthMember,
      level: "offering",
      subject_key: id(311),
      name: "Beginner camp, week 1",
      revenue_cents: 1_000_000,
      expense_cents: 600_000,
      net_cents: 400_000,
      mtdc_cents: 500_000,
      enrollment: 10,
      days: 10,
      sailor_days: 100,
    },
    {
      version_set_id: budget,
      version_set_member_id: ids.youthMember,
      level: "program_area",
      subject_key: youth,
      name: "Youth Racing",
      revenue_cents: 1_000_000,
      expense_cents: 600_000,
      net_cents: 400_000,
      mtdc_cents: 500_000,
      enrollment: 10,
      days: 10,
      sailor_days: 100,
    },
    {
      version_set_id: budget,
      version_set_member_id: ids.adultMember,
      level: "program_area",
      subject_key: adult,
      name: "Adult Programs",
      revenue_cents: 400_000,
      expense_cents: 100_000,
      net_cents: 300_000,
      mtdc_cents: 100_000,
      enrollment: 6,
      days: 4,
      sailor_days: 24,
    },
  ],
  plan_result_lines: [
    {
      version_set_id: budget,
      version_set_member_id: ids.youthMember,
      line: "offering:revenue",
      line_name: "Tuition",
      cost_center_name: "Beginner camp, week 1",
      amount_cents: 1_000_000,
      function: "program",
      account_id: { id: tuition, type: "revenue" },
    },
    {
      version_set_id: budget,
      version_set_member_id: ids.youthMember,
      line: "offering:coaches",
      line_name: "Coach wages",
      cost_center_name: "Beginner camp, week 1",
      amount_cents: 300_000,
      function: "program",
      account_id: { id: office, type: "expense" },
    },
    {
      version_set_id: budget,
      version_set_member_id: ids.youthMember,
      line: "pool:office",
      line_name: "Office share: Office rent",
      cost_center_name: "Beginner camp, week 1",
      amount_cents: 300_000,
      function: "management",
      account_id: { id: office, type: "expense" },
    },
    {
      version_set_id: budget,
      version_set_member_id: ids.opsMember,
      line: "org:insurance",
      line_name: "Insurance",
      cost_center_name: "Organization",
      amount_cents: 200_000,
      function: "management",
      account_id: { id: office, type: "expense" },
    },
    // Fundraising and capital, which the top-line numbers leave out.
    {
      version_set_id: budget,
      version_set_member_id: ids.opsMember,
      line: "org:gala",
      line_name: "Spring gala",
      cost_center_name: "Organization",
      amount_cents: 50_000,
      function: "fundraising",
      account_id: { id: tuition, type: "revenue" },
    },
    {
      version_set_id: budget,
      version_set_member_id: ids.opsMember,
      line: "org:coach-boat",
      line_name: "Coach boat",
      cost_center_name: "Organization",
      amount_cents: 80_000,
      function: null,
      account_id: { id: office, type: "asset" },
    },
  ],
  plan_result_warnings: [
    {
      version_set_id: budget,
      code: "position_double_booked",
      message: "The head coach coaches two groups at once on June 6, so another coach is needed for 3 hours.",
      subject_key: null,
    },
  ],
};
