import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types/types";
import { useDraggable } from "@dnd-kit/core";
import { CategorySelect } from "./ui/CategorySelect";
import { DeleteButton } from "./ui/DeleteButton";
import { EditableDate } from "./ui/EditableDate";
import { EditableTitle } from "./ui/EditableTitle";
import { StatusChangeButton } from "./ui/StatusChangeButton";

interface TaskItemProps {
	task: Task;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
}

export function TaskItem({
	task,
	onUpdateTask,
	onDeleteTask,
}: TaskItemProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `task-${task.id}`,
		data: { task },
	});
	const style = {
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<div 
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group cursor-grab active:cursor-grabbing">
			<div className="flex items-center gap-4 flex-1">
				<Checkbox
					checked={task.status === "COMPLETED"}
					onCheckedChange={(checked) =>
						onUpdateTask(task.id, { status: checked ? "COMPLETED" : "PENDING" })
					}
					onPointerDown={(e) => e.stopPropagation()}
					className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 transition-colors"
				/>

				<div className="flex-1 min-w-0">
					<EditableTitle
						id={task.id}
						title={task.title}
						onTitleChange={(id, title) => onUpdateTask(id, { title })}
						className={`text-base font-medium text-gray-700 truncate ${task.status === "COMPLETED" ? "line-through text-gray-400" : ""}`}
					/>
					<div className="flex items-center gap-2 mt-1">
						<CategorySelect
							selectedCategoryId={task.category?.id}
							onCategoryChange={(categoryId) =>
								// @ts-ignore - categoryId is handled by the store
								onUpdateTask(task.id, { categoryId })
							}
						/>
						{/* <TaskListSelector
							currentTaskListId={task.taskListId}
							onTaskListChange={(taskListId) =>
								// @ts-ignore - taskListId is handled by the store
								onUpdateTask(task.id, { taskListId })
							}
						/> */}

						<EditableDate
							id={task.id}
							date={task.executionDate ?? null}
							type="executionDate"
							onDateChange={(id, date) => onUpdateTask(id, { executionDate: date })}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<StatusChangeButton
					status={task.status}
					onChange={(newStatus) => onUpdateTask(task.id, { status: newStatus })}
				/>
				<DeleteButton
					onDelete={() => onDeleteTask(task.id)}
					title="Delete Task?"
					description="This action cannot be undone."
				/>
			</div>
		</div>
	);
}
