import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  memberName,
  memberNet,
  type FinancialPlanSummary,
  type Member,
  type Results,
  type Totals,
} from "@/model/financial-plans";
import { Money } from "./money";

export interface Compared {
  set: Pick<FinancialPlanSummary, "id" | "name" | "status">;
  members: Member[];
  results: Results | null;
}

const totals: { label: string; pick: (t: Totals) => number }[] = [
  { label: "Operating net", pick: (t) => t.operating_net_cents },
  { label: "Fundraising net", pick: (t) => t.fundraising_net_cents },
  { label: "Capital", pick: (t) => t.capital_cents },
  { label: "Total", pick: (t) => t.total_cents },
];

/** Two Financial Plans side by side: the organization's totals, and each plan's net, with how they differ. */
export function CompareView({ a, b }: { a: Compared; b: Compared }) {
  const netOf = (side: Compared, name: string) => {
    const member = side.members.find((m) => memberName(m) === name);
    return member && side.results ? memberNet(side.results, member) : null;
  };
  const plans = [...new Set([...a.members, ...b.members].map(memberName))].sort((x, y) =>
    x === "Non-program" ? -1 : y === "Non-program" ? 1 : x.localeCompare(y),
  );
  const difference =
    a.results && b.results ? a.results.totals.operating_net_cents - b.results.totals.operating_net_cents : null;
  const cell = (cents: number | null) =>
    cents === null ? <span className="text-muted-foreground">None</span> : <Money cents={cents} colored />;
  return (
    <div className="grid gap-card">
      {difference !== null && (
        <p className="text-base">
          {difference === 0 ? (
            `${a.set.name} and ${b.set.name} have the same operating net.`
          ) : (
            <>
              {difference > 0 ? a.set.name : b.set.name} nets <Money cents={Math.abs(difference)} /> more than{" "}
              {difference > 0 ? b.set.name : a.set.name}.
            </>
          )}
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Line</TableHead>
            <TableHead className="text-right">{a.set.name}</TableHead>
            <TableHead className="text-right">{b.set.name}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {totals.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-right">{cell(a.results ? row.pick(a.results.totals) : null)}</TableCell>
              <TableCell className="text-right">{cell(b.results ? row.pick(b.results.totals) : null)}</TableCell>
            </TableRow>
          ))}
          {plans.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell className="text-right">{cell(netOf(a, name))}</TableCell>
              <TableCell className="text-right">{cell(netOf(b, name))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
