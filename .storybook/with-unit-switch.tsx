import type { Decorator } from "@storybook/react-vite";
import { UnitSwitch } from "../src/components/plans/unit-switch";

/** Renders the Unit Switch above a story, for the tables that follow it. */
export const withUnitSwitch: Decorator = (Story) => (
  <div className="grid gap-2">
    <UnitSwitch />
    <Story />
  </div>
);
