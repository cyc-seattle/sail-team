import { Link } from "@tanstack/react-router";
import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { LabeledSwitch } from "@/components/labeled-switch";
import { SeverityIcon } from "@/components/plans/warning-mark";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDay } from "@/model/dates";
import {
  filterCrew,
  type CatalogQualification,
  type CrewFilters,
  type CrewPerson,
  type CrewRow,
  type HeldQualification,
  type Named,
} from "@/model/crew";
import { AddMemberDialog } from "./add-member-dialog";

const EVERYWHERE = "everywhere";
const shows = [
  { value: "current", label: "Current" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

export interface AddMember {
  /** People whose name or email has the words in it. */
  find: (q: string) => Promise<CrewPerson[]>;
  /** The people already on Crew, by id, who can't be added again. */
  onCrew: Set<string>;
  /** Puts them on Crew, and resolves to the new crew member's id. */
  add: (person: CrewPerson) => Promise<string>;
}

/**
 * Everyone on Crew, by name: their current positions, what they're missing or must renew soon, and whether the website
 * shows them. Narrow it to a program or program area, to those whose terms have all ended, or to those who need
 * something. A Crew Writer adds someone already in People.
 */
export function CrewList({
  rows,
  programs,
  areas,
  qualifications,
  filters,
  onFiltersChange,
  addMember,
}: {
  rows: CrewRow[];
  programs: Named[];
  areas: Named[];
  qualifications: CatalogQualification[];
  filters: CrewFilters;
  onFiltersChange: (filters: CrewFilters) => void;
  /** How a Crew Writer adds someone. None for anyone else. */
  addMember?: AddMember | undefined;
}) {
  const [adding, setAdding] = useState(false);
  const phone = useIsMobile();
  const shown = filterCrew(rows, filters);
  const set = (changes: Partial<CrewFilters>) => onFiltersChange({ ...filters, ...changes });
  // Only the programs and areas someone on Crew is in now.
  const inUse = new Set(rows.flatMap((r) => r.places));
  const groups = [
    { label: "Program areas", items: areas.filter((a) => inUse.has(a.id)) },
    { label: "Programs", items: programs.filter((p) => inUse.has(p.id)) },
  ].filter((g) => g.items.length > 0);
  const placeItems = [
    { value: EVERYWHERE, label: "All programs" },
    ...groups.flatMap((g) => g.items.map((i) => ({ value: i.id, label: i.name }))),
  ];
  const qualificationName = (id: string) => qualifications.find((q) => q.id === id)?.name ?? "";

  return (
    <section aria-label="Crew members" className="grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <InputGroup className="h-tap md:h-8 md:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Find by name or email"
            aria-label="Find by name or email"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
          />
        </InputGroup>
        <Select
          items={placeItems}
          value={filters.in && placeItems.some((i) => i.value === filters.in) ? filters.in : EVERYWHERE}
          onValueChange={(v) => set({ in: v === EVERYWHERE ? undefined : String(v) })}
        >
          <SelectTrigger
            aria-label="In"
            className="w-full data-[size=default]:h-tap md:w-52 md:data-[size=default]:h-8"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EVERYWHERE}>All programs</SelectItem>
            {groups.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={shows}
          value={filters.show ?? "current"}
          onValueChange={(v) => set({ show: v === "past" || v === "all" ? v : undefined })}
        >
          <SelectTrigger
            aria-label="Show"
            className="w-full data-[size=default]:h-tap md:w-32 md:data-[size=default]:h-8"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {shows.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <LabeledSwitch
          label="Show only missing or expiring"
          checked={filters.flagged ?? false}
          onChange={(on) => set({ flagged: on || undefined })}
        />
        {addMember && (
          <Button className="h-tap md:ml-auto md:h-8" onClick={() => setAdding(true)}>
            <PlusIcon aria-hidden />
            Add crew member
          </Button>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {rows.length === 0 ? "No crew members yet." : "No crew members match."}
        </p>
      ) : phone ? (
        <ul aria-label="Crew members" className="grid gap-2">
          {shown.map((r) => (
            <li key={r.member.id}>
              <MemberCard row={r} qualificationName={qualificationName} />
            </li>
          ))}
        </ul>
      ) : (
        <Table aria-label="Crew members">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>Qualifications</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.member.id} className={cn(r.past && "text-muted-foreground")}>
                <TableCell className="font-medium whitespace-nowrap">
                  <Link to="/crew/$memberId" params={{ memberId: r.member.id }} className="text-link hover:underline">
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Positions row={r} />
                </TableCell>
                <TableCell>
                  <QualificationStatus
                    missing={r.missing.map(qualificationName)}
                    expiring={r.expiring}
                    qualificationName={qualificationName}
                  />
                </TableCell>
                <TableCell>{r.member.on_website ? "On" : "Off"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {addMember && <AddMemberDialog open={adding} onOpenChange={setAdding} addMember={addMember} />}
    </section>
  );
}

/** A crew member's current positions, one to a line, or the day their last one ended. */
function Positions({ row }: { row: CrewRow }) {
  if (row.past) {
    return <>Ended {formatDay(row.ended_on!)}</>;
  }
  if (row.positions.length === 0) {
    return <span className="text-muted-foreground">None now</span>;
  }
  return (
    <ul>
      {row.positions.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

/** One crew member on a phone, where the table's columns don't fit. */
function MemberCard({ row, qualificationName }: { row: CrewRow; qualificationName: (id: string) => string }) {
  return (
    <article
      aria-label={row.name}
      className={cn(
        "grid gap-2 rounded-lg bg-card p-card text-sm ring-1 ring-border",
        row.past && "text-muted-foreground",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <Link
          to="/crew/$memberId"
          params={{ memberId: row.member.id }}
          className="flex min-h-tap items-center text-base font-medium text-link hover:underline"
        >
          {row.name}
        </Link>
        {row.member.on_website && <span className="text-muted-foreground">On the website</span>}
      </div>
      <Positions row={row} />
      <QualificationStatus
        missing={row.missing.map(qualificationName)}
        expiring={row.expiring}
        qualificationName={qualificationName}
      />
    </article>
  );
}

/** What a crew member is missing, and what expires soon, one to a line, or a check when neither. */
export function QualificationStatus({
  missing,
  expiring,
  qualificationName,
}: {
  missing: string[];
  expiring: HeldQualification[];
  qualificationName: (id: string) => string;
}) {
  if (missing.length === 0 && expiring.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <CheckIcon aria-hidden className="size-3.5" />
        <span className="sr-only">Nothing missing</span>
      </span>
    );
  }
  return (
    <ul className="grid gap-0.5">
      {missing.map((name) => (
        <li key={name} className="flex items-center gap-1">
          <SeverityIcon severity="error" />
          Missing {name}
        </li>
      ))}
      {expiring.map((q) => (
        <li key={q.id} className="flex items-center gap-1 whitespace-nowrap">
          <SeverityIcon severity="warning" />
          {qualificationName(q.qualification_id)} expires {formatDay(q.expires_on!)}
        </li>
      ))}
    </ul>
  );
}
