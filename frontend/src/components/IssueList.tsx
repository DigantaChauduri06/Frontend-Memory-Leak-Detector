import { useMemo } from "react";
import { Issue } from "../types";
import { FileGroup } from "./FileGroup";

interface IssueListProps {
  issues: Issue[];
  projectPath: string;
}

export function IssueList({ issues, projectPath }: IssueListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues) {
      const existing = map.get(issue.file);
      if (existing) {
        existing.push(issue);
      } else {
        map.set(issue.file, [issue]);
      }
    }
    return Array.from(map.entries());
  }, [issues]);

  return (
    <div className="space-y-6">
      {grouped.map(([file, fileIssues]) => (
        <FileGroup key={file} file={file} issues={fileIssues} projectPath={projectPath} />
      ))}
    </div>
  );
}
