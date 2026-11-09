import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NO_SCHOOL, withFilters, type RosterFilters, type TeamRoster } from "@/model/roster";

export interface RosterFilterBarProps {
  teams: TeamRoster[];
  schools: string[];
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
}

// One select picks a team, or one of its divisions, so each choice is coded with which it is.
const ALL = "all";
const teamValue = (id: string) => `team:${id}`;
const divisionValue = (id: string) => `division:${id}`;

/** The team and division picker, the search by name, and the school filter above the roster. */
export function RosterFilterBar({ teams, schools, filters, onChange }: RosterFilterBarProps) {
  // The box keeps its own text, so a slow address update never undoes a keystroke.
  const [q, setQ] = useState(filters.q ?? "");
  const placeItems = teams.flatMap((team) => [
    { value: teamValue(team.id), label: team.name },
    ...team.divisions.map((d) => ({ value: divisionValue(d.id), label: `${team.name} · ${d.name}` })),
  ]);
  const schoolItems = [
    { value: ALL, label: "All schools" },
    ...schools.map((school) => ({ value: school, label: school })),
    { value: NO_SCHOOL, label: "School not on file" },
  ];
  const place = filters.division ? divisionValue(filters.division) : teamValue(filters.team ?? "");
  const filtered = Boolean(filters.division || filters.school || filters.q);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <Select
        items={placeItems}
        value={place}
        onValueChange={(value) => {
          const [kind, id] = String(value).split(":");
          const team = kind === "team" ? id : teams.find((t) => t.divisions.some((d) => d.id === id))?.id;
          onChange(withFilters(filters, { team, division: kind === "division" && id }));
        }}
      >
        <SelectTrigger
          aria-label="Team and division"
          className="w-full data-[size=default]:h-tap md:w-64 md:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectGroup key={team.id}>
              <SelectItem value={teamValue(team.id)} className="font-medium">
                {team.name}
              </SelectItem>
              {team.divisions.map((d) => (
                <SelectItem key={d.id} value={divisionValue(d.id)} className="pl-6">
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <InputGroup className="h-tap md:h-8 md:max-w-xs">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Find a sailor or guardian"
          aria-label="Find a sailor or guardian"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            onChange(withFilters(filters, { q: event.target.value.trim() }));
          }}
        />
      </InputGroup>
      <Select
        items={schoolItems}
        value={filters.school ?? ALL}
        onValueChange={(value) => {
          const picked = String(value ?? ALL);
          onChange(withFilters(filters, { school: picked !== ALL && picked }));
        }}
      >
        <SelectTrigger
          aria-label="School"
          className="w-full data-[size=default]:h-tap md:w-56 md:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {schoolItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filtered && (
        <Button
          variant="ghost"
          className="h-tap self-end md:h-8 md:self-auto"
          onClick={() => {
            setQ("");
            onChange(withFilters({}, { team: filters.team }));
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
