interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by file name or message..."
        className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   bg-white dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
      />
    </div>
  );
}
