import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { asAdmin, newRunId } from "./support";

// A made-up club's 2027 plans on dev, made by dev's admin and deleted when the scenario ends: an organization, its
// accounts, a Youth Racing area and product, an Operations Plan, and Youth Racing's plan. Every figure is made up.

export const PLAN_YEAR = 2027;

type Row = Record<string, unknown>;

export class Club {
  readonly run = newRunId();
  readonly area = `Youth Racing ${this.run}`;
  /**
   * The plan year. The plans journeys use 2027. A financial model journey that reads a whole year's page uses a far-off
   * year of its own, so no other run's financial model for the year can show up there.
   */
  year = PLAN_YEAR;
  get areaPlanName() {
    return `Youth Racing ${this.run} ${this.year}`;
  }
  get operationsPlanName() {
    return `Operations ${this.run} ${this.year}`;
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
  private areaId?: string;
  private productId?: string;
  areaPlan?: string;
  operationsPlan?: string;
  operationsVersion?: string;

  private async create(collection: string, fields: Row): Promise<Row> {
    const id = randomUUID();
    const row = await asAdmin("POST", `/items/${collection}`, { id, ...fields });
    this.made.push({ collection, id });
    return row;
  }

  private async versioned(collection: string, version: string, fields: Row): Promise<Row> {
    return this.create(collection, { version_id: version, key: randomUUID(), ...fields });
  }

  /** The organization, its accounts, the area, its product, and both plans, each with a draft. */
  async plans(): Promise<void> {
    this.organizationId = (
      await this.create("organizations", { name: `Journey club ${this.run}`, fiscal_year_start_month: 1 })
    )["id"] as string;
    for (const [name, type, fn] of [
      ["programs", "revenue", "program"],
      ["costs", "expense", "program"],
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
    // The Operations Plan first, so cleanup deletes the area's versions that name it before it.
    this.operationsPlan = (await this.plan("operations", null, this.operationsPlanName))["id"] as string;
    this.operationsVersion = await this.draft(this.operationsPlan);
    this.areaPlan = (await this.plan("program_area", this.areaId, this.areaPlanName))["id"] as string;
  }

  private plan(kind: "operations" | "program_area", areaId: string | null, name: string) {
    return this.create("plans", {
      kind,
      program_area_id: areaId,
      organization_id: this.organizationId,
      fiscal_year: this.year,
      name,
    });
  }

  /** A new draft of `plan`, calculated with `operations` (a saved Operations Plan version) if given. */
  async draft(plan: string, operations?: string): Promise<string> {
    return (
      await this.create("plan_versions", {
        plan_id: plan,
        status: "draft",
        ...(operations && { operations_version_id: operations }),
      })
    )["id"] as string;
  }

  /** An offering in `version` of `sailors` at `price` cents each, with `costs` cents of its own costs. */
  async offering(version: string, name: string, sailors: number, price: number, costs = 0): Promise<string> {
    const offering = await this.versioned("plan_offerings", version, {
      product_id: this.productId,
      name,
      starts_on: `${this.year}-07-05`,
      ends_on: `${this.year}-07-16`,
      target_enrollment: sailors,
      price_cents: price,
    });
    if (costs > 0) {
      await this.versioned("plan_budget_lines", version, {
        name: `${name} costs`,
        account_id: this.accounts["costs"],
        cost_center_type: "offering",
        cost_center_key: offering["key"],
        amount_cents: costs,
        fiscal_year: this.year,
        excluded_from_mtdc: false,
      });
    }
    return offering["id"] as string;
  }

  /** A practice of `offering` on each of `dates`, in the morning. */
  async practices(version: string, offering: string, dates: string[]): Promise<void> {
    for (const date of dates) {
      await this.versioned("plan_activities", version, {
        offering_id: offering,
        date,
        start_time: "09:00:00",
        end_time: "12:00:00",
        kind: "practice",
        uses_boats: false,
      });
    }
  }

  /** A day the club is closed, in the Operations Plan's draft. */
  async closed(date: string, name: string): Promise<void> {
    await this.versioned("plan_closed_dates", this.operationsVersion!, { date, name });
  }

  /**
   * Saves a draft as the admin, the way a Plan Writer does, and waits for platform's saved-versions hook to work out
   * its results. An area's version names the saved Operations Plan version.
   */
  async save(version: string, message: string): Promise<void> {
    const isArea = version !== this.operationsVersion;
    await asAdmin("PATCH", `/items/plan_versions/${version}`, {
      status: "saved",
      message,
      ...(isArea && { operations_version_id: this.operationsVersion }),
    });
    await expect
      .poll(
        async () => (await asAdmin("GET", `/items/plan_results?filter[version_id][_eq]=${version}&fields=id`)).length,
        {
          timeout: 60_000,
          intervals: [1_000],
        },
      )
      .toBe(1);
  }

  async activate(version: string): Promise<void> {
    await this.create("plan_activations", { version_id: version });
  }

  /**
   * Saves the financial model for the year as dev's admin, the way a Plan Writer does: a new `version_sets` row. The database
   * fills in its members, the active versions, and platform works out its results, which this waits for. Returns its id.
   */
  async saveFinancialModel(name: string): Promise<string> {
    const set = (
      await this.create("version_sets", {
        organization_id: this.organizationId,
        fiscal_year: this.year,
        name,
      })
    )["id"] as string;
    await expect
      .poll(
        async () => (await asAdmin("GET", `/items/plan_results?filter[version_set_id][_eq]=${set}&fields=id`)).length,
        {
          timeout: 60_000,
          intervals: [1_000],
        },
      )
      .toBe(1);
    return set;
  }

  /**
   * Deletes everything the scenario made, newest first, so a financial model goes before the versions it holds. Dev's
   * `backend:savedVersionsDeletable` lets its first admin delete a saved version or financial model, with its rows,
   * activations, members, and results; prod refuses it.
   */
  async cleanUp(): Promise<void> {
    for (const { collection, id } of this.made.reverse()) {
      await asAdmin("DELETE", `/items/${collection}/${id}`);
    }
  }
}
