import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Label } from "./label";
import { Switch } from "./switch";

const meta = { component: Switch } satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Label>
      <Switch /> Show per sailor-day
    </Label>
  ),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Show per sailor-day" });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};
