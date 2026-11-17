import type { Meta, StoryObj } from "@storybook/react-vite";
import { withRouter } from "../../../.storybook/with-router";
import { expect, fn, waitFor, within } from "storybook/test";
import { toolsFor } from "@/model/nav";
import { AppShell } from "./app-shell";

const directus = "https://directus.cycsail.team";

const staff = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Planning" },
  { to: "/roster", label: "Rosters" },
  { to: "/links", label: "Links" },
];
const links = staff[3]!;

const meta = {
  component: AppShell,
  decorators: [withRouter("/roster", ["/", "/plans", "/links"])],
  parameters: { layout: "fullscreen" },
  args: {
    name: "Robin Tiller",
    email: "robin.tiller@example.org",
    role: "Crew",
    pages: staff,
    tools: toolsFor("Crew", directus),
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

/** Opens the sidebar, after More on a phone. */
async function openSidebar({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story["play"]>>[0]) {
  const body = within(canvasElement.ownerDocument.body);
  // Hidden on a laptop, where the sidebar is always open.
  const more = canvas.queryByRole("button", { name: "More" });
  if (more) {
    await userEvent.click(more);
    await waitFor(async () => expect(await body.findByRole("dialog", { name: "Menu" })).toBeVisible());
  }
  return body;
}

/** Support, at the foot of the sidebar, emails the office. */
export const Support: Story = {
  play: async (context) => {
    const body = await openSidebar(context);
    const support = (await body.findAllByRole("link", { name: "Support" })).find((link) => link.checkVisibility());
    await expect(support).toHaveAttribute("href", "mailto:info@cyccommunitysailing.org");
  },
};

/** The tools in the account menu, which opens after More on a phone. */
async function openToolNames(context: Parameters<NonNullable<Story["play"]>>[0]) {
  const body = await openSidebar(context);
  await context.userEvent.click(await body.findByRole("button", { name: context.args.name }));
  await waitFor(async () => expect(await body.findByRole("menu")).toBeVisible());
  return body
    .getAllByRole("menuitem")
    .filter((item: HTMLElement) => item.tagName === "A")
    .map((item: HTMLElement) => item.textContent);
}

/** A family member gets no tools. */
export const CommunityTools: Story = {
  args: {
    name: "Lee Halyard",
    pages: [staff[0]!, links],
    tools: toolsFor("Community", directus),
    children: (
      <main className="p-card">
        <h1 className="text-2xl font-semibold tracking-tight">Sail Team</h1>
      </main>
    ),
  },
  play: async (context) => {
    await expect(await openToolNames(context)).toEqual([]);
  },
};

/** Crew get the organization's Clubspot dashboard. */
export const CrewTools: Story = {
  play: async (context) => {
    await expect(await openToolNames(context)).toEqual(["Clubspot dashboard"]);
  },
};

/** Admins also get Directus, and where to sign in as someone. */
export const AdminTools: Story = {
  args: { tools: toolsFor("Admin", directus) },
  play: async (context) => {
    await expect(await openToolNames(context)).toEqual(["Clubspot dashboard", "Directus", "Sign in as someone"]);
  },
};

/** A parent on a team, who can open Rosters but not Planning. */
export const TeamParent: Story = { args: { name: "Lee Halyard", pages: [staff[0]!, staff[2]!, links] } };

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
  play: async (context) => {
    const body = await openSidebar(context);
    await context.userEvent.click(await body.findByRole("button", { name: "Robin Tiller" }));
    await waitFor(async () => expect(await body.findByText("Signed in as Robin Tiller")).toBeVisible());
    await expect(body.getByText("robin.tiller@example.org")).toBeVisible();
    await expect(body.getByText("Role: Crew")).toBeVisible();
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
