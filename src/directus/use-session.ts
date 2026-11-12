import { useSuspenseQuery } from "@tanstack/react-query";
import { appDirectus, landing } from "./app.ts";
import { returnUrl, signOutUrl } from "./session.ts";
import { signIn, signOut, type SignIn } from "./sign-in.ts";

export const sessionQuery = {
  queryKey: ["session"],
  queryFn: () =>
    signIn({
      client: appDirectus().client,
      directusUrl: appDirectus().url,
      page: returnUrl(window.location.origin, landing, window.location),
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

export function signOutOfApp() {
  return signOut({
    client: appDirectus().client,
    signOutUrl: signOutUrl(window.location.hostname),
    navigate: (url) => window.location.assign(url),
  });
}
