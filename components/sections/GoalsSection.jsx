"use client";

/**
 * Monthly budgets. Each bar shows what is used, and a small mark shows where spending
 * would be if it were spread evenly across the month, so "ahead of pace" is visible
 * before the budget is gone.
 */
import { useSelector } from "react-redux";
import { TbAlertTriangle, TbCircleCheck, TbCircleX, TbTarget } from "react-icons/tb";
import { useGoals } from "@/utils/hooks/useSpendingApi";
import { errorMessage } from "@/utils/lib/apiClient";
import { selectCustomerId } from "@/utils/store/preferencesSlice";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Money from "@/components/ui/Money";
import ProgressBar from "@/components/ui/ProgressBar";
import Skeleton from "@/components/ui/Skeleton";
import { ErrorBlock, EmptyBlock } from "@/components/ui/States";

const STATUS = {
  on_track: { tone: "ok", label: "On track", bar: "ok", icon: TbCircleCheck },
  warning: { tone: "warn", label: "Watch this", bar: "warn", icon: TbAlertTriangle },
  over_budget: { tone: "bad", label: "Over budget", bar: "bad", icon: TbCircleX },
};

/** How far through the month today is, as a percentage. */
export function monthPace(daysRemaining, now = new Date()) {
  const days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  return ((days - daysRemaining) / days) * 100;
}

export default function GoalsSection() {
  const customerId = useSelector(selectCustomerId);
  const { data, isLoading, isError, error, refetch } = useGoals(customerId);
  const days = data?.goals?.[0]?.daysRemaining;

  return (
    <Card title="Monthly budgets" subtitle={days !== undefined ? `${days} ${days === 1 ? "day" : "days"} left this month` : " "}>
      {isError ? <ErrorBlock message={errorMessage(error)} onRetry={refetch} /> : isLoading || !data ? (
        <div className="space-y-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : !data.goals.length ? (
        <EmptyBlock icon={TbTarget} title="No budgets set">Set a monthly budget for a category to see how you are tracking.</EmptyBlock>
      ) : (
        <ul className="space-y-5">
          {data.goals.map((g) => {
            const s = STATUS[g.status] || STATUS.on_track;
            const left = g.monthlyBudget - g.currentSpent;
            return (
              <li key={g.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[14.5px] font-semibold text-ink">{g.category}</span>
                  <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge>
                </div>
                <ProgressBar value={g.percentageUsed} tone={s.bar} label={`${g.category}: ${g.percentageUsed}% of budget used`} marker={monthPace(g.daysRemaining)} />
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-ink-3">
                  <span><Money amount={g.currentSpent} className="font-semibold text-ink" /> of <Money amount={g.monthlyBudget} cents={false} /></span>
                  <span className={left < 0 ? "font-semibold text-bad" : ""}>
                    {left < 0 ? <><Money amount={-left} /> over</> : <><Money amount={left} /> left</>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
