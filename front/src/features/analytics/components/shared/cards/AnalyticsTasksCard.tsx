import { CheckCircle2 } from "lucide-react";
import { KPICard } from "../KPICard";

interface AnalyticsTasksCardProps {
	completed: number;
	total?: number;
	className?: string;
	isLoading?: boolean;
}

export function AnalyticsTasksCard({
	completed,
	total,
	className,
	isLoading = false,
}: AnalyticsTasksCardProps) {
	let value = isLoading ? "..." : String(completed);
	let sub = "";
	let trend: "up" | "down" | undefined;

	if (!isLoading) {
		if (total !== undefined && total > 0) {
			value = `${completed} / ${total}`;
			sub = `${Math.round((completed / total) * 100)}% completion rate`;
			trend = completed >= total / 2 ? "up" : "down";
		} else {
			sub = "Tasks completed";
			// For monthly where total is not available, we can assume 'up' if > 0? or just neutral.
			// Let's make it purple (neutral) by not setting trend, unless we have a target.
			// The original Monthly Tasks Card was generic purple.
			trend = undefined;
		}
	}

	return (
		<KPICard
			title="Tasks Completed"
			value={value}
			sub={sub || undefined}
			trend={trend}
			icon={<CheckCircle2 size={20} />}
			className={className}
		/>
	);
}
