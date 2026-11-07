import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { offerings } from "./fixtures";
import { VersionInFinancialModelSection } from "./version-in-financial-model";

const meta = {
  component: VersionInFinancialModelSection,
  decorators: [withRouter("/plans/youth/v1", ["/plans/model/$setId"])],
  args: {
    held: {
      set: {
        id: "march",
        organization_id: "org",
        fiscal_year: 2027,
        name: "March",
        message: null,
        saved_at: "2027-03-10T18:00:00Z",
      },
      pnl: offerings.slice(0, 2).map(({ name, pnl }) => ({ ...pnl, subject_key: pnl.key, name })),
    },
  },
} satisfies Meta<typeof VersionInFinancialModelSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HeldByAFinancialModel: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "March" })).toHaveAttribute("href", "/plans/model/march");
    await expect(canvas.getByText(/can differ from the version's own/)).toBeVisible();
  },
};

export const NoOfferings: Story = { args: { held: { ...meta.args.held, pnl: [] } } };
