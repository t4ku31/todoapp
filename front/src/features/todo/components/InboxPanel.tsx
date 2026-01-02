import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { CreateTaskForm } from "./forms/CreateTaskForm";
import { TaskItem } from "./TaskItem";

interface InboxPanelProps {
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		estimatedDuration?: number,
	) => Promise<void>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InboxPanel({
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
	isOpen,
	onOpenChange,
}: InboxPanelProps) {
	const inboxList = useTodoStore((state) => state.getInboxList());

	const { setNodeRef, isOver } = useDroppable({
		id: inboxList ? `tasklist-${inboxList.id}` : "tasklist-inbox",
	});

	if (!inboxList) {
		return null;
	}

	const tasks = inboxList.tasks || [];

	return (
		<>
			{/* Toggle Button - Always visible on the right edge */}
			<button
				type="button"
				onClick={() => onOpenChange(!isOpen)}
				className={`fixed top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-l-xl shadow-lg hover:shadow-xl transition-all ${
					isOpen ? "right-[33vw] md:right-[28vw]" : "right-0"
				}`}
				aria-label={isOpen ? "Close Inbox" : "Open Inbox"}
			>
				{isOpen ? (
					<div className="flex items-center gap-2">
						<Inbox className="w-5 h-5" />
					</div>
				) : (
					<div className="flex items-center gap-2">
						<Inbox className="w-5 h-5" />
						{tasks.length > 0 && (
							<span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
								{tasks.length}
							</span>
						)}
					</div>
				)}
			</button>

			{/* Slide Panel */}
			<div
				ref={setNodeRef}
				className={`fixed top-0 right-0 h-full bg-gradient-to-br from-purple-50 to-pink-50 border-l border-purple-200 shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "translate-x-full"
				} ${isOver ? "ring-4 ring-blue-400 bg-blue-50" : ""} w-[90vw] sm:w-[70vw] md:w-[50vw] lg:w-[35vw] xl:w-[28vw]`}
			>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="shrink-0 p-6 border-b border-purple-200 bg-white/50 backdrop-blur-sm">
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
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onOpenChange(false)}
								className="h-8 w-8 p-0"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
						<CreateTaskForm
							taskListId={inboxList.id}
							onCreateTask={onCreateTask}
							showListSelector={false}
						/>
					</div>

					{/* Task List */}
					<div className="flex-1 overflow-y-auto p-6">
						{tasks.length > 0 ? (
							<div className="space-y-4">
								{tasks.map((task) => (
									<div key={task.id}>
										<TaskItem
											task={task}
											onUpdateTask={onUpdateTask}
											onDeleteTask={onDeleteTask}
										/>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-400">
								<p className="text-sm">タスクがありません</p>
								<p className="text-xs mt-1">
									上の入力欄から新しいタスクを追加してください
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
