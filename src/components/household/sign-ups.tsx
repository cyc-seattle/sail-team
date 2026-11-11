import { Badge } from "@/components/ui/badge";
import { formatDays } from "@/model/dates";
import type { SignUp } from "@/model/household";

/** What a person is signed up for, each with its dates. */
export function SignUps({ signUps }: { signUps: SignUp[] }) {
  // Not a landmark: every card has one, and the card's own heading already names whose they are.
  return (
    <div className="grid gap-1.5 border-t border-border pt-3 text-sm">
      <h3 className="font-medium">Sign-ups</h3>
      {signUps.length === 0 ? (
        <p className="text-muted-foreground">No sign-ups</p>
      ) : (
        <ul className="grid gap-2">
          {signUps.map((s) => (
            <li key={s.id} className="grid gap-0.5">
              <span className="flex flex-wrap items-center gap-2">
                {s.program}
                {s.waitlisted && <Badge variant="secondary">Waitlist</Badge>}
              </span>
              <span className="text-muted-foreground tabular-nums">{formatDays(s.startsOn, s.endsOn)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
