import { ReportSection } from "@/components/plans/reports/report-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { offeringsByProgram, type CatalogOffering, type CatalogProduct } from "@/model/catalog";

/** Every offering plans and Clubspot both point to, under its program. */
export function OfferingsList({ offerings, products }: { offerings: CatalogOffering[]; products: CatalogProduct[] }) {
  const groups = offeringsByProgram(offerings, products);
  return (
    <ReportSection id="offerings" title="Offerings">
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offerings yet.</p>
      ) : (
        <Table aria-label="Offerings">
          <TableHeader>
            <TableRow>
              <TableHead>Offering</TableHead>
            </TableRow>
          </TableHeader>
          {groups.map(({ program, offerings }) => (
            <TableBody key={program.id}>
              <TableRow highlight={false} className="bg-muted/50">
                <TableHead scope="rowgroup">{program.name}</TableHead>
              </TableRow>
              {offerings.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          ))}
        </Table>
      )}
    </ReportSection>
  );
}
