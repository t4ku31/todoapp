import { Clock } from "lucide-react";
import { KPICard } from "../KPICard";

interface AnalyticsFocusCardProps {
	minutes: number;
	comparisonDiffMinutes?: number;
	title?: string;
	className?: string;
	isLoading?: boolean;
}

export function AnalyticsFocusCard({
	minutes,
	comparisonDiffMinutes,
	title = "Total Focus Time",
	className,
	isLoading = false,
}: AnalyticsFocusCardProps) {
	// Format: Xh Ym
	const formatTime = (totalMinutes: number) => {
		const hours = Math.floor(totalMinutes / 60);
		const mins = Math.floor(totalMinutes % 60);
		return `${hours}h ${mins.toString().padStart(2, "0")}m`;
	};

	const value = isLoading ? "..." : formatTime(minutes);

	let sub = "";
	let trend: "up" | "down" | undefined;

	if (comparisonDiffMinutes !== undefined && !isLoading) {
		const isPositive = comparisonDiffMinutes >= 0;
		const absMinutes = Math.abs(Math.round(comparisonDiffMinutes));
		const formattedComp = `${absMinutes}m`;

		if (isPositive) {
			sub = `↗ +${formattedComp} vs last week`;
			trend = "up";
		} else {
			sub = `↘ -${formattedComp} vs last week`;
			trend = "down";
		}
	} else if (!isLoading) {
		sub = "No comparison data";
	}

	return (
		<KPICard
			title={title}
			value={value}
			sub={sub || undefined}
			trend={trend}
			icon={<Clock size={20} />}
			className={className}
		/>
	);
}
