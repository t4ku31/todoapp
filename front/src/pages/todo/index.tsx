import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InboxSection } from "@/features/todo/components/InboxSection";
import TaskListCard from "@/features/todo/components/TaskListCard";
import CreateTaskListButton from "@/features/todo/components/ui/CreateTaskListButton";
// import { useTaskLists } from "@/features/todo/hooks/useTaskLists"; // Deprecated
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useEffect, useState } from "react";

export default function Todo() {
	const {
		taskLists,
		loading,
		error,
		fetchTaskLists,
        fetchCategories,
		addTaskList,
		updateTaskListTitle,
		updateTaskListDate,
		updateTaskListCompletion,
		deleteTaskList,
		createTask,
		updateTask,
		deleteTask,
	} = useTodoStore();

	const [activeTask, setActiveTask] = useState<Task | null>(null);

	useEffect(() => {
		fetchTaskLists();
        fetchCategories();
	}, [fetchTaskLists, fetchCategories]);

	const activeTaskLists = taskLists.filter((list) => !list.isCompleted);
	const completedTaskLists = taskLists.filter((list) => list.isCompleted);

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

		// Extract taskListId from the droppable ID (format: "tasklist-{id}")
		if (task && targetId.startsWith("tasklist-")) {
			const newTaskListId = Number.parseInt(targetId.replace("tasklist-", ""));
			
			if (task.taskListId !== newTaskListId) {
				updateTask(task.id, { taskListId: newTaskListId });
			}
		}

		setActiveTask(null);
	};

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="flex flex-col gap-6 h-full w-full p-8 overflow-hidden bg-gradient-to-r from-blue-200 to-indigo-200">
				<div className="flex justify-between items-center shrink-0">
					<h1 className="text-2xl font-bold">タスクリスト</h1>
					<CreateTaskListButton onTaskListCreated={addTaskList} />
				</div>

				<div className="flex-1 min-h-0">
			<InboxSection
				onUpdateTask={updateTask}
				onDeleteTask={deleteTask}
				onCreateTask={createTask}
			/>

			<Tabs defaultValue="active" className="flex flex-col h-full">
					<TabsList className="grid w-full grid-cols-2 mb-4 rounded-full">
						<TabsTrigger value="active" className="rounded-full">Active Tasks</TabsTrigger>
						<TabsTrigger value="completed" className="rounded-full">Completed Tasks</TabsTrigger>
					</TabsList>

					<TabsContent
						value="active"
						className="flex-1 overflow-y-auto min-h-0 pr-2 mt-0"
					>
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

						{!loading && !error && activeTaskLists.length === 0 && (
							<p className="text-gray-500 text-center py-4">
								No active task lists found.
							</p>
						)}

						{!loading && !error && activeTaskLists.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
							{activeTaskLists
								.filter((list) => list.title !== "Inbox")
								.map((list) => (
									<TaskListCard
										key={list.id}
										taskList={list}
										onUpdateTask={updateTask}
										onTaskListTitleChange={updateTaskListTitle}
										onTaskListDateChange={updateTaskListDate}
										onIsCompletedChange={updateTaskListCompletion}
										onDeleteTaskList={deleteTaskList}
										onDeleteTask={deleteTask}
										onCreateTask={createTask}
									/>
								))}
						</div>
					)}
					</TabsContent>

					<TabsContent
						value="completed"
						className="flex-1 overflow-y-auto min-h-0 pr-2 mt-0"
					>
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

						{!loading && !error && completedTaskLists.length === 0 && (
							<p className="text-gray-500 text-center py-4">
								No completed task lists found.
							</p>
						)}

						{!loading && !error && completedTaskLists.length > 0 && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
								{completedTaskLists
									.filter((list) => list.title !== "Inbox")
									.map((list) => (
										<TaskListCard
											key={list.id}
											taskList={list}
											onUpdateTask={updateTask}
											onTaskListTitleChange={updateTaskListTitle}
											onTaskListDateChange={updateTaskListDate}
											onIsCompletedChange={updateTaskListCompletion}
											onDeleteTaskList={deleteTaskList}
											onDeleteTask={deleteTask}
											onCreateTask={createTask}
										/>
									))}
							</div>
						)}
					</TabsContent>
			</Tabs>
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
		</DndContext>
	);
}
