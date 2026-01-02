import { Activity, BarChart2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DailyAnalyticsData } from "@/features/analytics/types";

interface DailyEfficiencyCardProps {
	data?: DailyAnalyticsData | null;
	isLoading?: boolean;
}

export function DailyEfficiencyCard({
	data,
	isLoading = false,
}: DailyEfficiencyCardProps) {
	const stats = data;

	if (isLoading) {
		return (
			<Card className="h-full flex items-center justify-center p-4">
				<span className="text-sm text-gray-400">Loading stats...</span>
			</Card>
		);
	}

	if (!stats) {
		return (
			<Card className="h-full flex items-center justify-center p-4">
				<span className="text-sm text-gray-400">No data available</span>
			</Card>
		);
	}

	return (
		<Card className="h-full p-4 flex flex-col justify-between bg-white shadow-sm border-gray-100">
			<div className="flex items-start justify-between">
				<div>
					<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
						Efficiency
					</h3>
					<div className="flex items-baseline gap-2">
						<span className="text-3xl font-bold text-gray-800">
							{Math.round(stats.efficiencyScore)}
						</span>
						<span className="text-sm font-medium text-gray-400">/ 100</span>
					</div>
				</div>
				<div
					className={`p-2 rounded-full ${
						stats.efficiencyScore >= 80
							? "bg-green-100 text-green-600"
							: stats.efficiencyScore >= 60
								? "bg-yellow-100 text-yellow-600"
								: "bg-red-100 text-red-600"
					}`}
				>
					<Zap size={18} />
				</div>
			</div>

			<div className="space-y-3 mt-2">
				{/* Rhythm Quality */}
				<div className="space-y-1">
					<div className="flex justify-between text-xs">
						<div className="flex items-center gap-1.5 text-gray-600">
							<Activity size={12} className="text-blue-500" />
							<span>Rhythm</span>
						</div>
						<span className="font-medium">
							{Math.round(stats.rhythmQuality)}%
						</span>
					</div>
					<Progress value={stats.rhythmQuality} className="h-1.5" />
				</div>

				{/* Volume Balance */}
				<div className="space-y-1">
					<div className="flex justify-between text-xs">
						<div className="flex items-center gap-1.5 text-gray-600">
							<BarChart2 size={12} className="text-purple-500" />
							<span>Balance</span>
						</div>
						<span className="font-medium">
							{Math.round(stats.volumeBalance)}%
						</span>
					</div>
					<Progress value={stats.volumeBalance} className="h-1.5" />
				</div>

				{/* Focus Ratio */}
				<div className="space-y-1">
					<div className="flex justify-between text-xs">
						<div className="flex items-center gap-1.5 text-gray-600">
							<Zap size={12} className="text-amber-500" />
							<span>Focus</span>
						</div>
						<span className="font-medium">{Math.round(stats.focusRatio)}%</span>
					</div>
					<Progress value={stats.focusRatio} className="h-1.5" />
				</div>
			</div>
		</Card>
	);
}
