import { Issue } from "../types";

function formatSnippet(snippet?: string[]): string {
  if (!snippet || snippet.length === 0) return "";
  return "\n\nHere is the current code around that line:\n```\n" + snippet.join("\n") + "\n```";
}

function isReactIssue(issue: Issue): boolean {
  return issue.message.includes("useEffect") || issue.message.includes("unmount");
}

// --- Angular prompts ---

function angularSubscriptionPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  if (issue.severity === "HIGH") {
    return `In the file \`${absolutePath}\`, at line ${issue.line}, there is an unmanaged .subscribe() call inside an Angular @Component class with no takeUntil or unsubscribe in ngOnDestroy. This causes memory leaks.

Fix this by:
1. Add \`private destroy$ = new Subject<void>();\` to the class (if not already present)
2. Import \`takeUntil\` from 'rxjs/operators' and \`Subject\` from 'rxjs' if missing
3. Insert \`.pipe(takeUntil(this.destroy$))\` before the .subscribe() at line ${issue.line}
4. Add or update ngOnDestroy() to call this.destroy$.next() and this.destroy$.complete()
5. Ensure the class implements OnDestroy${snippetBlock}`;
  }

  if (issue.severity === "MEDIUM") {
    return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a .subscribe() call without a takeUntil operator, which may cause memory leaks.

Fix this by adding a destroy mechanism:
1. Create a Subject for teardown if one doesn't exist in this scope
2. Add .pipe(takeUntil(destroy$)) before the .subscribe() at line ${issue.line}
3. Ensure the Subject is completed when the enclosing scope is torn down${snippetBlock}`;
  }

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a .subscribe() call with an empty or missing error handler. Unhandled observable errors will silently kill the stream.

Fix this by refactoring to observer object syntax with an error callback:
.subscribe({
  next: (value) => { /* existing handler */ },
  error: (err) => { console.error('Observable error:', err); }
});${snippetBlock}`;
}

function angularIntervalPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);
  const isInterval = issue.message.includes("setInterval");
  const timerFn = isInterval ? "setInterval" : "setTimeout";
  const clearFn = isInterval ? "clearInterval" : "clearTimeout";

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a ${timerFn}() call inside an Angular component without a matching ${clearFn}() in ngOnDestroy. The timer will keep firing after the component is destroyed.

Fix this by:
1. Store the return value of ${timerFn}() in a class property (e.g. \`private timerId: ReturnType<typeof ${timerFn}> | null = null;\`)
2. Assign the result: \`this.timerId = ${timerFn}(...);\` at line ${issue.line}
3. Add or update ngOnDestroy() to call \`if (this.timerId) { ${clearFn}(this.timerId); }\`
4. Ensure the class implements OnDestroy${snippetBlock}`;
}

function angularEventListenerPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is an addEventListener() call inside an Angular component without a matching removeEventListener() in ngOnDestroy. The listener will persist after the component is destroyed.

Fix this by:
1. Store the handler function as a class property so the same reference can be used for removal
2. In ngOnDestroy(), call removeEventListener() with the same event name and handler reference
3. Ensure the class implements OnDestroy

Example pattern:
private onResize = () => { /* handler */ };

ngOnInit() {
  window.addEventListener('resize', this.onResize);
}

ngOnDestroy() {
  window.removeEventListener('resize', this.onResize);
}${snippetBlock}`;
}

function rendererListenPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a Renderer2.listen() call whose unlisten function is either not captured or not called in ngOnDestroy. The event listener will leak.

Fix this by:
1. Capture the return value: \`this.unlisten = this.renderer.listen(...);\`
2. Add a class property: \`private unlisten: (() => void) | null = null;\`
3. In ngOnDestroy(), call it: \`if (this.unlisten) { this.unlisten(); }\`
4. Ensure the class implements OnDestroy${snippetBlock}`;
}

function formSubscriptionPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a form observable subscription (valueChanges/statusChanges) inside an Angular component without proper cleanup. This will cause memory leaks.

Fix this by:
1. Add \`private destroy$ = new Subject<void>();\` to the class (if not already present)
2. Import \`takeUntil\` from 'rxjs/operators' and \`Subject\` from 'rxjs' if missing
3. Insert \`.pipe(takeUntil(this.destroy$))\` before the .subscribe() at line ${issue.line}
4. Add or update ngOnDestroy() to call this.destroy$.next() and this.destroy$.complete()
5. Ensure the class implements OnDestroy${snippetBlock}`;
}

