import { http, HttpResponse } from "msw";
import type { Permissions } from "@/directus/access";
import type { Me } from "@/directus/sign-in";
import { planner, plannerPermissions } from "./fixtures";
import { catalogTables } from "./catalog";
import { crewTables, photo } from "./crew";
import { homeTables } from "./home";
import { inventoryTables } from "./inventory";
import { engine, tables } from "./plans";
import { logins, rosterTables } from "./roster";

export interface MockSession {
  me: Me | null;
  permissions: Permissions;
}

const forbidden = () =>
  HttpResponse.json(
    { errors: [{ message: "You don't have permission to access this.", extensions: { code: "FORBIDDEN" } }] },
    { status: 403 },
  );

type Row = Record<string, unknown>;

/**
 * Whether a row matches a Directus filter's `_eq`, `_in`, and `_icontains` conditions, inside any `_and` or `_or`. Other conditions match every
 * row. `$CURRENT_USER` and `$CURRENT_USER.person_id` are read from `vars`.
 */
function matches(row: Row, filter: Record<string, Record<string, unknown>>, vars: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([field, condition]) => {
    if (field === "_and") {
      return (condition as unknown as Record<string, Record<string, unknown>>[]).every((f) => matches(row, f, vars));
    }
    if (field === "_or") {
      return (condition as unknown as Record<string, Record<string, unknown>>[]).some((f) => matches(row, f, vars));
    }
    // A related row is matched by its id, as Directus matches a foreign key.
    const raw = row[field];
    const value = raw !== null && typeof raw === "object" && "id" in raw ? (raw as Row)["id"] : raw;
    if ("_eq" in condition) {
      const eq = condition["_eq"];
      return value === (typeof eq === "string" && eq in vars ? vars[eq] : eq);
    }
    if ("_in" in condition) {
      return (condition["_in"] as unknown[]).includes(value);
    }
    if ("_icontains" in condition) {
      return String(value ?? "")
        .toLowerCase()
        .includes(String(condition["_icontains"]).toLowerCase());
    }
    return true;
  });
}

/**
 * A row as Directus returns it for `fields`: only the fields asked for, and a related row's id unless its own fields
 * are asked for too. With no `fields`, or `*`, every field.
 */
function shape(row: Row, fields: string | null): Row {
  const asked = (fields ?? "*").split(",");
  const everything = asked.includes("*");
  return Object.fromEntries(
    Object.entries(row)
      .filter(([field]) => everything || asked.some((f) => f === field || f.startsWith(`${field}.`)))
      .map(([field, value]) => {
        const related = value !== null && typeof value === "object" && "id" in value;
        const expanded = asked.some((f) => f.startsWith(`${field}.`));
        return [field, related && !expanded ? (value as Row)["id"] : value];
      }),
  );
}

/** A made-up table by name, from whichever area has it. Crew's comes first, for its people. */
const tableOf = (table: string): Row[] | undefined =>
  crewTables[table] ??
  inventoryTables[table] ??
  catalogTables[table] ??
  tables[table] ??
  rosterTables[table] ??
  homeTables[table];

/** The tables a made-up session can add to and delete from. */
const writable = (table: string): Row[] | undefined => crewTables[table] ?? inventoryTables[table];

