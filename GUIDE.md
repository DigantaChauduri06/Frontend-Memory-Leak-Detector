# Memory Leak Scanner — Comprehensive Guide

## What It Does

This tool scans **Angular** and **React** TypeScript projects for **memory leaks** — unmanaged subscriptions, uncleared timers, orphaned event listeners, missing useEffect cleanup, and more. It uses **ts-morph** to walk the AST (not string matching), so detection is accurate and structural.

The scanner **auto-detects the framework** from your project's `package.json` and applies the appropriate rule set.

For every issue found, the tool provides:

- The exact file and line number
- A severity rating (HIGH / MEDIUM / LOW)
- A category indicating the leak type
- A code snippet showing the surrounding context
- A ready-to-use **Cursor AI prompt** that fixes the issue automatically
- A **"Fix in Cursor"** button that opens Cursor IDE with the fix prompt pre-loaded

---

## Architecture

```
subscription-handler/
├── backend/                  # Express + ts-morph scanner API
│   ├── src/
│   │   ├── server.ts         # Express server (port 4000)
│   │   ├── scanner.ts        # Framework detection + rule runner
│   │   ├── types.ts          # Shared types (Issue, Severity, Category, Framework, ScanResult)
│   │   └── rules/
│   │       ├── rule.ts              # Rule interface
│   │       ├── helpers.ts           # Shared AST utilities (Angular + general)
│   │       ├── reactHelpers.ts      # React hook AST utilities
│   │       ├── subscriptionRule.ts  # Angular: RxJS subscription detection
│   │       ├── intervalRule.ts      # Angular: setInterval/setTimeout detection
│   │       ├── eventListenerRule.ts # Angular: addEventListener detection
│   │       ├── rendererListenRule.ts# Angular: Renderer2.listen() detection
│   │       ├── formSubscriptionRule.ts # Angular: valueChanges/statusChanges detection
│   │       ├── reactIntervalRule.ts       # React: timer in useEffect
│   │       ├── reactEventListenerRule.ts  # React: addEventListener in useEffect
│   │       ├── reactSubscriptionRule.ts   # React: subscribe in useEffect
│   │       ├── reactEffectCleanupRule.ts  # React: useEffect without cleanup
│   │       └── index.ts            # Exports rules grouped by framework
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + Vite + Tailwind UI
│   ├── src/
│   │   ├── App.tsx           # Main app shell with state management
│   │   ├── types.ts          # Frontend type definitions
│   │   ├── components/
│   │   │   ├── ScanForm.tsx         # Path input + scan button
│   │   │   ├── SummaryBar.tsx       # Severity + category count cards
│   │   │   ├── FilterBar.tsx        # Severity filter buttons
│   │   │   ├── CategoryFilter.tsx   # Category filter pills with counts
│   │   │   ├── SearchBar.tsx        # Text search input
│   │   │   ├── IssueList.tsx        # Groups issues by file
│   │   │   ├── FileGroup.tsx        # File heading + issue cards
│   │   │   ├── IssueItem.tsx        # Expandable issue card
│   │   │   ├── SeverityBadge.tsx    # Colored severity pill
│   │   │   ├── CodeSnippet.tsx      # Syntax-highlighted code block
│   │   │   ├── CursorFixBlock.tsx   # Copyable prompt + Fix in Cursor button
│   │   │   └── ThemeToggle.tsx      # Light/dark mode toggle
│   │   └── utils/
│   │       └── cursorPrompt.ts      # Framework-aware prompt generation + deep link builder
│   ├── tailwind.config.js
│   ├── index.html
│   └── package.json
├── README.md
└── GUIDE.md                  # This file
```

### Data Flow

```
User enters project path
        │
        ▼
  POST /scan { path }  ──►  Backend (Express, port 4000)
                                    │
                                    ▼
                             detectFramework()
                             reads package.json deps
                                    │
                         ┌──────────┴──────────┐
                         ▼                      ▼
                    Angular Rules          React Rules
                    ├── Subscription       ├── React Interval
                    ├── Interval           ├── React Event Listener
                    ├── Event Listener     ├── React Subscription
                    ├── Renderer Listen    └── React Effect Cleanup
                    └── Form Subscription
                         │                      │
                         └──────────┬──────────┘
                                    ▼
                         ScanResult { framework, issues[] }
        │
        ▼
  Frontend renders results
  - Framework badge (Angular / React)
  - Summary cards (severity + category breakdown)
  - Filterable by severity and category
  - Searchable issue list
  - Expandable cards with code + framework-specific Cursor fix prompts
```

