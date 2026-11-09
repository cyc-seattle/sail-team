import { useId, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { School } from "@/model/household";

/** A picked school, or none with the school typed in after choosing Other, which is blank for no school at all. */
export interface SchoolChoice {
  schoolId: string | null;
  school: string;
}

export interface SchoolFieldProps {
  /** The known schools, by name. */
  schools: School[];
  value: SchoolChoice;
  onChange: (value: SchoolChoice) => void;
}

interface Choice {
  /** A known school's id, or null for Other. */
  id: string | null;
  label: string;
}

const other: Choice = { id: null, label: "Other" };

/** Picks a sailor's school from the known ones, or types another in after choosing Other. */
export function SchoolField({ schools, value, onChange }: SchoolFieldProps) {
  const id = useId();
  const choices = [...schools.map((school): Choice => ({ id: school.id, label: school.name })), other];
  const [typing, setTyping] = useState(!value.schoolId && !!value.school.trim());
  const selected = typing ? other : (choices.find((c) => c.id && c.id === value.schoolId) ?? null);
  return (
    <div className="grid gap-1.5">
      <Label id={`${id}-label`} htmlFor={`${id}-school`}>
        School
      </Label>
      <Combobox
        items={choices}
        value={selected}
        onValueChange={(choice: Choice | null) => {
          setTyping(choice === other);
          onChange({ schoolId: choice?.id ?? null, school: "" });
        }}
        itemToStringLabel={(choice: Choice) => choice.label}
        isItemEqualToValue={(a: Choice, b: Choice) => a.id === b.id}
        // Other stays on the list whatever's typed, for a school that isn't on it.
        filter={(choice: Choice, query: string) =>
          choice === other || choice.label.toLowerCase().includes(query.trim().toLowerCase())
        }
      >
        <ComboboxInput
          id={`${id}-school`}
          placeholder="Search schools"
          triggerLabel="Show schools"
          // Named by reference too, since Base UI hides the label from screen readers while the list is open.
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-school-hint`}
          className="min-h-tap"
        />
        <ComboboxContent>
          <ComboboxEmpty>No school matches.</ComboboxEmpty>
          <ComboboxList>
            {(choice: Choice) => (
              <ComboboxItem key={choice.id ?? ""} value={choice}>
                {choice.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p id={`${id}-school-hint`} className="text-xs text-muted-foreground">
        The school they sail for, which may not be the school they attend.
      </p>
      {typing && (
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-other`}>School name</Label>
          <Input
            id={`${id}-other`}
            value={value.school}
            onChange={(e) => onChange({ schoolId: null, school: e.target.value })}
            className="min-h-tap"
          />
        </div>
      )}
    </div>
  );
}
