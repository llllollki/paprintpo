// Renders the configurable options for a product (size, finish, material, etc.)
// and emits the current selection upward.
// Pricing display is driven by the parent via lib/pricing.ts — this component
// is display-only and does not calculate prices itself.

export interface OptionValue {
  label: string;
  value: string;
  priceModifier: number; // cents delta, can be 0
}

export interface ProductOption {
  id: string;
  name: string; // "size" | "finish" | "material" | "sides" | "turnaround"
  values: OptionValue[];
  required: boolean;
}

interface OptionSelectorProps {
  options: ProductOption[];
  selected: Record<string, string>; // optionName → selectedValue
  onChange: (optionName: string, value: string) => void;
}

export function OptionSelector({
  options,
  selected,
  onChange,
}: OptionSelectorProps) {
  return (
    <div>
      {options.map((option) => (
        <div key={option.id}>
          <label>{option.name}</label>
          <select
            value={selected[option.name] ?? ""}
            onChange={(e) => onChange(option.name, e.target.value)}
            required={option.required}
          >
            <option value="">Select {option.name}</option>
            {option.values.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
