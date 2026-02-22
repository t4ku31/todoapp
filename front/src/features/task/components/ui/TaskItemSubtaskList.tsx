import {
	useCreateSubtaskMutation,
	useDeleteSubtaskMutation,
	useUpdateSubtaskMutation,
} from "@/features/task/queries/task/useTaskMutations";
import type { Subtask } from "@/features/task/types";
import { cn } from "@/lib/utils";
import { SortableSubtaskList } from "./SortableSubtaskList";

interface TaskItemSubtaskListProps {
	taskId?: number;
	subtasks: Subtask[];
	onUpdate?: (id: number, updates: Partial<Subtask>) => void;
	onDelete?: (id: number) => void;
	onAdd?: (title: string) => void;
	onReorder?: (newSubtasks: Subtask[]) => void;
	className?: string;
}

export function TaskItemSubtaskList({
	taskId,
	subtasks: rawSubtasks,
	onUpdate,
	onDelete,
	onAdd,
	onReorder,
	className,
}: TaskItemSubtaskListProps) {
	const subtasks = (rawSubtasks || []).filter(
		(s): s is Subtask => s !== null && s !== undefined && typeof s === "object",
	);
	const { mutate: updateSubtask } = useUpdateSubtaskMutation();
	const { mutate: deleteSubtask } = useDeleteSubtaskMutation();
	const { mutate: createSubtask } = useCreateSubtaskMutation();

	const handleUpdate = (subtaskId: number, updates: Partial<Subtask>) => {
		if (onUpdate) {
			onUpdate(subtaskId, updates);
		} else if (taskId) {
			updateSubtask({ subtaskId, updates });
		}
	};

	const handleDelete = (subtaskId: number) => {
		if (onDelete) {
			onDelete(subtaskId);
		} else if (taskId) {
			deleteSubtask(subtaskId);
		}
	};

	const handleAdd = (title: string) => {
		if (onAdd) {
			onAdd(title);
		} else if (taskId) {
			createSubtask({ taskId, subtask: { title } });
		}
	};

	const handleReorder = (newSubtasks: Subtask[]) => {
		if (onReorder) {
			onReorder(newSubtasks);
		} else if (taskId) {
			newSubtasks.forEach((st) => {
				const original = subtasks.find((s) => s.id === st.id);
				if (original && original.orderIndex !== st.orderIndex) {
					updateSubtask({
						subtaskId: st.id,
						updates: { orderIndex: st.orderIndex },
					});
				}
			});
		}
	};

	return (
		<SortableSubtaskList
			subtasks={subtasks}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
			onAdd={handleAdd}
			onReorder={handleReorder}
			className={cn(
				"mt-2 pl-2 border-l-2 border-indigo-100/50 ml-1 animate-in slide-in-from-top-1 duration-200",
				className,
			)}
		/>
	);
}