// --- React prompts ---

function reactSubscriptionPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a .subscribe() call inside a useEffect hook without .unsubscribe() in the cleanup return. The subscription will leak after the component unmounts.

Fix this by:
1. Store the subscription: \`const sub = observable$.subscribe(...);\`
2. Return a cleanup function from useEffect: \`return () => sub.unsubscribe();\`

Example pattern:
useEffect(() => {
  const sub = myObservable$.subscribe(value => { /* handle */ });
  return () => sub.unsubscribe();
}, []);${snippetBlock}`;
}

function reactIntervalPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);
  const isInterval = issue.message.includes("setInterval");
  const timerFn = isInterval ? "setInterval" : "setTimeout";
  const clearFn = isInterval ? "clearInterval" : "clearTimeout";

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a ${timerFn}() call inside a useEffect hook without ${clearFn}() in the cleanup return. The timer will keep running after the component unmounts.

Fix this by:
1. Store the timer ID: \`const id = ${timerFn}(...);\`
2. Return a cleanup function: \`return () => ${clearFn}(id);\`

Example pattern:
useEffect(() => {
  const id = ${timerFn}(() => { /* handler */ }, 1000);
  return () => ${clearFn}(id);
}, []);${snippetBlock}`;
}

function reactEventListenerPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is an addEventListener() call inside a useEffect hook without removeEventListener() in the cleanup return. The listener will persist after the component unmounts.

Fix this by:
1. Define the handler as a named function or variable inside the effect
2. Return a cleanup function that calls removeEventListener with the same arguments

Example pattern:
useEffect(() => {
  const handleResize = () => { /* handler */ };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);${snippetBlock}`;
}

function reactEffectCleanupPrompt(issue: Issue, absolutePath: string): string {
  const snippetBlock = formatSnippet(issue.snippet);

  return `In the file \`${absolutePath}\`, at line ${issue.line}, there is a useEffect hook that performs side effects (e.g. fetch, WebSocket, observer) but has no cleanup return function. Resources created in the effect will not be released when the component unmounts.

Fix this by adding a cleanup return function to the useEffect. The exact cleanup depends on the side effect:

- For fetch: use an AbortController
  \`const controller = new AbortController();\`
  \`fetch(url, { signal: controller.signal });\`
  \`return () => controller.abort();\`

- For WebSocket: close the connection
  \`return () => ws.close();\`

- For observers (Intersection/Mutation/Resize): disconnect
  \`return () => observer.disconnect();\`

Review the effect body and add the appropriate cleanup.${snippetBlock}`;
}

// --- Main dispatcher ---

export function generateCursorPrompt(
  issue: Issue,
  absolutePath: string
): string {
  const react = isReactIssue(issue);

  switch (issue.category) {
    case "interval":
      return react
        ? reactIntervalPrompt(issue, absolutePath)
        : angularIntervalPrompt(issue, absolutePath);
    case "event-listener":
      return react
        ? reactEventListenerPrompt(issue, absolutePath)
        : angularEventListenerPrompt(issue, absolutePath);
    case "subscription":
      return react
        ? reactSubscriptionPrompt(issue, absolutePath)
        : angularSubscriptionPrompt(issue, absolutePath);
    case "renderer-listen":
      return rendererListenPrompt(issue, absolutePath);
    case "form-subscription":
      return formSubscriptionPrompt(issue, absolutePath);
    case "effect-cleanup":
      return reactEffectCleanupPrompt(issue, absolutePath);
    default:
      return react
        ? reactSubscriptionPrompt(issue, absolutePath)
        : angularSubscriptionPrompt(issue, absolutePath);
  }
}

const DEEPLINK_BASE = "cursor://anysphere.cursor-deeplink/prompt";
const MAX_URL_LENGTH = 8000;

export function generateCursorDeepLink(prompt: string): string {
  const url = new URL(DEEPLINK_BASE);
  url.searchParams.set("text", prompt);

  const result = url.toString();
  if (result.length > MAX_URL_LENGTH) {
    const truncated = prompt.slice(
      0,
      prompt.length - (result.length - MAX_URL_LENGTH) - 50
    ) + "\n\n(prompt truncated due to URL length limit)";
    const fallbackUrl = new URL(DEEPLINK_BASE);
    fallbackUrl.searchParams.set("text", truncated);
    return fallbackUrl.toString();
  }

  return result;
}
