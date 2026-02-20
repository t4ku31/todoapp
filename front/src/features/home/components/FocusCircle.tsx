import { CheckCircle, Target } from "lucide-react";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { usePomodoroStore } from "@/features/pomodoro/stores/usePomodoroStore";
import { PomodoroPhase } from "@/features/pomodoro/types";
import { cn } from "@/lib/utils";

interface FocusCircleProps {
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function FocusCircle({ className, size = "md" }: FocusCircleProps) {
	const {
		dailyFocusTime,
		settings,
		fetchDailySummary,
		dailyGoalData,
		fetchDailyGoal,
		timeLeft,
		duration,
		phase,
	} = usePomodoroStore();

	// Fetch daily summary and goal on mount
	useEffect(() => {
		fetchDailySummary();
		fetchDailyGoal();
	}, [fetchDailySummary, fetchDailyGoal]);

	// Calculate values
	const baseMinutes =
		dailyGoalData?.actualMinutes ?? Math.floor(dailyFocusTime / 60);
	// Calculate current session focus time (only if in focus phase)
	const currentSessionSeconds =
		phase === PomodoroPhase.FOCUS ? duration - timeLeft : 0;
	// Only count if active or paused? Actually duration-timeLeft is elapsed time.
	// But if we are in break, we don't count it.
	const currentSessionMinutes = Math.floor(currentSessionSeconds / 60);
	const currentMinutes = baseMinutes + currentSessionMinutes;

	const goalMinutes = dailyGoalData?.goalMinutes ?? settings.dailyGoal;
	const progressPercent =
		goalMinutes > 0 ? Math.min((currentMinutes / goalMinutes) * 100, 100) : 0;

	// Progress circle calculation
	const circumference = 2 * Math.PI * 43;
	const strokeDashoffset = circumference * (1 - progressPercent / 100);

	// Size configurations
	// Size configurations
	const sizeConfig = {
		sm: {
			percentText: "text-sm",
			iconSize: "w-9 h-9",
			labelText: "text-base",
			subText: "text-[10px]",
			padding: "p-1",
			containerSize: "max-w-24 max-h-24",
		},
		md: {
			percentText: "text-2xl",
			iconSize: "w-10 h-10",
			labelText: "text-xl",
			subText: "text-xs",
			padding: "p-2",
			containerSize: "max-w-48 max-h-48",
		},
		lg: {
			percentText: "text-4xl",
			iconSize: "w-16 h-16",
			labelText: "text-3xl",
			subText: "text-base",
			padding: "p-6",
			containerSize: "max-w-96 max-h-96",
		},
	};

	const config = sizeConfig[size];

	return (
		<Card className={cn("flex flex-col h-full", config.padding, className)}>
			<div className="flex w-full items-center gap-2 mb-2 px-1">
				<Target className="w-4 h-4 text-gray-500" />
				<h3 className="text-sm font-medium text-gray-500">Today's Focus:</h3>
			</div>
			<div className="flex-1 w-full flex items-center justify-center min-h-0">
				<div
					className={cn(
						"flex-col flex items-center justify-center relative w-full h-full",
						config.containerSize,
					)}
				>
					{/* Circular Progress */}
					<svg
						className="w-full h-full"
						viewBox="0 0 100 100"
						aria-label={`Focus progress: ${currentMinutes} of ${goalMinutes} minutes (${Math.round(
							progressPercent,
						)}%)`}
						role="img"
					>
						<circle
							cx="50"
							cy="50"
							r="43"
							fill="none"
							stroke="#e5e7eb"
							strokeWidth="13"
						/>
						<circle
							cx="50"
							cy="50"
							r="43"
							fill="none"
							stroke="url(#focusCircleGradient)"
							strokeWidth="13"
							strokeDasharray={circumference}
							strokeDashoffset={
								isValid(strokeDashoffset) ? strokeDashoffset : circumference
							}
							transform="rotate(-90 50 50)"
							style={{
								transition: "stroke-dashoffset 0.5s ease",
								strokeLinecap: "round",
							}}
						/>
						<defs>
							<linearGradient
								id="focusCircleGradient"
								x1="0%"
								y1="0%"
								x2="100%"
								y2="0%"
							>
								<stop offset="0%" stopColor="#8b5cf6" />
								<stop offset="100%" stopColor="#ec4899" />
							</linearGradient>
						</defs>
					</svg>
					<div className="absolute inset-0 flex items-center justify-center">
						{progressPercent >= 100 ? (
							<CheckCircle className={cn("text-green-500", config.iconSize)} />
						) : (
							<div className="flex flex-col items-center justify-center">
								<span
									className={cn(
										"font-bold pt-2 pl-1 text-purple-600 leading-none",
										config.percentText,
									)}
								>
									{Math.round(progressPercent)}%
								</span>
								<span
									className={cn("text-gray-500 leading-tight", config.subText)}
								>
									{currentMinutes} / {goalMinutes} m
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}

// Helper to check for NaN/Infinity
function isValid(num: number) {
	return !Number.isNaN(num) && Number.isFinite(num);
}
