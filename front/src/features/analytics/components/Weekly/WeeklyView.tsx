import { endOfWeek, format, startOfWeek } from "date-fns";
import { useEffect } from "react";
import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";
import { EstimationAccuracyCard } from "../shared/EstimationAccuracyCard";
import { TaskSummaryCard } from "../shared/TaskSummaryCard";
import { CategoryPieChart } from "./cards/CategoryPieChart";
import { EfficiencyCard } from "./cards/EfficiencyCard";
import { ProductivityChart } from "./cards/ProductivityChart";
import { TasksCompletedCard } from "./cards/TasksCompletedCard";
import { TotalFocusTimeCard } from "./cards/TotalFocusTimeCard";
// import { WeeklyFocusTasks } from "./cards/WeeklyFocusTasks";

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

	return (
		<div className="h-full flex gap-3 overflow-hidden">
			{/* Left Column: Charts and KPIs (flex-[5]) */}
			<div className="flex-[5] flex flex-col gap-3 min-w-0">
				{/* Top Row: KPI Cards (h-[110px]) */}
				<div className="shrink-0 grid grid-cols-4 gap-3 h-[120px]">
					<TotalFocusTimeCard className="h-full" data={data} />
					<EfficiencyCard className="h-full" data={data} />
					<TasksCompletedCard className="h-full" data={data} />
					<EstimationAccuracyCard
						startDate={weekStart}
						endDate={weekEnd}
						variant="compact"
						className="h-full"
						data={{
							startDate: startStr,
							endDate: endStr,
							completedCount: data?.tasksCompletedCount ?? 0,
							totalCount: data?.tasksTotalCount ?? 0,
							totalEstimatedMinutes: data?.totalEstimatedMinutes ?? 0,
							totalActualMinutes: data?.totalActualMinutes ?? 0,
						}}
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
