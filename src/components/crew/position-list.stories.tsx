import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { positionRows } from "@/model/crew";
import { crew, day } from "./fixtures";
import { PositionList, type PositionActions } from "./position-list";

const writer = (changes: Partial<PositionActions> = {}): PositionActions => ({
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  onCreate: fn(async () => {}),
  onUpdate: fn(async () => {}),
  onDelete: fn(async () => {}),
  ...changes,
});

const meta = {
  component: PositionList,
  args: { rows: positionRows(crew, day), qualifications: crew.qualifications, actions: writer() },
} satisfies Meta<typeof PositionList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every position, by name, with who holds it today and where. */
export const ByName: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /^Parent Coordinator/ })).toHaveTextContent(
      "Casey Nguyen (J-Pod)Priya Patel (Opti Race Team)",
    );
    await expect(canvas.getByRole("row", { name: /^Director 2A/ })).toHaveTextContent("No one");
  },
};

/** Past three holders, a count. */
export const ManyHolders: Story = {
  args: {
    rows: positionRows(
      {
        ...crew,
        terms: [1, 2, 3, 4].map((n) => ({ ...crew.terms[0]!, id: `t${n}`, crew_member_id: crew.members[n]!.id })),
      },
      day,
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("row", { name: /^Sailing Director/ })).toHaveTextContent("4 people");
  },
};

/** Only a position no one has held can be deleted. */
export const Delete: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Treasurer" }));
    await expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "More for Director 2A" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(args.actions.onDelete).toHaveBeenCalledWith(expect.objectContaining({ name: "Director 2A" }));
  },
};

/** Adding a position, with the qualifications it needs. */
export const AddAPosition: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add position" }));
    await screen.findByRole("dialog", { name: "Add position" });
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Dockmaster");
    await userEvent.click(screen.getByRole("checkbox", { name: "Powerboat Safety" }));
    await userEvent.click(screen.getByRole("button", { name: "Add position" }));
    await waitFor(() =>
      expect(args.actions.onCreate).toHaveBeenCalledWith({
        name: "Dockmaster",
        title: null,
        description: null,
        qualification_ids: [crew.qualifications.find((q) => q.name === "Powerboat Safety")!.id],
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
  },
};

/** A Crew Reader gets no Add position and no menus. */
export const ReadOnly: Story = {
  args: { actions: writer({ canCreate: false, canUpdate: false, canDelete: false }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Add position" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /^More for/ })).not.toBeInTheDocument();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };

export const Empty: Story = { args: { rows: [] } };
