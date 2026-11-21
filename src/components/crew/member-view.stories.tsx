import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { crew, day, memberNamed } from "./fixtures";
import { MemberView, type MemberActions } from "./member-view";

const photo = (id: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#c9a"/><title>${id}</title></svg>`)}`;

const writer = (changes: Partial<MemberActions> = {}): MemberActions => ({
  canWriteTerms: true,
  canWriteQualifications: true,
  canDelete: true,
  pay: true,
  onSaveTerm: fn(async () => {}),
  onEndTerm: fn(async () => {}),
  onDeleteTerm: fn(async () => {}),
  onSaveQualification: fn(async () => {}),
  onDeleteQualification: fn(async () => {}),
  onDelete: fn(async () => {}),
  profile: { onSave: fn(async () => {}), onUpload: fn(async () => "new-photo") },
  ...changes,
});

const meta = {
  component: MemberView,
  decorators: [withRouter("/crew/priya", ["/crew", "/crew/priya"])],
  parameters: { layout: "fullscreen" },
  args: { member: memberNamed("Priya"), data: crew, day, photoUrl: photo, actions: writer() },
} satisfies Meta<typeof MemberView>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Their positions, current first, then ended ones; their qualifications, with one expiring soon; and their profile. */
export const Writer: Story = {
  play: async ({ canvas }) => {
    const positions = within(canvas.getByRole("table", { name: "Positions" }));
    await expect(
      positions
        .getAllByRole("row")
        .slice(1)
        .map((r) => r.firstChild?.textContent),
    ).toEqual(["Parent Coordinator", "Head Coach", "Sailing Instructor"]);
    await expect(positions.getByRole("row", { name: /Head Coach/ })).toHaveTextContent("Head Coach");
    await expect(canvas.getByRole("row", { name: /First Aid and CPR/ })).toHaveTextContent(/in \d+ days/);
    await expect(canvas.getByRole("textbox", { name: "Name on the website" })).toHaveValue("Priya Patel");
    await expect(canvas.queryByRole("button", { name: "More for Priya Patel" })).not.toBeInTheDocument();
  },
};

/** Someone whose position needs a qualification they don't have in date. */
export const Missing: Story = {
  args: { member: memberNamed("Jordan") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("list", { name: "Missing" })).toHaveTextContent("Missing SafeSport");
    await expect(canvas.getByRole("row", { name: /SafeSport/ })).toHaveTextContent(/Expired/);
  },
};

/** Assigning a position, in a program, with its pay. An archived staff level isn't offered. */
export const AssignAPosition: Story = {
  globals: { viewport: { value: "laptop" } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Assign position" }));
    await screen.findByRole("dialog", { name: "Assign position" });
    await userEvent.click(screen.getByRole("combobox", { name: "Position" }));
    await userEvent.click(await screen.findByRole("option", { name: "Parent Coordinator" }));
    await userEvent.click(screen.getByRole("combobox", { name: "In" }));
    await userEvent.click(await screen.findByRole("option", { name: "J-Pod" }));
    await userEvent.click(screen.getByRole("combobox", { name: "Staff level" }));
    await expect(screen.queryByRole("option", { name: "Senior Instructor" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("option", { name: "Coach" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Hourly rate" }), "32.50");
    await userEvent.click(screen.getByRole("button", { name: "Assign position" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(args.actions.onSaveTerm).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        crew_member_id: args.member.id,
        position_id: crew.positions.find((p) => p.name === "Parent Coordinator")!.id,
        program_id: crew.programs.find((p) => p.name === "J-Pod")!.id,
        program_area_id: null,
        hourly_rate_cents: 3250,
      }),
    );
  },
};

/** Ending a position asks its last day, today unless changed. */
export const EndAPosition: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Head Coach" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "End" }));
    await screen.findByRole("dialog", { name: "End Head Coach for Priya Patel?" });
    await userEvent.click(screen.getByRole("button", { name: "End position" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(args.actions.onEndTerm).toHaveBeenCalledWith(
      expect.objectContaining({ position_id: crew.positions.find((p) => p.name === "Head Coach")!.id }),
      day,
    );
  },
};

/** Adding a qualification, earned today unless changed. */
export const AddAQualification: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add qualification" }));
    await screen.findByRole("dialog", { name: "Add qualification" });
    await userEvent.click(screen.getByRole("combobox", { name: "Qualification" }));
    await userEvent.click(await screen.findByRole("option", { name: "SafeSport" }));
    await userEvent.click(screen.getByRole("button", { name: "Add qualification" }));
    await waitFor(() =>
      expect(args.actions.onSaveQualification).toHaveBeenCalledWith(null, {
        crew_member_id: args.member.id,
        qualification_id: crew.qualifications.find((q) => q.name === "SafeSport")!.id,
        earned_on: day,
        expires_on: null,
        note: null,
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
  },
};

/** Changing the website profile saves only with Save, and Discard puts it back. */
export const EditTheProfile: Story = {
  play: async ({ canvas, args }) => {
    const save = canvas.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();
    const bio = canvas.getByRole("textbox", { name: "Bio" });
    await userEvent.type(bio, " She sails a 29er.");
    await userEvent.click(canvas.getByRole("button", { name: "Discard" }));
    await expect(bio).toHaveValue("Priya has coached the race team since 2023.");
    await userEvent.click(canvas.getByRole("switch", { name: "On the website" }));
    await userEvent.click(save);
    await waitFor(() =>
      expect(args.actions.profile!.onSave).toHaveBeenCalledWith(expect.objectContaining({ on_website: false })),
    );
  },
};

/** Someone with no positions or qualifications can be taken off Crew. */
export const NewCrewMember: Story = {
  args: { member: { ...memberNamed("Casey"), id: "new" } },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText("No positions yet.")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "More for Casey Nguyen" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete from Crew" }));
    await screen.findByRole("dialog", { name: "Delete Casey Nguyen from Crew?" });
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(args.actions.onDelete).toHaveBeenCalled();
  },
};

/** A Crew Reader sees no pay, no buttons, and a profile they can't change. */
export const Reader: Story = {
  args: {
    actions: writer({
      canWriteTerms: false,
      canWriteQualifications: false,
      canDelete: false,
      pay: false,
      profile: undefined,
    }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("columnheader", { name: "Staff level" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Assign position" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /^More for/ })).not.toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Bio" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };
