import * as React from "react";
import { cn } from "cn";

/**
 * A table that scrolls sideways inside its container when it's too wide. `focusable` lets a keyboard reach the
 * container to scroll it, for a table with nothing inside to focus.
 */
function Table({ className, focusable = false, ...props }: React.ComponentProps<"table"> & { focusable?: boolean }) {
  return (
    <div
      data-slot="table-container"
      tabIndex={focusable ? 0 : undefined}
      className={cn(
        "relative w-full overflow-x-auto",
        focusable && "rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * A row, highlighted under the pointer across every cell, a pinned one too. `highlight={false}` is for a row that's
 * only a heading or a total.
 */
function TableRow({ className, highlight = true, ...props }: React.ComponentProps<"tr"> & { highlight?: boolean }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors data-[state=selected]:bg-muted",
        highlight && "hover:*:bg-row-hover has-aria-expanded:*:bg-row-hover",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-9 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-2 py-1.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
