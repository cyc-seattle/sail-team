import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import { expect, fn, waitFor, within } from "storybook/test";
import { linksFor } from "@/model/nav";
import { AppShell } from "./app-shell";

const directus = "https://directus.cycsail.team";

const staff = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Planning" },
  { to: "/roster", label: "Rosters" },
];

const meta = {
  component: AppShell,
  decorators: [withRouter("/roster", ["/", "/plans"])],
  parameters: { layout: "fullscreen" },
  args: {
    name: "Robin Tiller",
    pages: staff,
    links: linksFor("Crew", directus),
    onSignOut: fn(),
    children: (
      <main className="p-card">
        <h1 className="text-2xl font-semibold tracking-tight">Rosters</h1>
      </main>
    ),
  },
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A staff member, who can open Planning and Rosters. */
export const Staff: Story = {
  play: async ({ canvas }) => {
    const links = await canvas.findAllByRole("link", { name: "Rosters" });
    const visible = links.find((link) => link.checkVisibility());
    await expect(visible).toHaveAttribute("aria-current", "page");
  },
};

/** Opens Links, after More on a phone. */
async function openLinks({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story["play"]>>[0]) {
  const body = within(canvasElement.ownerDocument.body);
  const more = canvas.queryByRole("button", { name: "More" });
  if (more) {
    await userEvent.click(more);
    await waitFor(async () => expect(await body.findByRole("dialog", { name: "Menu" })).toBeVisible());
  }
  const links = (await body.findAllByRole("button", { name: "Links" })).find((button) => button.checkVisibility());
  await userEvent.click(links!);
  return body;
}

const linkNames = (body: ReturnType<typeof within>) =>
  body
    .getAllByRole("link")
    .filter((link: HTMLElement) => link.closest("#sidebar-links") && link.checkVisibility())
    .map((link: HTMLElement) => link.textContent);

/** A family member sees the links everyone does: Google Calendar, and Support, an email link. */
export const CommunityLinks: Story = {
  args: {
    name: "Lee Halyard",
    pages: [staff[0]!],
    links: linksFor("Community", directus),
    children: (
      <main className="p-card">
        <h1 className="text-2xl font-semibold tracking-tight">Sail Team</h1>
      </main>
    ),
  },
  play: async (context) => {
    const body = await openLinks(context);
    await waitFor(() => expect(linkNames(body)).toEqual(["Google Calendar", "Support"]));
    const support = body.getAllByRole("link", { name: "Support" }).find((link) => link.checkVisibility());
    await expect(support).toHaveAttribute("href", "mailto:info@cyccommunitysailing.org");
  },
};

/** Crew also see the organization's Clubspot dashboard. */
export const CrewLinks: Story = {
  play: async (context) => {
    const body = await openLinks(context);
    await waitFor(() => expect(linkNames(body)).toEqual(["Clubspot dashboard", "Google Calendar", "Support"]));
  },
};

/** Staff also see Directus. */
export const StaffLinks: Story = {
  args: { links: linksFor("Staff", directus) },
  play: async (context) => {
    const body = await openLinks(context);
    await waitFor(() =>
      expect(linkNames(body)).toEqual(["Clubspot dashboard", "Directus", "Google Calendar", "Support"]),
    );
  },
};

/** Admins also see where to sign in as someone. */
export const AdminLinks: Story = {
  args: { links: linksFor("Admin", directus) },
  play: async (context) => {
    const body = await openLinks(context);
    await waitFor(() =>
      expect(linkNames(body)).toEqual([
        "Clubspot dashboard",
        "Directus",
        "Sign in as someone",
        "Google Calendar",
        "Support",
      ]),
    );
  },
};

/** A parent on a team, who can open Rosters but not Planning. */
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
    await expect(body.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  },
};

/** Sign out, from the person's menu. */
export const SignOut: Story = {
  play: async (context) => {
    await AccountMenuOpen.play!(context);
    const body = within(context.canvasElement.ownerDocument.body);
    await context.userEvent.click(body.getByRole("menuitem", { name: "Sign out" }));
    await expect(context.args.onSignOut).toHaveBeenCalledOnce();
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};
