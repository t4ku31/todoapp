import { Button } from "@/components/ui/button";
import type { Task } from "@/types/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { TaskItem } from "../TaskItem";

interface CompletedSectionProps {
	tasks: Task[]; // All tasks - will be filtered internally for completed ones
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask?: (taskId: number) => Promise<void>;
	variant?: "full" | "simple";
	renderItem?: (task: Task) => React.ReactNode;
	className?: string;
}

export function CompletedSection({
	tasks,
	onUpdateTask,
	onDeleteTask,
	variant = "full",
	renderItem,
	className = "",
}: CompletedSectionProps) {
	const [showCompleted, setShowCompleted] = useState(false);

	// Filter for completed tasks
	const completedTasks = tasks.filter((task) => task.status === "COMPLETED");

	if (completedTasks.length === 0) return null;

	return (
		<div className={`pt-4 ${className}`}>
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
								{variant === "simple" && renderItem ? (
									renderItem(task)
								) : (
									<TaskItem
										task={task}
										onUpdateTask={onUpdateTask}
										onDeleteTask={onDeleteTask!}
									/>
								)}
							</motion.div>
						))}
					</AnimatePresence>
				</motion.div>
			)}
		</div>
	);
}

