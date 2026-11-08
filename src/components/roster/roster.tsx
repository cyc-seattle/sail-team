import { MailIcon, PhoneIcon } from "lucide-react";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  divisionsIn,
  filterRoster,
  groupUrl,
  rosterEntries,
  schoolsOn,
  type RosterEntry,
  type RosterFilters,
  type RosterPerson,
  type TeamRoster,
} from "@/model/roster";
import { RosterFilterBar } from "./roster-filters";

export interface RosterProps {
  teams: TeamRoster[];
  filters: RosterFilters;
  onFiltersChange: (filters: RosterFilters) => void;
}

/**
 * Every sailor on the teams the person can see, with how to reach their parents: a table on a laptop and a card for
 * each sailor on a phone, both narrowed by the same search and filters.
 */
export function Roster({ teams, filters, onFiltersChange }: RosterProps) {
  const entries = useMemo(() => rosterEntries(teams), [teams]);
  const schools = useMemo(() => schoolsOn(entries), [entries]);
  const phone = useIsMobile();
  if (teams.length === 0) {
    return <p className="text-sm text-muted-foreground">There's no one on a team for you to see right now.</p>;
  }
  const shown = filterRoster(entries, filters);
  const groups = divisionsIn(teams, filters).filter((d) => d.group);
  const withTeam = teams.length > 1 && !filters.team && !filters.division;
  return (
    <div className="grid gap-card">
      <RosterFilterBar teams={teams} schools={schools} filters={filters} onChange={onFiltersChange} />
      {groups.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          Google Groups:
          {groups.map((d) => (
            <a
              key={d.id}
              href={groupUrl(d.group!.email)}
              className={`inline-flex items-center text-link hover:underline ${phone ? "min-h-tap" : ""}`}
            >
              {d.group!.email}
            </a>
          ))}
        </p>
      )}
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one on the roster matches.</p>
      ) : phone ? (
        <ul className="grid gap-2" aria-label="Roster">
          {shown.map((entry) => (
            <li key={entry.id}>
              <SailorCard entry={entry} withTeam={withTeam} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-card ring-1 ring-border">
          <RosterTable entries={shown} withTeam={withTeam} />
        </div>
      )}
    </div>
  );
}

const teamsOf = (entry: RosterEntry) => [...new Set(entry.placements.map((p) => p.team))].join(", ");
const divisionsOf = (entry: RosterEntry) => entry.placements.map((p) => p.division).join(", ");

function RosterTable({ entries, withTeam }: { entries: RosterEntry[]; withTeam: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sailor</TableHead>
          {withTeam && <TableHead>Team</TableHead>}
          <TableHead>Division</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Parents</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="align-top whitespace-normal">
              <span className="font-medium">{entry.name}</span>
              <Reach person={entry} quiet />
            </TableCell>
            {withTeam && <TableCell className="align-top whitespace-normal">{teamsOf(entry)}</TableCell>}
            <TableCell className="align-top whitespace-normal">{divisionsOf(entry)}</TableCell>
            <TableCell className="align-top whitespace-normal">
              {entry.school ?? <span className="text-muted-foreground">Not on file</span>}
            </TableCell>
            <TableCell className="align-top whitespace-normal">
              <Parents parents={entry.parents} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SailorCard({ entry, withTeam }: { entry: RosterEntry; withTeam: boolean }) {
  const about = [withTeam ? teamsOf(entry) : null, divisionsOf(entry), entry.school ?? "School not on file"];
  return (
    <article className="grid gap-2 rounded-lg bg-card p-card text-sm ring-1 ring-border" aria-label={entry.name}>
      <div className="grid gap-0.5">
        <h2 className="text-base font-medium">{entry.name}</h2>
        <p className="text-muted-foreground">{about.filter(Boolean).join(" · ")}</p>
        <Reach person={entry} quiet tap />
      </div>
      <Parents parents={entry.parents} tap />
    </article>
  );
}

function Parents({ parents, tap = false }: { parents: RosterPerson[]; tap?: boolean }) {
  if (parents.length === 0) {
    return <p className="text-muted-foreground">No parents on file.</p>;
  }
  return (
    <ul className="grid gap-2">
      {parents.map((parent) => (
        <li key={parent.id} className="grid">
          <span>{parent.name}</span>
          <Reach person={parent} tap={tap} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Their email and phone, or that they haven't shared them. A sailor's own are `quiet`: most are children, who never
 * do. On a phone, each link is `tap`-sized.
 */
function Reach({ person, quiet = false, tap = false }: { person: RosterPerson; quiet?: boolean; tap?: boolean }) {
  if (!person.email && !person.phone) {
    return quiet ? null : <span className="text-muted-foreground">Hasn't shared their email and phone.</span>;
  }
  const link = `inline-flex items-center gap-1 text-link break-all hover:underline ${tap ? "min-h-tap" : ""}`;
  return (
    <span className="grid justify-items-start">
      {person.email && (
        <a href={`mailto:${person.email}`} className={link}>
          <MailIcon className="size-4 shrink-0" aria-hidden />
          {person.email}
        </a>
      )}
      {person.phone && (
        <a href={`tel:${person.phone}`} className={link}>
          <PhoneIcon className="size-4 shrink-0" aria-hidden />
          {person.phone}
        </a>
      )}
    </span>
  );
}
