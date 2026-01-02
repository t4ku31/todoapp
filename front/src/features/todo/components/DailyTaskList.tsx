import { format, isSameDay, parse } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateTaskForm } from "@/features/todo/components/forms/CreateTaskForm";
import type { Task } from "@/types/types";
import { TaskItem } from "./TaskItem";
import { CompletedSection } from "./ui/CompletedSection";
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
		estimatedDuration?: number,
	) => Promise<void>;
	onPrevDay?: () => void;
	onNextDay?: () => void;
	taskListId: number;
	emptyMessage?: string;
	className?: string;
	taskItemVariant?: "default" | "focusSelector";
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
	taskItemVariant = "default",
}: DailyTaskListProps) {
	// Filter tasks by date first
	const tasksForDate = tasks.filter((task) => task.executionDate === date);

	// Filter for active tasks
	const activeTasks = tasksForDate.filter(
		(task) => task.status !== "COMPLETED",
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
			{activeTasks.length === 0 &&
			tasksForDate.filter((t) => t.status === "COMPLETED").length === 0 ? (
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
								variant={taskItemVariant}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			)}

			{/* Completed Tasks Section */}
			<CompletedSection
				tasks={tasksForDate}
				onUpdateTask={onUpdateTask}
				onDeleteTask={onDeleteTask}
			/>
		</div>
	);
}
