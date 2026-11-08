import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GoogleAuth } from "google-auth-library";

// What the journeys reach on dev, as whatever identity ADC holds (deploy-dev in Actions): the cluster, through its
// API, for the Secrets and Mailpit, and dev's Directus as its built-in admin. Ported from isthmia's
// test/features/support.ts. Never point any of it at prod.

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

const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

async function accessToken(): Promise<string> {
  const token = await auth.getAccessToken();
  if (!token) {
    throw new Error("Application Default Credentials gave no access token.");
  }
  return token;
}

export interface DevPlatform {
  clusterEndpoint: string;
  namespace: string;
  domain: string;
}

let platform: Promise<DevPlatform> | undefined;

/** Reads dev's outputs file from its state bucket, the way the Pulumi projects do. Always dev's. */
export function devPlatform(): Promise<DevPlatform> {
  platform ??= (async () => {
    const project = process.env["GCP_PROJECT"];
    if (!project) {
      throw new Error("GCP_PROJECT isn't set. Run the journeys under mise.");
    }
    const bucket = `${project}-pulumi-dev`;
    const object = encodeURIComponent("platform/outputs.json");
    const response = await http(`https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}?alt=media`, {
      headers: { authorization: `Bearer ${await accessToken()}` },
    });
    if (!response.ok) {
      throw new Error(`Can't read gs://${bucket}/platform/outputs.json: ${response.status} ${await response.text()}`);
    }
    const outputs = (await response.json()) as DevPlatform;
    if (outputs.namespace !== "dev") {
      throw new Error(`The journeys run only against dev, not ${outputs.namespace}.`);
    }
    return outputs;
  })();
  return platform;
}

/** Calls dev's cluster API through its DNS-based endpoint, with the caller's Google token. */
async function kube(method: string, path: string) {
  const { clusterEndpoint } = await devPlatform();
  const response = await http(`https://${clusterEndpoint}${path}`, {
    method,
    headers: { authorization: `Bearer ${await accessToken()}` },
  });
  const text = await response.text();
  const json = response.headers.get("content-type")?.startsWith("application/json");
  return { status: response.status, body: json && text ? JSON.parse(text) : text || undefined };
}

const namespaced = async (group: string, resource: string) =>
  `${group === "" ? "/api/v1" : `/apis/${group}`}/namespaces/${(await devPlatform()).namespace}/${resource}`;

/** Calls a dev Service that isn't on the Gateway, such as Mailpit, through the API's service proxy. */
export async function proxyOk(service: string, port: number, path: string): Promise<any> {
  const response = await kube("GET", `${await namespaced("", "services")}/${service}:${port}/proxy${path}`);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`GET ${service}:${port}${path}: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

/** One key of a Secret in dev's namespace. */
export async function secretValue(name: string, key: string): Promise<string> {
  const response = await kube("GET", `${await namespaced("", "secrets")}/${name}`);
  const value = response.body?.data?.[key];
  if (response.status !== 200 || typeof value !== "string") {
    throw new Error(`Can't read ${key} from the Secret ${name}: ${response.status}`);
  }
  return Buffer.from(value, "base64").toString("utf8");
}

async function deploymentEnv(deployment: string, name: string): Promise<string> {
  const response = await kube("GET", `${await namespaced("apps/v1", "deployments")}/${deployment}`);
  const env: { name: string; value?: string }[] = response.body?.spec?.template?.spec?.containers?.[0]?.env ?? [];
  const value = env.find((variable) => variable.name === name)?.value;
  if (response.status !== 200 || value === undefined) {
    throw new Error(`Can't read ${name} from the Deployment ${deployment}: ${response.status}`);
  }
  return value;
}

let admin: Promise<{ baseUrl: string; token: string }> | undefined;

/** Signs in to dev's Directus as its built-in admin, with the password in the `directus` Secret. */
function directusAdmin() {
  admin ??= (async () => {
    const baseUrl = `https://directus.${(await devPlatform()).domain}`;
    const email = await deploymentEnv("directus", "ADMIN_EMAIL");
    const password = await secretValue("directus", "ADMIN_PASSWORD");
    const response = await http(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(`Can't sign in to dev's Directus as its admin: ${response.status} ${await response.text()}`);
    }
    return { baseUrl, token: (await response.json()).data.access_token as string };
  })();
  return admin;
}

/** A Directus REST call as dev's admin, which must succeed. Returns the response's `data`. */
export async function asAdmin(method: string, path: string, body?: unknown): Promise<any> {
  for (let attempt = 1; ; attempt++) {
    const { baseUrl, token } = await directusAdmin();
    const response = await http(`${baseUrl}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : undefined;
    // Dev's small Directus sheds load with a 503. The admin's token lasts 15 minutes, which a run can outlast.
    if (response.status === 503 && attempt < 10) {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      continue;
    }
    if (response.status === 401 && parsed?.errors?.[0]?.extensions?.code === "TOKEN_EXPIRED" && attempt === 1) {
      admin = undefined;
      continue;
    }
    if (response.status >= 300) {
      throw new Error(`${method} ${path}: ${response.status} ${text}`);
    }
    return parsed?.data;
  }
}

/** Calls Authentik's users API on dev, with the bootstrap token Authentik's stack wrote to its Secret. */
export async function authentikUsers(method: string, path: string): Promise<any> {
  const api = `https://login.${(await devPlatform()).domain}/api/v3/core/users`;
  const token = await secretValue("authentik", "AUTHENTIK_BOOTSTRAP_TOKEN");
  const response = await http(`${api}${path}`, { method, headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`${method} ${api}${path}: ${response.status} ${await response.text()}`);
  }
  return method === "DELETE" ? undefined : response.json();
}
