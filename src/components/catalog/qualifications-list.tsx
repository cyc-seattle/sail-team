import { ReportSection } from "@/components/plans/reports/report-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Qualification } from "@/model/catalog";

const byName = new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });

/** Every certification a coach holds or an offering requires, and the others each one also meets. */
export function QualificationsList({ qualifications }: { qualifications: Qualification[] }) {
  const sorted = [...qualifications].sort((a, b) => byName.compare(a.name, b.name));
  const nameOf = (id: string) => qualifications.find((q) => q.id === id)?.name;
  return (
    <ReportSection id="qualifications" title="Qualifications">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No qualifications yet.</p>
      ) : (
        <Table aria-label="Qualifications">
          <TableHeader>
            <TableRow>
              <TableHead>Qualification</TableHead>
              <TableHead>Also meets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.name}</TableCell>
                <TableCell>
                  {q.covers
                    .map(nameOf)
                    .filter(Boolean)
                    .sort((a, b) => byName.compare(a!, b!))
                    .join(", ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportSection>
  );
}
