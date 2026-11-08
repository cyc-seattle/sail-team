import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { household } from "./fixtures";
import { HouseholdView } from "./household-view";

const meta = {
  component: HouseholdView,
  args: { household, onShareChange: fn(), onSaveMember: fn(async () => {}) },
} satisfies Meta<typeof HouseholdView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Household: Story = {};

export const NotSharing: Story = { args: { household: { ...household, shares: false } } };

/** A sailor who signs in sees their household, but only an adult changes it. */
export const SignedInAsSailor: Story = {
  args: { household: { ...household, editable: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-disabled", "true");
    await expect(canvas.queryByRole("button", { name: /^Edit/ })).toBeNull();
  },
};
