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
    actions: {
      canApprove: true,
      canDelete: true,
      onFreeze: fn(async () => {}),
      onActivate: fn(async () => {}),
      onArchive: fn(async () => {}),
      onDelete: fn(async () => {}),
    },
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
    await waitFor(() => expect(canvas.queryByRole("link", { name: "Budget" })).toBeNull());
    await expect(canvas.getByRole("link", { name: "Fall re-plan" })).toBeVisible();
  },
};

/** A draft's details, such as the planning agent's note, show on hover or a tap. */
export const AgentsReport: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About 2027 allocations, Nov 9" }));
    await waitFor(async () => expect(await screen.findByText(/Allocated every summer week/)).toBeVisible());
  },
};

/** A frozen plan's details say when and by whom it was frozen, and which platform version worked it out. */
export const FrozenPlansDetails: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About Budget" }));
    await waitFor(async () => expect(await screen.findByText("Platform 1.38.1")).toBeVisible());
    await expect(screen.getByText(/Frozen .* by Morgan Keel/)).toBeVisible();
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

/** Freezing a draft asks first, then freezes it. */
export const FreezingADraft: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Fall re-plan" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Freeze" }));
    await userEvent.click(await screen.findByRole("button", { name: "Freeze" }));
    await waitFor(() =>
      expect(args.actions.onFreeze).toHaveBeenCalledWith(expect.objectContaining({ id: "two-coaches" })),
    );
  },
};

/** Archiving a frozen plan hides it from the list. It can be undone, so it doesn't ask. */
export const ArchivingAFrozenPlan: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Board review" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Archive" }));
    await waitFor(() =>
      expect(args.actions.onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: "board" }), true),
    );
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

/** Archived plans show only when asked for, and each can be brought back. */
export const Archived: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.queryByRole("link", { name: "First pass" })).toBeNull();
    await userEvent.click(canvas.getByRole("combobox", { name: "Status" }));
    await userEvent.click(await screen.findByRole("option", { name: "Archived" }));
    await waitFor(() => expect(canvas.getByRole("link", { name: "First pass" })).toBeVisible());
    await expect(canvas.queryByRole("link", { name: "Budget" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Actions for First pass" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Unarchive" }));
    await waitFor(() =>
      expect(args.actions.onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: "first" }), false),
    );
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

/** The plan in force is listed first, with when it's in force, and a draft can be active from a later date. */
export const InForce: Story = {
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole("row");
    await expect(rows[1]).toHaveTextContent("Budget");
    await expect(rows[1]).toHaveTextContent("In force since Jul 1, 2026");
    await expect(canvas.getByRole("row", { name: /Fall re-plan/ })).toHaveTextContent("Active from Sep 1, 2027");
    await userEvent.click(canvas.getByRole("combobox", { name: "Status" }));
    await userEvent.click(await screen.findByRole("option", { name: "In force" }));
    await waitFor(() => expect(canvas.queryByRole("link", { name: "Fall re-plan" })).toBeNull());
    await expect(canvas.getByRole("link", { name: "Budget" })).toBeVisible();
  },
};

/** The plan in force can't be archived or deleted, though its date can change. */
export const PlanInForceStays: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Budget" }));
    await waitFor(async () =>
      expect(await screen.findByRole("menuitem", { name: "Change active date" })).toBeVisible(),
    );
    await expect(screen.queryByRole("menuitem", { name: "Archive" })).toBeNull();
  },
};

/** Making a frozen plan active asks for the date it's active from. */
export const MakingAPlanActive: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Board review" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Change active date" }));
    const date = await screen.findByLabelText("Active from");
    await userEvent.clear(date);
    await userEvent.type(date, "2027-10-01");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.actions.onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "board" }), "2027-10-01"),
    );
  },
};

/** When platform refuses a date, the dialog says why. */
export const RefusedDate: Story = {
  args: {
    actions: {
      canApprove: true,
      canDelete: true,
      onFreeze: fn(),
      onActivate: fn(async () => {
        throw {
          errors: [
            {
              message: "Another Financial Plan for the year is already active from that date.",
              extensions: { code: "INVALID_PAYLOAD" },
            },
          ],
        };
      }),
      onArchive: fn(),
      onDelete: fn(),
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions for 2027 allocations, Nov 9" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Make active" }));
    await userEvent.click(await screen.findByRole("button", { name: "Make active" }));
    await expect(await screen.findByRole("alert")).toHaveTextContent(
      "Another Financial Plan for the year is already active from that date.",
    );
  },
};

/** A program director starts and deletes drafts, but leaves freezing, making active, and archiving to the committee. */
export const ProgramDirector: Story = {
  args: {
    actions: { canApprove: false, canDelete: true, onFreeze: fn(), onActivate: fn(), onArchive: fn(), onDelete: fn() },
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Actions for Budget" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Actions for 2027 allocations, Nov 9" }));
    await waitFor(async () => expect(await screen.findByRole("menuitem", { name: "Delete" })).toBeVisible());
    await expect(screen.queryByRole("menuitem", { name: "Freeze" })).toBeNull();
    await expect(screen.queryByRole("menuitem", { name: "Make active" })).toBeNull();
  },
};

/** A planner who can only read plans has no actions. */
export const ReadOnly: Story = {
  args: {
    actions: { canApprove: false, canDelete: false, onFreeze: fn(), onActivate: fn(), onArchive: fn(), onDelete: fn() },
  },
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
    await expect(canvas.getByRole("row", { name: /Fall re-plan/ })).toHaveTextContent("—");
  },
};
