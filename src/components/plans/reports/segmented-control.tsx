import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * A two-way view switch whose chosen side is filled in, the way a phone's segmented control looks. The chosen side
 * can't be pressed off.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values: string[]) => {
        const next = values[0] as T | undefined;
        if (next) {
          onChange(next);
        }
      }}
      spacing={0}
      aria-label={label}
      className="rounded-lg bg-muted p-0.5"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="min-h-tap rounded-md! px-3 text-muted-foreground hover:bg-transparent aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm md:min-h-8"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
