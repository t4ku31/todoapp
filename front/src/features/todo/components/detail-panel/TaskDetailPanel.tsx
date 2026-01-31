import { format, isValid, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import {
	Calendar,
	ChevronRight,
	Clock,
	Folder,
	ListTree,
	Tag,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // Removed
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/store/useTodoStore";
import { CategorySelect } from "../ui/CategorySelect";
import { DeleteButton } from "../ui/DeleteButton";
import { EditableDate } from "../ui/EditableDate";
import { EditableDescription } from "../ui/EditableDescription";
import { EditableDuration } from "../ui/EditableDuration";
import { TaskItemSubtaskList } from "../ui/TaskItemSubtaskList";
import { TaskListSelector } from "../ui/TaskListSelector";

interface TaskDetailPanelProps {
	taskId: number;
	onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
	const { allTasks, updateTask, deleteTask, taskLists } = useTodoStore();
	const task = allTasks.find((t) => t.id === taskId);

	const [title, setTitle] = useState(task?.title || "");
	const [isChecked, setIsChecked] = useState(task?.status === "COMPLETED");

	// Sync local state with task changes
	useEffect(() => {
		if (task) {
			setTitle(task.title);
			setIsChecked(task.status === "COMPLETED");
		}
	}, [task]);

	const handleTitleBlur = useCallback(() => {
		if (task && title !== task.title && title.trim()) {
			updateTask(task.id, { title: title.trim() });
		}
	}, [task, title, updateTask]);

	const handleDescriptionChange = useCallback(
		async (_: number | string, newDescription: string) => {
			if (task && newDescription !== (task.description || "")) {
				try {
					await updateTask(task.id, { description: newDescription });
					toast.success("メモを保存しました");
				} catch {
					// Error handling is somewhat handled in updateTask, but toast helps
				}
			}
		},
		[task, updateTask],
	);

	/* Removed handleDescriptionBlur */

	const handleStatusChange = useCallback(
		(checked: boolean) => {
			if (task) {
				setIsChecked(checked);
				updateTask(task.id, { status: checked ? "COMPLETED" : "PENDING" });
			}
		},
		[task, updateTask],
	);

	const handleDelete = useCallback(async () => {
		if (task) {
			await deleteTask(task.id);
			onClose();
		}
	}, [task, deleteTask, onClose]);

	if (!task) {
		return (
			<div className="w-80 border-l bg-white p-6 flex flex-col items-center justify-center text-gray-400">
				<p>タスクが見つかりません</p>
				<Button variant="ghost" size="sm" onClick={onClose} className="mt-4">
					閉じる
				</Button>
			</div>
		);
	}

	// Get task list name
	const taskList = taskLists.find((l) => l.id === task.taskListId);

	// Format dates
	const formatDate = (dateStr: string | undefined) => {
		if (!dateStr) return null;
		const date = parseISO(dateStr);
		if (!isValid(date)) return null;
		return format(date, "M月d日（E）", { locale: ja });
	};

	const executionDateDisplay = formatDate(task.executionDate);
	const dueDateDisplay = formatDate(task.dueDate);

	const subtasks = task.subtasks || [];
	const completedSubtasks = subtasks.filter((st) => st.isCompleted).length;
	const totalSubtasks = subtasks.length;

	return (
		<div className="w-96 border-l bg-white flex flex-col h-full shadow-lg">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
				<div className="flex items-center gap-2 text-sm text-gray-500">
					{taskList && (
						<>
							<span className="font-medium">{taskList.title}</span>
							<ChevronRight className="w-4 h-4" />
						</>
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="h-8 w-8 text-gray-400 hover:text-gray-600"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{/* Title & Checkbox */}
				<div className="flex items-start gap-3">
					<Checkbox
						checked={isChecked}
						onCheckedChange={handleStatusChange}
						className="mt-1 h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
					/>
					<Input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onBlur={handleTitleBlur}
						className={cn(
							"flex-1 text-lg font-semibold border-none shadow-none focus-visible:ring-0",
							isChecked && "line-through text-gray-400",
						)}
						placeholder="タスク名"
					/>
				</div>

				{/* Due Date Badge */}
				{(executionDateDisplay || dueDateDisplay) && (
					<div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
						<Calendar className="w-4 h-4 text-gray-400" />
						<span className="text-sm text-gray-600">
							{executionDateDisplay || dueDateDisplay}
						</span>
						{task.dueDate && (
							<span className="text-xs text-orange-500 ml-auto">期限</span>
						)}
					</div>
				)}

				{/* Description */}
				<div className="space-y-2">
					<label
						htmlFor="task-description"
						className="text-sm font-medium text-gray-500"
					>
						メモ
					</label>
					<EditableDescription
						id={task.id}
						description={task.description}
						onDescriptionChange={handleDescriptionChange}
						placeholder="メモを追加..."
						className="min-h-[100px] text-base"
						initialMaxLines={5}
					/>
				</div>

				{/* Subtasks */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm font-medium text-gray-500">
							<ListTree className="w-4 h-4" />
							<span>サブタスク</span>
							{totalSubtasks > 0 && (
								<span className="text-xs text-gray-400">
									{completedSubtasks}/{totalSubtasks}
								</span>
							)}
						</div>
					</div>
					<TaskItemSubtaskList taskId={task.id} subtasks={subtasks} />
				</div>

				{/* Metadata Section */}
				<div className="space-y-3 pt-4 border-t">
					{/* Category */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Tag className="w-4 h-4" />
							<span>カテゴリ</span>
						</div>
						<CategorySelect
							selectedCategoryId={task.category?.id}
							onCategoryChange={(categoryId) =>
								updateTask(task.id, { categoryId } as Parameters<
									typeof updateTask
								>[1])
							}
						/>
					</div>

					{/* Task List */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Folder className="w-4 h-4" />
							<span>リスト</span>
						</div>
						<TaskListSelector
							currentTaskListId={task.taskListId}
							onTaskListChange={(taskListId) =>
								updateTask(task.id, { taskListId })
							}
						/>
					</div>

					{/* Execution Date */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Calendar className="w-4 h-4" />
							<span>実行日</span>
						</div>
						<EditableDate
							id={task.id}
							date={task.executionDate ?? null}
							type="executionDate"
							onDateChange={(id, date) =>
								updateTask(id, { executionDate: date })
							}
							onRecurrenceChange={async (id, recurrence) => {
								await updateTask(id, {
									isRecurring: recurrence.isRecurring,
									recurrenceRule: recurrence.recurrenceRule,
								});
							}}
							isRecurring={task.isRecurring}
							recurrenceRule={task.recurrenceRule}
						/>
					</div>

					{/* Duration */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Clock className="w-4 h-4" />
							<span>見積時間</span>
						</div>
						<EditableDuration
							id={task.id}
							duration={task.estimatedPomodoros}
							onDurationChange={(id, duration) =>
								updateTask(id, { estimatedPomodoros: duration })
							}
						/>
					</div>
				</div>
			</div>

			{/* Footer Actions */}
			<div className="p-4 border-t bg-gray-50/50">
				<DeleteButton
					onDelete={handleDelete}
					title="タスクを削除しますか？"
					description="この操作は取り消せません（ゴミ箱へ移動します）。"
					trigger={
						<Button
							variant="ghost"
							className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
						>
							<Trash2 className="w-4 h-4 mr-2" />
							タスクを削除
						</Button>
					}
				/>
			</div>
		</div>
	);
}
