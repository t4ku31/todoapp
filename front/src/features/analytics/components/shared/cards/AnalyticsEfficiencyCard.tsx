import { Zap } from "lucide-react";
import { KPICard } from "../KPICard";

interface AnalyticsEfficiencyCardProps {
	efficiency: number;
	rhythm?: number;
	volume?: number;
	className?: string;
	isLoading?: boolean;
}

export function AnalyticsEfficiencyCard({
	efficiency,
	rhythm,
	volume,
	className,
	isLoading = false,
}: AnalyticsEfficiencyCardProps) {
	const value = isLoading ? "..." : `${Math.round(efficiency)}%`;

	let sub = "";
	if (!isLoading) {
		if (rhythm !== undefined && volume !== undefined) {
			sub = `Rhythm: ${Math.round(rhythm)}% | Vol: ${Math.round(volume)}%`;
		} else {
			sub = "Based on completed sessions";
		}
	}

	const trend: "up" | "down" = !isLoading && efficiency >= 70 ? "up" : "down";

	return (
		<KPICard
			title="Focus Efficiency"
			value={value}
			sub={sub || undefined}
			trend={trend}
			icon={<Zap size={20} />}
			className={className}
		/>
	);
}
