import { Issue, Category } from "../types";

interface SummaryBarProps {
  issues: Issue[];
}

const categoryLabels: { key: Category; label: string; color: string }[] = [
  { key: "subscription", label: "Subscriptions", color: "bg-purple-500" },
  { key: "interval", label: "Intervals", color: "bg-orange-500" },
  { key: "event-listener", label: "Event Listeners", color: "bg-teal-500" },
  { key: "renderer-listen", label: "Renderer", color: "bg-cyan-500" },
  { key: "form-subscription", label: "Forms", color: "bg-pink-500" },
  { key: "effect-cleanup", label: "Effect Cleanup", color: "bg-emerald-500" },
];

export function SummaryBar({ issues }: SummaryBarProps) {
  const total = issues.length;
  const high = issues.filter((i) => i.severity === "HIGH").length;
  const medium = issues.filter((i) => i.severity === "MEDIUM").length;
  const low = issues.filter((i) => i.severity === "LOW").length;

  const categoryCounts = categoryLabels
    .map((c) => ({
      ...c,
      count: issues.filter((i) => i.category === c.key).length,
    }))
    .filter((c) => c.count > 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Issues" count={total} color="bg-slate-600" />
        <SummaryCard label="High" count={high} color="bg-red-500" />
        <SummaryCard label="Medium" count={medium} color="bg-amber-500" />
        <SummaryCard label="Low" count={low} color="bg-blue-500" />
      </div>

      {categoryCounts.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {categoryCounts.map((c) => (
            <SummaryCard
              key={c.key}
              label={c.label}
              count={c.count}
              color={c.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
    </div>
  );
}
