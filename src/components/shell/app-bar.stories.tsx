import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, waitFor, within } from "storybook/test";
import { AppBar } from "./app-bar";

// The bar's links need a router. This one has a page for each, and starts on Plans.
const withRouter: Decorator = (Story) => {
  const root = createRootRoute({ component: () => <Outlet /> });
  const page = (path: string) => createRoute({ getParentRoute: () => root, path, component: () => <Story /> });
  const router = createRouter({
    routeTree: root.addChildren([page("/plans"), page("/roster")]),
    history: createMemoryHistory({ initialEntries: ["/plans"] }),
  });
  return <RouterProvider router={router} />;
};

const meta = {
  component: AppBar,
  decorators: [withRouter],
  parameters: { layout: "fullscreen" },
  args: {
    name: "Robin Tiller",
    nav: [
      { to: "/plans", label: "Plans" },
      { to: "/roster", label: "Roster" },
    ],
  },
} satisfies Meta<typeof AppBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Plans" })).toHaveAttribute("data-status", "active");
  },
};

export const NoSections: Story = { args: { nav: [] } };

export const UserMenuOpen: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Robin Tiller" }));
    const menu = within(canvasElement.ownerDocument.body);
    await waitFor(async () => expect(await menu.findByText("Signed in as Robin Tiller")).toBeVisible());
  },
};
