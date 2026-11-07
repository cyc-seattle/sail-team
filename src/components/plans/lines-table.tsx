import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { signedCents, type PlanLine } from "@/model/financial-plans";
import { Money } from "./money";

/** Each line, such as coach wages or a share of the office, what it's for, and its amount, with their net. */
export function LinesTable({
  lines,
}: {
  lines: Pick<PlanLine, "name" | "cost_center_name" | "amount_cents" | "revenue">[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Line</TableHead>
          <TableHead>For</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line, i) => (
          <TableRow key={`${line.name}-${line.cost_center_name}-${i}`}>
            <TableCell>{line.name}</TableCell>
            <TableCell className="text-muted-foreground">{line.cost_center_name}</TableCell>
            <TableCell className="text-right">
              <Money cents={signedCents(line)} colored />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Net</TableCell>
          <TableCell className="text-right">
            <Money cents={lines.reduce((sum, l) => sum + signedCents(l), 0)} colored />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
