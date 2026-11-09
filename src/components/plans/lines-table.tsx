import { Fragment } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePnlView } from "@/hooks/use-pnl-view";
import type { Category } from "@/model/plan-lines";
import { viewLabels, type Measures } from "@/model/pnl-view";
import { cn } from "@/lib/utils";
import { ViewedMoney } from "./viewed-money";

function Amount({ cents, measures, colored = false }: { cents: number; measures: Measures; colored?: boolean }) {
  return (
    <TableCell className="text-right">
      <ViewedMoney cents={cents} measures={measures} colored={colored} />
    </TableCell>
  );
}

// "Revenue" is the engine's name for an offering's sales, which the category already says.
const sameAs = (item: string, category: string) => item === category || item === "Revenue";

function Categories({ categories, measures }: { categories: Category[]; measures: Measures }) {
  return categories.map((category) => {
    const name = (
      <>
        {category.name}
        {category.number && <span className="ml-2 font-normal text-muted-foreground">{category.number}</span>}
      </>
    );
    const [only] = category.items;
    // A category with one line item is one row, naming the item only when it says more than the category.
    if (category.items.length === 1 && only) {
      return (
        <TableRow key={`${category.number} ${category.name}`}>
          <TableCell className="font-medium whitespace-normal">
            {name}
            {!sameAs(only.name, category.name) && (
              <div className="pl-4 font-normal text-muted-foreground">{only.name}</div>
            )}
          </TableCell>
          <Amount cents={only.cents} measures={measures} />
        </TableRow>
      );
    }
    return (
      <Fragment key={`${category.number} ${category.name}`}>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={2} className="pt-4 font-medium whitespace-normal">
            {name}
          </TableCell>
        </TableRow>
        {category.items.map((item) => (
          <TableRow key={item.name}>
            <TableCell className="pl-6 whitespace-normal">{item.name}</TableCell>
            <Amount cents={item.cents} measures={measures} />
          </TableRow>
        ))}
        <TableRow className="font-medium">
          <TableCell className="pl-6 whitespace-normal">{category.name} total</TableCell>
          <Amount cents={category.cents} measures={measures} />
        </TableRow>
      </Fragment>
    );
  });
}

const sum = (categories: Category[]) => categories.reduce((total, c) => total + c.cents, 0);

export interface Section {
  title: string;
  categories: Category[];
}

/**
 * Line items, such as coach wages, under their category, which is their account, with a total for each category and
 * each section, in the view the Unit Switch chose. With revenue and costs as its sections, the footer shows the net.
 */
export function LinesTable({
  sections,
  measures,
  net = false,
  label,
}: {
  sections: Section[];
  /** What a per-day or per-sailor-day amount divides by. */
  measures: Measures;
  /** Whether to end with the first section's total less the second's: revenue less costs. */
  net?: boolean;
  label: string;
}) {
  const [view] = usePnlView();
  const shown = sections.filter((s) => s.categories.length > 0);
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead>Line item</TableHead>
          <TableHead className="text-right">{viewLabels[view]}</TableHead>
        </TableRow>
      </TableHeader>
      {shown.map((section, i) => (
        <TableBody key={section.title} className={cn(i > 0 && "border-t-2")}>
          {shown.length > 1 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="pt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {section.title}
              </TableCell>
            </TableRow>
          )}
          <Categories categories={section.categories} measures={measures} />
          <TableRow className="bg-muted/50 font-medium">
            <TableCell>Total {section.title.toLowerCase()}</TableCell>
            <Amount cents={sum(section.categories)} measures={measures} />
          </TableRow>
        </TableBody>
      ))}
      {net && (
        <TableFooter>
          <TableRow>
            <TableCell>Net</TableCell>
            <Amount
              cents={sum(sections[0]?.categories ?? []) - sum(sections[1]?.categories ?? [])}
              measures={measures}
              colored
            />
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
