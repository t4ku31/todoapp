import { useDraggable } from "@dnd-kit/core";
import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { usePomodoroStore } from "@/store/usePomodoroStore";
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
	variant?: "default" | "focusSelector";
}

export function TaskItem({
	task,
	onUpdateTask,
	onDeleteTask,
	variant = "default",
}: TaskItemProps) {
	const { setFocusTask, currentTaskId } = usePomodoroStore();

	const isFocusSelector = variant === "focusSelector";

	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `task-${task.id}`,
		data: { task },
		disabled: isFocusSelector, // Disable drag in focusSelector mode
	});
	const [isExpanded, setIsExpanded] = useState(false);
	const [isChecked, setIsChecked] = useState(task.status === "COMPLETED");

	const isSelected = isFocusSelector && currentTaskId === task.id;

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

	const handleClick = () => {
		if (isFocusSelector && task.status !== "COMPLETED") {
			setFocusTask(task.id);
		}
	};

	const baseClassName = `relative p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group
		${isFocusSelector ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}
		${
			isSelected
				? "border-4 border-purple-500 ring-4 ring-purple-200 shadow-purple-100"
				: "border border-gray-100"
		}
		${isFocusSelector && !isSelected ? "hover:border-purple-200" : ""}`;

	const baseStyle = {
		...style,
		borderLeftWidth: 4,
		borderLeftColor: task.category?.color ?? "transparent",
	};

	// Shared content for both modes
	const taskContent = (
		<>
			{/* 常に表示: Checkbox + Title + Focus Button */}
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
					className={`text-base font-medium truncate flex-1 ${effectiveStatus === "COMPLETED" ? "line-through text-gray-400" : ""}`}
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
		</>
	);

	// Use native <button> for focusSelector mode (proper accessibility)
	if (isFocusSelector) {
		return (
			<button
				type="button"
				ref={setNodeRef}
				style={baseStyle}
				onClick={handleClick}
				className={`${baseClassName} w-full text-left`}
			>
				{taskContent}
			</button>
		);
	}

	// Use <div> with drag handlers for default mode
	return (
		<div
			ref={setNodeRef}
			style={baseStyle}
			{...listeners}
			{...attributes}
			className={baseClassName}
		>
			{taskContent}
		</div>
	);
}
