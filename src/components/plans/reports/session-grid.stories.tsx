import type { Meta, StoryObj } from "@storybook/react-vite";
import { doublehandedOfferings, summerOfferings } from "./fixtures";
import { SessionGrid } from "./session-grid";

const meta = { component: SessionGrid, args: { offerings: summerOfferings } } satisfies Meta<typeof SessionGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Race Camp runs only some weeks, so the others show a dash. A full session is bold. */
export const SummerWeeks: Story = {};

export const Seasons: Story = { args: { offerings: doublehandedOfferings } };
