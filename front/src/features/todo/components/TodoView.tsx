import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { InboxMobile } from "@/features/todo/components/InboxMobile";
import { InboxPanel } from "@/features/todo/components/InboxPanel";
import CreateTaskListButton from "@/features/todo/components/ui/CreateTaskListButton";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import CustomTaskList from "./CustomTaskList";

export default function TodoView() {
	const fetchCategories = useCategoryStore((state) => state.fetchCategories);
	const {
		taskLists,
		loading,
		error,
		fetchTaskLists,
		addTaskList,
		updateTaskListTitle,
		updateTaskListDate,
		deleteTaskList,
		createTask,
		updateTask,
		deleteTask,
	} = useTodoStore();

	const [activeTask, setActiveTask] = useState<Task | null>(null);
	const [isInboxOpen, setIsInboxOpen] = useState(false);

	useEffect(() => {
		fetchTaskLists();
		fetchCategories();
	}, [fetchTaskLists, fetchCategories]);

	const handleDragStart = (event: DragStartEvent) => {
		if (event.active.data.current?.task) {
			setActiveTask(event.active.data.current.task);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveTask(null);
			return;
		}

		const task = active.data.current?.task as Task;
		const targetId = over.id as string;

		if (task && targetId.startsWith("tasklist-")) {
			const newTaskListId = Number.parseInt(
				targetId.replace("tasklist-", ""),
				10,
			);

			if (task.taskListId !== newTaskListId) {
				updateTask(task.id, { taskListId: newTaskListId });
			}
		}

		setActiveTask(null);
	};

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div
				className={`flex flex-col gap-6 h-full p-8 overflow-hidden transition-all duration-300 ${
					isInboxOpen
						? "w-full lg:w-[calc(100%-35vw)] xl:w-[calc(100%-28vw)]"
						: "w-full"
				}`}
			>
				<div className="flex justify-between items-center shrink-0">
					<h1 className="text-2xl font-bold">タスクリスト</h1>
					<CreateTaskListButton onTaskListCreated={addTaskList} />
				</div>

				{/* Mobile Inbox - Top section (md and below) */}
				<div className="lg:hidden">
					<InboxMobile
						onUpdateTask={updateTask}
						onDeleteTask={deleteTask}
						onCreateTask={createTask}
					/>
				</div>

				<div className="flex-1 min-h-0">
					<div className="flex-1 overflow-y-auto min-h-0 pr-2 h-full">
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
							<p className="text-gray-500 text-center py-4">
								No task lists found.
							</p>
						)}

						{!loading && !error && taskLists.length > 0 && (
							<div
								className={`grid gap-6 pb-20 ${
									isInboxOpen
										? "grid-cols-1 xl:grid-cols-2"
										: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
								}`}
							>
								{taskLists
									.filter((list) => list.title !== "Inbox")
									.map((list) => (
										<CustomTaskList
											key={list.id}
											taskList={list}
											onUpdateTask={updateTask}
											onTaskListTitleChange={updateTaskListTitle}
											onTaskListDateChange={updateTaskListDate}
											onDeleteTaskList={deleteTaskList}
											onDeleteTask={deleteTask}
											onCreateTask={createTask}
										/>
									))}
							</div>
						)}
					</div>
				</div>

				<DragOverlay>
					{activeTask ? (
						<div className="opacity-90 rotate-2 cursor-grabbing pointer-events-none">
							<div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-lg ring-2 ring-blue-400">
								<div className="flex items-center gap-4 flex-1">
									<div className="text-base font-medium text-gray-700">
										{activeTask.title}
									</div>
								</div>
							</div>
						</div>
					) : null}
				</DragOverlay>
			</div>

			{/* Inbox Panel - Fixed overlay (lg and above) */}
			<div className="hidden lg:block">
				<InboxPanel
					onUpdateTask={updateTask}
					onDeleteTask={deleteTask}
					onCreateTask={createTask}
					isOpen={isInboxOpen}
					onOpenChange={setIsInboxOpen}
				/>
			</div>
		</DndContext>
	);
}
