import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { sharedCosts } from "@/model/plan-lines";
import {
  budget,
  lines,
  measures,
  offerings,
  operationsAssumptions,
  twoCoaches,
  warnings,
  youthAssumptions,
} from "./fixtures";
import { SourceNote } from "./financial-plan-view";
import { PageHeader } from "./page-header";
import { PlanView } from "./plan-view";
import { UnitSwitch } from "./unit-switch";

const meta = {
  component: PlanView,
  args: {
    note: <SourceNote set={budget} savedBy="Pat Example" />,
    warnings,
    lines: lines.filter((l) => l.member === "youth"),
    offerings,
    assumptions: youthAssumptions,
    measures,
  },
  // The page around it, as the route shows it.
  decorators: [
    (Story, { args }) => (
      <main className="mx-auto max-w-6xl">
        <PageHeader
          title={args.assumptions?.operations ? "Non-program" : "Youth Racing"}
          back={{ to: "/plans/financial/budget", label: "Budget" }}
          actions={<UnitSwitch />}
        />
        <Story />
      </main>
    ),
    withRouter("/plans/financial/budget/youth", ["/plans/financial/budget"]),
  ],
} satisfies Meta<typeof PlanView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProgramPlan: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Assumptions" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Offerings" })).toBeVisible();
    await expect(canvas.getByRole("row", { name: /G&A share: Insurance/ })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "Shared costs" })).toBeNull();
  },
};

export const OperationsPlan: Story = {
  args: {
    lines: lines.filter((l) => l.member === "ops"),
    shared: sharedCosts(lines),
    offerings: [],
    assumptions: operationsAssumptions,
    warnings: [],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Salaried staff" })).toBeVisible();
    // Insurance, added back up from Youth Racing's and Adult Programs' shares.
    await expect(canvas.getByRole("row", { name: /G&A: Insurance/ })).toHaveTextContent("$2,450");
  },
};

export const Draft: Story = {
  args: { note: <SourceNote set={twoCoaches} savedBy={null} />, warnings: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/calculated now/)).toBeVisible();
  },
};

export const LoadingAssumptions: Story = { args: { assumptions: undefined } };
