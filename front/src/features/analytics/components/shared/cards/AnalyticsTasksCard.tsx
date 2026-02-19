import { CheckCircle2 } from "lucide-react";
import { KPICard } from "../KPICard";

interface AnalyticsTasksCardProps {
	completed: number;
	total: number;
	completionRateGrowth?: number;
	comparisonLabel?: string;
	className?: string;
	isLoading?: boolean;
}

export function AnalyticsTasksCard({
	completed,
	total,
	completionRateGrowth,
	comparisonLabel,
	className,
	isLoading = false,
}: AnalyticsTasksCardProps) {
	const value = isLoading ? "..." : `${completed}/${total}`;
	const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

	let sub = "";
	let trend: "up" | "down" | undefined;

	if (completionRateGrowth !== undefined && !isLoading) {
		const isPositive = completionRateGrowth >= 0;
		const absGrowth = Math.abs(Math.round(completionRateGrowth));
		const formattedGrowth = `${absGrowth}%`;
		const label = comparisonLabel || "vs last week";

		if (isPositive) {
			sub = `↗ +${formattedGrowth} ${label}`;
			trend = "up";
		} else {
			sub = `↘ -${formattedGrowth} ${label}`;
			trend = "down";
		}
	} else if (!isLoading) {
		sub = `${rate}% completion rate`;
		// If completionRateGrowth is not provided, trend remains undefined (neutral)
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
