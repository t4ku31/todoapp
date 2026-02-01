import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PomodoroInput } from "./PomodoroInput";

interface EditableDurationProps {
	id: number;
	duration: number | null | undefined;
	onDurationChange: (id: number, duration: number | undefined) => Promise<void>;
	onOpenChange?: (open: boolean) => void;
}

// Format minutes to "Xmin" or "Xh Ym" format
const formatDuration = (minutes: number): string => {
	if (minutes < 60) {
		return `${minutes}min`;
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours}h${mins.toString().padStart(2, "0")}m`;
};

export function EditableDuration({
	id,
	duration,
	onDurationChange,
	onOpenChange,
}: EditableDurationProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [localValue, setLocalValue] = useState(duration ?? 0);
	const contentRef = useRef<HTMLDivElement>(null);

	const handleConfirm = () => {
		if (localValue !== duration) {
			onDurationChange(id, localValue || undefined);
		}
		setIsOpen(false);
		onOpenChange?.(false);
	};

	// Handle Enter key to confirm and close
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleConfirm();
			} else if (e.key === "Escape") {
				e.preventDefault();
				setIsOpen(false);
				onOpenChange?.(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	});

	const handleOpenChange = (newOpen: boolean) => {
		setIsOpen(newOpen);
		onOpenChange?.(newOpen);

		if (newOpen) {
			// Reset to current duration when opening
			setLocalValue(duration ?? 0);
		}
	};

	const pomodoroValue = duration ?? 0;

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"border-none font-normal cursor-pointer hover:scale-105 transition-all duration-200",
						pomodoroValue > 0
							? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
							: "text-muted-foreground hover:bg-gray-100/80 hover:text-gray-700",
					)}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<div className="flex items-center text-sm gap-1.5">
						{/* Pomodoro bars visualization - left side */}
						<div className="flex flex-col-reverse justify-between w-3 h-3">
							{[0, 1, 2, 3].map((i) => (
								<div
									key={`bar-${i}`}
									className={cn(
										"w-full h-[2px] rounded-[1px] transition-colors",
										i < (pomodoroValue > 4 ? 4 : pomodoroValue)
											? "bg-current"
											: "border border-current opacity-40",
									)}
								/>
							))}
						</div>
						{/* Show "+N" for values > 4, similar to PomodoroInput */}
						{pomodoroValue > 4 ? (
							<span className="font-bold">+{pomodoroValue - 4}</span>
						) : pomodoroValue > 0 ? (
							<span>{pomodoroValue}</span>
						) : (
							<span>ポモ</span>
						)}
					</div>
				</Badge>
			</PopoverTrigger>
			<PopoverContent
				ref={contentRef}
				className="w-auto p-3"
				align="start"
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div className="space-y-3">
					<p className="text-xs font-semibold text-center text-gray-500">
						Estimated Pomodoros
					</p>
					<div className="flex items-center justify-center">
						<div className="flex justify-center">
							<PomodoroInput
								value={localValue}
								onChange={setLocalValue}
								max={10}
								color="text-indigo-500"
								className="scale-125"
							/>
						</div>
					</div>
					{/* Minute conversion display */}
					<div className="text-center space-y-1">
						<p className="text-sm font-medium text-indigo-600">
							= {formatDuration(localValue * 25)}
						</p>
						{localValue !== pomodoroValue && (
							<p
								className={cn(
									"text-xs font-medium",
									localValue > pomodoroValue
										? "text-green-600"
										: "text-red-500",
								)}
							>
								{localValue > pomodoroValue ? "+" : ""}
								{formatDuration(Math.abs(localValue - pomodoroValue) * 25)}
							</p>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
