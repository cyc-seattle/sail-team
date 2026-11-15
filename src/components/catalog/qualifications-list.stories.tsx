import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { catalog } from "./fixtures";
import { QualificationsList } from "./qualifications-list";

const meta = {
  component: QualificationsList,
  args: { qualifications: catalog.qualifications },
} satisfies Meta<typeof QualificationsList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each qualification and the others it also meets. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const level2 = canvas.getAllByRole("row").find((r) => r.textContent?.startsWith("US Sailing Level 2"))!;
    await expect(level2).toHaveTextContent("US Sailing Level 1");
  },
};

export const Empty: Story = { args: { qualifications: [] } };
