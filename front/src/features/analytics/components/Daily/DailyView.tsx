import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";
import type { TimelineSession } from "@/features/analytics/types";
import { FocusCircle } from "@/features/home/components/FocusCircle";
import { EstimationAccuracyCard } from "../shared/EstimationAccuracyCard";
import { TaskSummaryCard } from "../shared/TaskSummaryCard";
import { DailyEfficiencyCard } from "./cards/DailyEfficiencyCard";
import { DailyTimeline } from "./cards/DailyTimeline";
import { HourlyActivityChart } from "./cards/HourlyActivityChart";

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

	return (
		<div className="flex flex-row gap-4 h-full pb-4 overflow-hidden w-full">
			{/* Left Column: Hourly Chart */}
			<div className="flex-[2] min-w-0 min-h-0 h-full flex flex-col gap-4">
				<FocusCircle size="md" />
				<DailyEfficiencyCard data={data} isLoading={isLoading} />
			</div>
			<div className="flex-[6] min-w-0 min-h-0 h-full flex flex-col gap-4">
				<div className="flex-[2] min-h-0 flex gap-4">
					<div className="flex-[3] min-h-0">
						<HourlyActivityChart sessions={sessions} />
					</div>
				</div>
				<div className="flex-[2] min-h-0 flex gap-4">
					<div className="flex-[1] min-h-0">
						<EstimationAccuracyCard
							variant="detailed"
							data={{
								startDate: dateStr,
								endDate: dateStr,
								completedCount: data?.tasksCompletedCount ?? 0,
								totalCount: data?.tasksTotalCount ?? 0,
								totalEstimatedMinutes: data?.totalEstimatedMinutes ?? 0,
								totalActualMinutes: data?.totalActualMinutes ?? 0,
							}}
							isLoading={isLoading}
						/>
					</div>
					<div className="flex-[2] min-h-0">
						<TaskSummaryCard data={data?.taskSummaries} isLoading={isLoading} />
					</div>
				</div>
			</div>
			<div className="flex-[3] min-w-0 min-h-0 h-full flex flex-col gap-4">
				{isLoading ? (
					<Card className="h-full flex items-center justify-center">
						Loading timeline...
					</Card>
				) : (
					<DailyTimeline sessions={sessions} />
				)}
			</div>
		</div>
	);
}
