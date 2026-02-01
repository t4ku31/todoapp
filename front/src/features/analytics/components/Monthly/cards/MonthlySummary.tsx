import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { MonthlyAnalyticsData } from "../MonthlyView";

interface MonthlySummaryProps {
	data?: MonthlyAnalyticsData | null;
	isLoading?: boolean;
}

export function MonthlySummary({ data, isLoading }: MonthlySummaryProps) {
	// Calculate summary statistics
	const summary = useMemo(() => {
		if (!data) return null;

		// Find best week (most focus time)
		const weeks = Object.entries(data.categoryDistribution || {});
		let bestWeek = { name: "—", hours: 0 };
		weeks.forEach(([weekName, categories]) => {
			const totalMinutes = categories.reduce(
				(sum, cat) => sum + cat.minutes,
				0,
			);
			const hours = Math.round(totalMinutes / 6) / 10;
			if (hours > bestWeek.hours) {
				bestWeek = { name: weekName, hours };
			}
		});

		// Find most focused day
		let bestDay = { date: "—", minutes: 0 };
		(data.dailyActivity || []).forEach((day) => {
			if (day.minutes > bestDay.minutes) {
				bestDay = { date: day.date, minutes: day.minutes };
			}
		});
		const bestDayFormatted =
			bestDay.date !== "—"
				? new Date(bestDay.date).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
					})
				: "—";
		const bestDayHours = Math.round(bestDay.minutes / 6) / 10;

		// Find top category across all weeks
		const categoryTotals = new Map<string, number>();
		weeks.forEach(([, categories]) => {
			categories.forEach((cat) => {
				categoryTotals.set(
					cat.name,
					(categoryTotals.get(cat.name) || 0) + cat.minutes,
				);
			});
		});
		let topCategory = "—";
		let topCategoryMinutes = 0;
		categoryTotals.forEach((minutes, name) => {
			if (minutes > topCategoryMinutes) {
				topCategory = name;
				topCategoryMinutes = minutes;
			}
		});

		return {
			bestWeek: `${bestWeek.name} (${bestWeek.hours}h)`,
			mostFocusedDay: `${bestDayFormatted} (${bestDayHours}h)`,
			topCategory,
			efficiency: `${Math.round(data.averageEfficiencyScore)}%`,
		};
	}, [data]);

	if (isLoading) {
		return (
			<Card className="p-3 h-full flex flex-col">
				<h3 className="text-xs font-semibold text-muted-foreground mb-2">
					Monthly Summary
				</h3>
				<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
					Loading...
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-3 h-full flex flex-col">
			<h3 className="text-xs font-semibold text-muted-foreground mb-2">
				Monthly Summary
			</h3>
			<div className="flex-1 space-y-1.5 overflow-hidden">
				<div className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-xs">
					<span>Best Week</span>
					<span className="font-bold">{summary?.bestWeek ?? "—"}</span>
				</div>
				<div className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-xs">
					<span>Most Focused Day</span>
					<span className="font-bold">{summary?.mostFocusedDay ?? "—"}</span>
				</div>
				<div className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-xs">
					<span>Top Category</span>
					<span className="font-bold">{summary?.topCategory ?? "—"}</span>
				</div>
				<div className="flex justify-between items-center p-2 bg-muted/50 rounded-md text-xs">
					<span>Avg Efficiency</span>
					<span className="font-bold">{summary?.efficiency ?? "—"}</span>
				</div>
			</div>
		</Card>
	);
}
