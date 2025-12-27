import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { useState } from "react";
import { CreateTaskForm } from "./forms/CreateTaskForm";
import { TaskItem } from "./TaskItem";

interface InboxMobileProps {
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		estimatedDuration?: number,
	) => Promise<void>;
}

export function InboxMobile({
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
}: InboxMobileProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const inboxList = useTodoStore((state) => state.getInboxList());

	const { setNodeRef, isOver } = useDroppable({
		id: inboxList ? `tasklist-${inboxList.id}` : "tasklist-inbox",
	});

	if (!inboxList) {
		return null;
	}

	const tasks = inboxList.tasks || [];

	return (
		<div className="mb-4">
			{/* Collapsed Header */}
			<div
				className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 shadow-sm transition-all ${
					isOver ? "ring-2 ring-blue-400 bg-blue-100" : ""
				}`}
			>
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className="w-full p-4 flex items-center justify-between"
				>
					<div className="flex items-center gap-3">
						<div className="bg-purple-500 p-2 rounded-lg">
							<Inbox className="w-5 h-5 text-white" />
						</div>
						<div className="text-left">
							<h2 className="text-lg font-bold text-gray-800">Inbox</h2>
							<p className="text-xs text-gray-500">
								{tasks.length} {tasks.length === 1 ? "task" : "tasks"}
							</p>
						</div>
					</div>
					{isExpanded ? (
						<ChevronUp className="w-5 h-5 text-gray-600" />
					) : (
						<ChevronDown className="w-5 h-5 text-gray-600" />
					)}
				</button>

				{/* Task creation form - always visible */}
				<div className="px-4 pb-4">
					<CreateTaskForm
						taskListId={inboxList.id}
						onCreateTask={onCreateTask}
						showListSelector={false}
					/>
				</div>

				{/* Expanded Content - Task List */}
				{isExpanded && (
					<div ref={setNodeRef} className="px-4 pb-4">
						{tasks.length > 0 ? (
							<div className="overflow-x-auto pb-2">
								<div className="flex gap-3">
									{tasks.map((task) => (
										<div key={task.id} className="w-[400px] shrink-0">
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
							<div className="text-center py-6 text-gray-400">
								<p className="text-sm">タスクがありません</p>
								<p className="text-xs mt-1">
									上の入力欄から新しいタスクを追加してください
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
