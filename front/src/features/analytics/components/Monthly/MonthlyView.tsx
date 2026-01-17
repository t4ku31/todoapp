import type {
	CategoryTime,
	DayActivity,
	MonthlyAnalyticsData,
} from "@/features/analytics/types";
import { useEffect } from "react";
// Shared Cards
import { AnalyticsEfficiencyCard } from "../shared/cards/AnalyticsEfficiencyCard";
import { AnalyticsFocusCard } from "../shared/cards/AnalyticsFocusCard";
import { AnalyticsTasksCard } from "../shared/cards/AnalyticsTasksCard";
import { HeatmapChart } from "./cards/HeatmapChart";
import { MonthlySummary } from "./cards/MonthlySummary";
import { ResourceStack } from "./cards/ResourceStack";

// Re-export types for child components
export type { CategoryTime, DayActivity, MonthlyAnalyticsData };

// --- Main MonthlyView Component ---
import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";

export default function MonthlyView() {
	const { monthlyData, isLoading, fetchMonthlyAnalytics } = useAnalyticsStore();
	const data = monthlyData;

	useEffect(() => {
		const now = new Date();
		const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
		fetchMonthlyAnalytics(month);
	}, [fetchMonthlyAnalytics]);

	return (
		<div className="h-full flex flex-col gap-3 overflow-hidden">
			{/* Top Row: KPI Cards */}
			<div className="shrink-0 grid grid-cols-4 gap-3 h-[120px]">
				<AnalyticsFocusCard
					title="Total Focus Time"
					minutes={data?.totalFocusMinutes ?? 0}
					isLoading={isLoading}
				/>
				<AnalyticsEfficiencyCard
					efficiency={data?.averageEfficiencyScore ?? 0}
					isLoading={isLoading}
				/>
				<AnalyticsTasksCard
					completed={data?.totalTasksCompleted ?? 0}
					isLoading={isLoading}
				/>
				{/* Use AnalyticsFocusCard for Avg Daily Focus */}
				<AnalyticsFocusCard
					title="Avg Daily Focus"
					minutes={data?.averageDailyFocusMinutes ?? 0}
					isLoading={isLoading}
				/>
			</div>

			{/* Main Content Area: Left (Heatmap) + Right (Resource & Summary) */}
			<div className="flex-1 flex gap-3 min-h-0">
				{/* Left: Heatmap (Dominant Visual) */}
				<div className="flex-[3] min-w-0">
					<HeatmapChart
						className="h-full"
						dailyActivity={data?.dailyActivity ?? []}
						isLoading={isLoading}
					/>
				</div>

				{/* Right: Resource & Summary */}
				<div className="flex-[2] flex flex-col gap-3 min-w-0">
					{/* Resource Allocation */}
					<div className="flex-[1] min-h-0">
						<ResourceStack
							categoryDistribution={data?.categoryDistribution ?? {}}
							isLoading={isLoading}
						/>
					</div>
					{/* Monthly Summary */}
					<div className="flex-[1] min-h-0">
						<MonthlySummary data={data} isLoading={isLoading} />
					</div>
				</div>
			</div>
		</div>
	);
}
