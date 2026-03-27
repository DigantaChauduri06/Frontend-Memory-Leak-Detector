import { useState, useMemo } from "react";
import axios from "axios";
import { Issue, Severity, Category, Framework, ScanResult } from "./types";
import { ScanForm } from "./components/ScanForm";
import { SummaryBar } from "./components/SummaryBar";
import { FilterBar } from "./components/FilterBar";
import { CategoryFilter } from "./components/CategoryFilter";
import { SearchBar } from "./components/SearchBar";
import { IssueList } from "./components/IssueList";
import { ThemeToggle } from "./components/ThemeToggle";

type SeverityFilter = Severity | "ALL";
type CategoryFilterValue = Category | "ALL";

function FrameworkBadge({ framework }: { framework: Framework }) {
  const config = {
    angular: { label: "Angular", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
    react: { label: "React", bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-700 dark:text-sky-300" },
  };
  const c = config[framework];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>("ALL");
  const [search, setSearch] = useState("");
  const [scanned, setScanned] = useState(false);
  const [projectPath, setProjectPath] = useState("");
  const [framework, setFramework] = useState<Framework | null>(null);

  const handleScan = async (path: string) => {
    setProjectPath(path);
    setLoading(true);
    setError(null);
    setIssues([]);
    setScanned(false);
    setFramework(null);
    setSeverityFilter("ALL");
    setCategoryFilter("ALL");
    setSearch("");

    try {
      const response = await axios.post<ScanResult>("http://localhost:4000/scan", {
        path,
      });
      setFramework(response.data.framework);
      setIssues(response.data.issues);
      setScanned(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.message || "Failed to connect to scanner API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = useMemo(() => {
    let result = issues;

    if (severityFilter !== "ALL") {
      result = result.filter((i) => i.severity === severityFilter);
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((i) => i.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.file.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q)
      );
    }

    return result;
  }, [issues, severityFilter, categoryFilter, search]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Memory Leak Scanner
              </h1>
              {framework && <FrameworkBadge framework={framework} />}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Detect memory leaks in Angular and React projects
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <ScanForm onScan={handleScan} loading={loading} />

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {scanned && !error && (
          <>
            <SummaryBar issues={issues} />

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-4">
                <FilterBar active={severityFilter} onChange={setSeverityFilter} />
                <SearchBar value={search} onChange={setSearch} />
              </div>
              <CategoryFilter
                active={categoryFilter}
                onChange={setCategoryFilter}
                issues={issues}
              />
            </div>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                {issues.length === 0
                  ? "No memory leak issues found — your code looks clean!"
                  : "No issues match the current filters."}
              </div>
            ) : (
              <IssueList issues={filteredIssues} projectPath={projectPath} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
