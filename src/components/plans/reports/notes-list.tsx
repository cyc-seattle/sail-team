import { InlineMarkdown } from "@/components/inline-markdown";
import { notesOf } from "@/model/reports";

/** A plan's or a program's short notes for the planning agent, as a bulleted list. */
export function NotesList({ notes, label }: { notes: string[] | null; label: string }) {
  const list = notesOf(notes);
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No notes.</p>;
  }
  return (
    <ul aria-label={label} className="grid list-disc gap-1 pl-5 text-sm">
      {list.map((note) => (
        <li key={note}>
          <InlineMarkdown text={note} />
        </li>
      ))}
    </ul>
  );
}
