import { customEndpoint } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import { appDirectus } from "./app.ts";

/** A site on the Links page. Directus's hook fills the `preview_` fields from the site's own preview.
 * `preview_image` is an absolute https URL. */
export interface SiteLink {
  id: string;
  title: string;
  url: string;
  note: string | null;
  preview_description: string | null;
  preview_image: string | null;
}

/** Every link this person can read, in the order a Link Writer set. */
export const linksQuery = queryOptions({
  queryKey: ["links"],
  queryFn: () =>
    appDirectus().client.request(
      customEndpoint<SiteLink[]>({
        path: "/items/links",
        method: "GET",
        params: {
          limit: -1,
          sort: ["sort", "title"],
          fields: ["id", "title", "url", "note", "preview_description", "preview_image"],
        },
      }),
    ),
});
