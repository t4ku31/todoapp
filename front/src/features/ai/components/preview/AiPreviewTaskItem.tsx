import { memo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ParsedTask } from "@/features/ai/types";
import { AddSubtaskButton } from "@/features/todo/components/ui/AddSubtaskButton";
import { CategorySelect } from "@/features/todo/components/ui/CategorySelect";
import { EditableDate } from "@/features/todo/components/ui/EditableDate";
import { EditableDescription } from "@/features/todo/components/ui/EditableDescription";
import { EditableDuration } from "@/features/todo/components/ui/EditableDuration";
import { EditableTitle } from "@/features/todo/components/ui/EditableTitle";
import { TaskItemSubtaskList } from "@/features/todo/components/ui/TaskItemSubtaskList";
import { TaskListSelector } from "@/features/todo/components/ui/TaskListSelector";
import type { Subtask } from "@/features/todo/types";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";
import { isExistingTask } from "../../utils/aiUtils";
import { AiStatusBadge } from "./AiStatusBadge";

interface AiPreviewTaskItemProps {
	task: ParsedTask;
	index: number;
	onUpdateTask: (taskId: number, updates: Partial<ParsedTask>) => void;
	onToggleSelection: (taskId: number) => void;
}

const generateTempId = () => {
	// Generate a random negative integer between -1 and -1,000,000,000
	return -Math.floor(Math.random() * 1000000000) - 1;
};

const normalizeSubtask = (st: Subtask | string, index: number): Subtask => {
	if (typeof st === "string") {
		return {
			id: generateTempId(),
			title: st,
			isCompleted: false,
			orderIndex: index,
		};
	}
	return {
		...st,
		id: st.id ?? generateTempId(), // Ensure ID exists
		isCompleted: st.isCompleted ?? false,
		orderIndex: st.orderIndex ?? index,
	};
};

