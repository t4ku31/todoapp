import type { Task } from "@/features/todo/types";
import { TaskItem } from "../TaskItem";

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
	return (
		<div className="space-y-8 pb-10">
			<div className="space-y-2">
				{tasks.map((task) => (
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
				))}
			</div>

			{tasks.length === 0 && (
				<div className="flex flex-col items-center justify-center h-64 text-gray-400">
					<p>ゴミ箱は空です</p>
				</div>
			)}
		</div>
	);
}
