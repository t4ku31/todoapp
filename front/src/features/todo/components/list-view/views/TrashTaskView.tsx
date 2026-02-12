import * as React from "react";
import { Virtuoso } from "react-virtuoso";
import type { Task } from "@/features/todo/types";
import { TaskItem } from "../../TaskItem";

interface TrashTaskViewProps {
	tasks: Task[];
	onDeletePermanently: (taskId: number) => Promise<void>;
	onRestore: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
}

export function TrashTaskView({
	tasks,
	onDeletePermanently,
	onRestore,
	onTaskSelect,
	selectedTaskId,
}: TrashTaskViewProps) {
	const itemContent = React.useCallback(
		(_index: number, task: Task) => (
			<div className="mb-2 pr-4">
				<TaskItem
					key={task.id}
					task={task}
					onUpdateTask={async () => {}}
					onDeleteTask={onDeletePermanently}
					onRestore={onRestore}
					onSelect={(id) => onTaskSelect?.(id)}
					isSelected={selectedTaskId === task.id}
					isTrash
				/>
			</div>
		),
		[onDeletePermanently, onRestore, onTaskSelect, selectedTaskId],
	);

	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-400">
				<p>ゴミ箱は空です</p>
			</div>
		);
	}

	return (
		<Virtuoso
			style={{ height: "100%" }}
			data={tasks}
			itemContent={itemContent}
		/>
	);
}
