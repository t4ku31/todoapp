import { apiClient } from "@/config/env";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import type { Task, TaskList } from "@/types/types";
import { normalizeError } from "@/utils/error";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export const useTaskLists = () => {
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

	// ----------- TaskList Handlers -----------

	// Add new task list to state
	const addTaskList = useCallback((newTaskList: TaskList) => {
		// Sort tasks for the new list (though initially empty or pre-filled)
		const sortedList = {
			...newTaskList,
			tasks: sortTasks(newTaskList.tasks || []),
		};
		setTaskLists((prev) => [...prev, sortedList]);
	}, []);

	const updateTaskListTitle = useCallback(async (
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
	}, []);

	const updateTaskListDate = useCallback(async (
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
	}, []);

	const updateTaskListCompletion = useCallback(async (
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
	}, [taskLists]);

	const deleteTaskList = useCallback(async (taskListId: number) => {
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
	}, []);

	// ----------- Task Handlers -----------

	const createTask = useCallback(async (
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
	}, []);

	// Handle task update (Optimistic)
	const updateTask = useCallback(async (taskId: number, updates: Partial<Task>) => {
		// Store previous state for revert
		const previousLists = taskLists;

		try {
			// Optimistic Update: Update State immediately
			setTaskLists((prevLists) =>
				prevLists.map((list) => ({
					...list,
					tasks: list.tasks
						? list.tasks.map((task) =>
								task.id === taskId ? { ...task, ...updates } : task,
							)
						: [],
				})),
			);

			// Call API in background
			await apiClient.patch(`/api/tasks/${taskId}`, updates);
		} catch (err) {
			console.error("Failed to update task:", err);
			// Revert state on error
			setTaskLists(previousLists);
			
			const appError = normalizeError(err);
			toast.error("更新失敗", {
				description: appError.message,
			});
			throw err;
		}
	}, [taskLists]);

	const deleteTask = useCallback(async (taskId: number) => {
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
	}, []);

	return {
		taskLists,
		loading,
		error,
		addTaskList,
		updateTaskListTitle,
		updateTaskListDate,
		updateTaskListCompletion,
		deleteTaskList,
		createTask,
		updateTask,
		deleteTask,
	};
};
