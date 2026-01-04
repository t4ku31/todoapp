import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

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
	color = "text-purple-500",
}: PomodoroInputProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isDraggingRef = useRef(false);
	const dragStartYRef = useRef(0);
	const accumulatedDeltaRef = useRef(0);
	const hasDraggedRef = useRef(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (e.deltaY < 0) {
				onChange(Math.min(value + 1, max));
			} else {
				onChange(Math.max(value - 1, 0));
			}
		};

		const handleMouseDown = (e: MouseEvent) => {
			// Only handle left click
			if (e.button !== 0) return;
			isDraggingRef.current = true;
			dragStartYRef.current = e.clientY;
			accumulatedDeltaRef.current = 0;
			hasDraggedRef.current = false;
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDraggingRef.current) return;

			const deltaY = dragStartYRef.current - e.clientY;
			accumulatedDeltaRef.current += deltaY;
			dragStartYRef.current = e.clientY;

			// Threshold: 20px of movement = 1 unit change
			const threshold = 15;
			if (Math.abs(accumulatedDeltaRef.current) >= threshold) {
				hasDraggedRef.current = true;
				const change = Math.sign(accumulatedDeltaRef.current);
				accumulatedDeltaRef.current = 0;

				if (change > 0) {
					onChange(Math.min(value + 1, max));
				} else {
					onChange(Math.max(value - 1, 0));
				}
			}
		};

		const handleMouseUp = () => {
			isDraggingRef.current = false;
			accumulatedDeltaRef.current = 0;
		};

		container.addEventListener("wheel", handleWheel, { passive: false });
		container.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			container.removeEventListener("wheel", handleWheel);
			container.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [value, onChange, max]);

	return (
		<div
			ref={containerRef}
			className={cn(
				"flex items-center gap-1 cursor-pointer select-none hover:bg-gray-100 rounded p-1 transition-colors outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500",
				color,
				className,
			)}
			onClick={() => {
				// Don't fire click if we just finished dragging
				if (hasDraggedRef.current) {
					hasDraggedRef.current = false;
					return;
				}
				onChange(value >= max ? 0 : value + 1);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onChange(value >= max ? 0 : value + 1);
				}
			}}
			tabIndex={0}
			role="spinbutton"
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={max}
			onContextMenu={(e) => {
				e.preventDefault();
				onChange(Math.max(0, value - 1));
			}}
		>
			<div className="flex items-end gap-[2px] h-5">
				{/* Vertical Stack of Horizontal Bars */}
				<div className="flex flex-col-reverse justify-between w-4 h-[18px]">
					{["bar-bottom", "bar-lower", "bar-upper", "bar-top"].map(
						(barId, i) => {
							// i=0 is bottom
							// 4 bars total
							const visuallyFilled = i < (value > 4 ? 4 : value);

							return (
								<div
									key={barId}
									className={cn(
										"w-full h-[3px] rounded-[1px] transition-colors",
										visuallyFilled
											? "bg-current"
											: "bg-gray-200 border border-gray-300",
									)}
									style={{
										backgroundColor: visuallyFilled ? undefined : "transparent",
										borderColor: visuallyFilled ? undefined : "currentColor",
										opacity: visuallyFilled ? 1 : 0.4,
									}}
								/>
							);
						},
					)}
				</div>
			</div>

			{value > 4 && (
				<span className={cn("text-xs font-bold leading-none", color)}>
					+{value - 4}
				</span>
			)}
		</div>
	);
}
