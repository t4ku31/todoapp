import { useMemo } from "react";
import { Legend, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryFocusTime } from "@/features/analytics/types";
import { softenColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface CategoryPieChartProps {
	className?: string;
	data?: CategoryFocusTime[] | null;
	isLoading?: boolean;
}

export function CategoryPieChart({
	className,
	data,
	isLoading = false,
}: CategoryPieChartProps) {
	// Transform data for chart with fill property for colors
	const chartData = useMemo(() => {
		if (!data) return [];
		return data
			.map((cat) => ({
				name: cat.categoryName,
				value: cat.minutes,
				fill: softenColor(cat.categoryColor),
			}))
			.sort((a, b) => {
				if (a.name === "その他") return 1;
				if (b.name === "その他") return -1;
				return b.value - a.value;
			});
	}, [data]);

	// Build chart config dynamically from categories
	const chartConfig = useMemo<ChartConfig>(() => {
		if (!data) return { value: { label: "Minutes" } };
		const config: ChartConfig = {
			value: { label: "Minutes" },
		};
		for (const cat of data) {
			config[cat.categoryName] = {
				label: cat.categoryName,
				color: cat.categoryColor,
			};
		}
		return config;
	}, [data]);

	return (
		<Card className={cn("flex flex-col h-full w-full", className)}>
			<CardHeader className="items-center py-3">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Category Split
				</CardTitle>
				<CardDescription className="text-xs">
					Weekly focus time by category
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-2 min-h-0">
				{isLoading ? (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						Loading...
					</div>
				) : chartData.length === 0 ? (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						No data
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="mx-auto h-full w-full"
					>
						<PieChart key={`pie-chart-${chartData.length}`}>
							<ChartTooltip
								content={
									<ChartTooltipContent
										nameKey="name"
										formatter={(value) => `${value} min`}
									/>
								}
							/>
							<Legend
								layout="vertical"
								verticalAlign="middle"
								align="right"
								wrapperStyle={{ paddingLeft: 8, fontSize: "12px" }}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="40%"
								cy="50%"
								outerRadius={70}
								label={({ cx, cy, midAngle, outerRadius, percent }) => {
									if (percent < 0.05) return null;
									const RADIAN = Math.PI / 180;
									const radius = outerRadius * 0.6;
									const x = cx + radius * Math.cos(-midAngle * RADIAN);
									const y = cy + radius * Math.sin(-midAngle * RADIAN);
									return (
										<text
											x={x}
											y={y}
											textAnchor="middle"
											dominantBaseline="central"
											style={{
												fontSize: "12px",
												fontWeight: 700,
												fill: "#ffffff",
												textShadow: "0 1px 3px rgba(0,0,0,0.6)",
											}}
										>
											{`${(percent * 100).toFixed(0)}%`}
										</text>
									);
								}}
								labelLine={false}
								isAnimationActive={true}
								animationDuration={1000}
								animationEasing="ease-in-out"
							/>
						</PieChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
