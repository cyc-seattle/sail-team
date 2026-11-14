import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  closedDays,
  doublehandedOfferings,
  doublehandedSchedule,
  summerSchedule,
  doublehandedPrograms,
  doublehandedRules,
  doublehandedTerms,
  doublehandedByProgram,
  summerByProgram,
  doublehandedStatement,
  summerOfferings,
  summerPrograms,
  summerRules,
  summerTerms,
  doublehandedTrips,
  summerFixedCosts,
  summerStaffTime,
  summerStatement,
  warnings,
} from "./fixtures";
import { withRouter } from "../../../../.storybook/with-router";
import { ProgramAreaReport } from "./program-area-report";

const meta = {
  component: ProgramAreaReport,
  decorators: [withRouter("/plans/financial/budget/doublehanded", ["/plans/financial/$setId/$planId"])],
  args: {
    areaKey: "doublehanded",
    schedule: doublehandedSchedule,
    closedDays,
    area: "Doublehanded",
    rules: doublehandedRules,
    warnings: warnings.filter((w) => w.area === "doublehanded"),
    statement: doublehandedStatement,
    budget: { term: doublehandedTerms, program: doublehandedByProgram },
    programs: doublehandedPrograms,
    offerings: doublehandedOfferings,
    trips: doublehandedTrips,
    fixedCosts: [],
    staffTime: [],
  },
} satisfies Meta<typeof ProgramAreaReport>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Offerings run term by term, in the order the terms start, whatever order they were planned in. */
export const Doublehanded: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Fees" });
    const names = [...table.querySelectorAll("tbody button")].map((b) => b.textContent).filter(Boolean);
    await expect(names.slice(0, 4)).toEqual(["J-Pod Spring", "K-Pod Spring", "L-Pod Spring", "J-Pod Summer"]);
    await expect(canvas.getByRole("list", { name: "J-Pod rules" })).not.toBeVisible();
  },
};

/** Max and Capacity say what they mean on hover. */
export const EnrollmentHelp: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Enrollment" });
    await expect([...table.querySelectorAll("thead th")].map((h) => h.textContent)).toEqual([
      "Offering",
      "Break even",
      "Max",
      "Capacity",
      "Target",
      "Sailor-days",
      "Sailor-hours",
    ]);
    await userEvent.hover(within(table).getByRole("button", { name: "What Capacity means" }));
    const help = await within(document.body).findByText(
      "The most sailors the coaches and boats given to its blocks can take",
    );
    // The popover fades in.
    await waitFor(() => expect(help).toBeVisible());
  },
};

/** The area's assumptions open from the top of the page. */
export const AssumptionsOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Assumptions", { selector: "h2" }));
    await expect(canvas.getByRole("list", { name: "J-Pod rules" })).toBeVisible();
  },
};

export const Summer: Story = {
  args: {
    area: "Summer",
    rules: summerRules,
    warnings: warnings.filter((w) => w.area === "summer"),
    statement: summerStatement,
    budget: { term: summerTerms, program: summerByProgram },
    programs: summerPrograms,
    offerings: summerOfferings,
    areaKey: "summer",
    schedule: summerSchedule,
    trips: [],
    fixedCosts: summerFixedCosts,
    staffTime: summerStaffTime,
  },
};

/** Its calendar shows only this area's offerings, so there's no area to choose. */
export const Calendar: Story = {
  args: Summer.args!,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Year" })).toHaveTextContent("Guppies");
    await expect(canvas.queryByRole("combobox")).toBeNull();
  },
};

/** A trip names its offering, and what each coach's travel takes. */
export const DoublehandedTrips: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Trips", { selector: "h2" }));
    await expect(canvas.getByRole("row", { name: /Nationals/ })).toHaveTextContent("NationalsK-Pod Summer5$450—");
  },
};

/** Budget opens by term, each term's revenue, expenses and net in the order the terms start. */
export const ByTerm: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Budget" });
    const rows = [...table.querySelectorAll("tbody tr")].map((r) =>
      [...r.querySelectorAll("td")].map((c) => c.textContent),
    );
    await expect(rows.map((r) => r[0])).toEqual(["Spring 2027", "Summer 2027", "Fall 2027"]);
    await expect(rows[1]).toEqual(["Summer 2027", "$30,000", "$33,000", "−$3,000"]);
    const groups = [...canvas.getByRole("table", { name: "Fees" }).querySelectorAll("tbody tr td[colspan]")].map(
      (c) => c.previousElementSibling?.textContent,
    );
    await expect(groups).toEqual(["Spring 2027", "Summer 2027", "Fall 2027"]);
  },
};

/** One toggle groups Budget, Enrollment and Fees by program instead. */
export const ByProgram: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "By program" }));
    const budget = canvas.getByRole("table", { name: "Budget" });
    await expect([...budget.querySelectorAll("tbody tr")].map((r) => r.querySelector("td")?.textContent)).toEqual([
      "J-Pod",
      "K-Pod",
      "L-Pod",
      "The area as a whole",
    ]);
    for (const name of ["Enrollment", "Fees"]) {
      const groups = [...canvas.getByRole("table", { name }).querySelectorAll("tbody tr td[colspan]")].map(
        (c) => c.previousElementSibling?.textContent,
      );
      await expect(groups).toEqual(["J-Pod", "K-Pod", "L-Pod"]);
    }
  },
};

/** An area with no terms has no toggle, and groups by program. */
export const NoTerms: Story = {
  args: {
    budget: { term: [], program: doublehandedByProgram },
    offerings: doublehandedOfferings.map((o) => ({ ...o, term: null })),
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "By term" })).toBeNull();
    await expect(canvas.getByRole("table", { name: "Budget" })).toHaveTextContent("J-Pod");
  },
};
