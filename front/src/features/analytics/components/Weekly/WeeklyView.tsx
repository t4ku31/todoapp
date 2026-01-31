import { endOfWeek, format, startOfWeek } from "date-fns";
import { useEffect } from "react";
import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";
// Shared Cards (Unified UX)
import { AnalyticsEfficiencyCard } from "../shared/cards/AnalyticsEfficiencyCard";
import { AnalyticsFocusCard } from "../shared/cards/AnalyticsFocusCard";
import { AnalyticsTasksCard } from "../shared/cards/AnalyticsTasksCard";
import { EstimationAccuracyCard } from "../shared/EstimationAccuracyCard";
import { TaskSummaryCard } from "../shared/TaskSummaryCard";
import { CategoryPieChart } from "./cards/CategoryPieChart";
import { ProductivityChart } from "./cards/ProductivityChart";

// --- Main WeeklyView Component ---
export default function WeeklyView() {
	const today = new Date();
	const weekStart = startOfWeek(today, { weekStartsOn: 1 });
	const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

	const startStr = format(weekStart, "yyyy-MM-dd");
	const endStr = format(weekEnd, "yyyy-MM-dd");

	const { weeklyData, isLoading, fetchWeeklyAnalytics } = useAnalyticsStore();

	useEffect(() => {
		fetchWeeklyAnalytics(startStr, endStr);
	}, [startStr, endStr, fetchWeeklyAnalytics]);

	const data = weeklyData;

	// Estimation Data Prep
	const estimationData = {
		startDate: startStr,
		endDate: endStr,
		completedCount: data?.tasksCompletedCount ?? 0,
		totalCount: data?.tasksTotalCount ?? 0,
		totalEstimatedMinutes: data?.totalEstimatedMinutes ?? 0,
		totalActualMinutes: data?.totalActualMinutes ?? 0,
	};

	return (
		<div className="h-full flex gap-3 overflow-hidden">
			{/* Left Column: Charts and KPIs (flex-[5]) */}
			<div className="flex-[5] flex flex-col gap-3 min-w-0">
				{/* Top Row: KPI Cards (h-[120px] - increased to match Monthly new default) */}
				<div className="shrink-0 grid grid-cols-4 gap-3 h-[120px]">
					<AnalyticsFocusCard
						minutes={data?.totalFocusMinutes ?? 0}
						comparisonPercent={data?.focusComparisonPercentage}
						isLoading={isLoading}
					/>
					<AnalyticsEfficiencyCard
						efficiency={data?.efficiencyScore ?? 0}
						rhythm={data?.rhythmQuality}
						volume={data?.volumeBalance}
						isLoading={isLoading}
					/>
					<AnalyticsTasksCard
						completed={data?.tasksCompletedCount ?? 0}
						total={data?.tasksTotalCount ?? 0}
						isLoading={isLoading}
					/>
					<EstimationAccuracyCard
						variant="compact"
						className="h-full"
						data={estimationData}
						isLoading={isLoading}
					/>
				</div>

				{/* Bottom Row: Charts (Bar 5 : Pie 2) */}
				<div className="flex-1 flex gap-3 min-h-0">
					{/* Productivity Chart (Bar) - Larger */}
					<div className="flex-[5] min-w-0">
						<ProductivityChart
							className="h-full"
							data={data?.dailyFocusData}
							isLoading={isLoading}
						/>
					</div>
					{/* Category Pie Chart - Smaller */}
					<div className="flex-[3] min-w-0">
						<CategoryPieChart
							className="h-full"
							data={data?.categoryAggregation}
							isLoading={isLoading}
						/>
					</div>
				</div>
			</div>

			{/* Right Column: Detailed List (flex-[2], Full Height) */}
			<div className="flex-[2] min-w-0">
				<TaskSummaryCard data={data?.taskSummaries} isLoading={isLoading} />
			</div>
		</div>
	);
}
