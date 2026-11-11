// A made-up household, for stories. Never real club members.
import type { Household, Member, School } from "@/model/household";

const member = (fields: Partial<Member> & Pick<Member, "id" | "name">): Member => ({
  displayName: null,
  email: null,
  phone: null,
  schoolId: null,
  school: null,
  role: null,
  me: false,
  hasSchool: false,
  signUps: null,
  ...fields,
});

export const me = member({
  id: "me",
  name: "Robin Tiller",
  email: "robin@example.org",
  phone: "2065550110",
  role: "guardian",
  me: true,
  signUps: [],
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
  schoolId: "lakeside-middle",
  school: "Lakeside Middle School",
  role: "sailor",
  hasSchool: true,
  signUps: [
    { id: "j-pod", program: "J-Pod", startsOn: "2026-09-08", endsOn: "2026-11-20", waitlisted: false },
    {
      id: "winter-clinic",
      program: "Winter Race Clinic",
      startsOn: "2027-01-09",
      endsOn: "2027-02-27",
      waitlisted: true,
    },
    { id: "camp", program: "Summer Camp", startsOn: "2026-07-06", endsOn: "2026-07-17", waitlisted: false },
  ],
});

export const household: Household = {
  id: "household",
  shares: true,
  editable: true,
  members: [me, otherGuardian, sailor],
};

const school = (name: string): School => ({
  id: name
    .toLowerCase()
    .replace(/ school$/, "")
    .replaceAll(" ", "-"),
  name,
});

export const schools: School[] = [
  school("Ballard High School"),
  school("Eastlake High School"),
  school("Garfield High School"),
  school("Hamilton International Middle School"),
  school("Lakeside Middle School"),
  school("Lakeside Upper School"),
  school("Lincoln High School"),
  school("Roosevelt High School"),
  school("Whitman Middle School"),
];
