import { TableCell, TableHead } from "@/components/ui/table";
import type { CatalogAccount } from "@/model/catalog";

/** The two header cells of an account: its number, in its own column on the left, then its name. */
export function AccountHeads({ label = "Account" }: { label?: string }) {
  return (
    <>
      <TableHead className="w-16">{label}</TableHead>
      <TableHead>
        <span className="sr-only">{label === "Account" ? "Account name" : `${label}: name`}</span>
      </TableHead>
    </>
  );
}

/** An account's number and name, in two cells so numbers line up. Empty cells for none. */
export function AccountCells({ account }: { account: Pick<CatalogAccount, "number" | "name"> | undefined }) {
  return (
    <>
      <TableCell className="text-muted-foreground tabular-nums">{account?.number}</TableCell>
      <TableCell className="whitespace-nowrap">{account?.name}</TableCell>
    </>
  );
}
