import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ciAppUrl, ciStack } from "./target";

// What the journeys reach: a CI stack's services, as its target.json gives them (./target.ts).

/** Where workers take turns at Authentik's sign-in. ./global-setup.ts clears one a killed run left. */
export const authentikLock = join(tmpdir(), "sail-team-journeys-authentik.lock");

/** Names a run's data, so runs never read or break each other's. Lowercase, for emails. */
export function newRunId(): string {
  return `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
}

interface HttpResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<any>;
}

export const http = fetch as unknown as (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<HttpResponse>;

/** The app's address. */
export async function appUrl(): Promise<string> {
  return ciAppUrl;
}

/** Directus's address. */
export async function directusUrl(): Promise<string> {
  return ciStack.directus.url;
}

/** Authentik's address, for the browser and its API alike. */
export async function authentikUrl(): Promise<string> {
  return ciStack.authentik.url;
}

/** Calls Mailpit's API, which must succeed. */
export async function mailpit(path: string): Promise<any> {
  const response = await http(`${ciStack.services["mailpit:8025"]}${path}`);
  if (!response.ok) {
    throw new Error(`GET mailpit${path}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** A Directus REST call as its built-in admin, with the stack's static token, which must succeed. Returns `data`. */
export async function asAdmin(method: string, path: string, body?: unknown): Promise<any> {
  const response = await http(`${ciStack.directus.url}${path}`, {
    method,
    headers: { authorization: `Bearer ${ciStack.directus.adminToken}`, "content-type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  if (response.status >= 300) {
    throw new Error(`${method} ${path}: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text).data : undefined;
}

/** Calls Authentik's users API with the stack's bootstrap token. */
export async function authentikUsers(method: string, path: string): Promise<any> {
  const api = `${ciStack.authentik.url}/api/v3/core/users`;
  const response = await http(`${api}${path}`, {
    method,
    headers: { authorization: `Bearer ${ciStack.authentik.token}` },
  });
  if (!response.ok) {
    throw new Error(`${method} ${api}${path}: ${response.status} ${await response.text()}`);
  }
  return method === "DELETE" ? undefined : response.json();
}
