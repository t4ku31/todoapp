import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Flag, Pencil } from "lucide-react";
import { useState } from "react";

interface EditableDateProps {
	id: number;
	type: "dueDate" | "executionDate";
	date: string | null; // ISO 8601 date string
	onDateChange: (id: number, newDate: string) => Promise<void>;
}

export function EditableDate({ id, type, date, onDateChange }: EditableDateProps) {
	// const [isHovered, setIsHovered] = useState(false); // Removed unused state
	const [isOpen, setIsOpen] = useState(false);

	const currentDate = date ? new Date(date) : undefined;

	const handleSelect = async (newDate: Date | undefined) => {
		if (newDate) {
			const formattedDate = format(newDate, "yyyy-MM-dd");
			setIsOpen(false); // Close popover immediately on selection
			await onDateChange(id, formattedDate);
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"border-none font-normal cursor-pointer",
						type === "dueDate"
							? "bg-red-100 text-red-700 hover:bg-red-200"
							: "bg-blue-100 text-blue-700 hover:bg-blue-200"
					)}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<div className="flex items-center text-sm text-gray-600">
						{type === "dueDate" ? (
							<Flag className="mr-2 h-4 w-4" />
						) : (
							<CalendarIcon className="mr-2 h-4 w-4" />
						)}
						{date ? <span>{format(new Date(date), "M/d")}</span> : <span>{type === "dueDate" ? "期限" : "実行日"}</span>}
					</div>
					<Pencil
						className={cn(
							"ml-2 w-4 h-4 text-gray-400 transition-opacity",
							isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
						)}
					/>
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
