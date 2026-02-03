import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Timer } from "lucide-react";

interface PomodoroInputProps {
	value?: number;
	onChange: (value: number) => void;
	max?: number;
	className?: string;
	color?: string;
}

export function PomodoroInput({
	value = 0,
	onChange,
	max = 10,
	className,
	color,
}: PomodoroInputProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = Number.parseInt(e.target.value, 10);
		if (Number.isNaN(newValue)) return;
		onChange(Math.min(Math.max(newValue, 0), max));
	};

	const handleIncrement = () => {
		if (value < max) onChange(value + 1);
	};

	const handleDecrement = () => {
		if (value > 0) onChange(value - 1);
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border shadow-sm transition-all duration-200",
				value > 0
					? "bg-indigo-50 border-indigo-100 text-indigo-700"
					: "bg-white border-gray-200 hover:border-gray-300 text-gray-600",
				className,
			)}
		>
			<Timer
				className={cn(
					"h-3.5 w-3.5 pointer-events-none transition-colors opacity-80",
					value > 0 ? "text-indigo-700" : "text-gray-400",
				)}
			/>
			<div className="relative flex items-center gap-0.5">
				<Input
					type="number"
					value={value}
					onChange={handleChange}
					min={0}
					max={max}
					className={cn(
						// Reset standard Input styles
						"h-auto p-0 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
						// Dimensions and text alignment
						"w-5 text-sm font-medium text-center leading-none",
						// Hide browser default spinners
						"[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
						value > 0 ? "text-indigo-700" : "text-gray-700",
						color,
					)}
				/>
				{/* Custom Spin Buttons */}
				<div className="flex flex-col ">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-3 w-4 hover:bg-indigo-100/50 text-gray-400 hover:text-indigo-600 rounded-sm"
						onClick={handleIncrement}
						disabled={value >= max}
					>
						<ChevronUp className="h-2.5 w-2.5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-3 w-4 hover:bg-indigo-100/50 text-gray-400 hover:text-indigo-600 rounded-sm"
						onClick={handleDecrement}
						disabled={value <= 0}
					>
						<ChevronDown className="h-2.5 w-2.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
