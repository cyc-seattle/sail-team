import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import type { SiteLink } from "@/directus/links";
import { homeTables } from "@/mocks/home";
import { LinkList } from "./link-list";

const links = homeTables["links"] as unknown as SiteLink[];

const meta = {
  component: LinkList,
  args: { links },
} satisfies Meta<typeof LinkList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each site with its preview, or without one, and its note or the site's own description. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /CSC website \(draft\)/ })).toHaveAttribute(
      "href",
      "https://csc-website.web.app",
    );
    await expect(canvas.getByText("Plan your days, and see what's coming up.")).toBeVisible();
  },
};

/** A Link Writer hasn't added any yet. */
export const Empty: Story = { args: { links: [] } };