export const AiPreviewTaskItem = memo(function AiPreviewTaskItem({
	task,
	onUpdateTask,
	onToggleSelection,
}: AiPreviewTaskItemProps) {
	const isExisting = isExistingTask(task);
	const { categories } = useCategoryStore();
	const { taskLists } = useTodoStore();

	// Ensure all subtasks are objects with IDs
	useEffect(() => {
		if (task.subtasks?.some((st) => typeof st === "string")) {
			const newSubtasks = (task.subtasks || []).map((st, index) => {
				if (typeof st === "string") {
					return {
						id: generateTempId(),
						title: st,
						isCompleted: false,
						orderIndex: index,
					};
				}
				return st;
			});
			onUpdateTask(task.id, { subtasks: newSubtasks });
		}
	}, [task.subtasks, task.id, onUpdateTask]);

	// Get category ID from category name
	const categoryId = task.categoryName
		? categories.find((c) => c.name === task.categoryName)?.id
		: undefined;

	// Get task list ID from task list title
	const taskListId = task.taskListTitle
		? taskLists.find((tl) => tl.title === task.taskListTitle)?.id
		: undefined;

	// Handle category change
	const handleCategoryChange = (id: number) => {
		const category = categories.find((c) => c.id === id);
		if (category) {
			onUpdateTask(task.id, { categoryName: category.name });
		}
	};

	// Handle task list change
	const handleTaskListChange = (id: number) => {
		const taskList = taskLists.find((tl) => tl.id === id);
		if (taskList) {
			onUpdateTask(task.id, { taskListTitle: taskList.title });
		}
	};

	// Determine badge variant and label based on task status

	const checkboxStyles: Record<PreviewStatus, string> = {
		delete: "data-[state=checked]:bg-rose-500 border-rose-200",
		new: "data-[state=checked]:bg-amber-400 border-amber-200",
		edit: "data-[state=checked]:bg-indigo-500 border-indigo-200",
	};

	const handleUpdateSubtask = (id: number, updates: Partial<Subtask>) => {
		const currentSubtasks = task.subtasks || [];
		const index = currentSubtasks.findIndex(
			(st) => typeof st === "object" && st.id === id,
		);

		if (index !== -1) {
			const newSubtasks = [...currentSubtasks];
			const current = newSubtasks[index] as Subtask;
			newSubtasks[index] = { ...current, ...updates };
			onUpdateTask(task.id, { subtasks: newSubtasks });
		}
	};

	const handleDeleteSubtask = (id: number) => {
		const currentSubtasks = task.subtasks || [];
		const index = currentSubtasks.findIndex(
			(st) => typeof st === "object" && st.id === id,
		);

		if (index !== -1) {
			const newSubtasks = [...currentSubtasks];
			newSubtasks.splice(index, 1);
			onUpdateTask(task.id, { subtasks: newSubtasks });
		}
	};

	const handleAddSubtask = (title: string) => {
		const newSubtask: Subtask = {
			id: generateTempId(),
			title,
			isCompleted: false,
			orderIndex: task.subtasks?.length || 0,
		};
		onUpdateTask(task.id, {
			subtasks: [...(task.subtasks || []), newSubtask],
		});
	};

	const handleReorderSubtasks = (newSubtasks: Subtask[]) => {
		onUpdateTask(task.id, { subtasks: newSubtasks });
	};

	const processedSubtasks = (task.subtasks || [])
		.filter((st) => st !== null && st !== undefined)
		.map(normalizeSubtask);
	const badgeInfo = task.isDeleted
		? ({ variant: "delete", label: "Delete" } as const)
		: !isExisting
			? ({ variant: "new", label: "New" } as const)
			: ({ variant: "edit", label: "Edit" } as const);

	type PreviewStatus = "delete" | "new" | "edit";

	const previewStatus: PreviewStatus = task.isDeleted
		? "delete"
		: !isExisting
			? "new"
			: "edit";

	const unselectedStyles: Record<PreviewStatus, string> = {
		delete:
			"bg-red-100/90 border-rose-100 opacity-60 hover:border-rose-500 hover:bg-red-200/90",
		new: "bg-amber-50/50 border-amber-100 hover:border-amber-300 hover:bg-amber-50",
		edit: "bg-indigo-50/50 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50",
	};

	const selectedStyles: Record<PreviewStatus, string> = {
		delete:
			"outline-4 bg-red-100/90 outline-rose-500 border-rose-500 opacity-60",
		new: "outline-4 bg-amber-50/50 border-amber-300 outline-amber-300 hover:border-amber-300 hover:bg-yellow-50",
		edit: "outline-4 bg-indigo-50/50 border-indigo-400 outline-indigo-400 hover:border-indigo-400 hover:bg-white",
	};
	return (
		<div className="relative">
			{/* Status Badge */}
			<AiStatusBadge
				variant={badgeInfo.variant}
				className="absolute -top-3 -left-2 z-10 shadow-sm"
			>
				{badgeInfo.label}
			</AiStatusBadge>
			<div className="flex items-center gap-2">
				{/* Selection Checkbox */}
				<div className="pt-1">
					<Checkbox
						checked={task.selected}
						onCheckedChange={() => onToggleSelection(task.id)}
						className={cn("transition-colors", checkboxStyles[previewStatus])}
					/>
				</div>
				{/* Task Content */}
				<div
					className={cn(
						"flex-1",
						"group relative border rounded-lg transition-all duration-200",
						task.selected
							? selectedStyles[previewStatus]
							: unselectedStyles[previewStatus],
					)}
				>
					{/* Selection Checkbox & Status */}
					<div className="flex-col gap-2 p-3 pb-0">
						<div className="flex items-center gap-2">
							<AddSubtaskButton
								hasSubtasks={Boolean(task.subtasks && task.subtasks.length > 0)}
								onClick={() => handleAddSubtask("")}
							/>
							<EditableTitle
								id={0}
								title={task.title}
								onTitleChange={async (_, title) =>
									onUpdateTask(task.id, { title })
								}
								className={cn(
									"text-sm font-medium flex-1",
									task.isDeleted && "line-through text-gray-500",
								)}
							/>
						</div>
						<div className="pl-0 pr-4 mt-1">
							<TaskItemSubtaskList
								subtasks={processedSubtasks}
								onUpdate={handleUpdateSubtask}
								onDelete={handleDeleteSubtask}
								onAdd={handleAddSubtask}
								onReorder={handleReorderSubtasks}
								className="mt-1 pl-0 border-none ml-0"
							/>
							<EditableDescription
								id={0}
								description={task.description}
								onDescriptionChange={async (_, description) =>
									onUpdateTask(task.id, { description })
								}
								className="text-gray-600"
								initialMaxLines={3}
							/>
						</div>
					</div>

					<div className="flex items-center justify-between pl-12 pr-4 mt-2 pb-3 transition-all">
						<div className="flex items-center gap-2 flex-wrap">
							{/* Category */}
							<div>
								<CategorySelect
									selectedCategoryId={categoryId}
									onCategoryChange={handleCategoryChange}
								/>
							</div>
							{/* Task List */}
							<TaskListSelector
								currentTaskListId={taskListId ?? 0}
								onTaskListChange={(id) => {
									handleTaskListChange(id);
								}}
							/>
							{/* Date */}
							<div>
								<EditableDate
									id={0}
									date={task.executionDate ?? null}
									type="executionDate"
									onDateChange={async (_, date) =>
										onUpdateTask(task.id, { executionDate: date ?? undefined })
									}
									isRecurring={false} // Preview doesn't support manual recurrence edit yet
									onRecurrenceChange={async () => {}}
								/>
							</div>
							{/* Pomodoro */}
							<div>
								<EditableDuration
									id={0}
									duration={task.estimatedPomodoros}
									onDurationChange={async (_, duration) => {
										onUpdateTask(task.id, { estimatedPomodoros: duration });
									}}
								/>
							</div>
						</div>
					</div>

					<div
						className={cn(
							"transition-all duration-300 ease-in-out border-t border-transparent",
							task.subtasks && task.subtasks.length > 0
								? "border-gray-100 pb-2"
								: "h-0 overflow-hidden opacity-0",
						)}
					>
						<div className="px-2 pt-1"></div>
					</div>
				</div>
			</div>
		</div>
	);
});
