import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import type { FinancialPlanSummary } from "@/model/financial-plans";
import { FinancialPlanActions } from "./financial-plan-actions";

// A made-up 2027 Financial Plan and a draft started from it.
const budget: FinancialPlanSummary = {
  id: "budget",
  organization_id: "org",
  fiscal_year: 2027,
  name: "Budget",
  message: "Reviewed with the board",
  status: "saved",
  effective_from: "2026-07-01",
  saved_at: "2027-03-10T18:00:00Z",
  saved_by: null,
  platform_version: null,
  parent: null,
  archived_at: null,
};
const twoCoaches: FinancialPlanSummary = {
  ...budget,
  id: "two",
  name: "Two coaches",
  message: null,
  status: "draft",
  effective_from: null,
  saved_at: null,
  parent: { id: "budget", name: "Budget" },
};

const meta = {
  component: FinancialPlanActions,
  args: {
    set: twoCoaches,
    canEdit: true,
    canCreate: true,
    canApprove: true,
    onEdit: fn(async () => {}),
    onStart: fn(async () => {}),
    onFreeze: fn(async () => {}),
    onActivate: fn(async () => {}),
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <FinancialPlanActions {...args} />
    </div>
  ),
} satisfies Meta<typeof FinancialPlanActions>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A draft can be frozen, after a warning that it then never changes. */
export const Draft: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Freeze" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await waitFor(() => expect(dialog.getByText(/never change/)).toBeVisible());
    await userEvent.click(dialog.getByRole("button", { name: "Freeze" }));
    await waitFor(() => expect(args.onFreeze).toHaveBeenCalled());
  },
};

/** A draft can be made active from a date, today unless it's changed, and stays a draft. */
export const MakeADraftActive: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Make active" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const date = dialog.getByLabelText("Active from");
    await userEvent.clear(date);
    await userEvent.type(date, "2027-09-01");
    await userEvent.click(dialog.getByRole("button", { name: "Make active" }));
    await waitFor(() => expect(args.onActivate).toHaveBeenCalledWith("2027-09-01"));
  },
};

/** A frozen plan that's active can't be frozen again, but its date can change. */
export const Frozen: Story = {
  args: { set: budget },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Change active date" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Freeze" })).toBeNull();
  },
};

/** Duplicating a plan starts a draft copy of it. */
export const Duplicate: Story = {
  args: { set: budget },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Duplicate" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await expect(dialog.getByLabelText("Name")).toHaveValue("Budget copy");
    await userEvent.click(dialog.getByRole("button", { name: "Duplicate" }));
    await waitFor(() => expect(args.onStart).toHaveBeenCalledWith({ name: "Budget copy", message: null }));
  },
};

/** A frozen plan's name and note can change, though its numbers can't. */
export const RenameFrozen: Story = {
  args: { set: budget },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const name = dialog.getByLabelText("Name");
    await userEvent.clear(name);
    await userEvent.type(name, "Adopted budget");
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.onEdit).toHaveBeenCalledWith({ name: "Adopted budget", message: "Reviewed with the board" }),
    );
  },
};

/** A program director can rename a plan and duplicate it, but freezing it and making it active are the committee's. */
export const ProgramDirector: Story = {
  args: { canApprove: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Duplicate" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Freeze" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Make active" })).toBeNull();
  },
};

/** Someone who can only read plans gets no buttons. */
export const ReadOnly: Story = {
  args: { set: budget, canEdit: false, canCreate: false, canApprove: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole("button")).toHaveLength(0);
  },
};
