import type { Decorator } from "@storybook/react-vite";
import { UnitSwitch } from "../src/components/plans/unit-switch";
import { viewKey } from "../src/model/pnl-view";

/** Renders the Unit Switch above a story, for the tables that follow it. */
export const withUnitSwitch: Decorator = (Story) => (
  <div className="grid gap-2">
    <UnitSwitch />
    <Story />
  </div>
);

/** Starts each story for the year, whatever an earlier one chose: the choice is saved in localStorage. */
export function forTheYear() {
  localStorage.removeItem(viewKey);
}
