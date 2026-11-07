import { useId } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { groupTeam, groupUrl, teamSize, type GroupBy, type TeamRoster } from "@/model/roster";
import { ContactCard } from "./contact-card";

export interface TeamRosterViewProps {
  team: TeamRoster;
  by: GroupBy;
  onByChange: (by: GroupBy) => void;
}

const byLabels: Record<GroupBy, string> = { division: "By division", school: "By school" };

const sailors = (count: number) => `${count} ${count === 1 ? "sailor" : "sailors"}`;

/** A team's sailors in one table for each division or each school, with how to reach each family. */
export function TeamRosterView({ team, by, onByChange }: TeamRosterViewProps) {
  const groups = groupTeam(team, by);
  const ids = useId();
  const groupLinks = team.divisions.filter((d) => d.group);
  return (
    <div className="grid gap-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1 text-sm">
          <p className="font-medium">{sailors(teamSize(team))} in all</p>
          {groupLinks.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-3 text-muted-foreground">
              Google Groups:
              {groupLinks.map((d) => (
                <a
                  key={d.id}
                  href={groupUrl(d.group!.email)}
                  className="inline-flex min-h-tap items-center text-link hover:underline"
                >
                  {d.group!.email}
                </a>
              ))}
            </p>
          )}
        </div>
        <ToggleGroup
          value={[by]}
          onValueChange={(values: string[]) => {
            const next = values[0] as GroupBy | undefined;
            // Pressing the chosen view again would leave none chosen, so it stays.
            if (next) {
              onByChange(next);
            }
          }}
          variant="outline"
          size="sm"
          aria-label="Group sailors"
        >
          {(["division", "school"] as const).map((v) => (
            <ToggleGroupItem key={v} value={v}>
              {byLabels[v]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {groups.map((group, i) => (
        <section key={group.name} className="grid gap-2" aria-labelledby={`${ids}-${i}`}>
          <h2 id={`${ids}-${i}`} className="flex items-baseline gap-2 text-base font-medium">
            {group.name}
            <span className="text-sm font-normal text-muted-foreground">{sailors(group.sailors.length)}</span>
          </h2>
          <div className="rounded-lg bg-card ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sailor</TableHead>
                  <TableHead className="hidden sm:table-cell">{by === "division" ? "School" : "Division"}</TableHead>
                  <TableHead>Parents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.sailors.map((sailor) => (
                  <TableRow key={sailor.id}>
                    <TableCell className="align-top">
                      <ContactCard
                        person={sailor}
                        parents={sailor.parents}
                        about={[sailor.divisions.join(", "), sailor.school].filter(Boolean).join(" · ")}
                      />
                    </TableCell>
                    <TableCell className="hidden align-top whitespace-normal sm:table-cell">
                      <span className="inline-flex min-h-tap items-center">
                        {by === "division" ? (sailor.school ?? "") : sailor.divisions.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <span className="flex flex-wrap gap-x-3">
                        {sailor.parents.map((parent) => (
                          <ContactCard key={parent.id} person={parent} />
                        ))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}
