import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import {
  areaOfferings,
  assumptionsRules,
  capital,
  doublehandedOfferings,
  doublehandedPrograms,
  doublehandedRules,
  doublehandedStatement,
  fundraising,
  overviewRows,
  products,
  reportAssumptions,
  reports,
  sharedCosts,
  summerOfferings,
  summerPrograms,
  summerRules,
  summerStatement,
  totals,
  warnings,
} from "./fixtures";
import { FundraisingCapitalReport } from "./fundraising-capital-report";
import { NonProgramReport } from "./non-program-report";
import { OverviewReport } from "./overview-report";
import { ProgramAreaReport } from "./program-area-report";
import { RatesReport } from "./rates-report";
import { ReportPage } from "./report-page";
import { withRouter } from "../../../../.storybook/with-router";

const meta = {
  component: ReportPage,
  decorators: [
    withRouter("/plans/financial/budget", ["/plans/financial/$setId", "/plans/financial/$setId/$planId", "/plans"]),
  ],
  parameters: { layout: "fullscreen" },
  args: { setId: "budget", name: "Budget", status: "active", reports, current: "overview", children: null },
} satisfies Meta<typeof ReportPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  args: {
    children: (
      <OverviewReport
        setId="budget"
        rows={overviewRows}
        offerings={areaOfferings}
        warnings={warnings}
        totals={totals}
      />
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Budget" })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Revenue and expenses" })).toBeVisible();
  },
};

export const Summer: Story = {
  args: {
    current: "summer",
    children: (
      <ProgramAreaReport
        area="Summer"
        rules={summerRules}
        warnings={warnings.filter((w) => w.area === "summer")}
        statement={summerStatement}
        programs={summerPrograms}
        offerings={summerOfferings}
      />
    ),
  },
};

/** A program area's assumptions open from the top of its report. */
export const SummerAssumptionsOpen: Story = {
  args: { ...Summer.args },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Assumptions", { selector: "h2" }));
    await expect(canvas.getByRole("list", { name: "Guppies rules" })).toBeVisible();
  },
};

export const Doublehanded: Story = {
  args: {
    current: "doublehanded",
    children: (
      <ProgramAreaReport
        area="Doublehanded"
        rules={doublehandedRules}
        warnings={warnings.filter((w) => w.area === "doublehanded")}
        statement={doublehandedStatement}
        programs={doublehandedPrograms}
        offerings={doublehandedOfferings}
      />
    ),
  },
};

export const NonProgram: Story = {
  args: { current: "non-program", children: <NonProgramReport products={products} shared={sharedCosts} /> },
};

export const FundraisingAndCapital: Story = {
  args: { current: "fundraising", children: <FundraisingCapitalReport fundraising={fundraising} capital={capital} /> },
};

export const Assumptions: Story = {
  args: { current: "rates", children: <RatesReport assumptions={reportAssumptions} rules={assumptionsRules} /> },
};

export const Draft: Story = { args: { ...Overview.args, name: "Two more coaches", status: "draft" } };
