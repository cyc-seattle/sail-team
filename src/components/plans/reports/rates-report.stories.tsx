import type { Meta, StoryObj } from "@storybook/react-vite";
import { assumptionsNotes, reportAssumptions } from "./fixtures";
import { RatesReport } from "./rates-report";

const meta = {
  component: RatesReport,
  args: { assumptions: reportAssumptions, notes: assumptionsNotes },
} satisfies Meta<typeof RatesReport>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
