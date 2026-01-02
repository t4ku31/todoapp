import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KPICardProps {
	title: string;
	value: string;
	sub?: string;
	trend?: "up" | "down";
	icon?: React.ReactNode;
	className?: string;
}

/**
 * Shared KPI Card component for analytics views.
 * - With trend: Shows colored icon container and trend arrow with sub text
 * - Without trend: Shows purple icon container and plain sub text
 */
export function KPICard({
	title,
	value,
	sub,
	trend,
	icon,
	className,
}: KPICardProps) {
	// Determine icon container color based on trend presence
	const iconContainerClass = trend
		? trend === "up"
			? "bg-emerald-100 text-emerald-600"
			: "bg-red-100 text-red-600"
		: "bg-purple-100 text-purple-600";

	return (
		<Card className={cn("h-full px-5 flex items-center gap-5", className)}>
			{/* Icon Container */}
			<div className={cn("p-3 rounded-xl shrink-0", iconContainerClass)}>
				{icon ?? <TrendingUp size={20} />}
			</div>

			<div className="min-w-0 flex flex-col justify-center">
				<p className="text-sm text-muted-foreground font-medium truncate mb-1">
					{title}
				</p>
				<div className="flex items-baseline gap-2 min-w-0">
					<p className="text-3xl font-bold leading-none shrink-0">{value}</p>
					{sub && (
						<div
							className={cn(
								"text-xs flex items-center gap-1 font-medium truncate",
								trend === "up"
									? "text-emerald-600"
									: trend === "down"
										? "text-red-600"
										: "text-muted-foreground",
							)}
						>
							{trend === "up" && (
								<ArrowUpRight size={12} className="shrink-0" />
							)}
							{trend === "down" && (
								<ArrowDownRight size={12} className="shrink-0" />
							)}
							<span className="truncate">{sub}</span>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
