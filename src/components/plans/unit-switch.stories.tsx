import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { viewKey } from "@/model/pnl-view";
import { UnitSwitch } from "./unit-switch";

const meta = { component: UnitSwitch } satisfies Meta<typeof UnitSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ForTheYear: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "For the year" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Remembered: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Per day" }));
    await expect(localStorage.getItem(viewKey)).toBe("day");
    // Pressing it again keeps it chosen.
    await userEvent.click(canvas.getByRole("button", { name: "Per day" }));
    await expect(canvas.getByRole("button", { name: "Per day" })).toHaveAttribute("aria-pressed", "true");
  },
};
