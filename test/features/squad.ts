import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { asAdmin, newRunId } from "./support";
import type { Visitor } from "./visitors";

// Made-up programs and families on dev, made by dev's admin and deleted when the scenario ends. Each offering and
// registration is the one clubspot-sync would make from Clubspot's mirrors, as platform's own features make them, so
// a sync run leaves them be. Every name is made up.

type Row = Record<string, unknown>;

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

export interface Program {
  name: string;
  id: string;
  campId: string;
  sessionId: string;
  classId: string;
  offeringId: string;
}

export class Squad {
  readonly run = newRunId();
  /** Every row made, oldest first, so cleanup deletes the newest first. */
  private readonly made: { collection: string; id: string }[] = [];
  /** The made-up program area every program here is in: the team, on the rosters. */
  areaId?: string;
  private serial = 0;

  private key(prefix: string) {
    return `${prefix}-${this.run}-${++this.serial}`;
  }

  private async create(collection: string, fields: Row): Promise<Row> {
    const row = await asAdmin("POST", `/items/${collection}`, { id: randomUUID(), ...fields });
    this.made.push({ collection, id: row["id"] as string });
    return row;
  }

  /** A new product of kind program, as each program has its own, all in the run's one program area. */
  private async product(name: string): Promise<string> {
    if (!this.areaId) {
      const account = await this.create("accounts", {
        number: `J${this.run}-rosters`,
        name: `Rosters ${this.run}`,
        type: "revenue",
        retired: false,
      });
      this.areaId = (await this.create("program_areas", { name: this.teamName, revenue_account_id: account["id"] }))[
        "id"
      ] as string;
    }
    return (await this.create("products", { name, kind: "program", program_area_id: this.areaId }))["id"] as string;
  }

  /** A program running now, with one class in a Clubspot camp, and its offering. */
  async program(name: string, { team }: { team: boolean }): Promise<Program> {
    const programName = `${name} ${this.run}`;
    const program = await this.create("programs", {
      name: programName,
      team,
      product_id: await this.product(programName),
    });
    const [startsOn, endsOn] = [daysFromNow(-7), daysFromNow(7)];
    const camp = await this.create("clubspot_camps", {
      id: this.key("camp"),
      name: `Camp ${this.run}`,
      start_date: startsOn,
      end_date: endsOn,
    });
    const session = await this.create("clubspot_sessions", { id: this.key("session"), camp_id: camp["id"] });
    const klass = await this.create("clubspot_classes", {
      id: this.key("class"),
      name: `Class ${this.run}`,
      camp_id: camp["id"],
      program_id: program["id"],
    });
    const offering = await this.create("offerings", {
      program_id: program["id"],
      starts_on: startsOn,
      ends_on: endsOn,
      capacity: null,
      clubspot_class_id: klass["id"],
      clubspot_session_id: null,
    });
    return {
      name: programName,
      id: program["id"] as string,
      campId: camp["id"] as string,
      sessionId: session["id"] as string,
      classId: klass["id"] as string,
      offeringId: offering["id"] as string,
    };
  }

  /** Someone in the CRM. An adult's email and phone are their own, made up for the run. */
  async person(first: string, fields: Row = {}): Promise<{ id: string; name: string; email: string; phone: string }> {
    const last = `Halyard ${this.run}`;
    const email = `sail-team.squad.${this.run}.${++this.serial}@example.com`;
    const phone = `+1206555${String(this.serial).padStart(4, "0")}`;
    const row = await this.create("people", { first_name: first, last_name: last, email, phone, ...fields });
    return { id: row["id"] as string, name: `${first} ${last}`, email, phone };
  }

  /** The made-up program area's name, which is the team's on the rosters. */
  get teamName(): string {
    return `Racing ${this.run}`;
  }

  /** A Google Group for `program`, archived so platform's gsuite-sync leaves it alone. */
  async googleGroup(program: Program): Promise<string> {
    const email = `sail-team.squad.${this.run}.${++this.serial}@example.com`;
    const group = await this.create("google_groups", { email, name: program.name, archived: true });
    await asAdmin("PATCH", `/items/programs/${program.id}`, { google_group_id: group["id"] });
    return email;
  }

  /** A child, with no email or phone of their own. */
  async child(first: string, fields: Row = {}): Promise<{ id: string; name: string }> {
    const last = `Halyard ${this.run}`;
    const row = await this.create("people", { first_name: first, last_name: last, email: null, ...fields });
    return { id: row["id"] as string, name: `${first} ${last}` };
  }

  async guardian(childId: string, guardianId: string): Promise<void> {
    await this.create("contacts", { subject_id: childId, contact_id: guardianId, relationship_type: "guardian" });
  }

  /** A household of `people`, as platform makes one for each family Clubspot links, and whether it shares. */
  async household(people: string[], shares: boolean | null): Promise<string> {
    const household = await this.create("households", { share_contact: shares });
    for (const id of people) {
      await asAdmin("PATCH", `/items/people/${id}`, { household_id: household["id"] });
    }
    return household["id"] as string;
  }

  /** Confirms `personId` in `program`, as Clubspot and clubspot-sync would. */
  async signUp(personId: string, program: Program): Promise<void> {
    const participant = await this.create("clubspot_participants", {
      id: this.key("participant"),
      person_id: personId,
    });
    const registration = await this.create("clubspot_registrations", {
      id: this.key("registration"),
      camp_id: program.campId,
      registered_at: new Date().toISOString(),
      status: "confirmed",
      participant_id: participant["id"],
      share_contact: null,
    });
    const entry = await this.create("clubspot_registration_entries", {
      id: this.key("entry"),
      registration_id: registration["id"],
      session_id: program.sessionId,
      class_id: program.classId,
      status: "confirmed",
    });
    await this.create("registrations", {
      person_id: personId,
      offering_id: program.offeringId,
      status: "confirmed",
      clubspot_entry_id: entry["id"],
    });
  }

  /**
   * The visitor's own person, which `cleanUp` in ./visitors.ts deletes by their email. platform's `group-policies` hook
   * links it to their login, which this waits for.
   */
  async visitorPerson(visitor: Visitor): Promise<string> {
    const person = await asAdmin("POST", "/items/people", {
      first_name: visitor.firstName,
      last_name: visitor.lastName,
      email: visitor.email,
    });
    visitor.personId = person.id;
    await expect
      .poll(async () => (await asAdmin("GET", `/items/people/${person.id}?fields=directus_user_id`)).directus_user_id, {
        timeout: 60_000,
        intervals: [1_000],
      })
      .toBe(visitor.directusUserId);
    return person.id;
  }

  /** Deletes everything the scenario made, newest first, so a registration goes before its person and offering. */
  async cleanUp(): Promise<void> {
    for (const { collection, id } of this.made.reverse()) {
      await asAdmin("DELETE", `/items/${collection}/${id}`);
    }
  }
}

/** Waits for platform's `group-policies` hook to put the visitor on `role`, as it does when a family joins a team. */
export async function hasRole(visitor: Visitor, role: string): Promise<void> {
  await expect
    .poll(async () => (await asAdmin("GET", `/users/${visitor.directusUserId}?fields=role.name`)).role?.name, {
      timeout: 60_000,
      intervals: [1_000],
    })
    .toBe(role);
}

/** Puts the visitor on a role by hand, as an admin does for Crew. */
export async function setRole(visitor: Visitor, role: string): Promise<void> {
  const [found] = await asAdmin("GET", `/roles?filter[name][_eq]=${encodeURIComponent(role)}&fields=id`);
  await asAdmin("PATCH", `/users/${visitor.directusUserId}`, { role: found.id });
}
