import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";
import type {
	CategoryFocusTime,
	DayActivity,
	MonthlyAnalyticsData,
} from "@/features/analytics/types";
import { endOfMonth, format, startOfMonth, startOfToday } from "date-fns";
import { useEffect, useMemo } from "react";
// Shared Cards
import { AnalyticsKpiGrid } from "../shared/AnalyticsKpiGrid";
import { HeatmapChart } from "./cards/HeatmapChart";
import { MonthlySummary } from "./cards/MonthlySummary";
import { ResourceStack } from "./cards/ResourceStack";

// Re-export types for child components
export type { CategoryFocusTime, DayActivity, MonthlyAnalyticsData };

// --- Main MonthlyView Component ---

export default function MonthlyView() {
	const today = startOfToday();
	const monthStart = format(startOfMonth(today), "yyyy-MM-01");
	const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
	// For API we need yyyy-MM
	const apiMonthParam = format(today, "yyyy-MM");

	const { monthlyData, isLoading, fetchMonthlyAnalytics } = useAnalyticsStore();

	useEffect(() => {
		fetchMonthlyAnalytics(apiMonthParam);
	}, [fetchMonthlyAnalytics, apiMonthParam]);

	const data = monthlyData;

	// Prepare data for EstimationAccuracyCard
	const estimationData = useMemo(
		() => ({
			startDate: monthStart,
			endDate: monthEnd,
			completedCount: data?.kpi.tasksCompletedCount ?? 0,
			totalCount: data?.kpi.tasksTotalCount ?? 0,
			totalEstimatedMinutes: data?.kpi.totalEstimatedMinutes ?? 0,
			totalActualMinutes: data?.kpi.totalActualMinutes ?? 0,
		}),
		[data, monthStart, monthEnd],
	);

	return (
		<div className="h-full flex flex-col gap-3 overflow-hidden">
			{/* Top Row: KPI Cards */}
			<AnalyticsKpiGrid
				isLoading={isLoading}
				focusMinutes={data?.kpi.totalActualMinutes ?? 0}
				focusComparisonDiffMinutes={data?.kpi.focusComparisonDiffMinutes}
				efficiencyScore={data?.kpi.efficiencyScore ?? 0}
				rhythmQuality={data?.kpi.rhythmQuality}
				volumeBalance={data?.kpi.volumeBalance}
				tasksCompletedCount={data?.kpi.tasksCompletedCount ?? 0}
				tasksTotalCount={data?.kpi.tasksTotalCount ?? 0}
				taskCompletionRateGrowth={data?.kpi.taskCompletionRateGrowth}
				estimationData={estimationData}
				comparisonLabel="vs last month"
			/>

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
				<div className="flex-[2] flex flex-col gap-3 min-h-0">
					{/* Resource Allocation */}
					<div className="flex-[1] min-h-0">
						<ResourceStack
							categoryAggregation={data?.categoryAggregation ?? {}}
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
