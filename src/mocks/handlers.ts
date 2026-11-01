import { http, HttpResponse } from "msw";
import type { Permissions } from "@/directus/access";
import type { Me } from "@/directus/sign-in";
import { planner, plannerPermissions } from "./fixtures";

export interface MockSession {
  me: Me | null;
  permissions: Permissions;
}

const forbidden = () =>
  HttpResponse.json(
    { errors: [{ message: "You don't have permission to access this.", extensions: { code: "FORBIDDEN" } }] },
    { status: 403 },
  );

/** Directus's answers for one made-up session, at `directusUrl`. A `null` user is a visitor with no session. */
export function handlers(directusUrl: string, session: MockSession = { me: planner, permissions: plannerPermissions }) {
  return [
    http.get(`${directusUrl}/users/me`, () => (session.me ? HttpResponse.json({ data: session.me }) : forbidden())),
    http.get(`${directusUrl}/permissions/me`, () =>
      session.me ? HttpResponse.json({ data: session.permissions }) : forbidden(),
    ),
  ];
}