---

## Framework Detection

The scanner reads the `package.json` in (or above) the scanned directory:

- **`@angular/core`** in dependencies --> Angular rules applied, scans `**/*.ts`
- **`react`** in dependencies --> React rules applied, scans `**/*.{ts,tsx,jsx}`
- **Neither found** --> error with a clear message

The detected framework is returned in the API response and displayed as a badge in the UI header.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd subscription-handler

cd backend
npm install

cd ../frontend
npm install
```

### Running

Open two terminal windows:

**Terminal 1 — Backend (port 4000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## How to Use

### 1. Scan a Project

Enter the **absolute path** to any Angular or React TypeScript project in the input field and click **Scan**. The scanner auto-detects the framework and applies the appropriate rules.

### 2. Review Results

After scanning, you'll see:

- **Framework badge** — shows "Angular" or "React" next to the title
- **Summary bar** — total issues, counts per severity level, and a breakdown by leak category
- **Issue list** — grouped by file, each issue showing line number, severity badge, and description

### 3. Filter and Search

- **Severity filter**: Click **High**, **Medium**, or **Low** buttons to filter by severity
- **Category filter**: Click category pills to filter by leak type. Only categories with detected issues are shown.
- **Search**: Type in the search box to filter by file name or message text

### 4. Expand an Issue

Click any issue card to expand it. You'll see:

- **Code snippet** — the offending line highlighted with 3 lines of context
- **Cursor Fix Prompt** — a detailed, framework-specific instruction block

### 5. Fix the Issue

**Option A — Copy and paste:** Click **Copy**, paste into Cursor chat, run it.

**Option B — One-click fix:** Click **Fix in Cursor** to open Cursor IDE with the prompt pre-loaded.

---

## Detection Rules — Angular

### 1. Subscription Rule (category: `subscription`)

| Severity | Trigger |
|----------|---------|
| HIGH | `.subscribe()` inside `@Component` class with no `takeUntil` or cleanup in `ngOnDestroy` |
| MEDIUM | `.subscribe()` in non-component files with no `takeUntil` in the pipe chain |
| LOW | `.subscribe()` with an empty or missing error handler |

### 2. Interval Rule (category: `interval`)

| Severity | Trigger |
|----------|---------|
| HIGH | `setInterval()` or `setTimeout()` in component without matching clear function in `ngOnDestroy` |

### 3. Event Listener Rule (category: `event-listener`)

| Severity | Trigger |
|----------|---------|
| HIGH | `.addEventListener()` in component without `removeEventListener` in `ngOnDestroy` |

### 4. Renderer Listen Rule (category: `renderer-listen`)

| Severity | Trigger |
|----------|---------|
| MEDIUM | `renderer.listen()` return value not stored, or stored but not called in `ngOnDestroy` |

### 5. Form Subscription Rule (category: `form-subscription`)

| Severity | Trigger |
|----------|---------|
| HIGH | Form observable subscription (`valueChanges`/`statusChanges`) in component without `takeUntil` |

---

## Detection Rules — React

### 1. React Interval Rule (category: `interval`)

| Severity | Trigger |
|----------|---------|
| HIGH | `setInterval()` or `setTimeout()` inside `useEffect` without matching clear function in cleanup return |

**Fix pattern:**
```tsx
useEffect(() => {
  const id = setInterval(() => { /* handler */ }, 1000);
  return () => clearInterval(id);
}, []);
```

### 2. React Event Listener Rule (category: `event-listener`)

| Severity | Trigger |
|----------|---------|
| HIGH | `addEventListener()` inside `useEffect` without `removeEventListener` in cleanup return |

**Fix pattern:**
```tsx
useEffect(() => {
  const handleResize = () => { /* handler */ };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 3. React Subscription Rule (category: `subscription`)

| Severity | Trigger |
|----------|---------|
| HIGH | `.subscribe()` inside `useEffect` without `.unsubscribe()` in cleanup return |

**Fix pattern:**
```tsx
useEffect(() => {
  const sub = myObservable$.subscribe(value => { /* handle */ });
  return () => sub.unsubscribe();
}, []);
```

### 4. React Effect Cleanup Rule (category: `effect-cleanup`)

| Severity | Trigger |
|----------|---------|
| MEDIUM | `useEffect` with side effects (fetch, WebSocket, Observer, etc.) but no cleanup return function |

**Fix pattern (fetch with AbortController):**
```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData);
  return () => controller.abort();
}, []);
```

---

## Cursor Integration

### How It Works

The tool generates **Cursor AI prompts** tailored to each specific issue's category and framework. Each prompt includes:

1. The exact absolute file path
2. The line number
3. A description of the problem
4. Step-by-step fix instructions specific to the framework and leak type
5. The surrounding code context

### Prompt Templates

| Category | Angular Prompt | React Prompt |
|----------|---------------|-------------|
| **subscription** | Add `destroy$` Subject, `takeUntil`, implement `OnDestroy` | Store subscription, return `unsubscribe()` from useEffect |
| **interval** | Store timer ID as class property, clear in `ngOnDestroy` | Store timer ID, return `clearInterval(id)` from useEffect |
| **event-listener** | Store handler reference, `removeEventListener` in `ngOnDestroy` | Define handler, return `removeEventListener` from useEffect |
| **renderer-listen** | Capture unlisten function, call in `ngOnDestroy` | (Angular only) |
| **form-subscription** | Apply `takeUntil` + `destroy$` pattern | (Angular only) |
| **effect-cleanup** | (React only) | Add cleanup return with AbortController / disconnect / close |

---

## UI Features

### Framework Detection Badge

After scanning, the header shows a colored badge indicating the detected framework:
- **Angular** — red badge
- **React** — blue badge

### Light / Dark Mode

Click the sun/moon icon in the top-right corner to toggle between light and dark themes.

### Severity Filter

Filter issues by HIGH, MEDIUM, or LOW severity.

### Category Filter

Filter by leak type. Pills only appear for categories with detected issues. Angular-only categories (Renderer, Forms) automatically hide when scanning React projects, and vice versa for Effect Cleanup.

### Summary Bar

- **Row 1**: Total issues, High, Medium, Low severity counts
- **Row 2**: Per-category counts (only shown when more than one category has issues)

---

## API Reference

### POST /scan

Scans a directory for memory leak issues.

**Request:**
```json
{
  "path": "/absolute/path/to/project"
}
```

**Response (200):**
```json
{
  "framework": "react",
  "issues": [
    {
      "file": "src/components/Dashboard.tsx",
      "line": 15,
      "message": "setInterval() in useEffect without clearInterval() in cleanup — timer will keep running after unmount",
      "severity": "HIGH",
      "category": "interval",
      "snippet": ["..."]
    }
  ]
}
```

**Error responses:**
- `400` — Missing or invalid path, or path does not exist
- `500` — Internal scanner error or framework detection failure

---

## Troubleshooting

### "Could not detect framework"

The scanner could not find `@angular/core` or `react` in `package.json` dependencies. Make sure the path points to a project root that contains a `package.json` with the framework listed as a dependency.

### "Failed to connect to scanner API"

The backend isn't running. Start it with `cd backend && npm run dev`.

### No issues found

- Make sure the path points to the **root** of the project (the directory containing `src/`)
- Angular projects: only `.ts` files are scanned
- React projects: `.ts`, `.tsx`, and `.jsx` files are scanned
- Issues with proper cleanup are correctly excluded

### "Fix in Cursor" button doesn't open anything

- Cursor IDE must be installed on your machine
- Your OS must have the `cursor://` protocol handler registered

### Scanner is slow on large projects

Point the scanner at a specific sub-project or `src/` directory rather than the workspace root.

---

## Rule-Based Architecture

The scanner uses a pluggable rule system. Each rule implements:

```typescript
interface Rule {
  name: string;
  framework: "angular" | "react";
  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[];
}
```

Rules are registered in `backend/src/rules/index.ts` and grouped by framework. The scanner detects the framework and only runs the matching rules.

To add a new rule:

1. Create a new file in `backend/src/rules/` implementing the `Rule` interface
2. Set the `framework` field to `"angular"` or `"react"`
3. Add a new category value to the `Category` type if needed
4. Register the rule in `backend/src/rules/index.ts`
5. Add a prompt template in `frontend/src/utils/cursorPrompt.ts`
6. The category filter UI automatically picks up new categories
