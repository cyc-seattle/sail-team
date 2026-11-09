import type { Meta, StoryObj } from "@storybook/react-vite";
import { capital, fundraising } from "./fixtures";
import { FundraisingCapitalReport } from "./fundraising-capital-report";

const meta = {
  component: FundraisingCapitalReport,
  args: { fundraising, capital },
} satisfies Meta<typeof FundraisingCapitalReport>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
