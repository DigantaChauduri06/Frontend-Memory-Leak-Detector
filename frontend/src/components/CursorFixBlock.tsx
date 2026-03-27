import { useState, useMemo } from "react";
import { Issue } from "../types";
import {
  generateCursorPrompt,
  generateCursorDeepLink,
} from "../utils/cursorPrompt";

interface CursorFixBlockProps {
  issue: Issue;
  projectPath: string;
}

export function CursorFixBlock({ issue, projectPath }: CursorFixBlockProps) {
  const [copied, setCopied] = useState(false);

  const absolutePath = projectPath.replace(/\/+$/, "") + "/" + issue.file;
  const prompt = useMemo(
    () => generateCursorPrompt(issue, absolutePath),
    [issue, absolutePath]
  );
  const deepLink = useMemo(() => generateCursorDeepLink(prompt), [prompt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          Cursor Fix Prompt
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
                       bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300
                       border border-slate-300 dark:border-slate-600
                       hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <a
            href={deepLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
                       bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Fix in Cursor
          </a>
        </div>
      </div>
      <pre className="p-3 text-xs leading-relaxed whitespace-pre-wrap bg-slate-900 dark:bg-slate-950 text-slate-200 overflow-x-auto max-h-64 overflow-y-auto">
        {prompt}
      </pre>
    </div>
  );
}
