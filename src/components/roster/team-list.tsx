import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { teamSize, type TeamRoster } from "@/model/roster";

/** Each team the person can see, linking to its roster, or a line saying there are none. */
export function TeamList({ teams }: { teams: TeamRoster[] }) {
  if (teams.length === 0) {
    return <p className="text-sm text-muted-foreground">There's no one on a team for you to see right now.</p>;
  }
  return (
    <ul className="grid divide-y divide-border rounded-lg bg-card ring-1 ring-border">
      {teams.map((team) => {
        const count = teamSize(team);
        return (
          <li key={team.id}>
            <Link
              to="/roster/$teamId"
              params={{ teamId: team.id }}
              className="flex min-h-tap items-center justify-between gap-2 p-card hover:bg-muted"
            >
              <span className="grid gap-0.5">
                <span className="font-medium text-link">{team.name}</span>
                <span className="text-sm text-muted-foreground">
                  {[
                    team.divisions.map((d) => d.name).join(", "),
                    `${count} ${count === 1 ? "sailor" : "sailors"}`,
                  ].join(" · ")}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
