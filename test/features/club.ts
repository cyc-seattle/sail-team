import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { asAdmin, newRunId } from "./support";

// A made-up organization's Financial Plans on dev, made by dev's admin and deleted when the scenario ends: the
// organization, its accounts, a Youth Racing area and product, an Operations Plan and Youth Racing's plan, and the
// Financial Plans that hold copies of them. Every figure is made up.

export const PLAN_YEAR = 2027;

type Row = Record<string, unknown>;

/** The tables a plan copy holds rows in, each after the rows that point at it, so cleanup can go in this order. */
const COPY_ROWS = [
  "plan_activity_resources",
  "plan_activities",
  "plan_trips",
  "plan_offering_boat_classes",
  "plan_budget_lines",
  "plan_labor_lines",
  "plan_activity_block_rules",
  "plan_bonus_owner_products",
  "plan_bonus_owners",
  "plan_salaried_bookings",
  "plan_salaried_positions",
  "plan_resources",
  "plan_boat_rates",
  "plan_rates",
  "plan_staff_levels",
  "plan_pools",
  "plan_offerings",
  "plan_revenue_charges",
  "plan_closed_dates",
];

export class Club {
  readonly run = newRunId();
  readonly area = `Youth Racing ${this.run}`;
  /**
   * The plan year. A journey that reads the list of Financial Plans uses a far-off year of its own, so no other run's
   * Financial Plan for the year can show up there.
   */
  year = PLAN_YEAR;
  get areaPlanName() {
    return `Youth Racing ${this.run} ${this.year}`;
  }

  /** Gives this run a year of its own, from 2100 to 2899, that no real plan uses. */
  ownYear(): number {
    this.year = 2100 + (parseInt(this.run.slice(-4), 16) % 800);
    return this.year;
  }
  /** Every row made, oldest first, so cleanup deletes the newest first. */
  private readonly made: { collection: string; id: string }[] = [];
  private organizationId?: string;
  private accounts: Record<string, string> = {};
  private productId?: string;
  private readonly plans: string[] = [];
  areaPlan?: string;
  operationsPlan?: string;

  private async create(collection: string, fields: Row): Promise<Row> {
    const id = randomUUID();
    const row = await asAdmin("POST", `/items/${collection}`, { id, ...fields });
    this.made.push({ collection, id });
    return row;
  }

  async versioned(collection: string, version: string, fields: Row): Promise<Row> {
    return this.create(collection, { version_id: version, key: randomUUID(), ...fields });
  }

  /** The organization, its accounts, the Youth Racing area and its product, and both plans. */
  async setUp(): Promise<void> {
    this.organizationId = (
      await this.create("organizations", { name: `Journey organization ${this.run}`, fiscal_year_start_month: 1 })
    )["id"] as string;
    for (const [name, type, fn] of [
      ["programs", "revenue", "program"],
      ["costs", "expense", "program"],
      ["office", "expense", "management"],
      ["coachWages", "expense", "program"],
      ["payrollTax", "expense", "program"],
    ] as const) {
      this.accounts[name] = (
        await this.create("accounts", {
          number: `J${this.run}-${name}`,
          name: `${name} ${this.run}`,
          type,
          default_function: fn,
          retired: false,
        })
      )["id"] as string;
    }
    for (const [costType, account] of [
      ["coach_wages", "coachWages"],
      ["payroll_tax", "payrollTax"],
    ] as const) {
      await this.create("organization_cost_accounts", {
        organization_id: this.organizationId,
        cost_type: costType,
        account_id: this.accounts[account],
      });
    }
    const area = (
      await this.create("program_areas", { name: this.area, revenue_account_id: this.accounts["programs"] })
    )["id"] as string;
    this.productId = (
      await this.create("products", { name: `Beginner camp ${this.run}`, kind: "program", program_area_id: area })
    )["id"] as string;
    await this.create("programs", { name: `Beginner camp ${this.run}`, product_id: this.productId });
    this.operationsPlan = await this.plan("operations", null, `Operations ${this.run} ${this.year}`);
    this.areaPlan = await this.plan("program_area", area, this.areaPlanName);
  }

