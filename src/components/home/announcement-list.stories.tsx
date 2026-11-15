import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import type { Announcement } from "@/directus/announcements";
import { homeTables } from "@/mocks/home";
import { AnnouncementList } from "./announcement-list";

const announcements = homeTables["announcements"] as unknown as Announcement[];

const meta = {
  component: AnnouncementList,
  args: { announcements },
} satisfies Meta<typeof AnnouncementList>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Newest first, with a body in Markdown. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const titles = canvas.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    await expect(titles).toEqual(["The bottom line, at a glance", "Planning reports", "Team rosters"]);
    await expect(canvas.getByText("boat class").tagName).toBe("STRONG");
  },
};

/** A body's raw HTML is dropped, never drawn. */
export const RawHtml: Story = {
  args: {
    announcements: [
      {
        id: "1",
        title: "Dock work",
        body: 'The dock is closed Saturday.<img src="x" onerror="alert(1)">',
        published_on: "2026-11-14",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("img")).toBeNull();
  },
};

/** None posted yet. */
export const Empty: Story = { args: { announcements: [] } };
