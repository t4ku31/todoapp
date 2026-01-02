import { Zap } from "lucide-react";
import type { WeeklyAnalyticsData } from "@/features/analytics/types";
import { KPICard } from "../../shared/KPICard";

interface EfficiencyCardProps {
	className?: string;
	data?: WeeklyAnalyticsData | null;
}

export function EfficiencyCard({ className, data }: EfficiencyCardProps) {
	const stats = data;

	const value = stats ? `${Math.round(stats.efficiencyScore)}%` : "—";
	// Sub: Rhythm / Volume
	const sub = stats
		? `Rhythm: ${Math.round(stats.rhythmQuality)}% | Vol: ${Math.round(stats.volumeBalance)}%`
		: "Loading...";

	// Simple trend logic or static
	const trend: "up" | "down" =
		(stats?.efficiencyScore ?? 0) >= 70 ? "up" : "down";

	return (
		<KPICard
			title="Focus Efficiency"
			value={value}
			sub={sub}
			trend={trend}
			icon={<Zap size={20} />}
			className={className}
		/>
	);
}
