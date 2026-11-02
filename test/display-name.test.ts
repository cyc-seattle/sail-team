import { describe, expect, it } from "vitest";
import { displayName } from "../src/model/display-name.ts";

describe("displayName", () => {
  it.each([
    [{ first_name: "Robin", last_name: "Tiller", email: "robin@example.org" }, "Robin Tiller"],
    [{ first_name: "Robin", last_name: null, email: "robin@example.org" }, "Robin"],
    [{ first_name: null, last_name: null, email: "robin@example.org" }, "robin@example.org"],
    [{ first_name: "", last_name: " ", email: null }, "You"],
  ])("names %j %s", (person, name) => {
    expect(displayName(person)).toBe(name);
  });
});
