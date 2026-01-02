import { Clock } from "lucide-react";
import type { WeeklyAnalyticsData } from "@/features/analytics/types";
import { KPICard } from "../../shared/KPICard";

interface TotalFocusTimeCardProps {
	className?: string;
	data?: WeeklyAnalyticsData | null;
}

export function TotalFocusTimeCard({
	className,
	data,
}: TotalFocusTimeCardProps) {
	// Calculate display values
	const formatTime = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = Math.floor(minutes % 60);
		return `${hours}h ${mins.toString().padStart(2, "0")}m`;
	};

	const value = data ? formatTime(data.totalFocusMinutes) : "—";

	let sub = "vs Last Week";
	let trend: "up" | "down" = "up";

	if (data) {
		const comparison = data.focusComparisonPercentage ?? 0; // percentage
		const isPositive = comparison >= 0;
		const formattedComp = `${Math.abs(Math.round(comparison))}%`;

		if (isPositive) {
			sub = `↗ ${formattedComp} vs last week`;
			trend = "up";
		} else {
			sub = `↘ ${formattedComp} vs last week`;
			trend = "down";
		}
	}

	return (
		<KPICard
			title="Total Focus Time"
			value={value}
			sub={sub}
			trend={trend}
			icon={<Clock size={20} />}
			className={className}
		/>
	);
}
