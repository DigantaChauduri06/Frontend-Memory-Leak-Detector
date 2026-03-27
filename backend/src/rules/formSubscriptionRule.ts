import {
  SourceFile,
  SyntaxKind,
  PropertyAccessExpression,
  CallExpression,
} from "ts-morph";
import { Issue } from "../types";
import { Rule } from "./rule";
import {
  isAngularComponent,
  hasTakeUntilInPipe,
  ngOnDestroyContains,
  extractSnippet,
} from "./helpers";

const FORM_OBSERVABLES = ["valueChanges", "statusChanges"];

export class FormSubscriptionRule implements Rule {
  name = "form-subscription";
  framework = "angular" as const;

  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[] {
    const issues: Issue[] = [];

    const subscribeCalls = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => {
        const expr = call.getExpression();
        if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
        return (expr as PropertyAccessExpression).getName() === "subscribe";
      });

    for (const call of subscribeCalls) {
      if (!this.isFormObservableSubscription(call)) continue;

      const containingClass = call.getFirstAncestorByKind(
        SyntaxKind.ClassDeclaration
      );
      if (!containingClass || !isAngularComponent(containingClass)) continue;

      if (
        !hasTakeUntilInPipe(call) &&
        !ngOnDestroyContains(containingClass, "unsubscribe") &&
        !ngOnDestroyContains(containingClass, ".next()") &&
        !ngOnDestroyContains(containingClass, ".complete()")
      ) {
        const formProp = this.getFormObservableName(call);
        issues.push({
          file: filePath,
          line: call.getStartLineNumber(),
          message: `Unmanaged ${formProp} subscription in component — missing takeUntil or cleanup in ngOnDestroy`,
          severity: "HIGH",
          category: "form-subscription",
          snippet: extractSnippet(lines, call.getStartLineNumber()),
        });
      }
    }

    return issues;
  }

  private isFormObservableSubscription(subscribeCall: CallExpression): boolean {
    const fullText = subscribeCall.getFullText();
    return FORM_OBSERVABLES.some((obs) => fullText.includes(`.${obs}`));
  }

  private getFormObservableName(subscribeCall: CallExpression): string {
    const fullText = subscribeCall.getFullText();
    for (const obs of FORM_OBSERVABLES) {
      if (fullText.includes(`.${obs}`)) return obs;
    }
    return "form observable";
  }
}
