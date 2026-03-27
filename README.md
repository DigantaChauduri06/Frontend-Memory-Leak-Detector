# Frontend Memory Leak Detector

A full-stack **Memory Leak Scanner** for **Angular** and **React** projects. It statically analyzes TypeScript (and TSX/JSX for React) with [ts-morph](https://ts-morph.com/), reports likely leak patterns by file and line, and serves a small web UI to browse, filter, and copy **Cursor**-ready fix prompts.

## What it scans

Framework is inferred from the target project’s `package.json` (`@angular/core` → Angular, `react` → React). If neither is present, the API returns an error.

**Angular** (`.ts` under the project root):

- RxJS `.subscribe()` usage without a clear teardown strategy (`takeUntil`, `AsyncPipe`, etc.)
- `setInterval` / timers without cleanup
- DOM `addEventListener` without matching `removeEventListener`
- `Renderer2.listen` without unsubscribe
- Reactive form value/status subscriptions without teardown

**React** (`.ts`, `.tsx`, `.jsx`):

- Intervals without cleanup on unmount
- DOM event listeners attached without removal
- RxJS-style subscriptions in components without teardown
- `useEffect` patterns that suggest missing or incomplete cleanup

Each finding includes **severity** (HIGH / MEDIUM / LOW), **category**, optional **code snippet** context, and a generated **Cursor Fix Prompt** (copy or open via Cursor deep link).

## Web UI

- Enter an **absolute path** to the project root (must contain `package.json`), or use **Browse** — the backend opens a native folder picker on macOS, Linux (zenity), or Windows.
- **Scan** runs all rules for the detected framework.
- **Summary** counts by severity; **filters** by severity, category, and text search.
- **Dark / light** theme toggle.
- Expand issues to see snippets and Cursor prompts.

## Quick start

### Backend (port 4000)

```bash
cd backend && npm install && npm run dev
```

### Frontend (port 5173)

```bash
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The UI expects the API at `http://localhost:4000`.

## API

| Method | Path     | Description |
|--------|----------|-------------|
| `POST` | `/scan`  | Body: `{ "path": "/absolute/path/to/project" }` → `{ framework, issues[] }` |
| `GET`  | `/browse`| Opens OS folder dialog; returns `{ path }` or `204` if cancelled / unsupported |

## Stack

- **Backend:** Express, TypeScript, ts-morph, CORS  
- **Frontend:** React 18, Vite, Tailwind CSS, axios  

Static analysis only — it does not execute your app. Treat results as hints; some patterns may be false positives depending on your architecture.
