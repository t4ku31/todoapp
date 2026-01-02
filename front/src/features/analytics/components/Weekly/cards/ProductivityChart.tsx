"use client";

import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { DailyFocusByCategory } from "@/features/analytics/types";
import { softenColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
	day: string;
	goal: number;
	[key: string]: string | number; // Dynamic category keys
}

interface CategoryInfo {
	name: string;
	color: string;
}

interface ProductivityChartProps {
	className?: string;
	data?: DailyFocusByCategory[] | null;
	isLoading?: boolean;
}

export function ProductivityChart({
	className,
	data,
	isLoading = false,
}: ProductivityChartProps) {
	const rawData = data || [];

	// Build chart data and collect all unique categories
	const { chartData, categoryInfoMap } = useMemo(() => {
		const allCategories = new Map<string, CategoryInfo>();

		// Collect all unique categories
		for (const day of rawData) {
			for (const cat of day.categories) {
				if (!allCategories.has(cat.categoryName)) {
					allCategories.set(cat.categoryName, {
						name: cat.categoryName,
						color: cat.categoryColor,
					});
				}
			}
		}

		// Build chart data with all categories as keys
		const data: ChartDataPoint[] = rawData.map((day) => {
			const point: ChartDataPoint = {
				day: day.dayOfWeek,
				goal: Math.round((day.goalMinutes / 60) * 10) / 10,
			};

			// Initialize all categories to 0
			for (const catName of allCategories.keys()) {
				point[catName] = 0;
			}

			// Fill in actual values
			for (const cat of day.categories) {
				point[cat.categoryName] = Math.round((cat.minutes / 60) * 10) / 10;
			}

			return point;
		});

		return { chartData: data, categoryInfoMap: allCategories };
	}, [rawData]);

	const categoryNames = Array.from(categoryInfoMap.keys()).sort();

	return (
		<Card className={cn("flex flex-col h-full w-full", className)}>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Weekly Focus Time by Category
				</CardTitle>
				<CardDescription className="text-xs">
					Stacked hours per category
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0 min-h-0">
				{isLoading ? (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						Loading...
					</div>
				) : (
					<ChartContainer config={{}} className="h-full w-full">
						<BarChart key={`bar-chart-${chartData.length}`} data={chartData}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="day"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={10}
								tickFormatter={(value) => `${value}h`}
								width={50}
								domain={[0, "auto"]}
							/>
							<Tooltip
								formatter={(value: number, name: string) => [`${value}h`, name]}
								labelFormatter={(label) => `Day: ${label}`}
							/>
							<Legend />
							{categoryNames.map((catName, index) => {
								const info = categoryInfoMap.get(catName);
								const isTopBar = index === categoryNames.length - 1;
								return (
									<Bar
										key={catName}
										dataKey={catName}
										stackId="focus"
										fill={softenColor(info?.color || "#888")}
										radius={isTopBar ? [8, 8, 0, 0] : [0, 0, 0, 0]}
										isAnimationActive={true}
										animationBegin={index * 200}
										animationDuration={1000}
										animationEasing="ease-in-out"
									/>
								);
							})}
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
