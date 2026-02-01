import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TimelineSession } from "@/features/analytics/types";

interface HourlyActivityChartProps {
	sessions: TimelineSession[];
}

export function HourlyActivityChart({ sessions }: HourlyActivityChartProps) {
	// 1. Initialize 24 hours
	const hours = Array.from({ length: 24 }, (_, i) => ({
		hour: i,
		minutes: 0,
		label: `${i}:00`,
	}));

	// 2. Distribute session duration across hours
	sessions.forEach((session) => {
		const start = new Date(session.start);
		let currentHour = start.getHours();
		let remainingMinutes = session.actual; // Use actual duration
		// Start minute offset
		let currentMinute = start.getMinutes();

		while (remainingMinutes > 0 && currentHour < 24) {
			const minutesInCurrentHour = Math.min(
				remainingMinutes,
				60 - currentMinute,
			);
			hours[currentHour].minutes += minutesInCurrentHour;

			remainingMinutes -= minutesInCurrentHour;
			currentHour++;
			currentMinute = 0; // Next hours start at 0
		}
	});

	// Find max for YAxis domain? Or just auto.

	return (
		<Card className="flex flex-col h-full bg-white shadow-sm border-gray-100 p-4">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-sm font-semibold text-gray-600">
					Hourly Focus Distribution
				</h3>
				<Badge variant="outline" className="text-xs">
					Minutes / Hour
				</Badge>
			</div>

			<div className="flex-1 min-h-[200px]">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={hours}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<XAxis
							dataKey="label"
							fontSize={10}
							tickLine={false}
							axisLine={false}
							interval={2}
						/>
						<YAxis fontSize={10} tickLine={false} axisLine={false} />
						<Tooltip
							cursor={{ fill: "#f3f4f6" }}
							contentStyle={{
								backgroundColor: "#fff",
								borderRadius: "8px",
								border: "1px solid #e5e7eb",
								boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
							}}
							formatter={(value: number) => [`${value} min`, "Focus"]}
						/>
						<Bar
							dataKey="minutes"
							fill="#8b5cf6"
							radius={[4, 4, 0, 0]}
							maxBarSize={40}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}
