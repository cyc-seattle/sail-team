import { createFileRoute, redirect } from "@tanstack/react-router";

// A club plan is now a Financial Plan, at its own address.
export const Route = createFileRoute("/plans/club/$setId/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/plans/financial/$setId", params: { setId: params.setId }, replace: true });
  },
});
