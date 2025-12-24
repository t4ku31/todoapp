import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

import { usePomodoroStore } from "@/store/usePomodoroStore";

interface FocusCircleProps {
	showLabel?: boolean;
}

export function FocusCircle({ showLabel = true }: FocusCircleProps) {
	const { dailyFocusTime, settings, fetchDailySummary } = usePomodoroStore();

	// Fetch daily summary on mount
	useEffect(() => {
		fetchDailySummary();
	}, [fetchDailySummary]);

	// Calculate values
	const currentMinutes = Math.floor(dailyFocusTime / 60);
	const goalMinutes = settings.dailyGoal;
	const progressPercent = Math.min((currentMinutes / goalMinutes) * 100, 100);

	// Progress circle calculation (circumference = 2 * PI * radius)
	const circumference = 2 * Math.PI * 40; // radius = 40
	const strokeDashoffset = circumference * (1 - progressPercent / 100);

	return (
		<div className="flex flex-col items-center gap-2">
			{showLabel && (
				<h3 className="text-sm font-medium text-gray-500">Today's Focus:</h3>
			)}
			<div className="flex-col flex items-center relative w-24 h-24">
				{/* Circular Progress */}
				<svg
					className="w-full h-full"
					viewBox="0 0 100 100"
					aria-label="Progress circle"
					role="img"
				>
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke="#e5e7eb"
						strokeWidth="8"
					/>
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke="url(#gradient)"
						strokeWidth="8"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						transform="rotate(-90 50 50)"
						style={{ transition: "stroke-dashoffset 0.5s ease" }}
					/>
					<defs>
						<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#8b5cf6" />
							<stop offset="100%" stopColor="#ec4899" />
						</linearGradient>
					</defs>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					{progressPercent >= 100 ? (
						<CheckCircle className="w-8 h-8 text-green-500" />
					) : (
						<span className="text-lg font-bold text-purple-600">
							{Math.round(progressPercent)}%
						</span>
					)}
				</div>
			</div>

			<div className="text-center">
				<span className="text-2xl font-bold text-purple-600">
					{currentMinutes}
				</span>
				<span className="text-gray-400"> / {goalMinutes}分 Goal</span>
			</div>
		</div>
	);
}
