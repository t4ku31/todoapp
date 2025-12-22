import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTodoStore } from "@/store/useTodoStore";
import { TaskBadge } from "./TaskBadge";

// Calendar day component that supports drag-and-drop
// This replaces the default DayButton component of react-day-picker
export function DroppableDayButton(props: any) {
	const { day, modifiers, ...buttonProps } = props;
	// Context is removed: const { selectedDate, setSelectedDate } = useCalendarContext();

	const dayDate = day.date;
	const dateKey = format(dayDate, "yyyy-MM-dd");

	// Use store's getTasksForDate
	const getTasksForDate = useTodoStore((state) => state.getTasksForDate);
	const tasksForDay = getTasksForDate(dateKey);

	// Limit displayed tasks to 3 to prevent layout overflow
	const displayTasks = tasksForDay.slice(0, 3);
	const remainingCount = tasksForDay.length - displayTasks.length;

	// Check if this day is currently selected by the user using modifiers provided by react-day-picker
	const isSelected = modifiers?.selected;

	// Make this day a "Droppable" zone for drag-and-drop
	// 'isOver' becomes true when a draggable item is hovering over this element
	const { setNodeRef, isOver } = useDroppable({
		id: dateKey, // Unique ID for this drop zone (e.g., "2023-10-25")
	});

	return (
		<Button
			ref={setNodeRef} // Attach droppable ref
			{...buttonProps} // Pass through default props to keep calendar functionality working within click handling
			variant="ghost"
			// onClick is handled by buttonProps from react-day-picker
			className={`h-full w-full p-2 text-left align-top font-normal hover:bg-transparent rounded-xl flex flex-col items-start justify-start gap-2
				${isSelected ? "ring-3 ring-gray-400 ring-offset-1" : ""} 
				${isOver ? "bg-blue-50 ring-1 ring-blue-400" : ""} 
			`}
		>
			{/* Date number display (e.g., "15") */}
			<div
				className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
					isSameDay(dayDate, new Date()) // Highlight today's date
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground"
				}`}
			>
				{format(dayDate, "d")}
			</div>

			{/* Task badges for this day (display only, not draggable) */}
			{/* Show dots until xl, show full badges on 2xl and above */}
			<div className="flex flex-col gap-1 w-full overflow-hidden">
				{/* Dots for xl and below */}
				<div className="flex flex-wrap gap-1 2xl:hidden">
					{displayTasks.map((task) => (
						<div
							key={task.id}
							className="w-2 h-2 rounded-full"
							style={{ backgroundColor: task.category?.color || "#6b7280" }}
							title={task.title}
						/>
					))}
					{remainingCount > 0 && (
						<div className="w-2 h-2 rounded-full bg-gray-300 flex items-center justify-center text-[6px]">
							+
						</div>
					)}
				</div>
				{/* Full badges for 2xl and above */}
				<div className="hidden 2xl:flex 2xl:flex-col 2xl:gap-1 w-full max-w-full overflow-hidden">
					{displayTasks.map((task) => (
						<TaskBadge key={task.id} task={task} />
					))}
					{remainingCount > 0 && (
						<div className="text-[10px] text-muted-foreground pl-1 font-medium">
							+{remainingCount} more
						</div>
					)}
				</div>
			</div>
		</Button>
	);
}
