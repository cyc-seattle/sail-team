// A made-up household, for stories. Never real club members.
import type { Household, Member } from "@/model/household";

const member = (fields: Partial<Member> & Pick<Member, "id" | "name">): Member => ({
  displayName: null,
  email: null,
  phone: null,
  school: null,
  role: null,
  me: false,
  hasSchool: false,
  ...fields,
});

export const me = member({
  id: "me",
  name: "Robin Tiller",
  email: "robin@example.org",
  phone: "2065550110",
  role: "guardian",
  me: true,
});

export const otherGuardian = member({
  id: "other guardian",
  name: "Sam Tiller",
  email: "sam@example.org",
  phone: "+1 206 555 0111",
  role: "guardian",
});

export const sailor = member({
  id: "sailor",
  name: "Addie Tiller",
  displayName: "Addie Tiller",
  school: "Lakeside Middle School",
  role: "sailor",
  hasSchool: true,
});

export const household: Household = {
  id: "household",
  shares: true,
  editable: true,
  members: [me, otherGuardian, sailor],
};

export const schools = [
  "Ballard High School",
  "Eastlake High School",
  "Garfield High School",
  "Hamilton International Middle School",
  "Lakeside Middle School",
  "Lakeside Upper School",
  "Lincoln High School",
  "Roosevelt High School",
  "Whitman Middle School",
];
