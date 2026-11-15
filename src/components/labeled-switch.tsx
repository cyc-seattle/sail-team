import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** A switch with its label beside it, such as Show drafts above a list, tall enough to tap on a phone. */
export function LabeledSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  const id = useId();
  return (
    <span className="flex min-h-tap items-center gap-2 md:min-h-8">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </span>
  );
}
