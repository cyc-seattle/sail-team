import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { withRouter } from "../../../../.storybook/with-router";
import { planningPlans } from "./fixtures";
import { PlanningPage, type PlanningActions } from "./planning-page";

const allowed = (fields: Partial<PlanningActions> = {}): PlanningActions => ({
  canAdmin: true,
  canDelete: true,
  onFreeze: fn(async () => {}),
  onActivate: fn(async () => {}),
  onArchive: fn(async () => {}),
  onDelete: fn(async () => {}),
  ...fields,
});

const meta = {
  component: PlanningPage,
  decorators: [withRouter("/plans", ["/plans", "/plans/financial/$setId"])],
  parameters: { layout: "fullscreen" },
  args: { plans: planningPlans, actions: allowed() },
} satisfies Meta<typeof PlanningPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every year's plans, newest first: the newest year, then within it the drafts not yet active, then by the date each
 * is active from. Archived plans are left out.
 */
export const NewestFirst: Story = {
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole("row").slice(1);
    await expect(rows.map((row) => row.querySelector("a")?.textContent)).toEqual([
      "2027 allocations, Nov 9",
      "Fall re-plan",
      "Budget",
      "Board review",
      "2026 Budget",
    ]);
  },
};

/** When a plan is active, the plan active now in bold. */
export const Active: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /^2027 Budget/ })).toHaveTextContent("Since Jul 1, 2026");
    await expect(canvas.getByRole("row", { name: /Fall re-plan/ })).toHaveTextContent("From Sep 1, 2027");
    await expect(canvas.getByRole("row", { name: /Board review/ })).toHaveTextContent("Mar 1, 2026 to Jun 30, 2026");
    await expect(canvas.getByRole("row", { name: /2027 allocations/ })).toHaveTextContent("Not active");
  },
};

/** Turning drafts off leaves the frozen plans. */
export const WithoutDrafts: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Show drafts" }));
    await waitFor(() => expect(canvas.queryByRole("link", { name: "Fall re-plan" })).toBeNull());
    await expect(canvas.getByRole("link", { name: "Budget" })).toBeVisible();
  },
};

/** Archived plans show only when turned on, and each can be brought back. */
export const Archived: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.queryByRole("link", { name: "First pass" })).toBeNull();
    await userEvent.click(canvas.getByRole("switch", { name: "Show archived" }));
    await waitFor(() => expect(canvas.getByRole("link", { name: "First pass" })).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "More for First pass" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Unarchive" }));
    await waitFor(() =>
      expect(args.actions.onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: "first" }), false),
    );
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

/** A plan's note shows on hover or a tap, with its link, such as to the spreadsheet it came from. */
export const Note: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About Budget" }));
    await waitFor(async () =>
      expect(await screen.findByRole("link", { name: "board's budget spreadsheet" })).toBeVisible(),
    );
  },
};

/** A frozen plan's details say when and by whom it was frozen, and which platform version worked it out. */
export const FrozenPlansDetails: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About Board review" }));
    await waitFor(async () => expect(await screen.findByText("Platform 1.36.0")).toBeVisible());
    await expect(screen.getByText(/Frozen .* by Sam Halyard/)).toBeVisible();
  },
};

/** A Plan Admin freezes a draft from its Status column. It can't be undone, so it asks first. */
export const FreezingADraft: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Status of Fall re-plan" }));
    await userEvent.click(await screen.findByRole("option", { name: "Frozen" }));
    await expect(await screen.findByText(/can't go back to a draft/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Freeze" }));
    await waitFor(() =>
      expect(args.actions.onFreeze).toHaveBeenCalledWith(expect.objectContaining({ id: "two-coaches" })),
    );
  },
};

/** A frozen plan stays frozen: its status is a label, not a choice. */
export const FrozenStaysFrozen: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("combobox", { name: "Status of Budget" })).toBeNull();
    await expect(canvas.getByRole("row", { name: /^2027 Budget/ })).toHaveTextContent("Frozen");
  },
};

/** A Plan Admin changes the day a plan is active from in its Active column. */
export const MakingAPlanActive: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Active date of Board review/ }));
    const date = await screen.findByLabelText("Active from");
    await userEvent.clear(date);
    await userEvent.type(date, "2027-10-01");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.actions.onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "board" }), "2027-10-01"),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/** A plan with a date can be made inactive again. */
export const MakingAPlanInactive: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Active date of Fall re-plan/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Make inactive" }));
    await waitFor(() =>
      expect(args.actions.onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "two-coaches" }), null),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/** When platform refuses a date, the popover says why. */
export const RefusedDate: Story = {
  args: {
    actions: allowed({
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
    }),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Active date of 2027 allocations, Nov 9/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Save" }));
    await expect(await screen.findByRole("alert")).toHaveTextContent(
      "Another Financial Plan for the year is already active from that date.",
    );
  },
};

/** Deleting a draft, from its ⋯ menu, asks first. */
export const DeletingTheAgentsDraft: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for 2027 allocations, Nov 9" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await waitFor(async () => expect(await screen.findByText("Delete 2027 allocations, Nov 9?")).toBeVisible());
  },
};

/** Archiving a frozen plan hides it from the list. It can be undone, so it doesn't ask. */
export const ArchivingAFrozenPlan: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Board review" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Archive" }));
    await waitFor(() =>
      expect(args.actions.onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: "board" }), true),
    );
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

/** The plan active now can't be archived or deleted, so it has no ⋯ menu, though its date can change. */
export const PlanActiveNowStays: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "More for Budget" })).toBeNull();
    await expect(canvas.getByRole("button", { name: /Active date of Budget/ })).toBeVisible();
  },
};

/** A Plan Writer deletes drafts, but leaves freezing, dates, and archiving to a Plan Admin. */
export const ProgramDirector: Story = {
  args: { actions: allowed({ canAdmin: false }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("combobox")).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Active date of/ })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "More for Board review" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "More for 2027 allocations, Nov 9" }));
    await waitFor(async () => expect(await screen.findByRole("menuitem", { name: "Delete" })).toBeVisible());
    await expect(screen.queryByRole("menuitem", { name: "Archive" })).toBeNull();
  },
};

/** A planner who can only read plans changes nothing. */
export const ReadOnly: Story = {
  args: { actions: allowed({ canAdmin: false, canDelete: false }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /More for/ })).toBeNull();
    await expect(canvas.queryByRole("combobox")).toBeNull();
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

/** With nothing to show, it says so. */
export const NoPlans: Story = {
  args: { plans: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No plans match.")).toBeVisible();
  },
};