/** Directus's answers for one made-up session, at `directusUrl`. A `null` user is a visitor with no session. */
export function handlers(directusUrl: string, session: MockSession = { me: planner, permissions: plannerPermissions }) {
  // Directus reads a login with no person as null, which matches no one.
  const vars = {
    $CURRENT_USER: session.me?.id,
    "$CURRENT_USER.person_id": session.me ? (logins[session.me.id] ?? null) : undefined,
  };
  return [
    http.get(`${directusUrl}/users/me`, () => (session.me ? HttpResponse.json({ data: session.me }) : forbidden())),
    http.post(`${directusUrl}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${directusUrl}/auth/refresh`, () =>
      session.me ? HttpResponse.json({ data: { expires: 86_400_000 } }) : HttpResponse.json({}, { status: 401 }),
    ),
    // Other users' names, which platform lets a planner read.
    http.get(`${directusUrl}/users`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      const filter = query.get("filter");
      const rows = tables["directus_users"]!.filter((r) => !filter || matches(r, JSON.parse(filter), vars));
      return HttpResponse.json({ data: rows.map((r) => shape(r, query.get("fields"))) });
    }),
    http.get(`${directusUrl}/permissions/me`, () =>
      session.me ? HttpResponse.json({ data: session.permissions }) : forbidden(),
    ),
    http.get(`${directusUrl}/items/:table/:id`, ({ params, request }) => {
      const table = params["table"] as string;
      const row = tableOf(table)?.find((r) => r["id"] === params["id"]);
      return row
        ? HttpResponse.json({ data: shape(row, new URL(request.url).searchParams.get("fields")) })
        : forbidden();
    }),
    http.get(`${directusUrl}/items/:table`, ({ params, request }) => {
      const query = new URL(request.url).searchParams;
      const filter = query.get("filter");
      const table = params["table"] as string;
      const rows = (tableOf(table) ?? []).filter((r) => !filter || matches(r, JSON.parse(filter), vars));
      return HttpResponse.json({ data: rows.map((r) => shape(r, query.get("fields"))) });
    }),
    http.patch(`${directusUrl}/items/:table/:id`, async ({ params, request }) => {
      const table = params["table"] as string;
      const row = tableOf(table)?.find((r) => r["id"] === params["id"]);
      if (!row) {
        return forbidden();
      }
      const changes = (await request.json()) as Row;
      // An asset's boat details, changed with it, as Directus applies a nested change to a one-to-many.
      if (table === "assets" && changes["boats"]) {
        const nested = changes["boats"] as { create: Row[]; update: Row[]; delete: string[] };
        const boats = (row["boats"] as Row[]).filter((b) => !nested.delete.includes(b["id"] as string));
        for (const update of nested.update) {
          Object.assign(boats.find((b) => b["id"] === update["id"]) ?? {}, update);
        }
        boats.push(...nested.create.map((b) => ({ id: crypto.randomUUID(), asset_id: row["id"], ...b })));
        changes["boats"] = boats;
      }
      // A position's qualifications, changed with it.
      if (table === "crew_positions" && changes["qualifications"]) {
        const nested = changes["qualifications"] as { create: Row[]; delete: string[] };
        changes["qualifications"] = [
          ...(row["qualifications"] as Row[]).filter((q) => !nested.delete.includes(q["id"] as string)),
          ...nested.create.map((q) => ({ id: crypto.randomUUID(), ...q })),
        ];
      }
      // A picked school is saved by its id, and read back with its name, as Directus expands the relation.
      if (changes["school_id"]) {
        changes["school_id"] = rosterTables["schools"]!.find((s) => s["id"] === changes["school_id"]) ?? null;
      }
      Object.assign(row, changes);
      return HttpResponse.json({ data: row });
    }),
    // A new asset, with its boat details, or a new boat class.
    http.post(`${directusUrl}/items/:table`, async ({ params, request }) => {
      const table = params["table"] as string;
      const rows = writable(table);
      if (!rows) {
        // Another handler's table, such as a Financial Plan's.
        return undefined;
      }
      const body = (await request.json()) as Row;
      const row: Row = { id: crypto.randomUUID(), ...body };
      // A new crew member's person, read back with their name, as Directus expands the relation.
      if (table === "crew_members") {
        const person = crewTables["people"]!.find((p) => p["id"] === body["person_id"]);
        Object.assign(row, { website_name: null, website_bio: null, website_photo: null, person_id: person });
      }
      if (table === "crew_positions") {
        row["qualifications"] = ((body["qualifications"] as Row[] | undefined) ?? []).map((q) => ({
          id: crypto.randomUUID(),
          ...q,
        }));
      }
      if (table === "assets") {
        row["boats"] = ((body["boats"] as Row[] | undefined) ?? []).map((b) => ({
          id: crypto.randomUUID(),
          asset_id: row["id"],
          ...b,
        }));
      }
      rows.push(row);
      return HttpResponse.json({ data: row });
    }),
    http.delete(`${directusUrl}/items/:table/:id`, ({ params }) => {
      const table = params["table"] as string;
      if (table === "boats") {
        for (const asset of inventoryTables["assets"]!) {
          asset["boats"] = (asset["boats"] as Row[]).filter((b) => b["id"] !== params["id"]);
        }
      }
      const rows = writable(table);
      if (!rows) {
        return undefined;
      }
      const at = rows.findIndex((r) => r["id"] === params["id"]);
      if (at < 0) {
        return forbidden();
      }
      rows.splice(at, 1);
      return new HttpResponse(null, { status: 204 });
    }),
    // A photo, made up from its id, and a new one uploaded.
    http.get(
      `${directusUrl}/assets/:id`,
      ({ params }) => new HttpResponse(photo(params["id"] as string), { headers: { "Content-Type": "image/svg+xml" } }),
    ),
    http.post(`${directusUrl}/files`, () => HttpResponse.json({ data: { id: crypto.randomUUID() } })),
    http.get(`${directusUrl}/frozen-plans/engine`, () => HttpResponse.json({ platform_version: engine })),
    // A draft recalculated with today's engine. Made up, they come out the same.
    http.post(`${directusUrl}/frozen-plans/drafts/:id/results`, ({ params }) => {
      const set = tables["financial_plans"]!.find((s) => s["id"] === params["id"]);
      if (set?.["status"] !== "draft") {
        return forbidden();
      }
      for (const row of tables["plan_results"]!.filter((r) => r["financial_plan_id"] === set["id"])) {
        row["platform_version"] = engine;
      }
      return HttpResponse.json({ written: true });
    }),
    // A new Financial Plan, with its parent's plans and their rows copied in, as platform's hook copies them.
    http.post(`${directusUrl}/items/financial_plans`, async ({ request }) => {
      const body = (await request.json()) as Row;
      const parent = tables["financial_plans"]!.find((s) => s["id"] === body["parent_id"]);
      const row: Row = {
        frozen_at: null,
        frozen_by: null,
        effective_from: null,
        archived_at: null,
        ...body,
        status: "draft",
        parent_id: parent ? { id: parent["id"], name: parent["name"] } : null,
      };
      tables["financial_plans"]!.push(row);
      const plans = tables["plans"]!;
      for (const plan of plans.filter((p) => (p["financial_plan_id"] as Row)["id"] === parent?.["id"])) {
        const copy = { ...plan, id: crypto.randomUUID(), financial_plan_id: row };
        plans.push(copy);
        for (const [table, rows] of Object.entries(tables)) {
          if (table.startsWith("plan_") && !table.startsWith("plan_result")) {
            for (const r of rows.filter((r) => r["plan_id"] === plan["id"])) {
              rows.push({ ...r, id: crypto.randomUUID(), plan_id: copy.id });
            }
          }
        }
      }
      return HttpResponse.json({ data: row });
    }),
  ];
}
