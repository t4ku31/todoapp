import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { CreateTaskForm } from "./forms/CreateTaskForm";

interface InboxSectionProps {
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
	) => Promise<void>;
}

export function InboxSection({
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
}: InboxSectionProps) {
	const inboxList = useTodoStore((state) => state.getInboxList());

	const { setNodeRef, isOver } = useDroppable({
		id: inboxList ? `tasklist-${inboxList.id}` : "tasklist-inbox",
	});

	if (!inboxList) {
		return (
			<div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
				<div className="flex items-center gap-3">
					<Inbox className="w-5 h-5 text-purple-400" />
					<p className="text-sm text-gray-600">
						Inboxが見つかりません。新しいタスクリスト「Inbox」を作成してください。
					</p>
				</div>
			</div>
		);
	}

	const tasks = inboxList.tasks || [];

	return (
		<div 
			ref={setNodeRef}
			className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm transition-all ${
				isOver ? "ring-2 ring-blue-400 bg-blue-100" : ""
			}`}>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="bg-purple-500 p-2 rounded-lg">
						<Inbox className="w-5 h-5 text-white" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-800">Inbox</h2>
						<p className="text-xs text-gray-500">
							{tasks.length} {tasks.length === 1 ? "task" : "tasks"}
						</p>
					</div>
				</div>
				<div className="w-72">
					<CreateTaskForm
						taskListId={inboxList.id}
						onCreateTask={onCreateTask}
					/>
				</div>
			</div>

			{tasks.length > 0 ? (
				<div className="overflow-x-auto pb-2">
					<div className="flex gap-4 min-w-min">
						{tasks.map((task) => (
							<div key={task.id} className="w-[600px] shrink-0">
								<TaskItem
									task={task}
									onUpdateTask={onUpdateTask}
									onDeleteTask={onDeleteTask}
								/>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="text-center py-8 text-gray-400">
					<p className="text-sm">タスクがありません</p>
					<p className="text-xs mt-1">上の入力欄から新しいタスクを追加してください</p>
				</div>
			)}
		</div>
	);
}
