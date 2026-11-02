import type { ReactNode } from "react";

export interface Tile {
  label: string;
  value: ReactNode;
  hint?: string;
}

/** A row of tiles with one big number each, such as a plan's revenue, expenses and net. */
export function SummaryTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="grid gap-1 rounded-lg bg-card p-card ring-1 ring-border">
          <dt className="text-xs text-muted-foreground">{tile.label}</dt>
          <dd className="text-2xl font-semibold tracking-tight">{tile.value}</dd>
          {tile.hint && <dd className="text-xs text-muted-foreground">{tile.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
