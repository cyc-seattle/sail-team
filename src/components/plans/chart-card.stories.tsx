import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { ChartCard } from "./chart-card";
import { offerings } from "./fixtures";
import { PnlTable } from "./pnl-table";
import { RevenueExpenseChart } from "./revenue-expense-chart";

const bars = offerings.map(({ name, pnl }) => ({ name, ...pnl }));

const meta = {
  component: ChartCard,
  args: {
    title: "Revenue and expenses by offering",
    explanation: "Each offering's tuition, against its coaches, boats, and its share of the area's costs.",
    chart: <RevenueExpenseChart bars={bars} />,
    table: <PnlTable rows={offerings} label="Offering" />,
  },
} satisfies Meta<typeof ChartCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Explained: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: 'How "Revenue and expenses by offering" is worked out' }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByText(/share of the area's costs/)).toBeVisible());
  },
};
