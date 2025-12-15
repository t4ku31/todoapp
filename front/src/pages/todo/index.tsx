import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/config/env";
import TaskListCard from "@/features/todo/components/TaskListCard";
import CreateTaskListButton from "@/features/todo/components/ui/CreateTaskListButton";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import type { Task, TaskList } from "@/types/types";
import { normalizeError } from "@/utils/error";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Todo() {
	const [taskLists, setTaskLists] = useState<TaskList[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch tasklists on initial render
	useEffect(() => {
		const fetchTaskLists = async () => {
			try {
				setLoading(true);
				const response = await apiClient.get<TaskList[]>("/api/tasklists");
				// Sort tasks in each list
				const sortedLists = response.data.map((list) => ({
					...list,
					tasks: sortTasks(list.tasks || []),
				}));
				setTaskLists(sortedLists);
				setError(null);
			} catch (err) {
				console.error("Failed to fetch tasklists:", err);
				const appError = normalizeError(err);
				setError(appError.message);
			} finally {
				setLoading(false);
			}
		};

		fetchTaskLists();
	}, []);

	// --- TaskList Handlers ---

	// Add new task list to state
	const handleAddTaskList = (newTaskList: TaskList) => {
		// Sort tasks for the new list (though initially empty or pre-filled)
		const sortedList = {
			...newTaskList,
			tasks: sortTasks(newTaskList.tasks || []),
		};
		setTaskLists((prev) => [...prev, sortedList]);
	};

	const handleTaskListTitleChange = async (
		taskListId: number,
		newTitle: string,
	) => {
		try {
			// Optimistic update
			setTaskLists((prevLists) =>
				prevLists.map((list) =>
					list.id === taskListId ? { ...list, title: newTitle } : list,
				),
			);

			await apiClient.patch(`/api/tasklists/${taskListId}`, {
				title: newTitle,
			});
		} catch (err) {
			console.error("Failed to update task list title:", err);
			const appError = normalizeError(err);
			toast.error("リストタイトル更新失敗", {
				description: appError.message,
			});
			throw err;
		}
	};

	const handleTaskListDateChange = async (
		taskListId: number,
		newDate: string,
	) => {
		try {
			// Optimistic update
			setTaskLists((prevLists) =>
				prevLists.map((list) =>
					list.id === taskListId ? { ...list, dueDate: newDate } : list,
				),
			);

			await apiClient.patch(`/api/tasklists/${taskListId}`, {
				dueDate: newDate,
			});
		} catch (err) {
			console.error("Failed to update task list date:", err);
			const appError = normalizeError(err);
			toast.error("リスト日付更新失敗", {
				description: appError.message,
			});
			throw err;
		}
	};

	const handleIsCompletedChange = async (
		taskListId: number,
		isCompleted: boolean,
	) => {
		// Store previous state for revert
		const previousLists = taskLists;

		try {
			// Optimistic update
			setTaskLists((prevLists) =>
				prevLists.map((list) =>
					list.id === taskListId ? { ...list, isCompleted: isCompleted } : list,
				),
			);

			await apiClient.patch(`/api/tasklists/${taskListId}`, {
				isCompleted: isCompleted,
			});
		} catch (err) {
			console.error("Failed to update task list completion:", err);
			// Revert optimistic update on error
			setTaskLists(previousLists);

			const appError = normalizeError(err);
			toast.error("タスクリストを完了できません", {
				description: appError.message,
			});

			throw err;
		}
	};

	const handleDeleteTaskList = async (taskListId: number) => {
		try {
			await apiClient.delete(`/api/tasklists/${taskListId}`);
			setTaskLists((prevLists) =>
				prevLists.filter((list) => list.id !== taskListId),
			);
			toast.success("タスクリストを削除しました");
		} catch (err) {
			console.error("Failed to delete task list:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", {
				description: appError.message,
			});
		}
	};

	// --- Task Handlers ---

	const handleCreateTask = async (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
	) => {
		try {
			const response = await apiClient.post<Task>("/api/tasks", {
				title,
				taskListId,
				dueDate,
				executionDate,
			});
			const newTask = response.data;

			setTaskLists((prevLists) =>
				prevLists.map((list) => {
					if (list.id === taskListId) {
						const updatedTasks = [
							...(list.tasks || []),
							{
								id: newTask.id,
								title: newTask.title,
								status: newTask.status || "PENDING",
								taskListId: taskListId,
								dueDate: newTask.dueDate,
								executionDate: newTask.executionDate,
							},
						];

						return {
							...list,
							tasks: sortTasks(updatedTasks),
						};
					}
					return list;
				}),
			);

			toast.success("タスクを追加しました");
		} catch (err) {
			console.error("Failed to create task:", err);
			const appError = normalizeError(err);
			toast.error("作成失敗", {
				description: appError.message,
			});
			throw err;
		}
	};

	// Handle task update (Generic)
	const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
		try {
			// Call API first (Pessimistic UI)
			await apiClient.patch(`/api/tasks/${taskId}`, updates);

			// Update State on success
			setTaskLists((prevLists) =>
				prevLists.map((list) => ({
					...list,
					tasks: list.tasks
						? list.tasks.map((task) =>
								task.id === taskId ? { ...task, ...updates } : task,
							)
						: [],
					// Resort might be needed if status changes, but minimal update for now.
					// Ideally re-fetch or careful splice needed for status change moving lists.
				})),
			);
		} catch (err) {
			console.error("Failed to update task:", err);
			const appError = normalizeError(err);
			toast.error("更新失敗", {
				description: appError.message,
			});
			throw err;
		}
	};

	const handleDeleteTask = async (taskId: number) => {
		try {
			// Wait for backend validation/processing
			await apiClient.delete(`/api/tasks/${taskId}`);

			// Update UI only after success
			setTaskLists((prevLists) =>
				prevLists.map((list) => ({
					...list,
					tasks: list.tasks
						? list.tasks.filter((task) => task.id !== taskId)
						: [],
				})),
			);

			toast.success("タスクを削除しました");
		} catch (err) {
			console.error("Failed to delete task:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", {
				description: appError.message,
			});
		}
	};

	const activeTaskLists = taskLists.filter((list) => !list.isCompleted);
	const completedTaskLists = taskLists.filter((list) => list.isCompleted);

	return (
		<div className="flex flex-col gap-6 h-full w-full p-8 overflow-hidden bg-gradient-to-r from-blue-200 to-indigo-200">
			<div className="flex justify-between items-center shrink-0">
				<h1 className="text-2xl font-bold">タスクリスト</h1>
				<CreateTaskListButton onTaskListCreated={handleAddTaskList} />
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
										onUpdateTask={handleUpdateTask}
										onTaskListTitleChange={handleTaskListTitleChange}
										onTaskListDateChange={handleTaskListDateChange}
										onIsCompletedChange={handleIsCompletedChange}
										onDeleteTaskList={handleDeleteTaskList}
										onDeleteTask={handleDeleteTask}
										onCreateTask={handleCreateTask}
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
										onUpdateTask={handleUpdateTask}
										onTaskListTitleChange={handleTaskListTitleChange}
										onTaskListDateChange={handleTaskListDateChange}
										onIsCompletedChange={handleIsCompletedChange}
										onDeleteTaskList={handleDeleteTaskList}
										onDeleteTask={handleDeleteTask}
										onCreateTask={handleCreateTask}
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
