import { createFileRoute, redirect } from "@tanstack/react-router";

// The page was at /rosters while the portal's own roster held /roster. Old links still land on it.
export const Route = createFileRoute("/rosters/")({
  beforeLoad: () => {
    throw redirect({ to: "/roster", replace: true });
  },
});
