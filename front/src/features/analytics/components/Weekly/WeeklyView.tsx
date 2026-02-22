import { addWeeks, formatISO, startOfWeek } from "date-fns";
import { useWeeklyAnalyticsQuery } from "@/features/analytics/queries/useAnalyticsQueries";
// Shared Cards (Unified UX)
import { AnalyticsKpiGrid } from "../shared/AnalyticsKpiGrid";
import { AnalyticsTaskList } from "../shared/AnalyticsTaskList";
import { CategoryPieChart } from "./cards/CategoryPieChart";
import { ProductivityChart } from "./cards/ProductivityChart";

// --- Main WeeklyView Component ---
export default function WeeklyView() {
	const today = new Date();
	const weekStart = startOfWeek(today, { weekStartsOn: 1 });
	const weekNextStart = addWeeks(weekStart, 1);

	const startStr = formatISO(weekStart);
	const endStr = formatISO(weekNextStart);

	const { data: weeklyData, isLoading } = useWeeklyAnalyticsQuery(
		startStr,
		endStr,
	);
	const data = weeklyData;

	// Estimation Data Prep
	const estimationData = {
		startDate: startStr,
		endDate: endStr,
		completedCount: data?.kpi.tasksCompletedCount ?? 0,
		totalCount: data?.kpi.tasksTotalCount ?? 0,
		totalEstimatedMinutes: data?.kpi.totalEstimatedMinutes ?? 0,
		totalActualMinutes: data?.kpi.totalActualMinutes ?? 0,
	};

	return (
		<div className="h-full flex flex-col gap-3 overflow-hidden">
			<div className="flex bg-white rounded-lg p-1 overflow-auto h-full gap-3">
				{/* Left Column: Charts and KPIs (flex-[5]) */}
				<div className="flex-[5] flex flex-col gap-3 min-w-0">
					{/* Top Row: KPI Cards (h-[120px] - increased to match Monthly new default) */}
					<AnalyticsKpiGrid
						isLoading={isLoading}
						focusMinutes={data?.kpi.totalFocusMinutes ?? 0}
						focusComparisonDiffMinutes={data?.kpi.focusComparisonDiffMinutes}
						efficiencyScore={data?.kpi.efficiencyScore ?? 0}
						rhythmQuality={data?.kpi.rhythmQuality}
						volumeBalance={data?.kpi.volumeBalance}
						tasksCompletedCount={data?.kpi.tasksCompletedCount ?? 0}
						tasksTotalCount={data?.kpi.tasksTotalCount ?? 0}
						taskCompletionRateGrowth={data?.kpi.taskCompletionRateGrowth}
						estimationData={estimationData}
						comparisonLabel="vs last week"
					/>

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
					<AnalyticsTaskList
						data={data?.taskSummaries}
						isLoading={isLoading}
						title="Weekly Tasks"
					/>
				</div>
			</div>
		</div>
	);
}
