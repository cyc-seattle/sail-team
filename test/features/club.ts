import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { asAdmin, newRunId } from "./support";

// A made-up organization's Financial Plans, made by Directus's admin and deleted when the scenario ends: the
// organization, its accounts, a Youth Racing area and product, and Financial Plans that each hold an Operations Plan
// and Youth Racing's plan. Every figure is made up.

export const PLAN_YEAR = 2027;

type Row = Record<string, unknown>;

export class Club {
  readonly run = newRunId();
  readonly area = `Youth Racing ${this.run}`;
  /**
   * The plan year. A journey that reads the list of Financial Plans uses a far-off year of its own, so no other run's
   * Financial Plan for the year can show up there.
   */
  year = PLAN_YEAR;
  /** Gives this run a year of its own, from 2100 to 2899, that no real plan uses. */
  ownYear(): number {
    this.year = 2100 + (parseInt(this.run.slice(-4), 16) % 800);
    return this.year;
  }
  /** Every row made, oldest first, so cleanup deletes the newest first. */
  private readonly made: { collection: string; id: string }[] = [];
  private organizationId?: string;
  private accounts: Record<string, string> = {};
  private roleId?: string;
  productId?: string;
  /** Youth Racing's program area, which names its report in every Financial Plan. */
  areaId?: string;

  private async create(collection: string, fields: Row): Promise<Row> {
    const id = randomUUID();
    const row = await asAdmin("POST", `/items/${collection}`, { id, ...fields });
    this.made.push({ collection, id });
    return row;
  }

  /** A row in `plan`. Deleting its Financial Plan deletes it. */
  private async inPlan(collection: string, plan: string, fields: Row): Promise<Row> {
    return asAdmin("POST", `/items/${collection}`, { id: randomUUID(), plan_id: plan, ...fields });
  }

