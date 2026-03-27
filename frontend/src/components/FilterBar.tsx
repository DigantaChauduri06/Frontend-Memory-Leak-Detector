import { Severity } from "../types";

type Filter = Severity | "ALL";

interface FilterBarProps {
  active: Filter;
  onChange: (filter: Filter) => void;
}

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
            ${
              active === value
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