  /** Another program area, with a plan for the year. Returns the plan. */
  async anotherArea(name: string): Promise<string> {
    const area = (
      await this.create("program_areas", { name: `${name} ${this.run}`, revenue_account_id: this.accounts["programs"] })
    )["id"] as string;
    return this.plan("program_area", area, `${name} ${this.run} ${this.year}`);
  }

  private async plan(kind: "operations" | "program_area", areaId: string | null, name: string): Promise<string> {
    const plan = (
      await this.create("plans", {
        kind,
        program_area_id: areaId,
        organization_id: this.organizationId,
        fiscal_year: this.year,
        name,
      })
    )["id"] as string;
    this.plans.push(plan);
    return plan;
  }

  /** A new draft copy of `plan`. */
  async copy(plan: string): Promise<string> {
    return (await this.create("plan_versions", { plan_id: plan, status: "draft" }))["id"] as string;
  }

  /** A draft Financial Plan for the year, named `name`, holding `copies`. Returns its id. */
  async financialPlan(name: string, copies: string[]): Promise<string> {
    const set = (
      await this.create("version_sets", {
        organization_id: this.organizationId,
        fiscal_year: this.year,
        name,
        status: "draft",
      })
    )["id"] as string;
    for (const copy of copies) {
      await this.create("version_set_members", { version_set_id: set, version_id: copy });
    }
    return set;
  }

