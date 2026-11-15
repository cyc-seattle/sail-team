import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { storageNeeds } from "@/model/inventory";
import { assets, classes, day } from "./fixtures";
import { StorageList } from "./storage-list";

const meta = {
  component: StorageList,
  decorators: [withRouter("/inventory/storage", ["/plans/financial/$setId/$planId"])],
  args: { needs: storageNeeds(assets, classes, day), activePlan: { id: "budget", name: "Budget" } },
} satisfies Meta<typeof StorageList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each class's dry storage, largest first, with the total, and a class with no footprint named under it. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Dry storage" })).toHaveTextContent("3,330");
    await expect(canvas.getByText(/Keelboat has no footprint yet/)).toBeVisible();
  },
};

/** Someone who reads no plans gets no link to its storage costs. */
export const NoPlan: Story = { args: { activePlan: null } };

export const Empty: Story = { args: { needs: [] } };
