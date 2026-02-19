import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface KPICardProps {
	title: string;
	value: string; // The main number/text
	sub?: string; // Small description below the value
	trend?: "up" | "down" | "neutral";
	icon?: React.ReactNode;
	className?: string; // Additional classes for the Card container
}

/**
 * A reusable KPI Card component for dashboards.
 * Displays a title, a main value, a subtext, and an optional trend indicator and icon.
 */
export function KPICard({
	title,
	value,
	sub,
	trend = "neutral",
	icon,
	className,
}: KPICardProps) {
	// Determine trend color and icon
	let TrendIcon = Minus;
	let trendColor = "text-gray-400";
	let trendBg = "bg-gray-100";

	if (trend === "up") {
		TrendIcon = ArrowUpRight; // Or TrendingUp
		trendColor = "text-green-600";
		trendBg = "bg-green-100";
	} else if (trend === "down") {
		TrendIcon = ArrowDownRight; // Or TrendingDown
		trendColor = "text-red-600";
		trendBg = "bg-red-100";
	}

	// Customize for specific KPI types if needed based on title, but keep generic for now.

	return (
		<Card
			className={cn(
				"p-4 flex flex-col justify-between bg-white shadow-sm border-gray-100 h-full",
				className,
			)}
		>
			<div className="flex items-start justify-between">
				<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
					{title}
				</span>
				{icon && (
					<div className={cn("p-1.5 rounded-full bg-slate-50 text-slate-400")}>
						{icon}
					</div>
				)}
			</div>

			<div className="mt-2">
				<div className="text-2xl font-bold text-gray-900">{value}</div>
				{sub && (
					<div className="flex items-center mt-1">
						{trend !== "neutral" && (
							<div
								className={cn(
									"flex items-center justify-center w-4 h-4 rounded-full mr-1.5",
									trendBg,
								)}
							>
								<TrendIcon className={cn("w-3 h-3", trendColor)} />
							</div>
						)}
						<span className="text-xs text-gray-400">{sub}</span>
					</div>
				)}
			</div>
		</Card>
	);
}

// Default export if needed, or named export is fine
export default KPICard;
