import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { clubMembers, clubResults } from "./fixtures";
import { ProgramsSection } from "./programs-section";

const meta = {
  component: ProgramsSection,
  decorators: [
    withRouter("/plans/financial/budget", [
      "/plans/financial/$setId",
      "/plans/financial/$setId/$planId",
      "/plans/compare/$a/$b",
      "/plans",
    ]),
  ],
  args: { setId: "budget", members: clubMembers, results: clubResults() },
} satisfies Meta<typeof ProgramsSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeAreas: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Doublehanded" })).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "J-Pod · fall practices" })).toBeVisible();
  },
};

export const NoPrograms: Story = { args: { members: clubMembers.filter((m) => m.kind === "operations") } };
