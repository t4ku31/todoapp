import * as React from "react";
import type { Task } from "@/features/task/types";
import { TaskItem } from "../../TaskItem";

interface TrashTaskViewProps {
	tasks: Task[];
	onDeletePermanently: (taskId: number) => Promise<void>;
	onRestore: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
}

export const TrashTaskView = React.memo(function TrashTaskView({
	tasks,
	onDeletePermanently,
	onRestore,
	onTaskSelect,
	selectedTaskId,
}: TrashTaskViewProps) {
	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-400">
				<p>ゴミ箱は空です</p>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto">
			{tasks.map((task) => (
				<div key={task.id} className="mb-2 pr-4">
					<TaskItem
						task={task}
						onUpdateTask={async () => {}}
						onDeleteTask={onDeletePermanently}
						onRestore={onRestore}
						onSelect={(id) => onTaskSelect?.(id)}
						isSelected={selectedTaskId === task.id}
						isTrash
					/>
				</div>
			))}
		</div>
	);
});
