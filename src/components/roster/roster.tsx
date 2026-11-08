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
 * One team's sailors, or one division's, with how to reach their guardians: a table on a laptop and a card for each
 * sailor on a phone. A search looks across every team, and says which team each match is on.
 */
export function Roster({ teams, filters, onFiltersChange }: RosterProps) {
  const entries = useMemo(() => rosterEntries(teams), [teams]);
  const schools = useMemo(() => schoolsOn(entries), [entries]);
  const phone = useIsMobile();
  if (teams.length === 0) {
    return <p className="text-sm text-muted-foreground">There's no one on a team for you to see right now.</p>;
  }
  const shown = filterRoster(entries, filters);
  const searching = Boolean(filters.q);
  const groups = searching ? [] : divisionsIn(teams, filters).filter((d) => d.group);
  const withTeam = searching && teams.length > 1;
  return (
    <div className="grid gap-card">
      <RosterFilterBar teams={teams} schools={schools} filters={filters} onChange={onFiltersChange} />
      {withTeam && <p className="text-sm text-muted-foreground">Showing matches on every team.</p>}
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
            <li key={`${entry.teamId}:${entry.id}`}>
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

const divisionsOf = (entry: RosterEntry) => entry.divisions.map((d) => d.name).join(", ");

function RosterTable({ entries, withTeam }: { entries: RosterEntry[]; withTeam: boolean }) {
  return (
    <Table aria-label="Roster">
      <TableHeader>
        <TableRow>
          <TableHead>Sailor</TableHead>
          {withTeam && <TableHead>Team</TableHead>}
          <TableHead>Division</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Guardians</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={`${entry.teamId}:${entry.id}`}>
            <TableCell className="align-top whitespace-normal">
              <span className="font-medium">{entry.name}</span>
              <Reach person={entry} quiet />
            </TableCell>
            {withTeam && <TableCell className="align-top whitespace-normal">{entry.team}</TableCell>}
            <TableCell className="align-top whitespace-normal">{divisionsOf(entry)}</TableCell>
            <TableCell className="align-top whitespace-normal">
              {entry.school ?? <span className="text-muted-foreground">Not on file</span>}
            </TableCell>
            <TableCell className="align-top whitespace-normal">
              <Guardians guardians={entry.guardians} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SailorCard({ entry, withTeam }: { entry: RosterEntry; withTeam: boolean }) {
  const about = [withTeam ? entry.team : null, divisionsOf(entry), entry.school ?? "School not on file"];
  return (
    <article className="grid gap-2 rounded-lg bg-card p-card text-sm ring-1 ring-border" aria-label={entry.name}>
      <div className="grid gap-0.5">
        <h2 className="text-base font-medium">{entry.name}</h2>
        <p className="text-muted-foreground">{about.filter(Boolean).join(" · ")}</p>
        <Reach person={entry} quiet tap />
      </div>
      <Guardians guardians={entry.guardians} tap />
    </article>
  );
}

function Guardians({ guardians, tap = false }: { guardians: RosterPerson[]; tap?: boolean }) {
  if (guardians.length === 0) {
    return <p className="text-muted-foreground">No guardians on file.</p>;
  }
  return (
    <ul className="grid gap-2">
      {guardians.map((guardian) => (
        <li key={guardian.id} className="grid">
          <span>{guardian.name}</span>
          <Reach person={guardian} tap={tap} />
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
