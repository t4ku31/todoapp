import { GripVertical, Trash2 } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ParsedTask } from "@/features/ai/types";
import { CategorySelect } from "@/features/todo/components/ui/CategorySelect";
import { EditableDate } from "@/features/todo/components/ui/EditableDate";
import { EditableDescription } from "@/features/todo/components/ui/EditableDescription";
import { EditableDuration } from "@/features/todo/components/ui/EditableDuration";
import { EditableTitle } from "@/features/todo/components/ui/EditableTitle";
import { TaskListSelector } from "@/features/todo/components/ui/TaskListSelector";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";
import { isExistingTask } from "../../utils/aiUtils";

interface AiPreviewTaskItemProps {
	task: ParsedTask;
	index: number;
	onUpdateTask: (taskId: number, updates: Partial<ParsedTask>) => void;
	onToggleSelection: (taskId: number) => void;
}

export const AiPreviewTaskItem = memo(function AiPreviewTaskItem({
	task,
	onUpdateTask,
	onToggleSelection,
}: AiPreviewTaskItemProps) {
	// Stores for mapping IDs <-> Names
	const { categories } = useCategoryStore();
	const { taskLists } = useTodoStore();

	// Resolve Category ID
	const categoryId = task.categoryName
		? categories.find((c) => c.name === task.categoryName)?.id
		: undefined;

	// Resolve TaskList ID
	const taskListId = task.taskListTitle
		? taskLists.find((l) => l.title === task.taskListTitle)?.id
		: undefined;

	// 既存タスクかどうか
	const isExisting = isExistingTask(task);

	const handleCategoryChange = (newCategoryId: number) => {
		const category = categories.find((c) => c.id === newCategoryId);
		if (category) {
			onUpdateTask(task.id, { categoryName: category.name });
		}
		console.log("change category", task.categoryName);
	};

	const handleTaskListChange = (newTaskListId: number) => {
		const list = taskLists.find((l) => l.id === newTaskListId);
		if (list) {
			onUpdateTask(task.id, { taskListTitle: list.title });
		}
		console.log("change task list", task.taskListTitle);
	};

	return (
		<div
			className={cn(
				"relative px-4 py-3 bg-white rounded-xl transition-all duration-200 group border shadow-sm hover:shadow-md",
				task.selected
					? "border-4 border-indigo-200 ring-2 ring-indigo-100 bg-white"
					: "border-gray-100 opacity-60 bg-gray-50",
				isExisting && !task.isDeleted && "border-amber-200",
				task.isDeleted && "border-red-200 bg-red-50/30 ring-red-100",
			)}
		>
			<div className="flex items-center gap-2">
				{/* Drag Handle (Visual only for now) */}
				<div className="text-gray-300 cursor-move">
					<GripVertical className="w-4 h-4" />
				</div>

				<Checkbox
					checked={task.selected}
					onCheckedChange={() => onToggleSelection(task.id)}
					className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 transition-colors"
				/>

				<div className="flex-1 min-w-0">
					<EditableTitle
						id={0} // Preview uses 0 as dummy ID, updates are handled via onTitleChange closure
						title={task.title}
						onTitleChange={async (_, title) => onUpdateTask(task.id, { title })}
						className="text-base font-medium truncate"
					/>
				</div>

				{/* Edit Icon / Status Badge */}
				{task.isDeleted ? (
					<span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
						Delete
					</span>
				) : !isExisting ? (
					<span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
						New
					</span>
				) : (
					<span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
						Edit
					</span>
				)}
			</div>

			{/* Description */}
			<div className="pl-7 pr-4 mt-1">
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

			{/* Chips / Action Section */}
			<div className="flex items-center justify-between pl-7 mt-2 transition-all">
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
							console.log("change task list", task.taskListTitle);
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

				{/* Delete (Deselect/Remove from preview) */}
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onToggleSelection(task.id)}
					className="text-gray-400 hover:text-red-500"
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>

			{/* Subtasks Section */}
			{task.subtasks && task.subtasks.length > 0 && (
				<div className="pl-7 mt-3 space-y-1">
					<div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
						Subtasks
					</div>
					<div className="grid grid-cols-1 gap-1">
						{task.subtasks?.map((st, i) => (
							<div
								key={`${task.id}-st-${i}`}
								className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50/50 px-2 py-1 rounded"
							>
								<div className="w-1 h-1 rounded-full bg-gray-300" />
								<span className="truncate">
									{typeof st === "string" ? st : st.title}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
});
