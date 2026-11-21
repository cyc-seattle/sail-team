import { BooleanCheck } from "@/components/boolean-check";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { NoteInfo } from "@/components/plans/note-info";
import { Money } from "@/components/plans/money";
import { PageHeader } from "@/components/plans/page-header";
import { ReportSection } from "@/components/plans/reports/report-page";
import { SeverityIcon } from "@/components/plans/warning-mark";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDay } from "@/model/dates";
import {
  daysUntil,
  expiringQualifications,
  hasEnded,
  inDate,
  missingQualifications,
  personName,
  sortHeld,
  sortTerms,
  termPlace,
  type CrewData,
  type CrewMember,
  type CrewTerm,
  type HeldQualification,
  type HeldQualificationInput,
  type TermInput,
} from "@/model/crew";
import { QualificationDialog } from "./qualification-dialog";
import { DeleteDialog, RowMenu } from "./row-menu";
import { EndTermDialog, TermDialog } from "./term-dialog";
import { WebsiteProfile, type ProfileActions } from "./website-profile";

export interface MemberActions {
  /** What the person may do, from `/permissions/me`. Directus still checks each request. */
  canWriteTerms: boolean;
  canWriteQualifications: boolean;
  canDelete: boolean;
  /** Whether they read and write a term's pay. */
  pay: boolean;
  onSaveTerm: (term: CrewTerm | null, input: TermInput) => Promise<void>;
  onEndTerm: (term: CrewTerm, on: string) => Promise<void>;
  onDeleteTerm: (term: CrewTerm) => Promise<void>;
  onSaveQualification: (held: HeldQualification | null, input: HeldQualificationInput) => Promise<void>;
  onDeleteQualification: (held: HeldQualification) => Promise<void>;
  onDelete: () => Promise<void>;
  /** How a Crew Writer changes the website profile. None for anyone else. */
  profile?: ProfileActions | undefined;
}

type Pending =
  | { kind: "add-term" }
  | { kind: "edit-term" | "end-term" | "delete-term"; term: CrewTerm }
  | { kind: "add-held" }
  | { kind: "edit-held" | "delete-held"; held: HeldQualification }
  | { kind: "delete" };

/**
 * One crew member: how to reach them, the positions they hold and have held, their qualifications, what their positions need that they're
 * missing, and what the website shows of them. A Crew Writer changes each of them here.
 */
