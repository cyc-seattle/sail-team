import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A stretch of a row from one column to another, both included, such as an offering's weeks. */
export interface Span {
  key: string;
  from: number;
  to: number;
  /** What it is, for a screen reader when it shows no words of its own. */
  label: string;
  content?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/** A row: a heading, such as a program area, or a name with its spans. */
export interface SpanRow {
  key: string;
  name: ReactNode;
  heading?: boolean;
  spans: Span[];
}

export interface SpanColumn {
  key: string;
  head: ReactNode;
  /** The column in words, such as "Week of Jul 12". */
  name: string;
}

/**
 * Rows of continuous spans over columns, such as weeks or days. When a column can be chosen, it's chosen from anywhere
 * in it, and stays marked top to bottom.
 */
export function SpanGrid({
  label,
  columns,
  rows,
  columnWidth,
  chosen,
  onChoose,
}: {
  label: string;
  columns: SpanColumn[];
  rows: SpanRow[];
  /** The narrowest a column gets, such as "3.5rem". */
  columnWidth: string;
  chosen?: string | null;
  onChoose?: (column: string) => void;
}) {
  const style = {
    gridTemplateColumns: `max-content repeat(${columns.length}, minmax(${columnWidth}, 1fr))`,
    gridTemplateRows: `repeat(${rows.length + 1}, auto)`,
  };
  const scroller = useRef<HTMLDivElement>(null);
  // Keeps the chosen column in view on a grid wider than the page, such as a whole year of weeks.
  const index = columns.findIndex((c) => c.key === chosen);
  useEffect(() => {
    const box = scroller.current;
    const column = box?.querySelectorAll<HTMLElement>("[data-column]")[index];
    if (!box || !column) {
      return;
    }
    const [left, right] = [column.offsetLeft, column.offsetLeft + column.offsetWidth];
    // The names stay pinned over the left of the scrolled columns.
    const names = box.querySelector<HTMLElement>("[data-corner]")?.offsetWidth ?? 0;
    if (left - names < box.scrollLeft || right > box.scrollLeft + box.clientWidth) {
      box.scrollTo({ left: left - names - (box.clientWidth - names) / 2 });
    }
  }, [index]);
  return (
    <div ref={scroller} className="overflow-x-auto">
      <div role="group" aria-label={label} className="grid min-w-fit text-sm" style={style}>
        <div data-corner className="sticky left-0 z-20 bg-background" style={{ gridColumn: 1, gridRow: 1 }} />
        {columns.map((c, i) =>
          onChoose ? (
            <button
              key={c.key}
              data-column
              type="button"
              aria-label={c.name}
              aria-pressed={c.key === chosen}
              onClick={() => onChoose(c.key)}
              style={{ gridColumn: i + 2, gridRow: "1 / -1" }}
              className="cursor-pointer rounded-sm outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-foreground/10"
            />
          ) : (
            <div key={c.key} data-column aria-hidden style={{ gridColumn: i + 2, gridRow: "1 / -1" }} />
          ),
        )}
        {columns.map((c, i) => (
          <div
            key={c.key}
            aria-hidden
            style={{ gridColumn: i + 2, gridRow: 1 }}
            // Over the chosen column's shading, muted words would lose their contrast.
            className={cn(
              "pointer-events-none z-10 pb-1 text-center whitespace-nowrap",
              c.key === chosen && "**:text-foreground",
            )}
          >
            {c.head}
          </div>
        ))}
        {rows.map((r, n) => (
          <div
            key={r.key}
            style={{ gridColumn: 1, gridRow: n + 2 }}
            className={cn(
              "sticky left-0 z-20 flex min-h-7 max-w-64 items-center bg-background pr-3",
              r.heading ? "pt-3 font-medium" : "pl-3 text-muted-foreground",
            )}
          >
            {r.name}
          </div>
        ))}
        {rows.flatMap((r, n) =>
          r.spans.map((s) => (
            <div
              key={`${r.key} ${s.key}`}
              style={{ ...s.style, gridColumn: `${s.from + 2} / ${s.to + 3}`, gridRow: n + 2 }}
              className={cn(
                "pointer-events-none relative z-10 mx-px my-1 flex min-h-5 items-center rounded-sm",
                s.className,
              )}
            >
              {s.content ?? <span className="sr-only">{s.label}</span>}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
