import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** A labelled input in a form, with any hint or error under it. `children` gets the id the label points at. */
export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: (id: string) => ReactNode;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint}
    </div>
  );
}
