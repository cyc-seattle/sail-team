import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { AssetList, type AssetActions } from "./asset-list";
import { assets, classes, day } from "./fixtures";

const writer = (fields: Partial<AssetActions> = {}): AssetActions => ({
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  onCreate: fn(async () => {}),
  onUpdate: fn(async () => {}),
  onDispose: fn(async () => {}),
  onDelete: fn(async () => {}),
  ...fields,
});

const meta = {
  component: AssetList,
  args: { assets, classes, day, actions: writer() },
} satisfies Meta<typeof AssetList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every asset CSC has, by kind, each kind with its value, and the total. The scrapped Opti is left out. */
export const ByKind: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("rowheader").map((th) => th.textContent)).toEqual([
      "Sailboats 44",
      "Powerboats 8",
      "Motors 3",
      "Other 2",
    ]);
    await expect(canvas.queryByText("Opti 412")).not.toBeInTheDocument();
  },
};

/** Show disposed adds what CSC no longer has, with the day it went, and Bring back in its menu. */
export const ShowDisposed: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Show disposed" }));
    await expect(canvas.getByText("Oct 1, 2025")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "More for Opti 412" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Bring back" }));
    await expect(args.actions.onDispose).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "MCL00412" }),
      null,
    );
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  },
};

/** Finding by number narrows the list to the motor with that serial number. */
export const Find: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole("searchbox", { name: "Find by name or number" }), "1100457");
    await expect(canvas.getAllByRole("rowheader").map((th) => th.textContent)).toEqual(["Motors 1"]);
  },
};

/** Adding a sailboat asks its class, and sends its boat details with it. */
export const AddASailboat: Story = {
  globals: { viewport: { value: "laptop" } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add asset" }));
    await screen.findByRole("dialog", { name: "Add asset" });
    await expect(screen.getByRole("button", { name: "Add asset" })).toBeDisabled();
    await userEvent.click(screen.getByRole("combobox", { name: "Boat class" }));
    await userEvent.click(await screen.findByRole("option", { name: "Opti" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Sail number" }), "2001");
    await userEvent.type(screen.getByRole("textbox", { name: "Value" }), "3,600");
    await userEvent.click(screen.getByRole("button", { name: "Add asset" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 });
    await expect(args.actions.onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "sailboat",
        value_cents: 360_000,
        model: null,
        boat: { boat_class_id: classes.find((c) => c.name === "Opti")!.id, sail_number: "2001" },
      }),
    );
  },
};

/** A value that isn't dollars says so, and can't be saved. */
export const BadValue: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Club van" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));
    const value = await screen.findByRole("textbox", { name: "Value" });
    await userEvent.clear(value);
    await userEvent.type(value, "lots");
    await expect(screen.getByRole("alert")).toHaveTextContent("Enter dollars");
    await expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  },
};

/** Disposing of an asset asks the day it went. */
export const DisposeOf: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "More for Coach 3" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Dispose of" }));
    await screen.findByRole("dialog", { name: "Dispose of Coach 3?" });
    await userEvent.click(screen.getByRole("button", { name: "Dispose of" }));
    await expect(args.actions.onDispose).toHaveBeenCalledWith(expect.objectContaining({ name: "Coach 3" }), day);
  },
};

/** Someone who only reads the inventory gets no Add asset and no menus. */
export const ReadOnly: Story = {
  args: { actions: writer({ canCreate: false, canUpdate: false, canDelete: false }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Add asset" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /^More for/ })).not.toBeInTheDocument();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };

export const Empty: Story = { args: { assets: [] } };
