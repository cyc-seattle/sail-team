import { rulesOf } from "@/model/reports";

/** A rules field, read as a list: one rule a line, or a dash when it has none. */
export function RulesList({ rules, label }: { rules: string | null; label: string }) {
  const lines = rulesOf(rules);
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">No rules.</p>;
  }
  return (
    <ul aria-label={label} className="grid list-disc gap-1 pl-5 text-sm">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
