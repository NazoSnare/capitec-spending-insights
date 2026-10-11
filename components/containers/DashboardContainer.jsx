"use client";

/** The overview: who, the period, the four figures, then the detail sections. */
import ProfileHeader from "@/components/sections/ProfileHeader";
import PeriodToolbar from "@/components/sections/PeriodToolbar";
import SummaryCards from "@/components/sections/SummaryCards";
import CategoryBreakdown from "@/components/sections/CategoryBreakdown";
import TrendSection from "@/components/sections/TrendSection";
import GoalsSection from "@/components/sections/GoalsSection";
import RecentTransactions from "@/components/sections/RecentTransactions";

export default function DashboardContainer() {
  return (
    <div className="space-y-6">
      <ProfileHeader />
      <PeriodToolbar />
      <SummaryCards />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <CategoryBreakdown />
        <GoalsSection />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <TrendSection />
        <RecentTransactions />
      </div>
    </div>
  );
}
