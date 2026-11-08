import { createFileRoute, redirect } from "@tanstack/react-router";

// A plan no longer has a page of its own: each Financial Plan shows the plans it holds.
export const Route = createFileRoute("/plans/$planId/")({
  beforeLoad: () => {
    throw redirect({ to: "/plans", replace: true });
  },
});
