import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./page-header";
import { VersionBadge } from "./version-badge";

const withRouter: Decorator = (Story) => {
  const root = createRootRoute({ component: () => <Outlet /> });
  const page = (path: string) => createRoute({ getParentRoute: () => root, path, component: () => <Story /> });
  const router = createRouter({
    routeTree: root.addChildren([page("/plans"), page("/plans/youth-racing")]),
    history: createMemoryHistory({ initialEntries: ["/plans/youth-racing"] }),
  });
  return <RouterProvider router={router} />;
};

const meta = {
  component: PageHeader,
  decorators: [withRouter],
  args: { title: "Youth Racing, 2027" },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const Full: Story = {
  args: {
    back: { to: "/plans", label: "All plans" },
    description: (
      <span className="inline-flex items-center gap-2">
        <VersionBadge state="active" /> Saved on March 3 by a planner
      </span>
    ),
    actions: <Button variant="outline">Compare with the draft</Button>,
  },
};
