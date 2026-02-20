import {
	Check,
	LogOut,
	Pause,
	Play,
	RotateCcw,
	SkipForward,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePomodoroStore } from "@/features/pomodoro/stores/usePomodoroStore";
import { PomodoroPhase } from "@/features/pomodoro/types";

export function ControlButtons() {
	const navigate = useNavigate();
	const {
		isActive,
		phase,
		isOvertime,
		settings,
		startTimer,
		pauseTimer,
		resetTimer,
		skipPhase,
		completeSession,
		setFocusTask,
		updateSettings,
	} = usePomodoroStore();

	const isWhiteNoiseOn = settings.whiteNoise !== "none";

	const handlePlayPause = () => {
		if (isOvertime) {
			completeSession();
			return;
		}
		isActive ? pauseTimer() : startTimer();
	};

	const handleEndSession = () => {
		resetTimer();
		setFocusTask(null);
		navigate("/home");
	};

	const toggleWhiteNoise = () => {
		updateSettings({ whiteNoise: isWhiteNoiseOn ? "none" : "white-noise" });
	};

	const getMainButtonClass = () => {
		if (isOvertime) {
			return "bg-gradient-to-r from-orange-500 to-red-500 animate-pulse";
		}
		if (isActive) {
			return phase === PomodoroPhase.FOCUS
				? "bg-gradient-to-r from-purple-500 to-pink-500"
				: "bg-gradient-to-r from-emerald-500 to-green-400";
		}
		return phase === PomodoroPhase.FOCUS
			? "bg-purple-300 hover:bg-purple-400"
			: "bg-emerald-300 hover:bg-emerald-400";
	};

	return (
		<>
			{/* Horizontal Control Buttons */}
			<div className="flex items-center justify-center gap-4 py-6">
				{/* White Noise Button */}
				<button
					type="button"
					onClick={toggleWhiteNoise}
					className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110
            ${
							isWhiteNoiseOn
								? "bg-purple-500 text-white"
								: "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
						}`}
					title="ホワイトノイズ"
				>
					{isWhiteNoiseOn ? (
						<Volume2 className="w-5 h-5" />
					) : (
						<VolumeX className="w-5 h-5" />
					)}
				</button>

				{/* Reset Button */}
				<button
					type="button"
					onClick={resetTimer}
					className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					title="リセット"
				>
					<RotateCcw className="w-5 h-5 text-gray-600" />
				</button>

				{/* Play/Pause/Complete Button */}
				<button
					type="button"
					onClick={isOvertime ? completeSession : handlePlayPause}
					className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 ${getMainButtonClass()}`}
				>
					{isOvertime ? (
						<Check className="w-8 h-8 text-white stroke-[3]" />
					) : isActive ? (
						<Pause className="w-8 h-8 text-white fill-current" />
					) : (
						<Play className="w-8 h-8 text-white fill-current ml-1" />
					)}
				</button>

				{/* Skip Forward Button */}
				<button
					type="button"
					onClick={skipPhase}
					className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					title="スキップ"
				>
					<SkipForward className="w-5 h-5 text-gray-600" />
				</button>

				{/* End Session Button */}
				<button
					type="button"
					onClick={handleEndSession}
					className="w-12 h-12 rounded-full bg-white hover:bg-red-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					title="セッション終了"
				>
					<LogOut className="w-5 h-5 text-red-500" />
				</button>
			</div>
		</>
	);
}
