import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/config/env";
import type { Task, TaskList } from "@/types/types";
import { format, isSameDay, parseISO } from "date-fns";
import {
	Check,
	MoreHorizontal,
	Plus
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CalendarView() {
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [taskLists, setTaskLists] = useState<TaskList[]>([]);
	const [taskForDate, setTaskForDate] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [month, setMonth] = useState<Date>(new Date());

	// Map tasks by date for calendar display
	const getTasksByDate = (): Map<string, Task[]> => {
		
		const taskMap = new Map<string, Task[]>();
		
		taskLists.forEach((taskList) => {
			taskList.tasks?.forEach((task) => {
				if (task.executionDate) {
					const dateKey = format(parseISO(task.executionDate), 'yyyy-MM-dd');
					if (!taskMap.has(dateKey)) {
						taskMap.set(dateKey, []);
					}
					// Check for duplicates
					const existing = taskMap.get(dateKey);
					
					if (!existing?.some(item => item.id === task.id)) {
						taskMap.get(dateKey)?.push(task);
					}
				}
			});
		});
		return taskMap;
	};

	const tasksByDate = getTasksByDate();

	// Fetch tasklists
	useEffect(() => {
		const fetchTaskLists = async () => {
			try {
				setLoading(true);
				const response = await apiClient.get<TaskList[]>("/api/tasklists");
				setTaskLists(response.data);
			} catch (err) {
				console.error("Failed to fetch tasklists:", err);
				toast.error("タスクの取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		fetchTaskLists();
	}, []);

	// Filter tasks based on selected date (executionDate only for calendar)
	useEffect(() => {
		if (!date) {
			setTaskForDate([]);
			return;
		}

		const tasksForSelectedDate: Task[] = [];

		taskLists.forEach((taskList) => {
			if (taskList.tasks) {
				const filtered = taskList.tasks.filter((task) => {
					// Show tasks scheduled for execution on this date
					const hasExecutionDate = task.executionDate && isSameDay(parseISO(task.executionDate), date);
					const hasDueDate = false; // Due dates shown in task list only
					return hasExecutionDate || hasDueDate;
				});
				tasksForSelectedDate.push(...filtered);
			}
		});
		setTaskForDate(tasksForSelectedDate);
	}, [date, taskLists]);

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">Loading...</div>
		);
	}

	return (
		<div className="h-full flex flex-col p-6 gap-6 bg-gradient-to-r from-blue-200 to-indigo-200">
			<h1 className="text-2xl font-bold">Task List & Calendar View</h1>

			<div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
				{/* Left Column: My Tasks */}
				<Card className="lg:flex-[1] h-full overflow-hidden flex flex-col border-none shadow-xl bg-white">
					<div className="p-6 pb-2 shrink-0 flex items-center justify-between">
						<div>
							<h2 className="text-xl font-bold">{date ? format(date, "yyyy-MM-dd") : "No Date Selected"} Tasks</h2>
							<div className="flex items-center gap-2 text-muted-foreground mt-1">
								<span className="font-semibold text-primary">Priority</span>
							</div>
						</div>
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
								<div
									key={task.id}
									className="group flex items-start gap-3 p-3 rounded-xl border bg-white hover:shadow-md transition-shadow"
								>
									<div
										className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center ${task.status === "COMPLETED" ? "bg-primary border-primary" : "border-muted-foreground/30"}`}
									>
										{task.status === "COMPLETED" && (
											<Check className="h-3 w-3 text-primary-foreground" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<h3
												className={`font-medium truncate ${task.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground"}`}
											>
												{task.title}
											</h3>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
											</Button>
										</div>
										<div className="mt-2 flex items-center gap-2">
											<Badge
												variant="secondary"
												className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-normal"
											>
												{task.status}
											</Badge>
											{task.executionDate && (
												<Badge
													variant="outline"
													className="border-none bg-blue-100 text-blue-700 font-normal"
												>
													📅 {format(parseISO(task.executionDate), "M/d")}
												</Badge>
											)}
											{task.dueDate && (
												<Badge
													variant="outline"
													className={`border-none bg-red-100 text-red-700 font-normal ${isSameDay(parseISO(task.dueDate), new Date()) ? "bg-red-500 text-white" : ""}`}
												>
													⚠️ {format(parseISO(task.dueDate), "M/d")}
												</Badge>
											)}
										</div>
									</div>
								</div>
							))}
							{taskForDate.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									No tasks for this date.
								</div>
							)}
						</div>
					</ScrollArea>
				</Card>

				<div className="flex-1 rounded-xl border bg-white p-15">
					<Calendar
						mode="single"
						selected={date}
						onSelect={setDate}
						month={month}
						onMonthChange={setMonth}
						className="w-full h-full p-0 [--cell-size:2.5rem]"
						classNames={{
							day_button: "h-22 w-30 p-0 font-normal",
							day: "h-22 w-30 p-0 font-normal text-center",
							cell: "border border-gray-200 relative",
							day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
						}}						modifiers={{}}
						components={{
							DayButton: (props) => {
								const dayDate = props.day.date;
								const dateKey = format(dayDate, 'yyyy-MM-dd');
								const tasksForDay = tasksByDate.get(dateKey) || [];
								const displayTasks = tasksForDay.slice(0, 3);
								const remainingCount = tasksForDay.length - displayTasks.length;

								return (
									<Button
										{...props}
										variant="ghost"
										className={`h-22 w-30 p-1 text-left align-top font-normal hover:bg-accent/50 rounded-md transition-colors flex flex-col items-start justify-start ${props.modifiers.selected ? 'bg-primary/10 border-2 border-primary' : ''} ${props.modifiers.today ? 'bg-accent' : ''}`}
									>
										<div className="font-semibold text-sm mb-1 w-full">{format(dayDate, 'd')}</div>
										<div className="flex flex-col gap-0.5 w-full overflow-hidden">
											{displayTasks.map((task, idx) => (
												<div
													key={`${task.id}-${idx}`}
													className="text-[10px] px-1.5 py-0.5 rounded truncate bg-blue-500 text-white w-full"
													title={task.title}
												>
													{task.title}
												</div>
											))}
											{remainingCount > 0 && (
												<div className="text-[9px] text-muted-foreground px-1">
													+{remainingCount} more
												</div>
											)}
										</div>
									</Button>
								);
							},
						}}
					/>
				</div>
			</div>
		</div>
	);
}
