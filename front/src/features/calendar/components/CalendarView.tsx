import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskItem } from "@/features/todo/components/TaskItem";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { format, isSameDay, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CalendarContext } from "../context/CalendarContext";
import { DroppableDayButton } from "./DroppableDayButton";
import { TaskBadge } from "./TaskBadge";

export default function CalendarView() {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
	
	// Use Zustand store
	const { taskLists, loading, fetchTaskLists, updateTask, deleteTask } = useTodoStore();
	
	const [taskForDate, setTaskForDate] = useState<Task[]>([]);
	const [month, setMonth] = useState<Date>(new Date());
	const [activeTask, setActiveTask] = useState<Task | null>(null);

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

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		
		if (!over) {
			setActiveTask(null);
			return;
		}
		
		const task = active.data.current?.task as Task;
		const newDateString = over.id as string;

		if (task && newDateString && task.executionDate !== newDateString) {
			updateTask(task.id, { executionDate: newDateString });
		}
		
		setActiveTask(null);
	};

	if (loading && taskLists.length === 0) {
		return (
			<div className="h-full flex items-center justify-center">Loading...</div>
		);
	}

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<CalendarContext.Provider value={{ selectedDate, setSelectedDate }}>
				<div className="h-full flex flex-col p-6 gap-6 bg-gradient-to-r from-blue-200 to-indigo-200">
					<h1 className="text-2xl font-bold">Task List & Calendar View</h1>

					<div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
						{/* Left Column: My Tasks */}
						<Card className="lg:flex-[1] h-full overflow-hidden flex flex-col border-none shadow-xl bg-white">
							<div className="p-6 pb-2 shrink-0 flex items-center justify-center">
								<h2 className="text-xl font-bold">
									{selectedDate ? format(selectedDate, "yyyy-MM-dd") : "No Date Selected"} Tasks
								</h2>
								<Button
									size="sm"
									disabled={true}
									className="bg-primary text-primary-foreground hover:bg-primary/90"
								>
									<Plus className="h-4 w-4 mr-1" /> Add Task
								</Button>
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
						</Card>

						<div className="flex-1 rounded-xl border bg-white p-4 overflow-hidden flex flex-col">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={setSelectedDate}
								month={month}
								onMonthChange={setMonth}
								className="w-full h-full p-0"
								classNames={{
									month: "w-full h-full flex flex-col",
									table: "w-full h-full border-separate border-spacing-2 mt-0",
									head_row: "flex w-full mb-1",
									head_cell:
										"text-muted-foreground w-full font-normal text-[0.8rem]",
									row: "flex w-full",
									day_button:
										"h-full w-full p-2 font-normal text-left align-top hover:bg-transparent",
									day: "h-32 w-full p-0 font-normal aspect-auto rounded-xl border border-gray-200 align-top transition-all hover:shadow-md hover:border-gray-300 bg-card/50",
									cell: "p-0 relative h-full w-full focus-within:relative focus-within:z-20",
									day_selected: "bg-transparent text-foreground hover:bg-transparent",
									day_today: "bg-accent/20 border-accent",
									day_outside: "text-muted-foreground opacity-50 bg-gray-50/50",
									day_disabled: "text-muted-foreground opacity-50",
									day_range_middle:
										"aria-selected:bg-accent aria-selected:text-accent-foreground",
									day_hidden: "invisible",
								}}
								modifiers={{}}
								components={{
									DayButton: DroppableDayButton,
								}}
							/>
						</div>
					</div>
					<DragOverlay>
						{activeTask ? (
							<div className="opacity-90 rotate-2 cursor-grabbing pointer-events-none">
								<TaskBadge task={activeTask} className="shadow-lg ring-2 ring-blue-400" />
							</div>
						) : null}
					</DragOverlay>
				</div>
			</CalendarContext.Provider>
		</DndContext>
	);
}
