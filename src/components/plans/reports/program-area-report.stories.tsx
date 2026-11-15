import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  closedDays,
  doublehandedOfferings,
  doublehandedSchedule,
  summerSchedule,
  doublehandedPrograms,
  doublehandedNotes,
  doublehandedTotal,
  summerTotal,
  doublehandedStatement,
  summerOfferings,
  summerPrograms,
  summerNotes,
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
    notes: doublehandedNotes,
    warnings: warnings.filter((w) => w.area === "doublehanded"),
    statement: doublehandedStatement,
    total: doublehandedTotal,
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
    await expect(canvas.getByRole("list", { name: "J-Pod notes" })).not.toBeVisible();
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
    await expect(canvas.getByRole("list", { name: "J-Pod notes" })).toBeVisible();
    // Each program's indirect cost rate, or none for a program without one.
    await expect(canvas.getByRole("region", { name: "J-Pod" })).toHaveTextContent("Indirect cost rate20%");
    await expect(canvas.getByRole("region", { name: "K-Pod" })).toHaveTextContent("Indirect cost rate—");
  },
};

export const Summer: Story = {
  args: {
    area: "Summer",
    notes: summerNotes,
    warnings: warnings.filter((w) => w.area === "summer"),
    statement: summerStatement,
    total: summerTotal,
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

/** Rows of a table, as the cells' text. */
const rowsOf = (table: HTMLElement) =>
  [...table.querySelectorAll("tbody tr")].map((r) => [...r.querySelectorAll("td")].map((c) => c.textContent));

/**
 * Budget runs term by term, then program by program, each with its subtotal, then what's charged to the area itself,
 * then the total.
 */
export const Budget: Story = {
  play: async ({ canvas }) => {
    const rows = rowsOf(canvas.getByRole("table", { name: "Budget" }));
    await expect(rows.slice(0, 5).map((r) => r[0])).toEqual([
      "Spring 2027",
      "J-Pod",
      "J-Pod Spring",
      "K-Pod",
      "K-Pod Spring",
    ]);
    // Summer's coaches cost more than its sailors pay.
    await expect(rows.find((r) => r[0] === "Summer 2027")?.[3]).toMatch(/^−/);
    await expect(rows.at(-2)).toEqual(["Charged to the area", "$0", "$7,000", "−$7,000"]);
    // The same as the statement above it.
    await expect(rows.at(-1)).toEqual(["Total", "$93,000", "$85,000", "$8,000"]);
  },
};

/** Enrollment adds up all but Break even; Fees only groups. */
export const Subtotals: Story = {
  play: async ({ canvas }) => {
    const enrollment = rowsOf(canvas.getByRole("table", { name: "Enrollment" }));
    await expect(enrollment[0]).toEqual(["Spring 2027", "", "48", "48", "34", "748", "2,244"]);
    await expect(enrollment.at(-1)).toEqual(["Total", "", "128", "128", "86", "1,892", "5,676"]);
    const fees = rowsOf(canvas.getByRole("table", { name: "Fees" }));
    await expect(fees[0]).toEqual(["Spring 2027", ""]);
  },
};

/** Offerings in no term come last, under No term. */
export const NoTerm: Story = {
  args: Summer.args!,
  play: async ({ canvas }) => {
    const rows = rowsOf(canvas.getByRole("table", { name: "Fees" }));
    const terms = rows.filter((r) => r[0] === "Summer 2027" || r[0] === "No term").map((r) => r[0]);
    await expect(terms).toEqual(["Summer 2027", "No term"]);
  },
};