export function MemberView({
  member,
  data,
  day,
  photoUrl,
  actions,
}: {
  member: CrewMember;
  data: CrewData;
  /** Today, `YYYY-MM-DD`. */
  day: string;
  photoUrl: (id: string) => string;
  actions: MemberActions;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const close = () => setPending(null);
  const name = personName(member.person);
  const terms = sortTerms(
    data.terms.filter((t) => t.crew_member_id === member.id),
    day,
  );
  const held = sortHeld(
    data.held.filter((q) => q.crew_member_id === member.id),
    data.qualifications,
  );
  const missing = missingQualifications(terms, data.positions, held, data.qualifications, day);
  const expiring = new Set(expiringQualifications(held, day).map((q) => q.id));
  const qualificationName = (id: string) => data.qualifications.find((q) => q.id === id)?.name ?? "";
  const positionName = (t: CrewTerm) => data.positions.find((p) => p.id === t.position_id)?.name ?? "";
  const levelName = (id: string | null | undefined) => data.staffLevels.find((l) => l.id === id)?.name;
  const deletable = actions.canDelete && terms.length === 0 && held.length === 0;
  const pickedTerm = pending && "term" in pending ? pending.term : null;
  const pickedHeld = pending && "held" in pending ? pending.held : null;

  return (
    <main className="mx-auto grid max-w-6xl gap-10 p-card">
      <PageHeader
        title={name}
        back={{ to: "/crew", label: "Crew" }}
        actions={
          <RowMenu
            label={`More for ${name}`}
            items={
              deletable
                ? [{ label: "Delete from Crew", destructive: true, onClick: () => setPending({ kind: "delete" }) }]
                : []
            }
          />
        }
      />

      <ReportSection id="contact" title="Contact information">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd>
            {member.person.email ? (
              <a href={`mailto:${member.person.email}`} className="text-link hover:underline">
                {member.person.email}
              </a>
            ) : (
              <span className="text-muted-foreground">Not on file</span>
            )}
          </dd>
        </dl>
      </ReportSection>

      <ReportSection
        id="positions"
        title="Positions"
        actions={
          actions.canWriteTerms && (
            <Button className="h-tap md:h-8" onClick={() => setPending({ kind: "add-term" })}>
              <PlusIcon aria-hidden />
              Assign position
            </Button>
          )
        }
      >
        {terms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No positions yet.</p>
        ) : (
          <Table aria-label="Positions">
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>In</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                {actions.pay && (
                  <>
                    <TableHead>Staff level</TableHead>
                    <TableHead className="text-right">Hourly rate</TableHead>
                    <TableHead>Profit share</TableHead>
                  </>
                )}
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((t) => {
                const ended = hasEnded(t, day);
                const position = positionName(t);
                return (
                  <TableRow key={t.id} className={cn(ended && "text-muted-foreground")}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1">
                        {position}
                        <NoteInfo note={t.note} label={`Note on ${position}`} />
                      </span>
                    </TableCell>
                    <TableCell>{termPlace(t, data.programs, data.areas)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {t.starts_on && formatDay(t.starts_on)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {t.ends_on && formatDay(t.ends_on)}
                    </TableCell>
                    {actions.pay && (
                      <>
                        <TableCell>{levelName(t.staff_level_id)}</TableCell>
                        <TableCell className="text-right">
                          {t.hourly_rate_cents != null && <Money cents={t.hourly_rate_cents} />}
                        </TableCell>
                        <TableCell>
                          <BooleanCheck checked={t.profit_share ?? false} label="Profit share" />
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      <RowMenu
                        label={`More for ${position}`}
                        items={
                          actions.canWriteTerms
                            ? [
                                { label: "Edit", onClick: () => setPending({ kind: "edit-term", term: t }) },
                                ...(ended
                                  ? []
                                  : [{ label: "End", onClick: () => setPending({ kind: "end-term", term: t }) }]),
                                {
                                  label: "Delete",
                                  destructive: true,
                                  onClick: () => setPending({ kind: "delete-term", term: t }),
                                },
                              ]
                            : []
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ReportSection>

      <ReportSection
        id="qualifications"
        title="Qualifications"
        actions={
          actions.canWriteQualifications && (
            <Button className="h-tap md:h-8" onClick={() => setPending({ kind: "add-held" })}>
              <PlusIcon aria-hidden />
              Add qualification
            </Button>
          )
        }
      >
        {missing.length > 0 && (
          <ul aria-label="Missing" className="grid gap-1 text-sm">
            {missing.map((id) => (
              <li key={id} className="flex items-center gap-1">
                <SeverityIcon severity="error" />
                Missing {qualificationName(id)}
              </li>
            ))}
          </ul>
        )}
        {held.length === 0 ? (
          <p className="text-sm text-muted-foreground">No qualifications yet.</p>
        ) : (
          <Table aria-label="Qualifications">
            <TableHeader>
              <TableRow>
                <TableHead>Qualification</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {held.map((q) => {
                const good = inDate(q, day);
                const qualification = qualificationName(q.qualification_id);
                return (
                  <TableRow key={q.id} className={cn(!good && "text-muted-foreground")}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1">
                        {qualification}
                        <NoteInfo note={q.note} label={`Note on ${qualification}`} />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatDay(q.earned_on)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        {expiring.has(q.id) && <SeverityIcon severity="warning" />}
                        {!q.expires_on
                          ? "Never"
                          : q.expires_on < day
                            ? `Expired ${formatDay(q.expires_on)}`
                            : expiring.has(q.id)
                              ? `${formatDay(q.expires_on)}, in ${daysUntil(day, q.expires_on)} days`
                              : formatDay(q.expires_on)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <RowMenu
                        label={`More for ${qualification}`}
                        items={
                          actions.canWriteQualifications
                            ? [
                                { label: "Edit", onClick: () => setPending({ kind: "edit-held", held: q }) },
                                {
                                  label: "Delete",
                                  destructive: true,
                                  onClick: () => setPending({ kind: "delete-held", held: q }),
                                },
                              ]
                            : []
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ReportSection>

      <WebsiteProfile key={member.id} profile={member} photoUrl={photoUrl} actions={actions.profile} />

      <TermDialog
        open={pending?.kind === "add-term" || pending?.kind === "edit-term"}
        onOpenChange={(open) => !open && close()}
        term={pending?.kind === "edit-term" ? pending.term : null}
        data={data}
        pay={actions.pay}
        onSave={(input) =>
          actions.onSaveTerm(pending?.kind === "edit-term" ? pending.term : null, {
            ...input,
            crew_member_id: member.id,
          })
        }
      />
      <EndTermDialog
        title={pickedTerm ? `End ${positionName(pickedTerm)} for ${name}?` : ""}
        day={day}
        open={pending?.kind === "end-term"}
        onClose={close}
        onEnd={(on) => actions.onEndTerm(pickedTerm!, on)}
      />
      <DeleteDialog
        title={pickedTerm ? `Delete ${positionName(pickedTerm)} for ${name}?` : ""}
        description="This can't be undone. If they've left the position, use End instead, so it stays in their history."
        open={pending?.kind === "delete-term"}
        onClose={close}
        onDelete={() => actions.onDeleteTerm(pickedTerm!)}
      />
      <QualificationDialog
        open={pending?.kind === "add-held" || pending?.kind === "edit-held"}
        onOpenChange={(open) => !open && close()}
        held={pending?.kind === "edit-held" ? pending.held : null}
        qualifications={data.qualifications}
        day={day}
        onSave={(input) =>
          actions.onSaveQualification(pending?.kind === "edit-held" ? pending.held : null, {
            ...input,
            crew_member_id: member.id,
          })
        }
      />
      <DeleteDialog
        title={pickedHeld ? `Delete ${qualificationName(pickedHeld.qualification_id)}?` : ""}
        description="This can't be undone. For a renewal, add the new one instead, so this one stays in their history."
        open={pending?.kind === "delete-held"}
        onClose={close}
        onDelete={() => actions.onDeleteQualification(pickedHeld!)}
      />
      <DeleteDialog
        title={`Delete ${name} from Crew?`}
        description="This can't be undone. They stay in People."
        open={pending?.kind === "delete"}
        onClose={close}
        onDelete={actions.onDelete}
      />
    </main>
  );
}
