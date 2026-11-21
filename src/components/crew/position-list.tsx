import { PlusIcon } from "lucide-react";
import { useState } from "react";
import Markdown, { type Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CatalogQualification, CrewPosition, PositionInput, PositionRow } from "@/model/crew";
import { PositionDialog } from "./position-dialog";
import { DeleteDialog, RowMenu } from "./row-menu";

// A description is simple Markdown: paragraphs, emphasis, links, and lists.
const ALLOWED = ["p", "strong", "em", "a", "ul", "ol", "li"];
const description: Components = {
  a: ({ children, href }) => (
    <a href={href} className="text-link underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
};

/** Past this many, a position's holders are counted, not named. */
const NAMED = 3;

export interface PositionActions {
  /** What the person may do, from `/permissions/me`. Directus still checks each request. */
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onCreate: (input: PositionInput) => Promise<void>;
  onUpdate: (position: CrewPosition, input: PositionInput) => Promise<void>;
  onDelete: (position: CrewPosition) => Promise<void>;
}

type Pending = { kind: "add" } | { kind: "edit" | "delete"; position: CrewPosition };

/**
 * Every position, by name: what someone in it is called, the qualifications it needs, and who holds it today, with the
 * program or program area they hold it in. A Crew Writer adds and changes positions, and deletes one no one has held.
 */
export function PositionList({
  rows,
  qualifications,
  actions,
}: {
  rows: PositionRow[];
  qualifications: CatalogQualification[];
  actions: PositionActions;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const close = () => setPending(null);
  const picked = pending && pending.kind !== "add" ? pending.position : null;
  return (
    <section aria-label="Positions" className="grid gap-4">
      {actions.canCreate && (
        <div className="flex justify-end">
          <Button className="h-tap md:h-8" onClick={() => setPending({ kind: "add" })}>
            <PlusIcon aria-hidden />
            Add position
          </Button>
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No positions yet.</p>
      ) : (
        <Table aria-label="Positions">
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Website title</TableHead>
              <TableHead>Qualifications</TableHead>
              <TableHead>Held by</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.position.id}>
                <TableCell className="align-top font-medium">
                  {r.position.name}
                  {r.position.description && (
                    <div className="grid max-w-sm gap-1 text-sm font-normal whitespace-normal text-muted-foreground">
                      <Markdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={description}>
                        {r.position.description}
                      </Markdown>
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-top">{r.position.title}</TableCell>
                <TableCell className="align-top">{r.needs.join(", ")}</TableCell>
                <TableCell className="align-top">
                  {r.holders.length === 0 ? (
                    <span className="text-muted-foreground">No one</span>
                  ) : r.holders.length > NAMED ? (
                    `${r.holders.length} people`
                  ) : (
                    <ul>
                      {r.holders.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell className="text-right align-top">
                  <RowMenu
                    label={`More for ${r.position.name}`}
                    items={[
                      ...(actions.canUpdate
                        ? [{ label: "Edit", onClick: () => setPending({ kind: "edit", position: r.position }) }]
                        : []),
                      // Platform refuses deleting a position a term names, so it's offered only for one never held.
                      ...(actions.canDelete && !r.held
                        ? [
                            {
                              label: "Delete",
                              destructive: true,
                              onClick: () => setPending({ kind: "delete", position: r.position }),
                            },
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <PositionDialog
        open={pending?.kind === "add" || pending?.kind === "edit"}
        onOpenChange={(open) => !open && close()}
        position={pending?.kind === "edit" ? pending.position : null}
        qualifications={qualifications}
        onSave={(input) =>
          pending?.kind === "edit" ? actions.onUpdate(pending.position, input) : actions.onCreate(input)
        }
      />
      <DeleteDialog
        title={picked ? `Delete ${picked.name}?` : ""}
        open={pending?.kind === "delete"}
        onClose={close}
        onDelete={() => actions.onDelete(picked!)}
      />
    </section>
  );
}
