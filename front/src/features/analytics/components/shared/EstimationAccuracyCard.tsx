import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TaskStats } from "@/features/analytics/types";
import { cn } from "@/lib/utils";
import { KPICard } from "./KPICard";

interface EstimationAccuracyCardProps {
	startDate?: Date;
	endDate?: Date;
	variant?: "compact" | "detailed";
	className?: string;
	data?: TaskStats | null;
	isLoading?: boolean;
}

/**
 * Shared Estimation Accuracy Card component.
 * - "compact" variant: Uses KPICard for Weekly view
 * - "detailed" variant: Shows full breakdown for Daily view
 */
export function EstimationAccuracyCard({
	variant = "compact",
	className,
	data,
	isLoading = false,
}: EstimationAccuracyCardProps) {
	const stats = data;

	// Calculate estimation accuracy
	const totalEstimated = stats?.totalEstimatedMinutes || 0;
	const totalActual = stats?.totalActualMinutes || 0;

	let value = "—";
	let sub = "No completed tasks";
	let trend: "up" | "down" = "up";
	let statusText = "No Data";
	let statusColor = "text-gray-400";
	let statusBg = "bg-gray-100";
	let displayScore = "—";
	let diff = 0;

	if (stats?.totalEstimatedMinutes && stats.totalEstimatedMinutes > 0) {
		const est = stats.totalEstimatedMinutes;
		const act = stats.totalActualMinutes ?? 0;
		diff = act - est;
		const pct = (diff / est) * 100;

		if (diff > 0) {
			value = `+${Math.round(diff)}m`;
			sub = `${Math.round(pct)}% over estimate`;
			trend = "down";
			statusText = "Over";
			statusColor = "text-orange-600";
			statusBg = "bg-orange-100";
			displayScore = `${Math.round(pct)}%`;
		} else {
			value = `${Math.round(diff)}m`;
			sub = `${Math.abs(Math.round(pct))}% under estimate`;
			trend = "up";
			statusText = "Under";
			statusColor = "text-green-600";
			statusBg = "bg-green-100";
			displayScore = `${Math.abs(Math.round(pct))}%`;
		}
	} else if (stats && stats.completedCount > 0) {
		value = "N/A";
		sub = "No estimates set";
		statusText = "No Est.";
		displayScore = "—";
	}

	// Compact variant (for Weekly view)
	if (variant === "compact") {
		return (
			<KPICard
				title="Estimation Accuracy"
				value={value}
				sub={sub}
				trend={trend}
				icon={<Target size={20} />}
				className={className}
			/>
		);
	}

	// Detailed variant (for Daily view)
	if (isLoading) {
		return (
			<Card
				className={cn(
					"h-full flex items-center justify-center text-muted-foreground text-sm",
					className,
				)}
			>
				Loading...
			</Card>
		);
	}

	if (!stats || stats.totalCount === 0) {
		return (
			<Card
				className={cn(
					"h-full flex flex-col items-center justify-center p-4 text-center",
					className,
				)}
			>
				<Target className="w-8 h-8 text-gray-300 mb-2" />
				<span className="text-sm text-muted-foreground">No data</span>
			</Card>
		);
	}

	return (
		<Card
			className={cn(
				"h-full p-4 flex flex-col justify-between bg-white shadow-sm border-gray-100",
				className,
			)}
		>
			<div className="flex items-start justify-between">
				<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
					Estimation
				</h3>
				<div
					className={cn(
						"px-2 py-0.5 rounded-full text-[10px] font-bold",
						statusBg,
						statusColor,
					)}
				>
					{statusText}
				</div>
			</div>

			<div className="flex flex-col items-center justify-center flex-1 my-1">
				<div className="text-4xl font-bold text-gray-800">
					{diff > 0 ? `+${Math.round(diff)}分` : `${Math.round(diff)}分`}
				</div>
				<div className="text-xs text-gray-400 mt-1">
					{diff > 0 ? "Over Estimate" : "Under Estimate"}
				</div>
				<div
					className="text-xs font-semibold mt-1"
					style={{ color: diff > 0 ? "rgb(234 88 12)" : "rgb(22 163 74)" }}
				>
					{displayScore}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 text-center text-xs border-t pt-2">
				<div>
					<div className="text-gray-400 mb-0.5">Est.</div>
					<div className="font-semibold text-gray-700">{totalEstimated}m</div>
				</div>
				<div>
					<div className="text-gray-400 mb-0.5">Act.</div>
					<div className="font-semibold text-gray-700">{totalActual}m</div>
				</div>
			</div>
		</Card>
	);
}
