import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePnlView } from "@/hooks/use-pnl-view";
import { viewLabels, type PnlView } from "@/model/pnl-view";

/** Shows every P&L on every page for the year, per day, or per sailor-day. The choice is remembered. */
export function UnitSwitch() {
  const [view, setView] = usePnlView();
  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(values: string[]) => {
        const next = values[0] as PnlView | undefined;
        // Pressing the chosen view again would leave none chosen, so it stays.
        if (next) {
          setView(next);
        }
      }}
      variant="outline"
      size="sm"
      aria-label="Show amounts"
    >
      {(Object.keys(viewLabels) as PnlView[]).map((v) => (
        <ToggleGroupItem key={v} value={v}>
          {viewLabels[v]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
