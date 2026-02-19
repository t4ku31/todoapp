import { Card } from "@/components/ui/card";
import { usePomodoroStore } from "@/features/pomodoro/stores/usePomodoroStore";
import { PomodoroPhase } from "@/features/pomodoro/types";
import { Minus, Plus } from "lucide-react";

export function TimerRing() {
	const {
		timeLeft,
		duration,
		phase,
		dailyFocusTime,
		settings,
		adjustTime,
		overtime,
		isOvertime,
	} = usePomodoroStore();

	// Calculate progress
	const totalDuration = duration;
	const progress = Math.min(
		100,
		((totalDuration - timeLeft) / totalDuration) * 100,
	);

	// Format time
	const displayTime = isOvertime ? overtime : timeLeft;
	const minutes = Math.floor(displayTime / 60);
	const seconds = displayTime % 60;
	const sign = isOvertime ? "+" : "";
	const formattedTime = `${sign}${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

	// Simple phase logic for colors
	const isFocus = phase === PomodoroPhase.FOCUS;
	const strokeColor = isFocus ? "#a855f7" : "#22c55e"; // purple-500 : green-500

	return (
		<Card className="relative w-80 h-80 flex items-center justify-center rounded-full border-none shadow-xl bg-white/80 backdrop-blur-sm">
			{/* SVG Ring */}
			<svg
				className="w-full h-full transform -rotate-90 drop-shadow-xl"
				viewBox="0 0 100 100"
			>
				<title>Timer Progress</title>
				{/* Background Track */}
				<circle
					cx="50"
					cy="50"
					r="45"
					fill="none"
					stroke="rgba(0,0,0,0.05)"
					strokeWidth="6"
				/>
				{/* Progress Track */}
				<circle
					cx="50"
					cy="50"
					r="45"
					fill="none"
					stroke={strokeColor}
					strokeWidth="6"
					strokeLinecap="round"
					strokeDasharray={2 * Math.PI * 45}
					strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
					className="transition-all duration-500 ease-in-out"
				/>
			</svg>

			{/* Center Content */}
			<div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800">
				<div className="text-6xl font-black tracking-tighter drop-shadow-sm text-gray-700">
					{formattedTime}
				</div>

				<div className="flex items-center gap-6 mt-2">
					<button
						type="button"
						onClick={() => adjustTime(-60)}
						className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
					>
						<Minus className="w-5 h-5" />
					</button>

					<div className="text-sm font-bold uppercase tracking-widest text-gray-500">
						{phase === PomodoroPhase.FOCUS ? "FOCUS" : "BREAK"}
					</div>

					<button
						type="button"
						onClick={() => adjustTime(60)}
						className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
					>
						<Plus className="w-5 h-5" />
					</button>
				</div>

				<div className="mt-3 text-xs font-semibold text-gray-400">
					Today: {Math.floor(dailyFocusTime / 60)} / {settings.dailyGoal} min
				</div>
			</div>
		</Card>
	);
}
