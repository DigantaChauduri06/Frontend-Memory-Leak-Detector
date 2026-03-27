export type Severity = "HIGH" | "MEDIUM" | "LOW";

export type Framework = "angular" | "react";

export type Category =
  | "subscription"
  | "interval"
  | "event-listener"
  | "renderer-listen"
  | "form-subscription"
  | "effect-cleanup";

export interface Issue {
  file: string;
  line: number;
  message: string;
  severity: Severity;
  category: Category;
  snippet?: string[];
}

export interface ScanResult {
  framework: Framework;
  issues: Issue[];
}