  /** The organization, its accounts, and the Youth Racing area and its product. */
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
      ["donations", "revenue", "fundraising"],
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
    this.areaId = (
      await this.create("program_areas", { name: this.area, revenue_account_id: this.accounts["programs"] })
    )["id"] as string;
    this.productId = (
      await this.create("products", {
        name: `Beginner camp ${this.run}`,
        kind: "program",
        program_area_id: this.areaId,
      })
    )["id"] as string;
    await this.create("programs", { name: `Beginner camp ${this.run}`, product_id: this.productId });
  }

  /** Another program area. Returns it. */
  async anotherArea(name: string): Promise<string> {
    return (
      await this.create("program_areas", { name: `${name} ${this.run}`, revenue_account_id: this.accounts["programs"] })
    )["id"] as string;
  }

  /** A draft Financial Plan for the year, named `name`, holding no plans yet. Returns its id. */
  async financialPlan(name: string): Promise<string> {
    return (
      await this.create("financial_plans", {
        organization_id: this.organizationId,
        fiscal_year: this.year,
        name,
        status: "draft",
      })
    )["id"] as string;
  }

  /** A plan in the draft Financial Plan `set`: its Operations Plan, or `area`'s Program Plan. Returns it. */
  async plan(set: string, area: string | null): Promise<string> {
    const plan = await asAdmin("POST", "/items/plans", {
      id: randomUUID(),
      financial_plan_id: set,
      kind: area ? "program_area" : "operations",
      program_area_id: area,
    });
    return plan["id"] as string;
  }

  /**
   * A draft Financial Plan started from `parent`, once platform's hook has copied the parent's plans into it. Returns
   * its id, and each plan by its program area, or `operations` for its Operations Plan.
   */
  async startFrom(parent: string, name: string): Promise<{ set: string; plans: Map<string, string> }> {
    const set = (
      await this.create("financial_plans", {
        organization_id: this.organizationId,
        fiscal_year: this.year,
        name,
        status: "draft",
        parent_id: parent,
      })
    )["id"] as string;
    let plans: { id: string; program_area_id: string | null }[] = [];
    await expect
      .poll(
        async () => {
          plans = await asAdmin("GET", `/items/plans?filter[financial_plan_id][_eq]=${set}&fields=id,program_area_id`);
          return plans.length;
        },
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBeGreaterThan(0);
    return { set, plans: new Map(plans.map((p) => [p.program_area_id ?? "operations", p.id])) };
  }

  /**
   * Freezes a Financial Plan as the admin, the way a Plan Admin does, with `note`, and waits for platform's hook to
   * work out its results.
   */
  async freeze(set: string, note: string | null = null): Promise<void> {
    await asAdmin("PATCH", `/items/financial_plans/${set}`, { status: "frozen", note });
    await expect
      .poll(
        async () =>
          (await asAdmin("GET", `/items/plan_results?filter[financial_plan_id][_eq]=${set}&fields=id`)).length,
        { timeout: 60_000, intervals: [1_000] },
      )
      .toBe(1);
  }

  /** An offering in `plan` of `sailors` at `price` cents each, with `costs` cents of its own costs. Returns it. */
  async offering(plan: string, name: string, sailors: number, price: number, costs = 0, extra: Row = {}): Promise<Row> {
    // A plan offering plans a catalog offering, which names its product and itself (cyc-seattle/platform#395).
    const catalog = await this.create("offerings", { product_id: this.productId, name });
    const offering = await this.inPlan("plan_offerings", plan, {
      offering_id: catalog["id"],
      starts_on: `${this.year}-07-05`,
      ends_on: `${this.year}-07-16`,
      capacity: sailors,
      target_enrollment: sailors,
      price_cents: price,
      ...extra,
    });
    if (costs > 0) {
      await this.inPlan("plan_budget_lines", plan, {
        name: `${name} costs`,
        account_id: this.accounts["costs"],
        cost_center_type: "offering",
        cost_center_id: offering["id"],
        amount_cents: costs,
        fiscal_year: this.year,
      });
    }
    return offering;
  }

  /** A term named `name` in the Operations Plan `plan`, from `starts` to `ends` (`MM-DD`) this year. Returns its id. */
  async term(plan: string, name: string, starts: string, ends: string): Promise<string> {
    const term = await this.inPlan("plan_terms", plan, {
      name,
      starts_on: `${this.year}-${starts}`,
      ends_on: `${this.year}-${ends}`,
    });
    return term["id"] as string;
  }

  /**
   * A practice of `offering` on each of `dates`, from `start` to `end`. Given a staff level's id, each is in a block of
   * its own with one coach at that level; without one, it's in no block.
   */
  async practices(
    plan: string,
    offering: string,
    dates: string[],
    start = "09:00:00",
    end = "12:00:00",
    coach: string | null = null,
  ): Promise<void> {
    for (const date of dates) {
      let block: string | null = null;
      if (coach) {
        block = (await this.inPlan("plan_activity_blocks", plan, { date, name: `Practice ${date}` }))["id"] as string;
        await this.inPlan("plan_block_staff", plan, { block_id: block, staff_level_id: coach, count: 1 });
      }
      await this.inPlan("plan_activities", plan, {
        offering_id: offering,
        date,
        start_time: start,
        end_time: end,
        kind: "practice",
        uses_boats: false,
        block_id: block,
      });
    }
  }

  /** The camp's program's settings in `plan`: the staff level that leads it, sailors per coach, and its notes. */
  async program(plan: string, level: string, sailorsPerCoach: number, notes: string[] | null): Promise<void> {
    await this.inPlan("plan_programs", plan, {
      product_id: this.productId,
      staff_level_id: level,
      sailors_per_coach: sailorsPerCoach,
      notes,
    });
  }

  /** The camp's program's indirect cost rate in `plan`, such as 0.5 to pay half its direct costs toward shared costs. */
  async indirectCostRate(plan: string, rate: number): Promise<void> {
    const [row]: { id: string }[] = await asAdmin(
      "GET",
      `/items/plan_programs?filter[plan_id][_eq]=${plan}&filter[product_id][_eq]=${this.productId}&fields=id`,
    );
    if (row) {
      await asAdmin("PATCH", `/items/plan_programs/${row.id}`, { indirect_cost_rate: rate });
    } else {
      await this.inPlan("plan_programs", plan, { product_id: this.productId, indirect_cost_rate: rate });
    }
  }

  /** A plan's notes, in the planner's own words. */
  async notes(plan: string, notes: string[]): Promise<void> {
    await asAdmin("PATCH", `/items/plans/${plan}`, { notes });
  }

  /** A day the organization is closed, in an Operations Plan. */
  async closed(operations: string, date: string, name: string): Promise<void> {
    await this.inPlan("plan_closed_dates", operations, { date, name });
  }

  /**
   * A coach's staff level, with its hourly rate in an Operations Plan. Returns the level's id, for a block or program
   * to name.
   */
  async coachRate(operations: string, cents: number, name = `Coach ${this.run}`): Promise<string> {
    this.roleId ??= (await this.create("staff_roles", { name: `Coach ${this.run}`, sort: 1 }))["id"] as string;
    const level = (await this.create("staff_levels", { name, role_id: this.roleId, grade: "standard" }))[
      "id"
    ] as string;
    await this.inPlan("plan_staff_levels", operations, { staff_level_id: level, hourly_rate_cents: cents });
    return level;
  }

  /** The office, in an Operations Plan's plan: `cents` a year, shared among every offering. */
  async office(operations: string, cents: number): Promise<void> {
    const pool = await this.inPlan("plan_pools", operations, { name: "Office" });
    await this.inPlan("plan_budget_lines", operations, {
      name: "Office rent",
      account_id: this.accounts["office"],
      cost_center_type: "pool",
      cost_center_id: pool["id"],
      amount_cents: cents,
      fiscal_year: this.year,
    });
  }

  /** Donations, in an Operations Plan's plan: `cents` of fundraising revenue for the year, on the organization. */
  async donations(operations: string, cents: number): Promise<void> {
    await this.inPlan("plan_budget_lines", operations, {
      name: "Donations",
      account_id: this.accounts["donations"],
      function: "fundraising",
      cost_center_type: "org",
      amount_cents: cents,
      fiscal_year: this.year,
    });
  }

  /** Sets every budget line named `name` in `plan` to `cents`. */
  async setLine(plan: string, name: string, cents: number): Promise<void> {
    const lines: { id: string }[] = await asAdmin(
      "GET",
      `/items/plan_budget_lines?filter[plan_id][_eq]=${plan}&filter[name][_eq]=${encodeURIComponent(name)}&fields=id`,
    );
    for (const { id } of lines) {
      await asAdmin("PATCH", `/items/plan_budget_lines/${id}`, { amount_cents: cents });
    }
  }

  /**
   * Deletes everything the scenario made. Financial Plans go first, the ones a visitor started in the app before the
   * ones they were started from, each with its plans, their rows, and its results. Then the rest, newest first. The CI stack's
   * `backend:frozenPlansDeletable` lets the admin delete frozen ones; prod refuses it.
   */
  async cleanUp(): Promise<void> {
    const made = this.made.filter((m) => m.collection === "financial_plans").map((m) => m.id);
    const all: { id: string }[] = this.organizationId
      ? await asAdmin(
          "GET",
          `/items/financial_plans?filter[organization_id][_eq]=${this.organizationId}&fields=id&limit=-1`,
        )
      : [];
    const existing = all.map((s) => s.id);
    const started = existing.filter((id) => !made.includes(id));
    // A visitor may have deleted one the scenario made.
    for (const set of [...started, ...made.reverse().filter((id) => existing.includes(id))]) {
      await asAdmin("DELETE", `/items/financial_plans/${set}`);
    }
    for (const { collection, id } of this.made.reverse()) {
      if (collection !== "financial_plans") {
        await asAdmin("DELETE", `/items/${collection}/${id}`);
      }
    }
  }
}
