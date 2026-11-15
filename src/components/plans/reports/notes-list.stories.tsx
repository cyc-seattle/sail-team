import type { Meta, StoryObj } from "@storybook/react-vite";
import { summerNotes } from "./fixtures";
import { NotesList } from "./notes-list";

const meta = { component: NotesList, args: { notes: summerNotes, label: "Summer notes" } } satisfies Meta<
  typeof NotesList
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Notes: Story = {};

export const NoNotes: Story = { args: { notes: null } };
