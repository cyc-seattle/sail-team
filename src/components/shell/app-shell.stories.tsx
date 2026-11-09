import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import { expect, waitFor, within } from "storybook/test";
import { AppShell } from "./app-shell";

const staff = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/roster", label: "Rosters" },
];

const meta = {
  component: AppShell,
  decorators: [withRouter("/roster", ["/", "/plans"])],
  parameters: { layout: "fullscreen" },
  args: {
    name: "Robin Tiller",
    pages: staff,
    children: (
      <main className="p-card">
        <h1 className="text-2xl font-semibold tracking-tight">Rosters</h1>
      </main>
    ),
  },
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A staff member, who can open Plans and Rosters. */
export const Staff: Story = {
  play: async ({ canvas }) => {
    const links = await canvas.findAllByRole("link", { name: "Rosters" });
    const visible = links.find((link) => link.checkVisibility());
    await expect(visible).toHaveAttribute("aria-current", "page");
  },
};

/** Everyone has Support, an email link, with the other sites. On a phone, More opens it. */
export const Support: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const more = canvas.queryByRole("button", { name: "More" });
    if (more) {
      await userEvent.click(more);
      await waitFor(async () => expect(await body.findByRole("dialog", { name: "Menu" })).toBeVisible());
    }
    const support = (await body.findAllByRole("link", { name: "Support" })).find((link) => link.checkVisibility());
    await expect(support).toHaveAttribute("href", "mailto:info@cyccommunitysailing.org");
  },
};

/** A parent on a team, who can open Rosters but not Plans. */
export const TeamParent: Story = { args: { name: "Lee Halyard", pages: [staff[0]!, staff[2]!] } };

/** A name too long for the sidebar is cut short, and the page never scrolls sideways. */
export const LongName: Story = {
  args: { name: "robin.tiller-montgomery@example.org" },
  play: async ({ canvasElement }) => {
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

/** The account menu open. On a phone, More opens the sidebar first. */
export const AccountMenuOpen: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Hidden on a laptop, where the sidebar is always open.
    const more = canvas.queryByRole("button", { name: "More" });
    if (more) {
      await userEvent.click(more);
      await waitFor(async () => expect(await body.findByRole("dialog", { name: "Menu" })).toBeVisible());
    }
    await userEvent.click(await body.findByRole("button", { name: "Robin Tiller" }));
    await waitFor(async () => expect(await body.findByText("Signed in as Robin Tiller")).toBeVisible());
  },
};
