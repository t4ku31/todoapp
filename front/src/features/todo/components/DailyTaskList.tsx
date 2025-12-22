import { format, isSameDay, parse } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateTaskForm } from "@/features/todo/components/forms/CreateTaskForm";
import type { Task } from "@/types/types";
import { TaskItem } from "./TaskItem";
import { CompletionBadge } from "./ui/CompletionBadge";

interface DailyTaskListProps {
	date: string; // yyyy-MM-dd format
	tasks: Task[]; // All tasks - will be filtered by date internally
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		categoryId?: number,
	) => Promise<void>;
	onPrevDay?: () => void;
	onNextDay?: () => void;
	taskListId: number;
	emptyMessage?: string;
	className?: string;
}

export function DailyTaskList({
	date,
	tasks,
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
	onPrevDay,
	onNextDay,
	taskListId,
	emptyMessage = "No tasks for this date.",
	className = "",
}: DailyTaskListProps) {
	const [showCompleted, setShowCompleted] = useState(false);

	// Filter tasks by date first
	const tasksForDate = tasks.filter((task) => task.executionDate === date);

	// Then separate by status
	const activeTasks = tasksForDate.filter(
		(task) => task.status !== "COMPLETED",
	);
	const completedTasks = tasksForDate.filter(
		(task) => task.status === "COMPLETED",
	);

	// Parse date safely
	const parsedDate = date ? parse(date, "yyyy-MM-dd", new Date()) : new Date();
	const isValidDate = date && !Number.isNaN(parsedDate.getTime());
	const dateDisplay = isValidDate
		? isSameDay(parsedDate, new Date())
			? "Today"
			: format(parsedDate, "MMM dd")
		: "No Date";

	return (
		<div className={`space-y-4 ${className}`}>
			<div className="flex flex-col gap-2 mb-4">
				<div className="flex justify-between items-center mb-2">
					<div className="flex items-center gap-2">
						{onPrevDay && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onPrevDay}
								className="h-8 w-8 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md transition-all"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						)}
						<h2 className="text-xl font-bold text-gray-700 shrink-0">
							{dateDisplay}
						</h2>
						{onNextDay && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onNextDay}
								className="h-8 w-8 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md transition-all"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						)}
					</div>
					<CompletionBadge tasks={tasksForDate} />
				</div>
				<CreateTaskForm
					taskListId={taskListId}
					onCreateTask={onCreateTask}
					defaultExecutionDate={isValidDate ? parsedDate : new Date()}
					showListSelector={true}
				/>
			</div>

			{/* Active Tasks */}
			{activeTasks.length === 0 && completedTasks.length === 0 ? (
				<Card className="p-4 bg-white/80">
					<p className="text-gray-500 text-center">{emptyMessage}</p>
				</Card>
			) : (
				<AnimatePresence mode="popLayout">
					{activeTasks.map((task) => (
						<motion.div
							key={task.id}
							layout
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -50, scale: 0.9 }}
							transition={{ duration: 0.25 }}
						>
							<TaskItem
								task={task}
								onUpdateTask={onUpdateTask}
								onDeleteTask={onDeleteTask}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			)}

			{/* Completed Tasks Section */}
			{completedTasks.length > 0 && (
				<div className="pt-4">
					<Button
						variant="ghost"
						onClick={() => setShowCompleted(!showCompleted)}
						className="text-gray-500 hover:text-gray-700 w-full flex items-center justify-center text-sm py-2 gap-2"
					>
						<span>Completed ({completedTasks.length})</span>
						<span className="text-xs">{showCompleted ? "Hide" : "Show"}</span>
					</Button>

					{showCompleted && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 0.75, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3 }}
							className="space-y-4 mt-2 overflow-hidden"
						>
							<AnimatePresence mode="popLayout">
								{completedTasks.map((task) => (
									<motion.div
										key={task.id}
										layout
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -50, scale: 0.9 }}
										transition={{ duration: 0.25 }}
									>
										<TaskItem
											task={task}
											onUpdateTask={onUpdateTask}
											onDeleteTask={onDeleteTask}
										/>
									</motion.div>
								))}
							</AnimatePresence>
						</motion.div>
					)}
				</div>
			)}
		</div>
	);
}
