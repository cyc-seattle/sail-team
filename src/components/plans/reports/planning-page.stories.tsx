import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { planningPlans } from "./fixtures";
import { PlanningPage } from "./planning-page";

const meta = {
  component: PlanningPage,
  decorators: [withRouter("/plans", ["/plans", "/plans/financial/$setId"])],
  parameters: { layout: "fullscreen" },
  args: {
    plans: planningPlans,
    actions: { canUpdate: true, canDelete: true, onMove: fn(async () => {}), onDelete: fn(async () => {}) },
  },
} satisfies Meta<typeof PlanningPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Opens on the newest year. The planning agent's draft is a draft like any other, with its report as its note. */
export const NewestYear: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link", { name: "2026 Budget" })).toBeNull();
  },
};

/** Every year's plans, narrowed to drafts. */
export const Drafts: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Status" }));
    await userEvent.click(await screen.findByRole("option", { name: "Draft" }));
    await waitFor(() => expect(canvas.queryByText("Active")).toBeNull());
    await expect(canvas.getByRole("link", { name: "Two more coaches" })).toBeVisible();
  },
};

/** A draft's details, such as the planning agent's note, show on hover or a tap. */
export const AgentsReport: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About 2027 allocations, Nov 9" }));
    await waitFor(async () => expect(await screen.findByText(/Allocated every summer week/)).toBeVisible());
  },
};

/** A saved plan's details say when and by whom it was saved, and which platform version worked it out. */
export const SavedPlansDetails: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About Budget" }));
    await waitFor(async () => expect(await screen.findByText("Platform 1.38.1")).toBeVisible());
    await expect(screen.getByText(/Saved .* by Morgan Keel/)).toBeVisible();
  },
};

/** Deleting a draft, from its Actions menu, asks first. */
export const DeletingTheAgentsDraft: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for 2027 allocations, Nov 9" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await waitFor(async () => expect(await screen.findByText("Delete 2027 allocations, Nov 9?")).toBeVisible());
  },
};

/** Saving a draft asks first, then saves it. */
export const SavingADraft: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Two more coaches" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Save" }));
    await userEvent.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.actions.onMove).toHaveBeenCalledWith(expect.objectContaining({ id: "two-coaches" }), "saved"),
    );
  },
};

/** A planner who can only read plans has no actions. */
export const ReadOnly: Story = {
  args: { actions: { canUpdate: false, canDelete: false, onMove: fn(), onDelete: fn() } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /Actions for/ })).toBeNull();
  },
};

/** A draft whose numbers platform is still working out shows dashes until they arrive. */
export const NumbersPending: Story = {
  args: {
    plans: planningPlans.map((p) =>
      p.id === "two-coaches" ? { ...p, revenue_cents: null, expense_cents: null, net_cents: null } : p,
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /Two more coaches/ })).toHaveTextContent("—");
  },
};
