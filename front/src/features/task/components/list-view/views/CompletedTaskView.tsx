import * as React from "react";
import type { UpdateTaskParams } from "@/features/task/api/taskApi";
import type { Task } from "@/features/task/types";
import { TaskItem } from "../../TaskItem";

interface CompletedTaskViewProps {
	tasks: Task[];
	onUpdateTask: (taskId: number, updates: UpdateTaskParams) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
}

export const CompletedTaskView = React.memo(function CompletedTaskView({
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
		<div className="h-full overflow-y-auto">
			{tasks.map((task) => (
				<div key={task.id} className="mb-2 pr-4">
					<TaskItem
						task={task}
						onUpdateTask={onUpdateTask}
						onDeleteTask={onDeleteTask}
						onSelect={(id) => onTaskSelect?.(id)}
						isSelected={selectedTaskId === task.id}
					/>
				</div>
			))}
		</div>
	);
});
