import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateTaskForm } from "@/features/todo/components/forms/CreateTaskForm";
import { TaskItem } from "@/features/todo/components/TaskItem";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { format, isSameDay, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarContext } from "../context/CalendarContext";
import { DraggableTaskItem } from "./DraggableTaskItem";
import { DroppableDayButton } from "./DroppableDayButton";



export default function CalendarView() {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
	const [isTaskListExpanded, setIsTaskListExpanded] = useState(false);

// 	const gridSize = 20; // pixels
// const snapToGridModifier = createSnapModifier(gridSize);
	
	// Use Zustand store
	const { taskLists, loading, fetchTaskLists, updateTask, deleteTask, createTask } = useTodoStore();
	
	const [taskForDate, setTaskForDate] = useState<Task[]>([]);
	const [month, setMonth] = useState<Date>(new Date());
	const [activeTask, setActiveTask] = useState<Task | null>(null);

	// Configure sensors for precise drag handling
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // Start drag after 5px movement
			},
		})
	);

	// Fetch data on mount
	useEffect(() => {
		fetchTaskLists();
	}, [fetchTaskLists]);

	// Filter tasks based on selected date (executionDate only for calendar)
	useEffect(() => {
		if (!selectedDate) {
			setTaskForDate([]);
			return;
		}

		const tasksForSelectedDate: Task[] = [];

		taskLists.forEach((taskList) => {
			if (taskList.tasks) {
				const filtered = taskList.tasks.filter((task) => {
					// Show tasks scheduled for execution on this date
					const hasExecutionDate =
						task.executionDate && isSameDay(parseISO(task.executionDate), selectedDate);
					const hasDueDate = false; // Due dates shown in task list only
					return hasExecutionDate || hasDueDate;
				});
				tasksForSelectedDate.push(...filtered);
			}
		});
		setTaskForDate(tasksForSelectedDate);
	}, [selectedDate, taskLists]);

	const handleDragStart = (event: DragStartEvent) => {
		if (event.active.data.current?.task) {
			setActiveTask(event.active.data.current.task);
		}
	};

	const handleDragEnd = async(event: DragEndEvent) => {
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
		setSelectedDate(parseISO(newDateString));
	};

	if (loading && taskLists.length === 0) {
		return (
			<div className="h-full flex items-center justify-center">Loading...</div>
		);
	}

	return (
		<DndContext sensors={sensors} modifiers={[snapCenterToCursor]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<CalendarContext.Provider value={{ selectedDate, setSelectedDate }}>
				<div className="h-full flex flex-col p-4 md:p-6 gap-4 md:gap-6 bg-gradient-to-r from-blue-300 to-purple-400">
					<h1 className="text-xl md:text-2xl font-bold">Task List & Calendar View</h1>

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
											{selectedDate ? format(selectedDate, "MMM dd") : "No Date"} Tasks
										</h2>
										<span className="text-sm text-gray-500">
											({taskForDate.length})
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
										<CreateTaskForm 
											taskListId={taskLists[0]?.id || 0}
											onCreateTask={createTask}
											defaultExecutionDate={selectedDate}
											className="w-full"
											showExecutionDate={false}
										/>
										{/* Mobile: Vertical scroll, Tablet: Horizontal scroll */}
										<div className="md:overflow-x-auto md:pb-2">
											<div className="space-y-3 md:space-y-0 md:flex md:gap-3 max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
												{taskForDate.map((task) => (
													<div key={task.id} className="md:w-[400px] md:shrink-0">
														<TaskItem
															task={task}
															onUpdateTask={updateTask}
															onDeleteTask={deleteTask}
														/>
													</div>
												))}
												{taskForDate.length === 0 && (
													<div className="text-center py-6 text-muted-foreground text-sm">
														No tasks for this date.
													</div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Desktop: Always visible */}
							<div className="hidden lg:flex lg:flex-col lg:h-full">
								<div className="p-6 shrink-0 space-y-4">
									<h2 className="text-xl font-bold">
										{selectedDate ? format(selectedDate, "yyyy-MM-dd") : "No Date Selected"} Tasks
									</h2>
									<CreateTaskForm 
										taskListId={taskLists[0]?.id || 0}
										onCreateTask={createTask}
										defaultExecutionDate={selectedDate}
										className="w-full"
										showExecutionDate={false}
									/>
								</div>

								<ScrollArea className="flex-1 p-6 pt-0">
									<div className="space-y-4">
										{taskForDate.map((task) => (
											<TaskItem
												key={task.id}
												task={task}
												onUpdateTask={updateTask}
												onDeleteTask={deleteTask}
											/>
										))}
										{taskForDate.length === 0 && (
											<div className="text-center py-8 text-muted-foreground">
												No tasks for this date.
											</div>
										)}
									</div>
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
									table: "w-full h-full border-separate border-spacing-1 md:border-spacing-2 mt-0",
									head_row: "flex w-full mb-1",
									head_cell:
										"text-muted-foreground w-full font-normal text-[0.7rem] md:text-[0.8rem]",
									row: "flex w-full",
									day_button:
										"h-full w-full p-1 md:p-2 font-normal text-left align-top hover:bg-transparent text-xs md:text-sm",
									day: "h-16 md:h-24 lg:h-32 xl:h-40 w-full p-0 font-normal aspect-auto rounded-lg md:rounded-xl border border-gray-200 align-top transition-all hover:shadow-md hover:border-gray-300 bg-card/50",
									cell: "p-0 relative h-full w-full focus-within:relative focus-within:z-20",
									day_selected: "bg-transparent text-foreground hover:bg-transparent",
									day_today: "bg-accent/20 border-accent",
									day_outside: "text-muted-foreground opacity-50 bg-gray-50/50",
									day_disabled: "text-muted-foreground opacity-50",
									day_range_middle:
										"aria-selected:bg-accent aria-selected:text-accent-foreground",
									day_hidden: "invisible",
									button_next: "w-10 h-10 flex justify-center items-center bg-gray-100 hover:bg-gray-200 rounded-md",
									button_previous: "w-10 h-10 flex justify-center items-center bg-gray-100 hover:bg-gray-200 rounded-md",
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
						<DragOverlay className={`bg-[${activeTask?.category?.color}]`}>
							{activeTask ? (
								<div className="w-[200px]">
									<DraggableTaskItem task={activeTask} />
								</div>
							) : null}
						</DragOverlay>,
						document.body
					)} 
				</div>
			</CalendarContext.Provider>
		</DndContext>
	);
}
