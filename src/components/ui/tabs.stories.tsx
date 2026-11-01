import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = { component: Tabs } satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

// Underline tabs for named sections. A two-way view switch is a Toggle Group instead.
export const Sections: Story = {
  render: () => (
    <Tabs defaultValue="offerings">
      <TabsList variant="line">
        <TabsTrigger value="offerings">Offerings</TabsTrigger>
        <TabsTrigger value="shared">Shared costs</TabsTrigger>
        <TabsTrigger value="warnings">Warnings</TabsTrigger>
      </TabsList>
      <TabsContent value="offerings">Each offering's P&amp;L.</TabsContent>
      <TabsContent value="shared">Costs no single offering carries.</TabsContent>
      <TabsContent value="warnings">Nothing to check.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Shared costs" }));
    await expect(canvas.getByText("Costs no single offering carries.")).toBeVisible();
  },
};
