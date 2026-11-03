import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { VersionList } from "./version-list";

const meta = {
  component: VersionList,
  decorators: [withRouter("/plans/youth", ["/plans/$planId/$versionId"])],
  args: {
    planId: "youth",
    activeId: "v1",
    versions: [
      {
        id: "v1",
        plan_id: "youth",
        status: "saved",
        message: "First pass",
        saved_at: "2027-01-12T18:00:00Z",
        operations_version_id: null,
      },
      { id: "d", plan_id: "youth", status: "draft", message: null, saved_at: null, operations_version_id: null },
      {
        id: "v2",
        plan_id: "youth",
        status: "saved",
        message: "Added a second week of camp",
        saved_at: "2027-03-03T18:00:00Z",
        operations_version_id: null,
      },
    ],
  },
} satisfies Meta<typeof VersionList>;
export default meta;
type Story = StoryObj<typeof meta>;

// The scenario in features/plans.feature: the draft, then the newer saved version, then the older, active one.
export const NewestFirst: Story = {
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole("listitem");
    await expect(items[0]).toHaveTextContent("Draft");
    await expect(items[1]).toHaveTextContent("March 3, 2027");
    await expect(items[2]).toHaveTextContent("Active");
  },
};

export const NoVersions: Story = { args: { versions: [] } };
