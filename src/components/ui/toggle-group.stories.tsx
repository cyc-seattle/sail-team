import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = { component: ToggleGroup } satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

// The pill toggle, only for a two-way view switch.
export const ViewSwitch: Story = {
  render: () => (
    <ToggleGroup defaultValue={["year"]} variant="outline" aria-label="Show amounts">
      <ToggleGroupItem value="year">Per year</ToggleGroupItem>
      <ToggleGroupItem value="day">Per day</ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const day = canvas.getByRole("button", { name: "Per day" });
    await userEvent.click(day);
    await expect(day).toHaveAttribute("aria-pressed", "true");
  },
};
