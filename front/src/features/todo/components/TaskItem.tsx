import { useDraggable } from "@dnd-kit/core";
import { GripVertical, ListTree, Trash2, Undo2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import type { Task } from "@/types/types";

import { CategorySelect } from "./ui/CategorySelect";
import { DeleteButton } from "./ui/DeleteButton";
import { EditableDate } from "./ui/EditableDate";
import { EditableDuration } from "./ui/EditableDuration";
import { EditableTitle } from "./ui/EditableTitle";
import { TaskItemSubtaskList } from "./ui/TaskItemSubtaskList";
import { TaskListSelector } from "./ui/TaskListSelector";

interface TaskItemProps {
	task: Task;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	variant?: "default" | "focusSelector";
	isTrash?: boolean;
	onRestore?: (taskId: number) => Promise<void>;
	onSelect?: (taskId: number) => void;
	isSelected?: boolean;
}

export const TaskItem = memo(function TaskItem({
	task,
	onUpdateTask,
	onDeleteTask,
	variant = "default",
	isTrash = false,
	onRestore,
	onSelect,
	isSelected = false,
}: TaskItemProps) {
	const { setFocusTask, currentTaskId } = usePomodoroStore();

	const isFocusSelector = variant === "focusSelector";

	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `task-${task.id}`,
		data: { task },
		disabled: isFocusSelector || isTrash, // Disable drag in focusSelector mode or trash
	});
	const [isExpanded, setIsExpanded] = useState(false);
	const [isChecked, setIsChecked] = useState(task.status === "COMPLETED");
	const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);

	const subtasks = task.subtasks || [];
	const completedSubtasks = subtasks.filter((st) => st.isCompleted).length;
	const totalSubtasks = subtasks.length;
	const hasSubtasks = totalSubtasks > 0;

	const isFocusSelected = isFocusSelector && currentTaskId === task.id;
	const isHighlighted = isSelected || isFocusSelected;

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
		} else if (onSelect && !isTrash) {
			onSelect(task.id);
		}
	};

	const baseClassName = `relative px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 group
		${isFocusSelector || onSelect ? "cursor-pointer" : ""}
		${
			isHighlighted
				? "border-2 border-indigo-500 ring-2 ring-indigo-500 shadow-indigo-500"
				: "border border-gray-100"
		}
		${(isFocusSelector || onSelect) && !isHighlighted ? "hover:border-indigo-200" : ""}`; // Purple -> Indigo

	const baseStyle = {
		...style,
		borderLeftWidth: 4,
		borderLeftColor: task.category?.color ?? "transparent",
	};

	// Shared content for both modes
	const taskContent = (
		<>
			{/* 常に表示: Drag Handle + Checkbox + Title + Focus Button */}
			<div className="flex items-center gap-2">
				{/* Drag Handle - only shown in default (non-focusSelector, non-trash) mode */}
				{!isFocusSelector && !isTrash && (
					<div
						{...listeners}
						{...attributes}
						className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors touch-none"
					>
						<GripVertical className="w-4 h-4" />
					</div>
				)}

				{!isTrash && (
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
				)}

				<EditableTitle
					id={task.id}
					title={task.title}
					onTitleChange={(id, title) => onUpdateTask(id, { title })}
					className={`text-base font-medium truncate flex-1 ${effectiveStatus === "COMPLETED" ? "line-through text-gray-400" : ""}`}
				/>

				{hasSubtasks && !isTrash && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsSubtasksOpen(!isSubtasksOpen);
						}}
						className={`flex items-center gap-1.5 hover:bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium transition-colors border ${
							isSubtasksOpen
								? "bg-indigo-50 text-indigo-600 border-indigo-200"
								: "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
						}`}
					>
						<ListTree className="w-3.5 h-3.5" />
						<span>
							{completedSubtasks}/{totalSubtasks}
						</span>
					</button>
				)}
			</div>

			{isSubtasksOpen && hasSubtasks && !isTrash && (
				<div className="cursor-default">
					<TaskItemSubtaskList taskId={task.id} subtasks={subtasks} />
				</div>
			)}

			{/* Hover時に展開: アクションセクション */}
			<div
				className={`overflow-hidden transition-all duration-400 ease-in-out ${isExpanded || isSubtasksOpen ? "max-h-24" : "max-h-0 group-hover:max-h-24"}`}
			>
				<div className="flex items-center justify-between pl-3 pt-3 mt-3 border-t border-gray-100">
					{!isTrash ? (
						<>
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
									onRecurrenceChange={async (id, recurrence) => {
										await onUpdateTask(id, {
											isRecurring: recurrence.isRecurring,
											recurrenceRule: recurrence.recurrenceRule,
										});
									}}
									isRecurring={task.isRecurring}
									recurrenceRule={task.recurrenceRule}
									onOpenChange={setIsExpanded}
								/>

								<EditableDuration
									id={task.id}
									duration={task.estimatedPomodoros}
									onDurationChange={(id, duration) =>
										onUpdateTask(id, { estimatedPomodoros: duration })
									}
									onOpenChange={setIsExpanded}
								/>
							</div>

							<div className="flex items-center gap-2">
								<DeleteButton
									onDelete={() => onDeleteTask(task.id)}
									title="タスクを削除しますか？"
									description="この操作は取り消せません（ゴミ箱へ移動します）。"
								/>
							</div>
						</>
					) : (
						<div className="flex items-center justify-end w-full gap-2">
							{onRestore && (
								<Button
									onClick={() => onRestore(task.id)}
									variant="outline"
									size="sm"
									className="flex items-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
								>
									<Undo2 className="w-4 h-4" />
									復元
								</Button>
							)}
							<DeleteButton
								onDelete={() => onDeleteTask(task.id)}
								title="完全に削除しますか？"
								description="この操作は取り消せません。タスクは永久に失われます。"
								trigger={
									<Button
										variant="ghost"
										size="sm"
										className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
									>
										<Trash2 className="w-4 h-4" />
										削除
									</Button>
								}
							/>
						</div>
					)}
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

	// Use <div> for default mode - drag handlers are now on the grip icon inside taskContent
	// Only add interactive attributes when onSelect is defined to avoid "static elements should not be interactive" warning
	const interactiveProps = onSelect
		? {
				onClick: handleClick,
				onKeyDown: (e: React.KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") {
						handleClick();
					}
				},
				role: "button" as const,
				tabIndex: 0,
			}
		: {};

	return (
		<div
			ref={setNodeRef}
			style={baseStyle}
			className={baseClassName}
			{...interactiveProps}
		>
			{taskContent}
		</div>
	);
});
