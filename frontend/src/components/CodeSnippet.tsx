interface CodeSnippetProps {
  lines: string[];
}

export function CodeSnippet({ lines }: CodeSnippetProps) {
  return (
    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-200 text-xs leading-5 rounded-md p-3 overflow-x-auto border border-transparent dark:border-slate-800">
      {lines.map((line, i) => {
        const isHighlighted = line.startsWith(">");
        return (
          <div
            key={i}
            className={isHighlighted ? "bg-red-900/40 -mx-3 px-3" : ""}
          >
            {line}
          </div>
        );
      })}
    </pre>
  );
}
