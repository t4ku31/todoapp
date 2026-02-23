import { formatISO, startOfDay } from "date-fns";
import { useMemo } from "react";
import { useDailyAnalyticsQuery } from "@/features/analytics/queries/useAnalyticsQueries";
import type {
	GroupedTaskSummary,
	TimelineSession,
} from "@/features/analytics/types";
// Shared Cards (Unified UX)
import { AnalyticsKpiGrid } from "../shared/AnalyticsKpiGrid";
import { AnalyticsTaskList } from "../shared/AnalyticsTaskList";
import { DailyTimeline } from "./cards/DailyTimeline";
import { HourlyActivityChart } from "./cards/HourlyActivityChart";

// --- Main DailyView Component ---
export default function DailyView() {
	const today = new Date();
	const dateStr = formatISO(startOfDay(today));

	const { data: dailyData, isLoading } = useDailyAnalyticsQuery(dateStr);
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

	// Transform DailyTaskSummary[] to GroupedTaskSummary[] for AnalyticsTaskList
	const taskListGroups: GroupedTaskSummary[] = useMemo(() => {
		if (!data?.taskSummaries) return [];
		return data.taskSummaries.map((task) => {
			// Use status as primary source of truth for completion
			const isCompleted = task.completed || task.status === "COMPLETED";
			return {
				parentTaskId: task.taskId,
				title: task.taskTitle,
				categoryName: task.categoryName,
				categoryColor: task.categoryColor,
				totalFocusMinutes: task.focusMinutes,
				completedCount: isCompleted ? 1 : 0,
				totalCount: 1,
				recurring: false,
				children: [
					{
						taskId: task.taskId,
						taskTitle: task.taskTitle,
						status: task.status,
						completed: isCompleted,
						focusMinutes: task.focusMinutes,
						estimatedMinutes: task.estimatedMinutes,
						progressPercentage: task.progressPercentage,
						startDate: new Date(dateStr), // Add current date for daily view
					},
				],
			};
		});
	}, [data?.taskSummaries, dateStr]);

	// Estimation Data Prep
	const estimationData = {
		startDate: dateStr,
		endDate: dateStr,
		completedCount: data?.kpi.tasksCompletedCount ?? 0,
		totalCount: data?.kpi.tasksTotalCount ?? 0,
		totalEstimatedMinutes: data?.kpi.totalEstimatedMinutes ?? 0,
		totalActualMinutes: data?.kpi.totalActualMinutes ?? 0,
	};

	return (
		<div className="h-full flex flex-col gap-3 overflow-hidden">
			{/* Top Row: KPI Cards (Consistent across all views) */}
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
				comparisonLabel="vs yesterday"
			/>

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
					<AnalyticsTaskList
						data={taskListGroups}
						isLoading={isLoading}
						title="Daily Tasks"
					/>
				</div>
			</div>
		</div>
	);
}
