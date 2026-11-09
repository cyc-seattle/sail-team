import PhoneInput, { getCountryCallingCode, type Country } from "react-phone-number-input";
import labels from "react-phone-number-input/locale/en";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

export interface PhoneFieldProps {
  id: string;
  /** The phone in E.164, +12065550110, or undefined for none. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  autoComplete?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/** A phone number with its country, formatted as it's typed. It starts in the US. */
export function PhoneField({ id, value, onChange, ...props }: PhoneFieldProps) {
  return (
    <PhoneInput
      id={id}
      value={value ?? ""}
      onChange={onChange}
      defaultCountry="US"
      initialValueFormat="national"
      labels={labels}
      addInternationalOption={false}
      countryOptionsOrder={["US", "..."]}
      countrySelectComponent={CountryPicker}
      inputComponent={Input}
      containerComponent={Row}
      numberInputProps={{ className: "min-h-tap" }}
      type="tel"
      {...props}
    />
  );
}

function Row(props: React.ComponentProps<"div">) {
  return <div {...props} className="flex gap-2" />;
}

interface CountryOption {
  value: Country;
  label: string;
}

const code = (country: Country) => `+${getCountryCallingCode(country)}`;

/** Matches a country by the start of its name or of a word in it, its two letters, or its calling code. */
function matches(option: CountryOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  const name = option.label.toLowerCase();
  return (
    name.startsWith(q) ||
    name.split(/[\s-]+/).some((word) => word.startsWith(q)) ||
    option.value.toLowerCase() === q ||
    code(option.value).startsWith(q.startsWith("+") ? q : `+${q}`)
  );
}

function CountryPicker({
  value,
  onChange,
  options,
  disabled,
}: {
  value?: Country;
  onChange: (value?: Country) => void;
  options: { value?: Country; label: string; divider?: boolean }[];
  disabled?: boolean;
}) {
  const countries = options.filter((o): o is CountryOption => !!o.value && !o.divider);
  const selected = countries.find((o) => o.value === value) ?? null;
  return (
    <Combobox
      items={countries}
      value={selected}
      onValueChange={(option: CountryOption | null) => option && onChange(option.value)}
      itemToStringLabel={(option: CountryOption) => option.label}
      filter={matches}
      disabled={disabled}
    >
      <ComboboxTrigger
        render={<Button variant="outline" className="min-h-tap shrink-0 tabular-nums" />}
        aria-label={selected ? `Country: ${selected.label}` : "Country"}
      >
        {value ? `${value} ${code(value)}` : "Country"}
      </ComboboxTrigger>
      <ComboboxContent className="w-72" aria-label="Country">
        <ComboboxInput showTrigger={false} placeholder="Search countries" aria-label="Search countries" />
        <ComboboxEmpty>No country matches.</ComboboxEmpty>
        <ComboboxList aria-label="Countries">
          {(option: CountryOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
              <span className="text-muted-foreground tabular-nums">{code(option.value)}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
