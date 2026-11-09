import type { Meta, StoryObj } from "@storybook/react-vite";
import { products, sharedCosts } from "./fixtures";
import { NonProgramReport } from "./non-program-report";

const meta = {
  component: NonProgramReport,
  args: { products, shared: sharedCosts },
} satisfies Meta<typeof NonProgramReport>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
