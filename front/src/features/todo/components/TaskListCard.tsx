import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskList, TaskStatus } from "@/types/types";
import { ClearButton } from "./ClearButton";
import { CreateTaskForm } from "./CreateTaskForm";
import { DeleteButton } from "./DeleteButton";
import { EditableDate } from "./EditableDate";
import { EditableTitle } from "./EditableTitle";
import { TaskItem } from "./TaskItem";

interface TaskCardProps {
	taskLists: TaskList[];
	loading: boolean;
	error: string | null;
	onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
	onTaskTitleChange: (taskId: number, newTitle: string) => Promise<void>;
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
	onCreateTask: (taskListId: number, title: string) => Promise<void>;
}

export default function TaskCard({
	taskLists,
	loading,
	error,
	onStatusChange,
	onTaskTitleChange,
	onTaskListTitleChange,
	onTaskListDateChange,
	onIsCompletedChange,
	onDeleteTaskList,
	onDeleteTask,
	onCreateTask,
}: TaskCardProps) {
	return (
		<Card className="h-full rounded-lg overflow-hidden flex flex-col border-none">
			<CardHeader>
				<CardTitle>Task Lists</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 overflow-y-auto">
				{loading && (
					<p className="text-gray-500 text-center py-4">
						Loading task lists...
					</p>
				)}

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
						<p className="font-bold">Error</p>
						<p>{error}</p>
					</div>
				)}

				{!loading && !error && taskLists.length === 0 && (
					<p className="text-gray-500 text-center py-4">No task lists found.</p>
				)}

				{!loading && !error && taskLists.length > 0 && (
					<div className="space-y-6">
						{taskLists.map((taskList) => {
							// Validation: Check if all tasks are completed
							const canComplete =
								taskList.tasks?.every((task) => task.status === "COMPLETED") ??
								true;
							const disabledReason = !canComplete
								? "すべてのタスクを完了してください"
								: undefined;

							return (
								<div key={taskList.id} className="border rounded-lg p-4">
									<div className="flex justify-between items-start mb-4">
										<div className="flex-1">
											<EditableTitle
												id={taskList.id}
												title={taskList.title}
												onTitleChange={onTaskListTitleChange}
											/>
											<EditableDate
												id={taskList.id}
												date={taskList.dueDate ?? null}
												onDateChange={onTaskListDateChange}
											/>
										</div>
										<div className="flex items-center gap-1">
											<DeleteButton
												onDelete={() => onDeleteTaskList(taskList.id)}
												title="タスクリストを削除しますか？"
												description="この操作は取り消せません。リストに含まれるすべてのタスクも削除されます。"
											/>
											<ClearButton
												isCompleted={taskList.isCompleted}
												onToggleCompletion={() =>
													onIsCompletedChange(
														taskList.id,
														!taskList.isCompleted,
													)
												}
												disabled={!canComplete}
												disabledReason={disabledReason}
											/>
										</div>
									</div>

									{taskList.tasks && taskList.tasks.length > 0 ? (
										<div className="space-y-3">
											{taskList.tasks.map((task) => (
												<TaskItem
													key={task.id}
													task={task}
													onStatusChange={onStatusChange}
													onTaskTitleChange={onTaskTitleChange}
													onDeleteTask={onDeleteTask}
												/>
											))}
										</div>
									) : (
										<p className="text-gray-400 text-sm">
											No tasks in this list
										</p>
									)}
									<CreateTaskForm
										taskListId={taskList.id}
										onCreateTask={onCreateTask}
									/>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
