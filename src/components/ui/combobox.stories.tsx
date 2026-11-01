import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox";

const boats = ["Opti", "Laser", "420", "FJ", "J/22"];

const meta = { component: Combobox } satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Combobox items={boats}>
      <ComboboxInput placeholder="Pick a boat class" aria-label="Boat class" />
      <ComboboxContent>
        <ComboboxEmpty>No boat class matches.</ComboboxEmpty>
        <ComboboxList>
          {(boat: string) => (
            <ComboboxItem key={boat} value={boat}>
              {boat}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByRole("combobox", { name: "Boat class" }), "la");
    const body = canvasElement.ownerDocument.body;
    await waitFor(async () => expect(await within(body).findByRole("option", { name: "Laser" })).toBeVisible());
  },
};
