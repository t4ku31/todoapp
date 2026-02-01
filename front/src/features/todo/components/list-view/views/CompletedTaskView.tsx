import type { Task } from "@/features/todo/types";
import { TaskItem } from "../../TaskItem";

interface CompletedTaskViewProps {
	tasks: Task[];
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
}

export function CompletedTaskView({
	tasks,
	onUpdateTask,
	onDeleteTask,
	onTaskSelect,
	selectedTaskId,
}: CompletedTaskViewProps) {
	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-400">
				<p>完了したタスクはありません</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{tasks.map((task) => (
				<TaskItem
					key={task.id}
					task={task}
					onUpdateTask={onUpdateTask}
					onDeleteTask={onDeleteTask}
					onSelect={(id) => onTaskSelect?.(id)}
					isSelected={selectedTaskId === task.id}
					// Completed view specific props if any
				/>
			))}
		</div>
	);
}
