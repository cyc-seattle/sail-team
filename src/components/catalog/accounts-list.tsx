import { useState } from "react";
import { AccountCells, AccountHeads } from "@/components/account-cells";
import { LabeledSwitch } from "@/components/labeled-switch";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  accountTypes,
  costTypes,
  form990,
  functionLabels,
  sortAccounts,
  type CatalogAccount,
  type CostAccount,
} from "@/model/catalog";

/**
 * The chart of accounts by type, in number order, with each account's functional-expense column, its Form 990 line,
 * and the account it sits under or offsets. Retired accounts show only when turned on. Under it, the account each cost
 * the planning engine works out is booked to.
 */
export function AccountsList({ accounts, costAccounts }: { accounts: CatalogAccount[]; costAccounts: CostAccount[] }) {
  const [showRetired, setShowRetired] = useState(false);
  const shown = sortAccounts(accounts).filter((a) => showRetired || !a.retired);
  const byId = (id: string | null) => accounts.find((a) => a.id === id);
  const booked = costTypes.filter((c) => costAccounts.some((ca) => ca.cost_type === c.type));
  return (
    <>
      <ReportSection
        id="chart"
        title="Chart of accounts"
        actions={<LabeledSwitch label="Show retired" checked={showRetired} onChange={setShowRetired} />}
      >
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <Table aria-label="Chart of accounts" focusable>
            <TableHeader>
              <TableRow>
                <AccountHeads />
                <TableHead>Function</TableHead>
                <TableHead>Form 990</TableHead>
                <AccountHeads label="Under" />
                <AccountHeads label="Offsets" />
              </TableRow>
            </TableHeader>
            {accountTypes
              .filter((t) => shown.some((a) => a.type === t.type))
              .map((t) => (
                <TableBody key={t.type}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead scope="rowgroup" colSpan={8}>
                      {t.label}
                    </TableHead>
                  </TableRow>
                  {shown
                    .filter((a) => a.type === t.type)
                    .map((a) => (
                      <TableRow key={a.id} className={cn(a.retired && "text-muted-foreground")}>
                        <AccountCells account={a} />
                        <TableCell>{a.default_function && functionLabels[a.default_function]}</TableCell>
                        <TableCell className="whitespace-nowrap">{form990(a)}</TableCell>
                        <AccountCells account={byId(a.parent_id)} />
                        <AccountCells account={byId(a.contra_account_id)} />
                      </TableRow>
                    ))}
                </TableBody>
              ))}
          </Table>
        )}
      </ReportSection>
      <ReportSection id="cost-accounts" title="Where costs are booked">
        {booked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cost has an account yet.</p>
        ) : (
          <Table aria-label="Where costs are booked" focusable>
            <TableHeader>
              <TableRow>
                <TableHead>Cost</TableHead>
                <AccountHeads />
              </TableRow>
            </TableHeader>
            <TableBody>
              {booked.map((c) => (
                <TableRow key={c.type}>
                  <TableCell>{c.label}</TableCell>
                  <AccountCells account={byId(costAccounts.find((ca) => ca.cost_type === c.type)!.account_id)} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ReportSection>
    </>
  );
}
