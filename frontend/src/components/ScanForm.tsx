import { useState } from "react";
import axios from "axios";

interface ScanFormProps {
  onScan: (path: string) => void;
  loading: boolean;
}

export function ScanForm({ onScan, loading }: ScanFormProps) {
  const [path, setPath] = useState("");
  const [browsing, setBrowsing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      onScan(path.trim());
    }
  };

  const handleBrowse = async () => {
    setBrowsing(true);
    try {
      const res = await axios.get<{ path: string }>("http://localhost:4000/browse");
      if (res.status === 200 && res.data.path) {
        setPath(res.data.path);
      }
    } catch {
      // user cancelled the dialog or backend unavailable
    } finally {
      setBrowsing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="Enter absolute path or browse for folder..."
        className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   bg-white dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleBrowse}
        disabled={loading || browsing}
        title="Browse for folder"
        className="px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg
                   hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors bg-white dark:bg-slate-900"
      >
        {browsing ? (
          <svg className="animate-spin w-5 h-5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-slate-500 dark:text-slate-400"
          >
            <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
          </svg>
        )}
      </button>
      <button
        type="submit"
        disabled={loading || !path.trim()}
        className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg
                   hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center gap-2"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? "Scanning..." : "Scan"}
      </button>
    </form>
  );
}
