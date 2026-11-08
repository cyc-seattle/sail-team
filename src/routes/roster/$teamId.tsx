import { createFileRoute, redirect } from "@tanstack/react-router";

// Each team had its own page until the roster became one list. Old links land on it, narrowed to the team.
export const Route = createFileRoute("/roster/$teamId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/roster", search: { team: params.teamId }, replace: true });
  },
});
