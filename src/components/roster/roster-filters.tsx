import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NO_SCHOOL, withFilters, type RosterFilters, type TeamRoster } from "@/model/roster";

export interface RosterFilterBarProps {
  teams: TeamRoster[];
  schools: string[];
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
}

// One select covers both team and division, so each choice is coded with which it is.
const ALL = "all";
const teamValue = (id: string) => `team:${id}`;
const divisionValue = (id: string) => `division:${id}`;

/** The search by name and the division and school filters above the roster. */
export function RosterFilterBar({ teams, schools, filters, onChange }: RosterFilterBarProps) {
  // The box keeps its own text, so a slow address update never undoes a keystroke.
  const [q, setQ] = useState(filters.q ?? "");
  const several = teams.length > 1;
  const divisionItems = [
    { value: ALL, label: "All divisions" },
    ...teams.flatMap((team) => [
      ...(several ? [{ value: teamValue(team.id), label: `All of ${team.name}` }] : []),
      ...team.divisions.map((d) => ({ value: divisionValue(d.id), label: d.name })),
    ]),
  ];
  const schoolItems = [
    { value: ALL, label: "All schools" },
    ...schools.map((school) => ({ value: school, label: school })),
    { value: NO_SCHOOL, label: "School not on file" },
  ];
  const division = filters.division ? divisionValue(filters.division) : filters.team ? teamValue(filters.team) : ALL;
  const filtered = Boolean(filters.team || filters.division || filters.school || filters.q);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <InputGroup className="h-tap md:h-8 md:max-w-xs">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Find a sailor or parent"
          aria-label="Find a sailor or parent"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            onChange(withFilters(filters, { q: event.target.value.trim() }));
          }}
        />
      </InputGroup>
      <Select
        items={divisionItems}
        value={division}
        onValueChange={(value) => {
          const picked = String(value ?? ALL);
          const [kind, id] = picked.split(":");
          onChange(withFilters(filters, { team: kind === "team" && id, division: kind === "division" && id }));
        }}
      >
        <SelectTrigger
          aria-label="Division"
          className="w-full data-[size=default]:h-tap md:w-48 md:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All divisions</SelectItem>
          {teams.map((team) => (
            <SelectGroup key={team.id}>
              {several && <SelectLabel>{team.name}</SelectLabel>}
              {several && <SelectItem value={teamValue(team.id)}>All of {team.name}</SelectItem>}
              {team.divisions.map((d) => (
                <SelectItem key={d.id} value={divisionValue(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
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
            onChange({});
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
