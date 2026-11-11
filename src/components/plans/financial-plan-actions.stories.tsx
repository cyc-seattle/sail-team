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
  saved_at: "2027-03-10T18:00:00Z",
  saved_by: null,
  platform_version: null,
  parent: null,
};
const twoCoaches: FinancialPlanSummary = {
  ...budget,
  id: "two",
  name: "Two coaches",
  message: null,
  status: "draft",
  saved_at: null,
  parent: { id: "budget", name: "Budget" },
};

const meta = {
  component: FinancialPlanActions,
  args: {
    set: twoCoaches,
    canUpdate: true,
    canCreate: true,
    onEdit: fn(async () => {}),
    onStart: fn(async () => {}),
    onMove: fn(async () => {}),
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <FinancialPlanActions {...args} />
    </div>
  ),
} satisfies Meta<typeof FinancialPlanActions>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A draft can be saved, after a warning that it then never changes. */
export const Draft: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await waitFor(() => expect(dialog.getByText(/never change/)).toBeVisible());
    await userEvent.click(dialog.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(args.onMove).toHaveBeenCalledWith("saved"));
  },
};

export const Saved: Story = {
  args: { set: budget },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Mark active" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Save" })).toBeNull();
  },
};

/** A saved plan's name and note can change, though its numbers can't. */
export const RenameSaved: Story = {
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

export const Active: Story = {
  args: { set: { ...budget, status: "active" } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Mark active" })).toBeNull();
  },
};

/** Someone who can only read plans gets no buttons. */
export const ReadOnly: Story = {
  args: { set: budget, canUpdate: false, canCreate: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole("button")).toHaveLength(0);
  },
};
