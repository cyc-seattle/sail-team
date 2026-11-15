import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { boatsInService } from "@/model/inventory";
import { BoatClassList } from "./boat-class-list";
import { accounts, assets, classes, day, defaultAccountId } from "./fixtures";

const id = (name: string) => classes.find((c) => c.name === name)!.id;

const rates = {
  plan: { id: "budget", name: "Budget" },
  rates: new Map([
    [id("Opti"), { maintenance_per_boat_hour_cents: 150, fuel_per_hour_cents: null, charter_per_day_cents: null }],
    [id("RIB"), { maintenance_per_boat_hour_cents: 800, fuel_per_hour_cents: 1_500, charter_per_day_cents: 10_000 }],
  ]),
};

const meta = {
  component: BoatClassList,
  decorators: [withRouter("/inventory/classes", ["/plans/financial/$setId/$planId"])],
  args: {
    classes,
    accounts,
    defaultAccountId,
    counts: boatsInService(assets, day),
    rates,
    canReadRates: true,
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

/** Each class with the boats CSC has, and under it the active plan's rates, linked to its Assumptions. */
export const WithRates: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Budget assumptions" })).toBeVisible();
    await expect(canvas.getByRole("table", { name: "Boat rates" })).toHaveTextContent("$100");
  },
};

/** Editing a class's footprint sends it with the rest. */
export const EditFootprint: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Keelboat" }));
    await userEvent.type(await screen.findByRole("spinbutton", { name: "Sq ft each" }), "180");
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
export const NoActivePlan: Story = { args: { rates: null } };

/** Someone who reads no plans sees no rates, and someone who can't change classes no buttons. */
export const ReadOnly: Story = {
  args: {
    canReadRates: false,
    actions: { canCreate: false, canUpdate: false, onCreate: fn(), onUpdate: fn() },
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("table", { name: "Boat rates" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};

export const OnAPhone: Story = { globals: { viewport: { value: "phone" } } };
