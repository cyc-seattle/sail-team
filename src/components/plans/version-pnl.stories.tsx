import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { offering, offerings, warnings } from "./fixtures";
import { VersionPnl } from "./version-pnl";

const area = {
  name: "Youth Racing",
  pnl: { ...offering("youth", 1_950_000, 1_560_000, 22, 0), level: "program_area" as const, sailor_days: 192 },
};

const meta = {
  component: VersionPnl,
  args: { source: { kind: "saved", savedAt: "2027-03-03T18:00:00Z" }, rows: [...offerings, area], warnings },
} satisfies Meta<typeof VersionPnl>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/saved with, on March 3, 2027/)).toBeVisible();
  },
};

export const Draft: Story = {
  args: { source: { kind: "draft" }, warnings: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/calculated now/)).toBeVisible();
  },
};

export const OfferingsOnly: Story = { args: { rows: offerings, warnings: [] } };
