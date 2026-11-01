import { QueryClient } from "@tanstack/react-query";
import { isSignedOut } from "./sign-in.ts";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retrying a request Directus refused only repeats the refusal.
      retry: (failures, error) => !isSignedOut(error) && failures < 2,
    },
  },
});
