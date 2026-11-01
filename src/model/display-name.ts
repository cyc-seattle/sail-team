/** A person's name as the app shows it: first and last, or their email when Directus has no name. */
export function displayName(person: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}): string {
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
  return name || person.email || "You";
}
