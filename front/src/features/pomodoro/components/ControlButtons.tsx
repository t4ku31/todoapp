import {
	LogOut,
	Pause,
	Play,
	Repeat2,
	RotateCcw,
	SkipForward,
	Volume2,
	VolumeX,
} from "lucide-react";

import type { PomodoroPhase } from "@/store/usePomodoroStore";

interface ControlButtonsProps {
	isActive: boolean;
	phase: PomodoroPhase;
	isWhiteNoiseOn: boolean;
	autoAdvance: boolean;
	onPlayPause: () => void;
	onReset: () => void;
	onSkip: () => void;
	onEndSession: () => void;
	onToggleWhiteNoise: () => void;
	onToggleAutoAdvance: () => void;
	volume: number;
	onVolumeChange: (volume: number) => void;
}

export function ControlButtons({
	isActive,
	phase,
	isWhiteNoiseOn,
	autoAdvance,
	onPlayPause,
	onReset,
	onSkip,
	onEndSession,
	onToggleWhiteNoise,
	onToggleAutoAdvance,
	volume,
	onVolumeChange,
}: ControlButtonsProps) {
	return (
		<>
			{/* Circular Icon Buttons */}
			<div className="relative w-80 h-24 -mt-4">
				{/* White Noise Button */}
				<button
					type="button"
					onClick={onToggleWhiteNoise}
					className={`absolute w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110
            ${
							isWhiteNoiseOn
								? "bg-purple-500 text-white"
								: "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
						}`}
					style={{ left: "10%", top: "30%" }}
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
					className="absolute w-11 h-11 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					style={{ left: "25%", top: "50%" }}
					title="リセット"
				>
					<RotateCcw className="w-5 h-5 text-gray-600" />
				</button>

				{/* Play/Pause Button */}
				<button
					type="button"
					onClick={onPlayPause}
					className={`absolute w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110
            ${
							isActive
								? phase === "focus"
									? "bg-gradient-to-r from-purple-500 to-pink-500"
									: "bg-gradient-to-r from-emerald-500 to-green-400"
								: phase === "focus"
									? "bg-purple-300 hover:bg-purple-400"
									: "bg-emerald-300 hover:bg-emerald-400"
						}`}
					style={{ left: "50%", top: "60%", transform: "translateX(-50%)" }}
				>
					{isActive ? (
						<Pause className="w-6 h-6 text-white fill-current" />
					) : (
						<Play className="w-6 h-6 text-white fill-current ml-0.5" />
					)}
				</button>

				{/* Skip Forward Button */}
				<button
					type="button"
					onClick={onSkip}
					className="absolute w-11 h-11 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					style={{ right: "25%", top: "50%" }}
					title="スキップ"
				>
					<SkipForward className="w-5 h-5 text-gray-600" />
				</button>

				{/* End Session Button */}
				<button
					type="button"
					onClick={onEndSession}
					className="absolute w-11 h-11 rounded-full bg-white hover:bg-red-50 flex items-center justify-center shadow-lg transition-all hover:scale-110 border border-gray-200"
					style={{ right: "10%", top: "30%" }}
					title="セッション終了"
				>
					<LogOut className="w-5 h-5 text-red-500" />
				</button>
			</div>

			{/* Controls Row: Auto-advance & Volume */}
			<div className="flex flex-col items-center gap-4 pt-8 w-full max-w-xs px-4">
				<div className="flex items-center justify-center w-full">
					{/* Auto-advance toggle */}
					<button
						type="button"
						onClick={onToggleAutoAdvance}
						className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition-all hover:scale-105
            ${
							autoAdvance
								? "bg-purple-500 text-white"
								: "bg-white text-gray-600 border border-gray-200"
						}`}
					>
						<Repeat2 className="w-4 h-4" />
						<span className="text-sm font-medium">
							{autoAdvance ? "自動切り替え ON" : "自動切り替え OFF"}
						</span>
					</button>
				</div>

				{/* Volume Slider - Only visible if White Noise is ON */}
				{isWhiteNoiseOn && (
					<div className="w-full bg-white/50 rounded-lg p-3 flex items-center gap-3">
						{volume === 0 ? (
							<VolumeX className="w-4 h-4 text-gray-600" />
						) : (
							<Volume2 className="w-4 h-4 text-gray-600" />
						)}
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={volume}
							onChange={(e) =>
								onVolumeChange(Number.parseFloat(e.target.value))
							}
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
						/>
					</div>
				)}
			</div>
		</>
	);
}
