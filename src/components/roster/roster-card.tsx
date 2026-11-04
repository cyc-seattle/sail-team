import { MailIcon, PhoneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDays } from "@/model/dates";
import type { Roster, RosterPerson } from "@/model/roster";

/** One program's roster: each sailor, their parents under them, and the email and phone of whoever shares them. */
export function RosterCard({ roster }: { roster: Roster }) {
  const count = roster.sailors.length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h2>{roster.program}</h2>
          {roster.team && <Badge variant="secondary">Team</Badge>}
        </CardTitle>
        <CardDescription>
          {[formatDays(roster.startsOn, roster.endsOn), `${count} ${count === 1 ? "sailor" : "sailors"}`]
            .filter(Boolean)
            .join(" · ")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid divide-y divide-border">
          {roster.sailors.map((sailor) => (
            <li key={sailor.id} className="grid gap-1 py-2 first:pt-0 last:pb-0">
              <span className="font-medium">{sailor.name}</span>
              <ContactDetails person={sailor} />
              {sailor.parents.length > 0 && (
                <ul className="grid gap-1 text-sm">
                  {sailor.parents.map((parent) => (
                    <li key={parent.id} className="grid gap-0.5">
                      <span>
                        <span className="text-muted-foreground">Parent:</span> {parent.name}
                      </span>
                      <ContactDetails person={parent} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ContactDetails({ person }: { person: RosterPerson }) {
  if (!person.email && !person.phone) {
    return null;
  }
  return (
    <span className="flex flex-wrap gap-x-4 text-sm">
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
