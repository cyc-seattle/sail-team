import { parsePhoneNumberFromString } from "libphonenumber-js/min";

// Clubspot stores most phones as bare digits with no country code, and nearly all are American.
const parse = (stored: string) => parsePhoneNumberFromString(stored, "US");

/** A stored phone as people read it: (206) 555-0110 for an American one, +44 20 7946 0958 for any other, or as stored. */
export function formatPhone(stored: string): string {
  const phone = parse(stored);
  if (!phone?.isPossible()) {
    return stored;
  }
  return phone.country === "US" ? phone.formatNational() : phone.formatInternational();
}

/** A stored phone in E.164, +12065550110, which the phone field edits, or undefined if it isn't a phone number. */
export function toE164(stored: string | null): string | undefined {
  const phone = stored ? parse(stored) : undefined;
  return phone?.isPossible() ? phone.number : undefined;
}
