import { Checkbox } from "@/components/ui/checkbox";

/**
 * A yes-or-no value, such as whether a crew member is on the website, as a checkbox to read, not change. Every boolean
 * in a table or page shows this way, never as Yes, No, On, or Off. `label` names it for a screen reader, which reads
 * whether it's checked.
 */
export function BooleanCheck({ checked, label }: { checked: boolean; label: string }) {
  return <Checkbox checked={checked} readOnly aria-label={label} />;
}
