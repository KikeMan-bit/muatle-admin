import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@/lib/admin-api";
import { CHIP_PLAIN, planName, subscriptionStateLabel, subscriptionStateStyle } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** The state of a subscription as a chip: a dot of its color and the word. */
function SubscriptionChip({ subscription, className }: { subscription: Subscription; className?: string }) {
  return (
    <Badge variant="outline" className={cn(subscriptionStateStyle(subscription), className)}>
      {subscriptionStateLabel(subscription)}
    </Badge>
  );
}

/** The plan's name as a chip, with no dot: a plan is not a state. */
function PlanChip({ plan, className }: { plan: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(CHIP_PLAIN, className)}>
      {planName(plan)}
    </Badge>
  );
}

export { PlanChip, SubscriptionChip };
