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

import type { PomodoroPhase } from "@/features/pomodoro/types/index";

interface ControlButtonsProps {
	isActive: boolean;
	phase: PomodoroPhase;
	isWhiteNoiseOn: boolean;
	isOvertime?: boolean;
	onPlayPause: () => void;
	onReset: () => void;
	onSkip: () => void;
	onEndSession: () => void;
	onToggleWhiteNoise: () => void;
	onComplete?: () => void;
}

export function ControlButtons({
	isActive,
	phase,
	isWhiteNoiseOn,
	isOvertime = false,
	onPlayPause,
	onReset,
	onSkip,
	onEndSession,
	onToggleWhiteNoise,
	onComplete,
}: ControlButtonsProps) {
	return (
		<>
			{/* Horizontal Control Buttons */}
			<div className="flex items-center justify-center gap-4 py-6">
				{/* White Noise Button */}
				<button
					type="button"
					onClick={onToggleWhiteNoise}
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
					onClick={onReset}
					className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					title="リセット"
				>
					<RotateCcw className="w-5 h-5 text-gray-600" />
				</button>

				{/* Play/Pause/Complete Button */}
				<button
					type="button"
					onClick={isOvertime ? onComplete : onPlayPause}
					className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110
            ${
							isOvertime
								? "bg-gradient-to-r from-orange-500 to-red-500 animate-pulse"
								: isActive
									? phase === "focus"
										? "bg-gradient-to-r from-purple-500 to-pink-500"
										: "bg-gradient-to-r from-emerald-500 to-green-400"
									: phase === "focus"
										? "bg-purple-300 hover:bg-purple-400"
										: "bg-emerald-300 hover:bg-emerald-400"
						}`}
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
					onClick={onSkip}
					className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					title="スキップ"
				>
					<SkipForward className="w-5 h-5 text-gray-600" />
				</button>

				{/* End Session Button */}
				<button
					type="button"
					onClick={onEndSession}
					className="w-12 h-12 rounded-full bg-white hover:bg-red-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					title="セッション終了"
				>
					<LogOut className="w-5 h-5 text-red-500" />
				</button>
			</div>
		</>
	);
}
