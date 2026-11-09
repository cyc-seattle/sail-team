import { customEndpoint } from "@directus/sdk";
import { appDirectus } from "./app.ts";

const client = () => appDirectus().client;

/** Every row of a table that matches `filter`, as plain JSON, for the tables the app reads without types. */
export function readAll<T = Record<string, unknown>>(table: string, filter?: object, fields = ["*"]): Promise<T[]> {
  return client().request(
    customEndpoint<T[]>({
      path: `/items/${table}`,
      method: "GET",
      // As objects, as the SDK's own queries take them: it drops a filter given as a JSON string.
      params: { limit: -1, fields, ...(filter && { filter }) },
    }),
  );
}
