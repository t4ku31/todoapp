import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { CategoryTime } from "../MonthlyView";

interface ResourceStackProps {
	categoryDistribution?: Record<string, CategoryTime[]>;
	isLoading?: boolean;
}

export function ResourceStack({
	categoryDistribution = {},
	isLoading,
}: ResourceStackProps) {
	// Get unique categories across all weeks for legend
	const allCategories = useMemo(() => {
		const categoryMap = new Map<string, { name: string; color: string }>();
		Object.values(categoryDistribution).forEach((categories) => {
			categories.forEach((cat) => {
				if (!categoryMap.has(cat.name)) {
					categoryMap.set(cat.name, { name: cat.name, color: cat.color });
				}
			});
		});
		return Array.from(categoryMap.values());
	}, [categoryDistribution]);

	// Get week entries sorted
	const weeks = Object.entries(categoryDistribution).sort(([a], [b]) =>
		a.localeCompare(b),
	);

	if (isLoading) {
		return (
			<Card className="p-3 h-full flex flex-col">
				<h3 className="text-xs font-semibold text-muted-foreground mb-2">
					Resource Allocation (Weekly)
				</h3>
				<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
					Loading...
				</div>
			</Card>
		);
	}

	if (weeks.length === 0) {
		return (
			<Card className="p-3 h-full flex flex-col">
				<h3 className="text-xs font-semibold text-muted-foreground mb-2">
					Resource Allocation (Weekly)
				</h3>
				<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
					No data available
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-3 h-full flex flex-col overflow-y-auto">
			<h3 className="text-xs font-semibold text-muted-foreground mb-2">
				Resource Allocation (Weekly)
			</h3>
			<div className="flex-1 space-y-1.5 overflow-y-auto">
				{weeks.map(([weekKey, categories]) => {
					const totalMinutes = categories.reduce(
						(sum, cat) => sum + cat.minutes,
						0,
					);
					const totalHours = Math.round(totalMinutes / 6) / 10; // Round to 1 decimal

					return (
						<div key={weekKey} className="flex items-center gap-2">
							<span className="text-[10px] font-medium text-muted-foreground w-12">
								{weekKey}
							</span>
							<div className="flex-1 h-6 flex rounded-full overflow-hidden bg-muted">
								{categories.map((cat, idx) => {
									const percentage =
										totalMinutes > 0 ? (cat.minutes / totalMinutes) * 100 : 0;
									return (
										<div
											key={`${cat.name}-${idx}`}
											className="h-full"
											style={{
												width: `${percentage}%`,
												backgroundColor: cat.color,
											}}
											title={`${cat.name}: ${Math.round(cat.minutes / 6) / 10}h (${Math.round(percentage)}%)`}
										/>
									);
								})}
							</div>
							<span className="text-[10px] font-medium text-muted-foreground w-8 text-right">
								{totalHours}h
							</span>
						</div>
					);
				})}
			</div>
			{allCategories.length > 0 && (
				<div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] text-muted-foreground font-medium">
					{allCategories.slice(0, 5).map((cat) => (
						<div key={cat.name} className="flex items-center gap-1">
							<div
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: cat.color }}
							/>
							{cat.name.length > 10 ? `${cat.name.slice(0, 10)}...` : cat.name}
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
