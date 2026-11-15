import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { boatsInService } from "@/model/inventory";
import { BoatClassList } from "./boat-class-list";
import { accounts, assets, classes, day, defaultAccountId } from "./fixtures";

const meta = {
  component: BoatClassList,
  args: {
    classes,
    accounts,
    defaultAccountId,
    counts: boatsInService(assets, day),
    actions: {
      canCreate: true,
      canUpdate: true,
      onCreate: fn(async () => {}),
      onUpdate: fn(async () => {}),
    },
  },
} satisfies Meta<typeof BoatClassList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each class with its account, capacity, area, and the boats CSC has. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Boat classes" })).toHaveTextContent("Boat upkeep");
  },
};

/** Editing a class's footprint sends it with the rest. */
export const EditFootprint: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Keelboat" }));
    await userEvent.type(await screen.findByRole("spinbutton", { name: "Area (ft²)" }), "180");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.actions.onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: "Keelboat" }), {
      name: "Keelboat",
      max_capacity: 4,
      footprint_sq_ft: 180,
      account_id: null,
    });
  },
};

/** No plan is active today. */
/** Someone who can't change classes gets no buttons. */
export const ReadOnly: Story = {
  args: {
    actions: { canCreate: false, canUpdate: false, onCreate: fn(), onUpdate: fn() },
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };
