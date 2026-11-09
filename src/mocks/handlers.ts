import { http, HttpResponse } from "msw";
import type { Permissions } from "@/directus/access";
import type { Me } from "@/directus/sign-in";
import { planner, plannerPermissions } from "./fixtures";
import { tables } from "./plans";
import { rosterTables } from "./roster";

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
 * Whether a row matches a Directus filter's `_eq` and `_in` conditions, inside any `_and`. Other conditions match every
 * row. `$CURRENT_USER` is `me`.
 */
function matches(row: Row, filter: Record<string, Record<string, unknown>>, me?: string): boolean {
  return Object.entries(filter).every(([field, condition]) => {
    if (field === "_and") {
      return (condition as unknown as Record<string, Record<string, unknown>>[]).every((f) => matches(row, f, me));
    }
    // A related row is matched by its id, as Directus matches a foreign key.
    const raw = row[field];
    const value = raw !== null && typeof raw === "object" && "id" in raw ? (raw as Row)["id"] : raw;
    if ("_eq" in condition) {
      return value === (condition["_eq"] === "$CURRENT_USER" ? me : condition["_eq"]);
    }
    if ("_in" in condition) {
      return (condition["_in"] as unknown[]).includes(value);
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

/** Directus's answers for one made-up session, at `directusUrl`. A `null` user is a visitor with no session. */
export function handlers(directusUrl: string, session: MockSession = { me: planner, permissions: plannerPermissions }) {
  return [
    http.get(`${directusUrl}/users/me`, () => (session.me ? HttpResponse.json({ data: session.me }) : forbidden())),
    http.get(`${directusUrl}/permissions/me`, () =>
      session.me ? HttpResponse.json({ data: session.permissions }) : forbidden(),
    ),
    http.get(`${directusUrl}/items/:table/:id`, ({ params, request }) => {
      const table = params["table"] as string;
      const row = (tables[table] ?? rosterTables[table])?.find((r) => r["id"] === params["id"]);
      return row
        ? HttpResponse.json({ data: shape(row, new URL(request.url).searchParams.get("fields")) })
        : forbidden();
    }),
    http.get(`${directusUrl}/items/:table`, ({ params, request }) => {
      const query = new URL(request.url).searchParams;
      const filter = query.get("filter");
      const rows = (tables[params["table"] as string] ?? rosterTables[params["table"] as string] ?? []).filter(
        (r) => !filter || matches(r, JSON.parse(filter), session.me?.id),
      );
      return HttpResponse.json({ data: rows.map((r) => shape(r, query.get("fields"))) });
    }),
    http.patch(`${directusUrl}/items/:table/:id`, async ({ params, request }) => {
      const table = params["table"] as string;
      const row = (tables[table] ?? rosterTables[table])?.find((r) => r["id"] === params["id"]);
      if (!row) {
        return forbidden();
      }
      Object.assign(row, await request.json());
      return HttpResponse.json({ data: row });
    }),
    // A new Financial Plan, with its parent's plans copied in, as platform's hook copies them.
    http.post(`${directusUrl}/items/version_sets`, async ({ request }) => {
      const body = (await request.json()) as Row;
      const parent = tables["version_sets"]!.find((s) => s["id"] === body["parent_id"]);
      const row: Row = {
        saved_at: null,
        saved_by: null,
        ...body,
        status: "draft",
        parent_id: parent ? { id: parent["id"], name: parent["name"] } : null,
      };
      tables["version_sets"]!.push(row);
      const members = tables["version_set_members"]!;
      for (const m of members.filter((m) => (m["version_set_id"] as Row)["id"] === parent?.["id"])) {
        members.push({ ...m, id: crypto.randomUUID(), version_set_id: row });
      }
      return HttpResponse.json({ data: row });
    }),
  ];
}
