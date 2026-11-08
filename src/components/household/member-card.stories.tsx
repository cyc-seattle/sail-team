import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { coParent, me, sailor } from "./fixtures";
import { MemberCard } from "./member-card";

const meta = {
  component: MemberCard,
  args: { member: me, onSave: fn(async () => {}) },
} satisfies Meta<typeof MemberCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Me: Story = {};

export const CoParent: Story = { args: { member: coParent } };

export const Sailor: Story = { args: { member: sailor } };

export const EditingSailor: Story = {
  args: { member: sailor },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    const school = canvas.getByLabelText("School");
    await userEvent.clear(school);
    await userEvent.type(school, "Eastlake High School");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onSave).toHaveBeenCalledWith({
      display_name: "Addie Tiller",
      phone: null,
      school: "Eastlake High School",
    });
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved.");
  },
};

export const EditingCoParent: Story = {
  args: { member: coParent },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Sam Tiller" }));
    await expect(canvas.getByLabelText("Name")).toBeVisible();
    await expect(canvas.queryByLabelText("Phone")).toBeNull();
    await expect(canvas.queryByLabelText("School")).toBeNull();
  },
};

export const DidNotSave: Story = {
  args: { onSave: fn(() => Promise.reject(new Error("forbidden"))) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Robin Tiller" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("That didn't save. Try again.");
    await expect(canvas.getByLabelText("Phone")).toBeVisible();
  },
};
