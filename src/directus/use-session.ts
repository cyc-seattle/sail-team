import { useSuspenseQuery } from "@tanstack/react-query";
import { appDirectus } from "./app.ts";
import { signIn, type SignIn } from "./sign-in.ts";

export const sessionQuery = {
  queryKey: ["session"],
  queryFn: () =>
    signIn({
      client: appDirectus().client,
      directusUrl: appDirectus().url,
      page: window.location.href,
      storage: sessionStorage,
      navigate: (url) => window.location.assign(url),
      now: Date.now,
    }),
  // Who's signed in doesn't change while the page is open.
  staleTime: Infinity,
} as const;

export function useSession(): SignIn {
  return useSuspenseQuery(sessionQuery).data;
}
