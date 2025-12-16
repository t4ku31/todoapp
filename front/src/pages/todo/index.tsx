import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskListCard from "@/features/todo/components/TaskListCard";
import CreateTaskListButton from "@/features/todo/components/ui/CreateTaskListButton";
// import { useTaskLists } from "@/features/todo/hooks/useTaskLists"; // Deprecated
import { useTodoStore } from "@/store/useTodoStore";
import { useEffect } from "react";

export default function Todo() {
	const {
		taskLists,
		loading,
		error,
		fetchTaskLists,
		addTaskList,
		updateTaskListTitle,
		updateTaskListDate,
		updateTaskListCompletion,
		deleteTaskList,
		createTask,
		updateTask,
		deleteTask,
	} = useTodoStore();

	useEffect(() => {
		fetchTaskLists();
	}, [fetchTaskLists]);

	const activeTaskLists = taskLists.filter((list) => !list.isCompleted);
	const completedTaskLists = taskLists.filter((list) => list.isCompleted);

	return (
		<div className="flex flex-col gap-6 h-full w-full p-8 overflow-hidden bg-gradient-to-r from-blue-200 to-indigo-200">
			<div className="flex justify-between items-center shrink-0">
				<h1 className="text-2xl font-bold">タスクリスト</h1>
				<CreateTaskListButton onTaskListCreated={addTaskList} />
			</div>

			<div className="flex-1 min-h-0">
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
								{activeTaskLists.map((list) => (
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
								{completedTaskLists.map((list) => (
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
		</div>
	);
}
