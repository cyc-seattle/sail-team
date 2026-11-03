import type { Decorator } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

/**
 * Renders a story inside a router, for components with links. Every path the story's links go to renders the story,
 * and it starts on `start`.
 */
export function withRouter(start: string, paths: string[]): Decorator {
  return (Story) => {
    const root = createRootRoute({ component: () => <Outlet /> });
    const page = (path: string) => createRoute({ getParentRoute: () => root, path, component: () => <Story /> });
    const router = createRouter({
      routeTree: root.addChildren([...new Set([start, ...paths])].map(page)),
      history: createMemoryHistory({ initialEntries: [start] }),
    });
    return <RouterProvider router={router} />;
  };
}
