import { Category, Issue } from "../types";

type CategoryFilterValue = Category | "ALL";

interface CategoryFilterProps {
  active: CategoryFilterValue;
  onChange: (filter: CategoryFilterValue) => void;
  issues: Issue[];
}

const categories: { value: CategoryFilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "subscription", label: "Subscriptions" },
  { value: "interval", label: "Intervals" },
  { value: "event-listener", label: "Event Listeners" },
  { value: "renderer-listen", label: "Renderer" },
  { value: "form-subscription", label: "Forms" },
  { value: "effect-cleanup", label: "Effect Cleanup" },
];

export function CategoryFilter({
  active,
  onChange,
  issues,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(({ value, label }) => {
        const count =
          value === "ALL"
            ? issues.length
            : issues.filter((i) => i.category === value).length;

        if (value !== "ALL" && count === 0) return null;

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${
                active === value
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
          >
            {label}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                active === value
                  ? "bg-violet-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
