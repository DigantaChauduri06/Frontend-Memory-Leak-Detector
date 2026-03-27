import { Rule } from "./rule";
import { Framework } from "../types";
import { SubscriptionRule } from "./subscriptionRule";
import { IntervalRule } from "./intervalRule";
import { EventListenerRule } from "./eventListenerRule";
import { RendererListenRule } from "./rendererListenRule";
import { FormSubscriptionRule } from "./formSubscriptionRule";
import { ReactIntervalRule } from "./reactIntervalRule";
import { ReactEventListenerRule } from "./reactEventListenerRule";
import { ReactSubscriptionRule } from "./reactSubscriptionRule";
import { ReactEffectCleanupRule } from "./reactEffectCleanupRule";

const angularRules: Rule[] = [
  new SubscriptionRule(),
  new IntervalRule(),
  new EventListenerRule(),
  new RendererListenRule(),
  new FormSubscriptionRule(),
];

const reactRules: Rule[] = [
  new ReactIntervalRule(),
  new ReactEventListenerRule(),
  new ReactSubscriptionRule(),
  new ReactEffectCleanupRule(),
];

export function getRulesForFramework(fw: Framework): Rule[] {
  return fw === "angular" ? angularRules : reactRules;
}
