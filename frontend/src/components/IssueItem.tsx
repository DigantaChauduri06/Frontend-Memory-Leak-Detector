import { useState } from "react";
import { Issue } from "../types";
import { SeverityBadge } from "./SeverityBadge";
import { CodeSnippet } from "./CodeSnippet";
import { CursorFixBlock } from "./CursorFixBlock";

interface IssueItemProps {
  issue: Issue;
  projectPath: string;
}

const borderColor: Record<string, string> = {
  HIGH: "border-l-red-500",
  MEDIUM: "border-l-amber-500",
  LOW: "border-l-blue-500",
};

export function IssueItem({ issue, projectPath }: IssueItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 ${
        borderColor[issue.severity]
      } rounded-lg shadow-sm hover:shadow-md dark:shadow-slate-950/50 transition-shadow`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <svg
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-14 shrink-0">
          L{issue.line}
        </span>
        <SeverityBadge severity={issue.severity} />
        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
          {issue.message}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {issue.snippet && issue.snippet.length > 0 && (
            <CodeSnippet lines={issue.snippet} />
          )}
          <CursorFixBlock issue={issue} projectPath={projectPath} />
        </div>
      )}
    </div>
  );
}
