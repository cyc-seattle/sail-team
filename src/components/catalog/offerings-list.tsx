import { ReportSection } from "@/components/plans/reports/report-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { offeringsByProgram, type CatalogOffering, type CatalogProduct } from "@/model/catalog";
import { formatDays } from "@/model/dates";
import { formatCents } from "@/model/money";

/** What CSC sells that hasn't ended, under its program, with its dates, price and capacity. */
export function OfferingsList({
  offerings,
  products,
  today,
}: {
  offerings: CatalogOffering[];
  products: CatalogProduct[];
  today: string;
}) {
  const groups = offeringsByProgram(offerings, products, today);
  return (
    <ReportSection id="offerings" title="Offerings">
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offerings coming up.</p>
      ) : (
        <Table aria-label="Offerings">
          <TableHeader>
            <TableRow>
              <TableHead>Offering</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
            </TableRow>
          </TableHeader>
          {groups.map(({ program, offerings }) => (
            <TableBody key={program.id}>
              <TableRow highlight={false} className="bg-muted/50">
                <TableHead scope="rowgroup" colSpan={4}>
                  {program.name}
                </TableHead>
              </TableRow>
              {offerings.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.name}</TableCell>
                  <TableCell>{formatDays(o.starts_on, o.ends_on)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.price_cents === null ? "" : formatCents(o.price_cents, o.price_cents % 100 === 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o.capacity ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          ))}
        </Table>
      )}
    </ReportSection>
  );
}