  /**
   * A draft Financial Plan started from `parent`, once platform's saved-versions hook has copied the parent's plans
   * into it. Returns its id, and each copy by the plan it's of.
   */
  async startFrom(parent: string, name: string): Promise<{ set: string; copies: Map<string, string> }> {
    const set = (
      await this.create("version_sets", {
        organization_id: this.organizationId,
        fiscal_year: this.year,
        name,
        status: "draft",
        parent_id: parent,
      })
    )["id"] as string;
    let members: { plan_id: string; version_id: string }[] = [];
    await expect
      .poll(
        async () => {
          members = await asAdmin(
            "GET",
            `/items/version_set_members?filter[version_set_id][_eq]=${set}&fields=plan_id,version_id`,
          );
          return members.length;
        },
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBeGreaterThan(0);
    return { set, copies: new Map(members.map((m) => [m.plan_id, m.version_id])) };
  }

  /**
   * Saves a Financial Plan as the admin, the way a Plan Writer does, with `note`, and waits for platform's
   * saved-versions hook to work out its results.
   */
  async save(set: string, note: string | null = null): Promise<void> {
    await asAdmin("PATCH", `/items/version_sets/${set}`, { status: "saved", message: note });
    await expect
      .poll(
        async () => (await asAdmin("GET", `/items/plan_results?filter[version_set_id][_eq]=${set}&fields=id`)).length,
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBe(1);
  }

  /** An offering in `copy` of `sailors` at `price` cents each, with `costs` cents of its own costs. Returns it. */
  async offering(copy: string, name: string, sailors: number, price: number, costs = 0, extra: Row = {}): Promise<Row> {
    const offering = await this.versioned("plan_offerings", copy, {
      product_id: this.productId,
      name,
      starts_on: `${this.year}-07-05`,
      ends_on: `${this.year}-07-16`,
      target_enrollment: sailors,
      price_cents: price,
      ...extra,
    });
    if (costs > 0) {
      await this.versioned("plan_budget_lines", copy, {
        name: `${name} costs`,
        account_id: this.accounts["costs"],
        cost_center_type: "offering",
        cost_center_key: offering["key"],
        amount_cents: costs,
        fiscal_year: this.year,
        excluded_from_mtdc: false,
      });
    }
    return offering;
  }

  /** A practice of `offering` on each of `dates`, from `start` to `end`. */
  async practices(
    copy: string,
    offering: string,
    dates: string[],
    start = "09:00:00",
    end = "12:00:00",
  ): Promise<void> {
    for (const date of dates) {
      await this.versioned("plan_activities", copy, {
        offering_id: offering,
        date,
        start_time: start,
        end_time: end,
        kind: "practice",
        uses_boats: false,
      });
    }
  }

  /** A day the organization is closed, in an Operations Plan's copy. */
  async closed(operations: string, date: string, name: string): Promise<void> {
    await this.versioned("plan_closed_dates", operations, { date, name });
  }

  /** A coach's hourly rate, in an Operations Plan's copy. Returns the level's key, for an offering to name. */
  async coachRate(operations: string, cents: number): Promise<string> {
    return (
      await this.versioned("plan_staff_levels", operations, {
        name: `Coach ${this.run}`,
        pay_type: "hourly",
        hourly_rate_cents: cents,
      })
    )["key"] as string;
  }

  /** The office, in an Operations Plan's copy: `cents` a year, shared among every offering. */
  async office(operations: string, cents: number): Promise<void> {
    const pool = await this.versioned("plan_pools", operations, { name: "Office" });
    await this.versioned("plan_budget_lines", operations, {
      name: "Office rent",
      account_id: this.accounts["office"],
      cost_center_type: "pool",
      cost_center_key: pool["key"],
      amount_cents: cents,
      fiscal_year: this.year,
      excluded_from_mtdc: false,
    });
  }

  /** Sets every budget line named `name` in `copy` to `cents`. */
  async setLine(copy: string, name: string, cents: number): Promise<void> {
    const lines: { id: string }[] = await asAdmin(
      "GET",
      `/items/plan_budget_lines?filter[version_id][_eq]=${copy}&filter[name][_eq]=${encodeURIComponent(name)}&fields=id`,
    );
    for (const { id } of lines) {
      await asAdmin("PATCH", `/items/plan_budget_lines/${id}`, { amount_cents: cents });
    }
  }

  /**
   * Deletes everything the scenario made. Financial Plans go first, with their members and results, the ones a visitor
   * started in the app before the ones they were started from. Then every copy of
   * the scenario's plans, including those the hook made, with their rows, then the rest, newest first. Dev's
   * `backend:savedVersionsDeletable` lets its first admin delete saved ones; prod refuses it.
   */
  async cleanUp(): Promise<void> {
    const ours = (collection: string) => this.made.filter((m) => m.collection === collection).map((m) => m.id);
    const made = ours("version_sets");
    const all: { id: string }[] = this.organizationId
      ? await asAdmin(
          "GET",
          `/items/version_sets?filter[organization_id][_eq]=${this.organizationId}&fields=id&limit=-1`,
        )
      : [];
    const started = all.map((s) => s.id).filter((id) => !made.includes(id));
    for (const set of [...started, ...made.reverse()]) {
      await asAdmin("DELETE", `/items/version_sets/${set}`);
    }
    if (this.plans.length > 0) {
      const copies: { id: string }[] = await asAdmin(
        "GET",
        `/items/plan_versions?filter[plan_id][_in]=${this.plans.join(",")}&fields=id&limit=-1`,
      );
      const ids = copies.map((c) => c.id);
      for (const table of COPY_ROWS) {
        if (ids.length === 0) break;
        const rows: { id: string }[] = await asAdmin(
          "GET",
          `/items/${table}?filter[version_id][_in]=${ids.join(",")}&fields=id&limit=-1`,
        );
        if (rows.length > 0) {
          await asAdmin(
            "DELETE",
            `/items/${table}`,
            rows.map((r) => r.id),
          );
        }
      }
      if (ids.length > 0) {
        await asAdmin("DELETE", "/items/plan_versions", ids);
      }
    }
    const done = new Set(["version_sets", "version_set_members", "plan_versions", ...COPY_ROWS]);
    for (const { collection, id } of this.made.reverse()) {
      if (!done.has(collection)) {
        await asAdmin("DELETE", `/items/${collection}/${id}`);
      }
    }
  }
}
