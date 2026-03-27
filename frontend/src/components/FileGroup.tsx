import { Issue } from "../types";
import { IssueItem } from "./IssueItem";

interface FileGroupProps {
  file: string;
  issues: Issue[];
  projectPath: string;
}

export function FileGroup({ file, issues, projectPath }: FileGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">
          {file}
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          ({issues.length} issue{issues.length !== 1 ? "s" : ""})
        </span>
      </div>
      <div className="space-y-2 ml-6">
        {issues.map((issue, idx) => (
          <IssueItem key={`${issue.line}-${idx}`} issue={issue} projectPath={projectPath} />
        ))}
      </div>
    </div>
  );
}
