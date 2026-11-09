import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { household, schools } from "./fixtures";
import { HouseholdView } from "./household-view";

const meta = {
  component: HouseholdView,
  args: { household, schools, onShareChange: fn(), onSaveMember: fn(async () => {}) },
} satisfies Meta<typeof HouseholdView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Household: Story = {};

export const NotSharing: Story = { args: { household: { ...household, shares: false } } };

/** A sailor who signs in changes anyone in the household, but only an adult decides whether it shares. */
export const SignedInAsSailor: Story = {
  args: { household: { ...household, editable: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-disabled", "true");
    await expect(canvas.getAllByRole("button", { name: /^Edit/ })).toHaveLength(3);
  },
};
