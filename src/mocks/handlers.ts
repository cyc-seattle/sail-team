import { http, HttpResponse } from "msw";
import type { Permissions } from "@/directus/access";
import type { Me } from "@/directus/sign-in";
import { planner, plannerPermissions } from "./fixtures";
import { tables } from "./plans";

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

/** Whether a row matches a Directus filter's top-level `_eq` and `_in` conditions. Nested ones match every row. */
function matches(row: Row, filter: Record<string, Record<string, unknown>>): boolean {
  return Object.entries(filter).every(([field, condition]) => {
    if ("_eq" in condition) {
      return row[field] === condition["_eq"];
    }
    if ("_in" in condition) {
      return (condition["_in"] as unknown[]).includes(row[field]);
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
      const row = tables[params["table"] as string]?.find((r) => r["id"] === params["id"]);
      return row
        ? HttpResponse.json({ data: shape(row, new URL(request.url).searchParams.get("fields")) })
        : forbidden();
    }),
    http.get(`${directusUrl}/items/:table`, ({ params, request }) => {
      const query = new URL(request.url).searchParams;
      const filter = query.get("filter");
      const rows = (tables[params["table"] as string] ?? []).filter((r) => !filter || matches(r, JSON.parse(filter)));
      return HttpResponse.json({ data: rows.map((r) => shape(r, query.get("fields"))) });
    }),
  ];
}
