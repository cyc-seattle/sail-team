import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
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

/** The table's row for a plan, by its exact name. */
const rowFor = (canvas: { getAllByRole: (role: "row") => HTMLElement[] }, name: string) =>
  canvas.getAllByRole("row").find((row) => row.querySelector("a")?.textContent === name)!;

const meta = {
  component: PlanningPage,
  decorators: [withRouter("/plans", ["/plans", "/plans/financial/$setId"])],
  parameters: { layout: "fullscreen" },
  args: { plans: planningPlans, actions: allowed() },
} satisfies Meta<typeof PlanningPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every year's plans under its year, newest first: within a year, the drafts not yet active, then by the date each is
 * active from. Archived plans are left out.
 */
export const NewestFirst: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("rowheader").map((th) => th.textContent)).toEqual(["2027", "2026"]);
    const rows = canvas.getAllByRole("row").filter((row) => row.querySelector("a"));
    await expect(rows.map((row) => row.querySelector("a")?.textContent)).toEqual([
      "2027 allocations, Nov 9",
      "Fall re-plan",
      "Budget",
      "Board review",
      "2026 Budget",
    ]);
  },
};

/** The day each plan is active from, the plan active now in bold, and nothing for one that's never been active. */
export const Active: Story = {
  play: async ({ canvas }) => {
    await expect(rowFor(canvas, "Budget")).toHaveTextContent("Jul 1, 2026");
    await expect(rowFor(canvas, "Fall re-plan")).toHaveTextContent("Sep 1, 2027");
    await expect(rowFor(canvas, "Board review")).toHaveTextContent("Mar 1, 2026");
    await expect(
      within(rowFor(canvas, "2027 allocations, Nov 9")).getByRole("button", { name: /Active date of/ }),
    ).toHaveAccessibleName("Active date of 2027 allocations, Nov 9: none");
  },
};

/** Each plan's status is an icon, named in its tooltip, beside its details and warnings. */
export const StatusIcons: Story = {
  play: async ({ canvas }) => {
    await expect(within(rowFor(canvas, "Fall re-plan")).getByRole("img", { name: "Draft" })).toBeVisible();
    await expect(within(rowFor(canvas, "Budget")).getByRole("img", { name: "Frozen" })).toBeVisible();
    await expect(within(rowFor(canvas, "Budget")).getByRole("img", { name: "2 warnings" })).toBeVisible();
    await userEvent.hover(within(rowFor(canvas, "Budget")).getByRole("img", { name: "Frozen" }));
    await waitFor(() => expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent("Frozen"));
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
    await expect(within(rowFor(canvas, "First pass")).getByRole("img", { name: "Archived, frozen" })).toBeVisible();
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

/** A frozen plan's details say when and by whom it was frozen, and which release calculated it. */
export const FrozenPlansDetails: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About Board review" }));
    await waitFor(async () => expect(await screen.findByText("Calculated with 1.36.0")).toBeVisible());
    await expect(screen.getByText(/Frozen .* by Sam Halyard/)).toBeVisible();
  },
};

/** A draft's details say which release calculated it too. */
export const DraftPlansDetails: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "About Fall re-plan" }));
    await waitFor(async () => expect(await screen.findByText("Calculated with 1.39.0")).toBeVisible());
  },
};

/** A Plan Admin freezes a draft from its ⋯ menu. It can't be undone, so it asks first. */
export const FreezingADraft: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Fall re-plan" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Freeze" }));
    // The dialog fades in from opacity 0, so the description is in the page a frame before it's visible.
    await waitFor(() => expect(screen.getByText(/can't go back to a draft/)).toBeVisible());
    await userEvent.click(screen.getByRole("button", { name: "Freeze" }));
    await waitFor(() =>
      expect(args.actions.onFreeze).toHaveBeenCalledWith(expect.objectContaining({ id: "two-coaches" })),
    );
  },
};

/** A frozen plan stays frozen: its menu has no Freeze. */
export const FrozenStaysFrozen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Board review" }));
    await waitFor(async () => expect(await screen.findByRole("menuitem", { name: "Archive" })).toBeVisible());
    await expect(screen.queryByRole("menuitem", { name: "Freeze" })).toBeNull();
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
    await expect(canvas.queryByRole("button", { name: /Active date of/ })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "More for Board review" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "More for 2027 allocations, Nov 9" }));
    await waitFor(async () => expect(await screen.findByRole("menuitem", { name: "Delete" })).toBeVisible());
    await expect(screen.queryByRole("menuitem", { name: "Archive" })).toBeNull();
    await expect(screen.queryByRole("menuitem", { name: "Freeze" })).toBeNull();
  },
};

/** A planner who can only read plans changes nothing. */
export const ReadOnly: Story = {
  args: { actions: allowed({ canAdmin: false, canDelete: false }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /More for/ })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Active date of/ })).toBeNull();
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
    await expect(rowFor(canvas, "Fall re-plan")).toHaveTextContent("—");
  },
};

/** With nothing to show, it says so. */
export const NoPlans: Story = {
  args: { plans: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No plans match.")).toBeVisible();
  },
};
