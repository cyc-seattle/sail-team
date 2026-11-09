import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { otherGuardian, me, sailor, schools } from "./fixtures";
import { MemberCard } from "./member-card";

const meta = {
  component: MemberCard,
  args: { member: me, schools, onSave: fn(async () => {}) },
  // As wide as a card in the page's two columns.
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Me: Story = {};

export const OtherGuardian: Story = { args: { member: otherGuardian } };

export const Sailor: Story = { args: { member: sailor } };

export const EditingSailor: Story = {
  args: { member: sailor },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    await expect(canvas.getByRole("combobox", { name: "School" })).toHaveValue("Lakeside Middle School");
    await expect(canvas.getByText("The school they sail for, which may not be the school they attend.")).toBeVisible();
  },
};

/** The school list, filtered by what's typed, with Other always at the end. */
export const PickingSchool: Story = {
  // Base UI hides the rest of the page from screen readers while a typeable list is open, as the ARIA combobox pattern
  // does, which axe reads as hiding the form's other fields while they can still take focus.
  parameters: { a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } } },
  args: { member: sailor },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    const school = canvas.getByRole("combobox", { name: "School" });
    await userEvent.clear(school);
    await userEvent.type(school, "high");
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("option", { name: "Other" })).toBeVisible());
    await expect(body.getByRole("option", { name: "Eastlake High School" })).toBeVisible();
    await expect(body.queryByRole("option", { name: "Lakeside Middle School" })).toBeNull();
  },
};

export const SavingSailor: Story = {
  args: { member: sailor },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    const school = canvas.getByRole("combobox", { name: "School" });
    await userEvent.clear(school);
    await userEvent.type(school, "eastlake");
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "Eastlake High School" }));
    await userEvent.type(canvas.getByLabelText("Phone"), "2065550142");
    await expect(canvas.getByLabelText("Phone")).toHaveValue("(206) 555-0142");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onSave).toHaveBeenCalledWith({
      display_name: "Addie Tiller",
      phone: "+12065550142",
      school: "Eastlake High School",
    });
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved.");
  },
};

/** A school that isn't on the list is typed in after choosing Other. */
export const OtherSchool: Story = {
  args: { member: sailor },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    await userEvent.click(canvas.getByRole("combobox", { name: "School" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "Other" }));
    await userEvent.type(canvas.getByLabelText("School name"), "Salish Sea Academy");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.onSave).toHaveBeenCalledWith({ display_name: "Addie Tiller", school: "Salish Sea Academy" });
  },
};

/** A school stored that isn't on the list opens as Other, with its name filled in. */
export const EditingUnlistedSchool: Story = {
  args: { member: { ...sailor, school: "Hamilton (going to Lincoln)" } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Addie Tiller" }));
    await expect(canvas.getByRole("combobox", { name: "School" })).toHaveValue("Other");
    await expect(canvas.getByLabelText("School name")).toHaveValue("Hamilton (going to Lincoln)");
  },
};

/** Anyone in the household changes anyone's phone, another guardian's included. */
export const EditingOtherGuardian: Story = {
  args: { member: otherGuardian },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Sam Tiller" }));
    await expect(canvas.getByText("sam@example.org")).toBeVisible();
    await expect(canvas.getByLabelText("Phone")).toHaveValue("(206) 555-0111");
    await expect(canvas.queryByRole("combobox", { name: "School" })).toBeNull();
  },
};

/** The country picker, searched by name or calling code. */
export const PickingCountry: Story = {
  // Base UI hides the rest of the page from screen readers while a typeable list is open, as the ARIA combobox pattern
  // does, which axe reads as hiding the form's other fields while they can still take focus.
  parameters: { a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } } },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Robin Tiller" }));
    await userEvent.click(canvas.getByRole("combobox", { name: "Country: United States" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(await body.findByRole("combobox", { name: "Search countries" }), "+44");
    await userEvent.click(await body.findByRole("option", { name: /United Kingdom/ }));
    await expect(canvas.getByRole("combobox", { name: "Country: United Kingdom" })).toBeVisible();
  },
};

export const DidNotSave: Story = {
  args: { onSave: fn(() => Promise.reject(new Error("forbidden"))) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit Robin Tiller" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("That didn't save. Try again.");
    await expect(canvas.getByLabelText("Phone")).toBeVisible();
  },
};
