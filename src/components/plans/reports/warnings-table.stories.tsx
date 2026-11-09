import type { Meta, StoryObj } from "@storybook/react-vite";
import { warnings } from "./fixtures";
import { WarningsTable } from "./warnings-table";

const meta = {
  component: WarningsTable,
  args: { warnings: warnings.filter((w) => w.area === "summer") },
} satisfies Meta<typeof WarningsTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Summer: Story = {};
