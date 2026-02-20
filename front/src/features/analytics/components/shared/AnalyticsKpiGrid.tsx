import type { TaskStats } from "../../types";
import { AnalyticsEfficiencyCard } from "./cards/AnalyticsEfficiencyCard";
import { AnalyticsFocusCard } from "./cards/AnalyticsFocusCard";
import { AnalyticsTasksCard } from "./cards/AnalyticsTasksCard";
import { EstimationAccuracyCard } from "./cards/EstimationAccuracyCard";

interface AnalyticsKpiGridProps {
	isLoading: boolean;
	focusMinutes: number;
	focusComparisonDiffMinutes?: number;
	efficiencyScore: number;
	rhythmQuality?: number;
	volumeBalance?: number;
	tasksCompletedCount: number;
	tasksTotalCount: number;
	taskCompletionRateGrowth?: number;
	estimationData: TaskStats;
	comparisonLabel?: string;
	className?: string;
}

/**
 * Shared KPI Grid component for Analytics views.
 * Displays 4 KPI cards in a responsive grid.
 */
export function AnalyticsKpiGrid({
	isLoading,
	focusMinutes,
	focusComparisonDiffMinutes,
	efficiencyScore,
	rhythmQuality,
	volumeBalance,
	tasksCompletedCount,
	tasksTotalCount,
	taskCompletionRateGrowth,
	estimationData,
	comparisonLabel,
	className,
}: AnalyticsKpiGridProps) {
	return (
		<div
			className={`shrink-0 grid grid-cols-4 gap-3 h-[120px] ${className || ""}`}
		>
			<AnalyticsFocusCard
				minutes={focusMinutes}
				comparisonDiffMinutes={focusComparisonDiffMinutes}
				isLoading={isLoading}
			/>
			<AnalyticsEfficiencyCard
				efficiency={efficiencyScore}
				rhythm={rhythmQuality}
				volume={volumeBalance}
				isLoading={isLoading}
			/>
			<AnalyticsTasksCard
				completed={tasksCompletedCount}
				total={tasksTotalCount}
				completionRateGrowth={taskCompletionRateGrowth}
				comparisonLabel={comparisonLabel}
				isLoading={isLoading}
			/>
			<EstimationAccuracyCard
				variant="compact"
				className="h-full"
				data={estimationData}
				isLoading={isLoading}
			/>
		</div>
	);
}
