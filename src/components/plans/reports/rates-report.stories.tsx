import type { Meta, StoryObj } from "@storybook/react-vite";
import { reportAssumptions } from "./fixtures";
import { RatesReport } from "./rates-report";

const meta = {
  component: RatesReport,
  args: { assumptions: reportAssumptions },
} satisfies Meta<typeof RatesReport>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
