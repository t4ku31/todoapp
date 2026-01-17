import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";
import type { TimelineSession } from "@/features/analytics/types";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
// Shared Cards (Unified UX)
import { AnalyticsEfficiencyCard } from "../shared/cards/AnalyticsEfficiencyCard";
import { AnalyticsFocusCard } from "../shared/cards/AnalyticsFocusCard";
import { AnalyticsTasksCard } from "../shared/cards/AnalyticsTasksCard";
import { EstimationAccuracyCard } from "../shared/EstimationAccuracyCard";
import { DailyTimeline } from "./cards/DailyTimeline";
import { HourlyActivityChart } from "./cards/HourlyActivityChart";
import { DailyTaskList } from "./DailyTaskList";

// --- Main DailyView Component ---
export default function DailyView() {
	const today = new Date();
	const dateStr = format(today, "yyyy-MM-dd");

	const { dailyData, isLoading, fetchDailyAnalytics } = useAnalyticsStore();

	useEffect(() => {
		fetchDailyAnalytics(dateStr);
	}, [dateStr, fetchDailyAnalytics]);

	const data = dailyData;

	// Map API response to TimelineSession
	const sessions: TimelineSession[] = useMemo(() => {
		if (!data?.focusSessions) return [];
		return data.focusSessions.map((s) => ({
			id: s.id,
			title: s.taskTitle ?? "Unknown Task",
			start: s.startedAt,
			duration: Math.ceil((s.actualDuration ?? 0) / 60), // minutes
			actual: Math.ceil((s.actualDuration ?? 0) / 60),
			planned: Math.ceil((s.scheduledDuration ?? 0) / 60),
			category: s.categoryName ?? "Others",
			categoryColor: s.categoryColor,
			status: s.status as "COMPLETED" | "INTERRUPTED",
		}));
	}, [data?.focusSessions]);

	// Estimation Data Prep
	const estimationData = {
		startDate: dateStr,
		endDate: dateStr,
		completedCount: data?.tasksCompletedCount ?? 0,
		totalCount: data?.tasksTotalCount ?? 0,
		totalEstimatedMinutes: data?.totalEstimatedMinutes ?? 0,
		totalActualMinutes: data?.totalActualMinutes ?? 0,
	};

	return (
		<div className="h-full flex flex-col gap-3 overflow-hidden">
			{/* Top Row: KPI Cards (Consistent across all views) */}
			<div className="shrink-0 grid grid-cols-4 gap-3 h-[120px]">
				<AnalyticsFocusCard
					minutes={data?.totalActualMinutes ?? 0}
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

			{/* Main Content Area */}
			<div className="flex-1 flex gap-3 min-h-0">
				{/* Left Column: Visuals (Chart + Timeline) */}
				<div className="flex-[3] flex gap-3 min-w-0">
					{/* Hourly Chart (Main Visual) */}
					<div className="flex-[2] min-h-0 h-full">
						<HourlyActivityChart sessions={sessions} />
					</div>
					{/* Timeline (Vertical Visual) */}
					<div className="flex-[1] min-w-0 h-full">
						<DailyTimeline sessions={sessions} />
					</div>
				</div>

				{/* Right Column: List (Tasks) */}
				<div className="flex-[1] min-w-0 h-full">
					<DailyTaskList data={data?.taskSummaries} isLoading={isLoading} />
				</div>
			</div>
		</div>
	);
}
