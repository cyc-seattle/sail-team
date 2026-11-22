import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { withRouter } from "../../../.storybook/with-router";
import { crewRows, type CrewFilters, type CrewPerson } from "@/model/crew";
import { CrewList } from "./crew-list";
import { crew, day, memberNamed } from "./fixtures";

const quinn: CrewPerson = {
  id: "p-quinn",
  first_name: "Quinn",
  last_name: "Okafor",
  email: "quinn.okafor@example.org",
};

const meta = {
  component: CrewList,
  decorators: [withRouter("/crew", ["/crew", "/crew/$memberId"])],
  args: {
    rows: crewRows(crew, day),
    programs: crew.programs,
    areas: crew.areas,
    qualifications: crew.qualifications,
    filters: {},
    onFiltersChange: fn(),
    addMember: {
      find: fn(async () => [quinn, memberNamed("Alex").person]),
      onCrew: new Set(crew.members.map((m) => m.person.id)),
      add: fn(async () => "new-member"),
    },
  },
  // Filters live in the address in the app; here, in the story.
  render: function Render(args) {
    const [filters, setFilters] = useState<CrewFilters>(args.filters);
    return (
      <CrewList
        {...args}
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          args.onFiltersChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof CrewList>;
export default meta;
type Story = StoryObj<typeof meta>;

const names = () =>
  within(screen.getByRole("table", { name: "Crew members" }))
    .getAllByRole("row")
    .slice(1)
    .map((r) => r.querySelector("a")?.textContent);

/** Everyone with a current position, by name, with what they're missing or must renew soon. */
export const Current: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Morgan Park")).not.toBeInTheDocument();
    const priya = canvas.getByRole("row", { name: /Priya Patel/ });
    await expect(priya).toHaveTextContent("Parent Coordinator, Opti Race Team");
    await expect(priya).toHaveTextContent(/First Aid and CPR expires/);
    await expect(canvas.getByRole("row", { name: /Jordan Lee/ })).toHaveTextContent("Missing SafeSport");
    // US Sailing Level 2 meets the Level 1 a Sailing Instructor needs.
    await expect(canvas.getByRole("row", { name: /Riley Kim/ })).toHaveTextContent("Nothing missing");
  },
};

/** Past shows those whose positions have all ended, with the day the last one did. */
export const Past: Story = {
  args: { filters: { show: "past" } },
  play: async ({ canvas }) => {
    await expect(names()).toEqual(["Morgan Park"]);
    await expect(canvas.getByRole("row", { name: /Morgan Park/ })).toHaveTextContent(/Ended/);
  },
};

/** Only missing or expiring leaves out those who need nothing. */
export const OnlyMissingOrExpiring: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Show only missing or expiring" }));
    await expect(names()).toEqual(["Casey Nguyen", "Jordan Lee", "Priya Patel"]);
  },
};

/** In narrows to one program or program area. */
export const InAProgram: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "In" }));
    await userEvent.click(await screen.findByRole("option", { name: "J-Pod" }));
    await waitFor(() => expect(names()).toEqual(["Casey Nguyen"]));
    // The menu's focus guards linger until it's gone.
    await waitFor(() => expect(document.querySelector("[data-base-ui-focus-guard]")).toBeNull());
  },
};

/** Adding a crew member finds them in People by name or email. */
export const AddACrewMember: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add crew member" }));
    const dialog = await screen.findByRole("dialog", { name: "Add crew member" });
    await userEvent.type(screen.getByRole("searchbox", { name: "Find by name or email" }), "quinn");
    await expect(await screen.findByRole("radio", { name: /Alex Rivera/ })).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(screen.getByRole("radio", { name: /Quinn Okafor/ }));
    await userEvent.click(screen.getByRole("button", { name: "Add crew member" }));
    await waitFor(() => expect(args.addMember!.add).toHaveBeenCalledWith(quinn));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/** A Crew Reader gets no Add crew member. */
export const ReadOnly: Story = {
  args: { addMember: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button", { name: "Add crew member" })).not.toBeInTheDocument();
  },
};

/** On a phone, a card each. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "phone" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("article", { name: "Jordan Lee" })).toHaveTextContent("Missing SafeSport");
  },
};

export const Empty: Story = { args: { rows: [] } };
