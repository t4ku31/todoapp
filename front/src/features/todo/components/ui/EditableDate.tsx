import { format, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Flag } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EditableDateProps {
	id: number;
	type: "dueDate" | "executionDate";
	date: string | null; // ISO 8601 date string
	onDateChange: (id: number, newDate: string) => Promise<void>;
	onOpenChange?: (open: boolean) => void;
}

export function EditableDate({
	id,
	type,
	date,
	onDateChange,
	onOpenChange,
}: EditableDateProps) {
	// const [isHovered, setIsHovered] = useState(false); // Removed unused state
	const [isOpen, setIsOpen] = useState(false);

	const currentDate = date ? new Date(date) : undefined;

	const handleSelect = async (newDate: Date | undefined) => {
		if (newDate) {
			const formattedDate = format(newDate, "yyyy-MM-dd");
			setIsOpen(false); // Close popover immediately on selection
			await onDateChange(id, formattedDate);
		}
		onOpenChange?.(false);
	};

	return (
		<Popover
			open={isOpen}
			onOpenChange={(newOpen) => {
				setIsOpen(newOpen);
				onOpenChange?.(newOpen);
			}}
		>
			<PopoverTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"border-none font-normal cursor-pointer hover:scale-105 transition-all duration-200",
						type === "dueDate"
							? date && isBefore(new Date(date), startOfDay(new Date()))
								? "bg-rose-500 text-white hover:bg-rose-600" // Expired
								: "bg-amber-400 text-white hover:bg-amber-500" // Not expired
							: "bg-indigo-500 text-white hover:bg-indigo-600",
					)}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<div className="flex items-center text-sm text-gray-600">
						{type === "dueDate" ? (
							<Flag className="mr-2 h-4 w-4 text-white" />
						) : (
							<CalendarIcon className="mr-2 h-4 w-4 text-white" />
						)}
						{date ? (
							<span className="text-white">
								{format(new Date(date), "M/d")}
							</span>
						) : (
							<span>{type === "dueDate" ? "期限" : "実行日"}</span>
						)}
					</div>
				</Badge>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0"
				align="start"
				onPointerDown={(e) => e.stopPropagation()}
			>
				<Calendar
					mode="single"
					selected={currentDate}
					onSelect={handleSelect}
					initialFocus
					className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
				/>
			</PopoverContent>
		</Popover>
	);
}
