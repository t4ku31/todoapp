import { CheckCircle } from "lucide-react";

interface FocusCircleProps {
	current: string;
	goal: string;
	showLabel?: boolean;
}

export function FocusCircle({
	current,
	goal,
	showLabel = true,
}: FocusCircleProps) {
	return (
		<div className="flex flex-col items-center gap-2">
			{showLabel && (
				<h3 className="text-sm font-medium text-gray-500">Today's Focus:</h3>
			)}
			<div className="flex-col flex items-center relative w-24 h-24">
				{/* Circular Progress Placeholder */}
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
						strokeDasharray="251.2"
						strokeDashoffset="100"
						strokeLinecap="round"
						transform="rotate(-90 50 50)"
					/>
					<defs>
						<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#8b5cf6" />
							<stop offset="100%" stopColor="#ec4899" />
						</linearGradient>
					</defs>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<CheckCircle className="w-8 h-8 text-purple-500" />
				</div>
			</div>

			<div className="text-center">
				<span className="text-2xl font-bold text-purple-600">{current}</span>
				<span className="text-gray-400"> / {goal} Goal</span>
			</div>
		</div>
	);
}
