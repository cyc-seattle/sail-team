import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import { numberedOfferings } from "@/model/reports";
import { summerOfferings } from "./fixtures";
import { OfferingName } from "./offering-name";

const guppies3 = numberedOfferings(summerOfferings)
  .flatMap((g) => g.offerings)
  .find((o) => o.label === "Guppies 3")!;

const meta = { component: OfferingName, args: { offering: guppies3 } } satisfies Meta<typeof OfferingName>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Its dates show on hover, or on a tap. */
export const WithDates: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Guppies 3" }));
    await waitFor(async () => expect(await screen.findByText("Jul 5, 2027 to Jul 9, 2027")).toBeVisible());
  },
};
