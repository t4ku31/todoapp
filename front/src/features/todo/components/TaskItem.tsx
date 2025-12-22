import { useDraggable } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types/types";
import { CategorySelect } from "./ui/CategorySelect";
import { DeleteButton } from "./ui/DeleteButton";
import { EditableDate } from "./ui/EditableDate";
import { EditableTitle } from "./ui/EditableTitle";
import { TaskListSelector } from "./ui/TaskListSelector";

interface TaskItemProps {
	task: Task;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
}

export function TaskItem({ task, onUpdateTask, onDeleteTask }: TaskItemProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `task-${task.id}`,
		data: { task },
	});
	const [isExpanded, setIsExpanded] = useState(false);
	const [isChecked, setIsChecked] = useState(task.status === "COMPLETED");

	useEffect(() => {
		setIsChecked(task.status === "COMPLETED");
	}, [task.status]);

	const style = {
		opacity: isDragging ? 0.3 : 1,
	};

	const effectiveStatus = isChecked
		? "COMPLETED"
		: task.status === "COMPLETED"
			? "PENDING"
			: task.status;
	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				borderLeftWidth: 4,
				borderLeftColor: task.category?.color ?? "transparent",
			}}
			{...listeners}
			{...attributes}
			className="relative p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 group cursor-grab active:cursor-grabbing"
		>
			{/* 常に表示: Checkbox + Title */}
			<div className="flex items-center gap-4">
				<Checkbox
					checked={isChecked}
					onCheckedChange={(checked) => {
						setIsChecked(!!checked);
						onUpdateTask(task.id, {
							status: checked ? "COMPLETED" : "PENDING",
						});
					}}
					onPointerDown={(e) => e.stopPropagation()}
					className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 transition-colors"
				/>

				<EditableTitle
					id={task.id}
					title={task.title}
					onTitleChange={(id, title) => onUpdateTask(id, { title })}
					className={`text-base font-medium truncate ${effectiveStatus === "COMPLETED" ? "line-through text-gray-400" : ""}`}
				/>
			</div>

			{/* Hover時に展開: アクションセクション */}
			<div
				className={`overflow-hidden transition-all duration-400 ease-in-out ${isExpanded ? "max-h-24" : "max-h-0 group-hover:max-h-24"}`}
			>
				<div className="flex items-center justify-between pl-3 pt-3 mt-3 border-t border-gray-100">
					<div className="flex items-center gap-2">
						<CategorySelect
							selectedCategoryId={task.category?.id}
							onCategoryChange={(categoryId) =>
								// @ts-expect-error - categoryId is handled by the store
								onUpdateTask(task.id, { categoryId })
							}
							onOpenChange={setIsExpanded}
						/>
						<TaskListSelector
							currentTaskListId={task.taskListId}
							onTaskListChange={(taskListId) =>
								// @ts-expect-error - taskListId is handled by the store
								onUpdateTask(task.id, { taskListId })
							}
							onOpenChange={setIsExpanded}
						/>

						<EditableDate
							id={task.id}
							date={task.executionDate ?? null}
							type="executionDate"
							onDateChange={(id, date) =>
								onUpdateTask(id, { executionDate: date })
							}
							onOpenChange={setIsExpanded}
						/>
					</div>

					<div className="flex items-center gap-2">
						<DeleteButton
							onDelete={() => onDeleteTask(task.id)}
							title="Delete Task?"
							description="This action cannot be undone."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
