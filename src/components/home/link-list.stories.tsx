import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { externalLinks } from "@/model/nav";
import { LinkList } from "./link-list";

const meta = {
  component: LinkList,
  decorators: [withRouter("/", ["/plans", "/roster"])],
  args: {
    links: [{ to: "/plans", label: "Planning" }, { to: "/roster", label: "Rosters" }, ...externalLinks],
  },
} satisfies Meta<typeof LinkList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Planning" })).toHaveAttribute("href", "/plans");
    await expect(canvas.getByRole("link", { name: "Clubspot" })).toHaveAttribute("href", "https://theclubspot.com");
  },
};

/** Someone who can't open any of this app's sections still sees the other sites. */
export const OnlyOtherSites: Story = { args: { links: externalLinks } };
