import { CheckCircle2 } from "lucide-react";
import type { WeeklyAnalyticsData } from "@/features/analytics/types";
import { KPICard } from "../../shared/KPICard";

interface TasksCompletedCardProps {
	className?: string;
	data?: WeeklyAnalyticsData | null;
}

export function TasksCompletedCard({
	className,
	data,
}: TasksCompletedCardProps) {
	const completed = data?.tasksCompletedCount ?? 0;
	const total = data?.tasksTotalCount ?? 0;

	const value = data ? `${completed} / ${total}` : "—";

	const sub =
		total > 0
			? `${Math.round((completed / total) * 100)}% completion rate`
			: "No tasks this week";

	// Trend logic based on quantity (or we could use comparison if we want)
	// Original logic was "completed >= total / 2"
	const trend: "up" | "down" = completed >= total / 2 ? "up" : "down";

	return (
		<KPICard
			title="Tasks Completed"
			value={value}
			sub={sub}
			trend={trend}
			icon={<CheckCircle2 size={20} />}
			className={className}
		/>
	);
}
