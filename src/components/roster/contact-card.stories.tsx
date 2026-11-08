import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { ContactCard } from "./contact-card";
import { ada, pat, sam } from "./fixtures";

const meta = {
  component: ContactCard,
  args: { person: pat },
} satisfies Meta<typeof ContactCard>;
export default meta;
type Story = StoryObj<typeof meta>;

// A parent who shares: their email and phone, as links.
export const Sharing: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Pat Bowline" }));
    const body = within(canvasElement.ownerDocument.body);
    const email = await body.findByRole("link", { name: "pat.bowline@example.org" });
    await waitFor(() => expect(email).toBeVisible());
    await expect(email).toHaveAttribute("href", "mailto:pat.bowline@example.org");
  },
};

export const NotSharing: Story = {
  args: { person: sam },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Sam Bowline" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByText("Hasn't shared their email and phone.")).toBeVisible());
  },
};

// A sailor: their parents, and how to reach each.
export const Sailor: Story = {
  args: { person: ada, parents: ada.parents, about: "J-Pod · Lakeside Middle School" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Ada Bowline" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await body.findByText("J-Pod · Lakeside Middle School")).toBeVisible());
    await expect(body.getByRole("link", { name: "+1 206 555 0141" })).toHaveAttribute("href", "tel:+1 206 555 0141");
    await expect(body.getByText("Hasn't shared their email and phone.")).toBeVisible();
  },
};
