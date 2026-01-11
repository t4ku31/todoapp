import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DailyTaskList } from "@/features/todo/components/DailyTaskList";
import { IconBadge } from "@/features/todo/components/ui/IconBadge";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { format, parseISO } from "date-fns";
import { CheckSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DroppableDayButton } from "./DroppableDayButton";

export default function CalendarView() {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date(),
	);
	const [isTaskListExpanded, setIsTaskListExpanded] = useState(false);

	// 	const gridSize = 20; // pixels
	// const snapToGridModifier = createSnapModifier(gridSize);

	// Use Zustand store
	const {
		taskLists,
		allTasks,
		loading,
		fetchTaskLists,
		updateTask,
		deleteTask,
		createTask,
	} = useTodoStore();

	const [month, setMonth] = useState<Date>(new Date());
	const [activeTask, setActiveTask] = useState<Task | null>(null);

	// Configure sensors for precise drag handling
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Start drag after 5px movement
			},
		}),
	);

	// Fetch data on mount
	useEffect(() => {
		fetchTaskLists();
	}, [fetchTaskLists]);

	const handleDragStart = (event: DragStartEvent) => {
		if (event.active.data.current?.task) {
			setActiveTask(event.active.data.current.task);
		}
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveTask(null);
			return;
		}

		const task = active.data.current?.task as Task;
		const newDateString = over.id as string;

		if (task && newDateString && task.executionDate !== newDateString) {
			await updateTask(task.id, { executionDate: newDateString });
		}

		setActiveTask(null);
		setActiveTask(null);
		setSelectedDate(parseISO(newDateString));
	};

	const handlePrevDay = () => {
		if (selectedDate) {
			const newDate = new Date(selectedDate);
			newDate.setDate(selectedDate.getDate() - 1);
			setSelectedDate(newDate);
		}
	};

	const handleNextDay = () => {
		if (selectedDate) {
			const newDate = new Date(selectedDate);
			newDate.setDate(selectedDate.getDate() + 1);
			setSelectedDate(newDate);
		}
	};

	if (loading && taskLists.length === 0) {
		return (
			<div className="h-full flex items-center justify-center">Loading...</div>
		);
	}

	return (
		<DndContext
			sensors={sensors}
			modifiers={[snapCenterToCursor]}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="h-full flex flex-col p-4 md:p-6 gap-4 md:gap-6">
				<h1 className="text-xl md:text-2xl font-bold">
					Task List & Calendar View
				</h1>

				<div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 overflow-hidden">
					{/* Left Column: My Tasks */}
					{/* Mobile: Collapsible, Desktop: Always visible */}
					<Card className="lg:flex-[4] overflow-hidden flex flex-col border-none shadow-xl bg-white md:h-auto lg:h-full">
						{/* Mobile: Collapsible Header */}
						<div className="lg:hidden">
							<button
								type="button"
								onClick={() => setIsTaskListExpanded(!isTaskListExpanded)}
								className="w-full p-4 flex items-center justify-between border-b"
							>
								<div className="flex items-center gap-3">
									<h2 className="text-lg font-bold">
										{selectedDate ? format(selectedDate, "MMM dd") : "No Date"}{" "}
										Tasks
									</h2>
									<span className="text-sm text-gray-500">
										(
										{selectedDate
											? allTasks.filter(
													(t) =>
														t.executionDate ===
														format(selectedDate, "yyyy-MM-dd"),
												).length
											: 0}
										)
									</span>
								</div>
								{isTaskListExpanded ? (
									<ChevronUp className="w-5 h-5 text-gray-600" />
								) : (
									<ChevronDown className="w-5 h-5 text-gray-600" />
								)}
							</button>

							{isTaskListExpanded && (
								<div className="p-4 space-y-4">
									<div className="max-h-[40vh] overflow-y-auto">
										<DailyTaskList
											date={
												selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
											}
											tasks={allTasks}
											onUpdateTask={updateTask}
											onDeleteTask={deleteTask}
											onCreateTask={createTask}
											onPrevDay={handlePrevDay}
											onNextDay={handleNextDay}
											taskListId={taskLists[0]?.id || 0}
											emptyMessage="No tasks for this date."
										/>
									</div>
								</div>
							)}
						</div>

						{/* Desktop: Always visible */}
						<div className="hidden lg:flex lg:flex-col lg:h-full">
							<div className="p-6 shrink-0 space-y-4 pb-0"></div>

							<ScrollArea className="flex-1 p-6 pt-0">
								<DailyTaskList
									date={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
									tasks={allTasks}
									onUpdateTask={updateTask}
									onDeleteTask={deleteTask}
									onCreateTask={createTask}
									onPrevDay={handlePrevDay}
									onNextDay={handleNextDay}
									taskListId={taskLists[0]?.id || 0}
									emptyMessage="No tasks for this date."
								/>
							</ScrollArea>
						</div>
					</Card>

					{/* Right Column: Calendar */}
					<div className="lg:flex-[6] rounded-xl border bg-white p-2 md:p-4 overflow-hidden flex flex-col">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							month={month}
							onMonthChange={setMonth}
							className="w-full h-full p-0"
							classNames={{
								month: "w-full h-full flex flex-col",
								table:
									"w-full h-full border-separate border-spacing-1 md:border-spacing-2 mt-0",
								head_row: "flex w-full mb-1",
								head_cell:
									"text-muted-foreground w-full font-normal text-[0.7rem] md:text-[0.8rem]",
								row: "flex w-full",
								day_button:
									"h-full w-full p-1 md:p-2 font-normal text-left align-top hover:bg-transparent text-xs md:text-sm",
								day: "h-16 md:h-24 lg:h-32 xl:h-40 w-full p-0 font-normal aspect-auto rounded-lg md:rounded-xl border border-gray-200 align-top transition-all hover:shadow-md hover:border-gray-300 bg-card/50",
								cell: "p-0 relative h-full w-full focus-within:relative focus-within:z-20",
								day_selected:
									"bg-transparent text-foreground hover:bg-transparent",
								day_today: "bg-accent/20 border-accent",
								day_outside: "text-muted-foreground opacity-50 bg-gray-50/50",
								day_disabled: "text-muted-foreground opacity-50",
								day_range_middle:
									"aria-selected:bg-accent aria-selected:text-accent-foreground",
								day_hidden: "invisible",
								button_next:
									"w-10 h-10 flex justify-center items-center bg-gray-100 hover:bg-gray-200 rounded-md",
								button_previous:
									"w-10 h-10 flex justify-center items-center bg-gray-100 hover:bg-gray-200 rounded-md",
								caption_label: "text-xl font-bold",
							}}
							modifiers={{}}
							components={{
								DayButton: DroppableDayButton,
							}}
						/>
					</div>
				</div>
				{createPortal(
					<DragOverlay>
						{activeTask ? (
							<div className="opacity-90 rotate-2 cursor-grabbing pointer-events-none">
								<IconBadge
									icon={CheckSquare}
									variant="category"
									color={activeTask.category?.color || "#999"}
								>
									{activeTask.title}
								</IconBadge>
							</div>
						) : null}
					</DragOverlay>,
					document.body,
				)}
			</div>
		</DndContext>
	);
}
