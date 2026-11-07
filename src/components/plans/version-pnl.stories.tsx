import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { budget, lines, offering, offerings, twoCoaches, warnings } from "./fixtures";
import { SourceNote } from "./financial-plan-view";
import { VersionPnl } from "./version-pnl";

const area = {
  name: "Youth Racing",
  pnl: { ...offering("youth", 1_950_000, 1_560_000, 22, 0), level: "program_area" as const, sailor_days: 192 },
};

const meta = {
  component: VersionPnl,
  args: {
    note: <SourceNote set={budget} savedBy="Pat Example" />,
    rows: [...offerings, area],
    warnings,
    lines: lines.filter((l) => l.member === "youth"),
  },
} satisfies Meta<typeof VersionPnl>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Budget was saved with, on March 10, 2027, by Pat Example/)).toBeVisible();
    await expect(canvas.getByText("Coach wages")).toBeVisible();
  },
};

export const Draft: Story = {
  args: { note: <SourceNote set={twoCoaches} savedBy={null} />, warnings: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/calculated now/)).toBeVisible();
  },
};

export const OfferingsOnly: Story = { args: { rows: offerings, warnings: [], lines: [] } };
