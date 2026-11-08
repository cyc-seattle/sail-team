import { MailIcon, PhoneIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { RosterPerson } from "@/model/roster";

export interface ContactCardProps {
  person: RosterPerson;
  /** A sailor's parents, shown under them in the card. */
  parents?: RosterPerson[];
  /** A line under the name, such as their school. */
  about?: string;
}

/** A name in a roster that opens how to reach them: their email and phone if they share them, and a sailor's parents. */
export function ContactCard({ person, parents, about }: ContactCardProps) {
  return (
    <Popover>
      <PopoverTrigger className="min-h-tap cursor-pointer text-left text-link hover:underline">
        {person.name}
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>{person.name}</PopoverTitle>
          {about && <PopoverDescription>{about}</PopoverDescription>}
        </PopoverHeader>
        {parents ? (
          <>
            <Reach person={person} quiet />
            {parents.length === 0 ? (
              <p className="text-muted-foreground">No parents on file.</p>
            ) : (
              <ul className="grid gap-2">
                {parents.map((parent) => (
                  <li key={parent.id} className="grid gap-0.5">
                    <span>
                      <span className="text-muted-foreground">Parent:</span> {parent.name}
                    </span>
                    <Reach person={parent} />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Reach person={person} />
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Their email and phone, or that they haven't shared them. A sailor's own are `quiet`: most are children, who never do. */
function Reach({ person, quiet = false }: { person: RosterPerson; quiet?: boolean }) {
  if (!person.email && !person.phone) {
    return quiet ? null : <p className="text-muted-foreground">Hasn't shared their email and phone.</p>;
  }
  return (
    <span className="grid">
      {person.email && (
        <a
          href={`mailto:${person.email}`}
          className="inline-flex min-h-tap items-center gap-1 text-link hover:underline"
        >
          <MailIcon className="size-4" aria-hidden />
          {person.email}
        </a>
      )}
      {person.phone && (
        <a href={`tel:${person.phone}`} className="inline-flex min-h-tap items-center gap-1 text-link hover:underline">
          <PhoneIcon className="size-4" aria-hidden />
          {person.phone}
        </a>
      )}
    </span>
  );
}
