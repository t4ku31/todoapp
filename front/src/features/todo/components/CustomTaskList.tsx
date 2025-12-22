import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Task, TaskList } from "@/types/types";
import { CreateTaskForm } from "./forms/CreateTaskForm";
import { TaskItem } from "./TaskItem";
import { CompletionBadge } from "./ui/CompletionBadge";
import { DeleteButton } from "./ui/DeleteButton";
import { EditableDate } from "./ui/EditableDate";
import { EditableTitle } from "./ui/EditableTitle";

interface CustomTaskListProps {
	taskList: TaskList;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onTaskListTitleChange: (
		taskListId: number,
		newTitle: string,
	) => Promise<void>;
	onTaskListDateChange: (taskListId: number, newDate: string) => Promise<void>;
	onIsCompletedChange: (
		taskListId: number,
		isCompleted: boolean,
	) => Promise<void>;
	onDeleteTaskList: (taskListId: number) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
	) => Promise<void>;
}

export default function CustomTaskList({
	taskList,
	onUpdateTask,
	onTaskListTitleChange,
	onTaskListDateChange,
	onIsCompletedChange,
	onDeleteTaskList,
	onDeleteTask,
	onCreateTask,
}: CustomTaskListProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: `tasklist-${taskList.id}`,
	});

	// Validation: Check if all tasks are completed
	// const canComplete =
	// 	taskList.tasks?.every((task) => task.status === "COMPLETED") ??
	// 	true;
	// const disabledReason = !canComplete
	// 	? "すべてのタスクを完了してください"
	// 	: undefined;

	return (
		<Card
			ref={setNodeRef}
			key={taskList.id}
			className={`flex flex-col h-full border-none shadow-md overflow-x-hidden transition-all ${
				isOver ? "ring-2 ring-blue-400 bg-blue-50" : ""
			}`}
		>
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<div className="flex-1 min-w-0 mr-2">
						<EditableTitle
							id={taskList.id}
							title={taskList.title}
							onTitleChange={onTaskListTitleChange}
							className="font-semibold text-lg"
						/>
						<EditableDate
							id={taskList.id}
							date={taskList.dueDate ?? null}
							type="dueDate"
							onDateChange={onTaskListDateChange}
						/>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<CompletionBadge tasks={taskList.tasks || []} />
						<DeleteButton
							onDelete={() => onDeleteTaskList(taskList.id)}
							title="タスクリストを削除しますか？"
							description="この操作は取り消せません。リストに含まれるすべてのタスクも削除されます。"
						/>
						{/* <ClearButton
							isCompleted={taskList.isCompleted}
							onToggleCompletion={() =>
								onIsCompletedChange(
									taskList.id,
									!taskList.isCompleted,
								)
							}
							disabled={!canComplete}
							disabledReason={disabledReason}
						/> */}
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col gap-4">
				<div className="pt-2 mt-auto">
					<CreateTaskForm
						taskListId={taskList.id}
						onCreateTask={onCreateTask}
						showListSelector={false}
					/>
				</div>
				<div className="flex-1 space-y-3">
					{taskList.tasks && taskList.tasks.length > 0 ? (
						taskList.tasks.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
								onUpdateTask={onUpdateTask}
								onDeleteTask={onDeleteTask}
							/>
						))
					) : (
						<p className="text-gray-400 text-sm text-center py-8">
							No tasks yet
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
