import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DayActivity } from "../MonthlyView";

interface HeatmapChartProps {
	className?: string;
	dailyActivity?: DayActivity[];
	isLoading?: boolean;
}

export function HeatmapChart({
	className,
	dailyActivity = [],
	isLoading,
}: HeatmapChartProps) {
	// Convert daily activity to heatmap format (group by week of month)
	const { series } = useMemo(() => {
		if (dailyActivity.length === 0) {
			// Fallback empty data
			return {
				series: [{ name: "Week 1", data: [] }],
				categories: [],
			};
		}

		// Group days by week of month
		const weeks: { [key: string]: { x: string; y: number }[] } = {};
		const dayLabels: string[] = [];

		dailyActivity.forEach((day) => {
			const date = new Date(day.date);
			const dayOfMonth = date.getDate();
			const weekNum = Math.ceil(dayOfMonth / 7);
			const weekKey = `Week ${weekNum}`;
			const dayLabel = date.toLocaleDateString("en-US", {
				weekday: "short",
				day: "numeric",
			});

			if (!weeks[weekKey]) {
				weeks[weekKey] = [];
			}
			weeks[weekKey].push({ x: dayLabel, y: day.minutes });
		});

		// Build series array
		const seriesData = Object.keys(weeks)
			.sort()
			.map((weekKey) => ({
				name: weekKey,
				data: weeks[weekKey],
			}));

		return {
			series:
				seriesData.length > 0 ? seriesData : [{ name: "Week 1", data: [] }],
			categories: dayLabels,
		};
	}, [dailyActivity]);

	const options = {
		chart: {
			height: 350,
			type: "heatmap" as const,
			toolbar: {
				show: false,
			},
		},
		dataLabels: {
			enabled: false,
		},
		colors: ["#8b5cf6"],
		title: {
			text: isLoading ? "Loading..." : "Daily Focus Activity (Minutes)",
			style: {
				fontSize: "14px",
				fontWeight: 600,
			},
		},
		xaxis: {
			type: "category" as const,
		},
		yaxis: {
			reversed: true,
		},
		plotOptions: {
			heatmap: {
				radius: 4,
				colorScale: {
					ranges: [
						{ from: 0, to: 0, color: "#374151", name: "No focus" },
						{ from: 1, to: 30, color: "#6366f1", name: "< 30 min" },
						{ from: 31, to: 60, color: "#8b5cf6", name: "30-60 min" },
						{ from: 61, to: 120, color: "#a855f7", name: "1-2 hours" },
						{ from: 121, to: 300, color: "#c084fc", name: "> 2 hours" },
					],
				},
			},
		},
		tooltip: {
			y: {
				formatter: (val: number) => `${val} min`,
			},
		},
	};

	return (
		<Card className={cn("p-4 flex flex-col h-full", className)}>
			<div id="chart" className="flex-1 min-h-0">
				<ReactApexChart
					options={options}
					series={series}
					type="heatmap"
					height="100%"
				/>
			</div>
		</Card>
	);
}
