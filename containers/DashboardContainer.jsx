"use client";

/** The overview: who, the period, the four figures, then the detail sections. */
import ProfileHeader from "@/sections/ProfileHeader";
import PeriodToolbar from "@/sections/PeriodToolbar";
import SummaryCards from "@/sections/SummaryCards";
import CategoryBreakdown from "@/sections/CategoryBreakdown";
import TrendSection from "@/sections/TrendSection";
import GoalsSection from "@/sections/GoalsSection";
import RecentTransactions from "@/sections/RecentTransactions";

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
