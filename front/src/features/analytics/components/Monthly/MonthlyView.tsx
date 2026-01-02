import { CalendarDays, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import type {
	CategoryTime,
	DayActivity,
	MonthlyAnalyticsData,
} from "@/features/analytics/types";
import { KPICard } from "../shared/KPICard";
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

	// Format values for display
	const formatHours = (minutes: number) => {
		const hours = Math.round(minutes / 6) / 10; // Round to 1 decimal
		return `${hours}h`;
	};

	const stats = {
		totalFocusHours: data ? formatHours(data.totalFocusMinutes) : "—",
		focusDays: data ? String(data.focusDays) : "—",
		tasksCompleted: data ? String(data.totalTasksCompleted) : "—",
		avgDailyFocus: data ? formatHours(data.averageDailyFocusMinutes) : "—",
	};

	// Get days in current month for "of X days" display
	const now = new Date();
	const daysInMonth = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
	).getDate();

	return (
		<div className="h-full flex flex-col gap-3 overflow-hidden">
			{/* Top Row: KPI Cards */}
			<div className="shrink-0 grid grid-cols-4 gap-3 h-[110px]">
				<KPICard
					title="Total Focus Time"
					value={stats.totalFocusHours}
					icon={<Clock size={20} />}
				/>
				<KPICard
					title="Focus Days"
					value={stats.focusDays}
					sub={`of ${daysInMonth} days`}
					icon={<CalendarDays size={20} />}
				/>
				<KPICard
					title="Tasks Completed"
					value={stats.tasksCompleted}
					icon={<CheckCircle2 size={20} />}
				/>
				<KPICard
					title="Avg Daily Focus"
					value={stats.avgDailyFocus}
					icon={<TrendingUp size={20} />}
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
