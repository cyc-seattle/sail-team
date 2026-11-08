import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/plans/page-header";
import { TeamRosterView } from "@/components/roster/team-roster";
import { NoAccess } from "@/components/shell/no-access";
import { NoticePage } from "@/components/shell/notice-page";
import { canSeeRosters, type Permissions } from "@/directus/access";
import { teamsQuery } from "@/directus/roster";
import { useSession } from "@/directus/use-session";
import type { GroupBy } from "@/model/roster";

export const Route = createFileRoute("/roster/$teamId")({
  validateSearch: (search: Record<string, unknown>): { by?: GroupBy } =>
    search["by"] === "school" ? { by: "school" } : {},
  component: TeamPage,
});

function TeamPage() {
  const session = useSession();
  if (session.kind !== "signed-in" || !canSeeRosters(session.permissions)) {
    return <NoAccess what="rosters" />;
  }
  return <Team permissions={session.permissions} />;
}

function Team({ permissions }: { permissions: Permissions }) {
  const { teamId } = Route.useParams();
  const { by = "division" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: teams } = useSuspenseQuery(teamsQuery(permissions));
  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    return (
      <NoticePage title="There's no such team">
        <p>It may have no one on it right now.</p>
      </NoticePage>
    );
  }
  return (
    <main className="mx-auto grid max-w-6xl gap-card p-card">
      <PageHeader title={team.name} back={{ to: "/roster", label: "All teams" }} />
      <TeamRosterView
        team={team}
        by={by}
        onByChange={(next) => navigate({ search: next === "division" ? {} : { by: next }, replace: true })}
      />
    </main>
  );
}
