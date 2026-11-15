import { AccountCells, AccountHeads } from "@/components/account-cells";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  kindLabels,
  productsByArea,
  type CatalogAccount,
  type CatalogArea,
  type CatalogProduct,
} from "@/model/catalog";

const pinned = "sticky left-0 z-10 bg-background";

/**
 * Every product the club sells, under its program area, with the revenue account its sales are booked to: the area's,
 * or the product's own when it's in none. A program shows whether it's a team, its color, and its Google Group.
 */
export function ProgramsList({
  areas,
  products,
  accounts,
}: {
  areas: CatalogArea[];
  products: CatalogProduct[];
  accounts: CatalogAccount[];
}) {
  const groups = productsByArea(areas, products);
  const accountOf = (id: string | null) => accounts.find((a) => a.id === id);
  return (
    <ReportSection id="products" title="Programs and products">
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      ) : (
        <Table aria-label="Programs and products" focusable>
          <TableHeader>
            <TableRow>
              <TableHead className={pinned}>Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Google Group</TableHead>
              <AccountHeads label="Revenue" />
            </TableRow>
          </TableHeader>
          {groups.map(({ area, products }) => (
            <TableBody key={area?.id ?? "none"}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead scope="rowgroup" colSpan={4} className={pinned + " bg-transparent"}>
                  {area?.name ?? "No program area"}
                </TableHead>
                {area ? <AccountCells account={accountOf(area.revenue_account_id)} /> : <TableCell colSpan={2} />}
              </TableRow>
              {products.map((product) => {
                const program = product.programs[0];
                return (
                  <TableRow key={product.id}>
                    <TableCell className={pinned + " font-medium"}>
                      <span className="inline-flex items-center gap-2">
                        {program?.color && (
                          <span
                            aria-hidden
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: program.color }}
                          />
                        )}
                        {product.name}
                      </span>
                    </TableCell>
                    <TableCell>{kindLabels[product.kind]}</TableCell>
                    <TableCell>{program?.team ? "Team" : ""}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {program?.google_group && (
                        <a href={`mailto:${program.google_group.email}`} className="text-link underline">
                          {program.google_group.email}
                        </a>
                      )}
                    </TableCell>
                    {/* A product in an area takes the area's account, on the area's row. */}
                    {area ? (
                      <TableCell colSpan={2} />
                    ) : (
                      <AccountCells account={accountOf(product.revenue_account_id)} />
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          ))}
        </Table>
      )}
    </ReportSection>
  );
}
