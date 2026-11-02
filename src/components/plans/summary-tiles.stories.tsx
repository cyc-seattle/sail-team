import type { Meta, StoryObj } from "@storybook/react-vite";
import { Money } from "./money";
import { SummaryTiles } from "./summary-tiles";

const meta = { component: SummaryTiles, args: { tiles: [] } } satisfies Meta<typeof SummaryTiles>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PlanTotals: Story = {
  args: {
    tiles: [
      { label: "Revenue", value: <Money cents={1_950_000} /> },
      { label: "Expenses", value: <Money cents={1_460_000} /> },
      { label: "Net", value: <Money cents={490_000} colored />, hint: "After shared costs" },
      { label: "Sailor-days", value: <span className="tabular-nums">192</span> },
    ],
  },
};
