import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { storageByArea } from "@/model/inventory";
import { areas, assets, classes, day } from "./fixtures";
import { StorageList } from "./storage-list";

const meta = {
  component: StorageList,
  decorators: [withRouter("/inventory/storage", ["/inventory/classes"])],
  args: {
    groups: storageByArea(assets, classes, areas, day),
    actions: { canCreate: true, canUpdate: true, onCreate: fn(async () => {}), onUpdate: fn(async () => {}) },
  },
} satisfies Meta<typeof StorageList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each area by name, with what's kept there and the area its boats use, then what has no location. */
export const ByArea: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("rowheader").map((th) => th.textContent)).toEqual([
      "Docks",
      "Dry Storage",
      "Yard Arm",
      "No location",
    ]);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Keelboat has no area");
  },
};

/** Adding an area asks its name, area, and note. */
export const AddArea: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add storage area" }));
    await userEvent.type(await screen.findByRole("textbox", { name: "Name" }), "Boathouse");
    await userEvent.type(screen.getByRole("spinbutton", { name: "Area (ft²)" }), "800");
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add storage area" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(args.actions.onCreate).toHaveBeenCalledWith({ name: "Boathouse", area_sq_ft: 800, note: null });
  },
};

/** Someone who can't change areas gets no buttons. */
export const ReadOnly: Story = {
  args: { actions: { canCreate: false, canUpdate: false, onCreate: fn(), onUpdate: fn() } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: /Add storage area|^Edit/ })).not.toBeInTheDocument();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };

export const NoAreas: Story = { args: { groups: [] } };
