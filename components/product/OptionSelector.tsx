// Renders the configurable option groups for a product (finish, sides, turnaround, etc.)
// and emits the current selection upward via onChange.
//
// Display-only: this component does not calculate prices.
// Price calculation lives in lib/pricing.ts and is driven by the parent.
//
// OptionGroup is the UI-layer type; do not confuse with the DB-layer ProductOption
// from lib/db/schema, which is transformed into this shape in ProductConfigurator.

export interface OptionValue {
  label: string;
  value: string;
  priceModifier: number; // cents delta, can be 0
}

export interface OptionGroup {
  id: string;
  name: string; // group_name: "finish" | "sides" | "turnaround" | etc.
  values: OptionValue[];
  required: boolean;
}

interface OptionSelectorProps {
  options: OptionGroup[];
  selected: Record<string, string>; // groupName → selectedValue
  onChange: (groupName: string, value: string) => void;
}

function toLabel(groupName: string): string {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, " ");
}

export function OptionSelector({
  options,
  selected,
  onChange,
}: OptionSelectorProps) {
  return (
    <div className="space-y-4">
      {options.map((group) => (
        <div key={group.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {toLabel(group.name)}
          </label>
          <select
            value={selected[group.name] ?? ""}
            onChange={(e) => onChange(group.name, e.target.value)}
            required={group.required}
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="" disabled>
              Select {toLabel(group.name)}
            </option>
            {group.values.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
                {v.priceModifier !== 0
                  ? ` (+$${(v.priceModifier / 100).toFixed(2)}/unit)`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
