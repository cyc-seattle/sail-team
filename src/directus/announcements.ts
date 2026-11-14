import { customEndpoint } from "@directus/sdk";
import { queryOptions } from "@tanstack/react-query";
import { appDirectus } from "./app.ts";

/** News for everyone who signs in. `body` is Markdown. */
export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  published_on: string;
}

/** The newest announcements first. */
export const announcementsQuery = queryOptions({
  queryKey: ["announcements"],
  queryFn: () =>
    appDirectus().client.request(
      customEndpoint<Announcement[]>({
        path: "/items/announcements",
        method: "GET",
        params: { limit: 20, sort: ["-published_on", "-id"], fields: ["id", "title", "body", "published_on"] },
      }),
    ),
});
