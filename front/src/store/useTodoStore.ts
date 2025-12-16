import { apiClient } from "@/config/env";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import type { Task, TaskList } from "@/types/types";
import { normalizeError } from "@/utils/error";
import { toast } from "sonner";
import { create } from "zustand";

interface TodoState {
	taskLists: TaskList[];
	allTasks: Task[]; // Flattened list for optimized access
	loading: boolean;
	error: string | null;

	fetchTaskLists: () => Promise<void>;
	addTaskList: (newTaskList: TaskList) => void;
	updateTaskListTitle: (taskListId: number, newTitle: string) => Promise<void>;
	updateTaskListDate: (taskListId: number, newDate: string) => Promise<void>;
	updateTaskListCompletion: (
		taskListId: number,
		isCompleted: boolean,
	) => Promise<void>;
	deleteTaskList: (taskListId: number) => Promise<void>;

	createTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
	) => Promise<void>;
	updateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	deleteTask: (taskId: number) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
	taskLists: [],
	allTasks: [],
	loading: false,
	error: null,

	fetchTaskLists: async () => {
		set({ loading: true, error: null });
		try {
			const response = await apiClient.get<TaskList[]>("/api/tasklists");
			const sortedLists = response.data.map((list) => ({
				...list,
				tasks: sortTasks(list.tasks || []),
			}));
			const allTasks = sortedLists.flatMap((list) => list.tasks || []);
			set({ taskLists: sortedLists, allTasks, loading: false });
		} catch (err) {
			console.error("Failed to fetch tasklists:", err);
			const appError = normalizeError(err);
			set({ error: appError.message, loading: false });
		}
	},

	addTaskList: (newTaskList: TaskList) => {
		const sortedList = {
			...newTaskList,
			tasks: sortTasks(newTaskList.tasks || []),
		};
		set((state) => ({ taskLists: [...state.taskLists, sortedList] }));
	},

	updateTaskListTitle: async (taskListId, newTitle) => {
		// Optimistic update
		const originalLists = get().taskLists;
		set((state) => ({
			taskLists: state.taskLists.map((list) =>
				list.id === taskListId ? { ...list, title: newTitle } : list,
			),
		}));

		try {
			await apiClient.patch(`/api/tasklists/${taskListId}`, {
				title: newTitle,
			});
		} catch (err) {
			console.error("Failed to update task list title:", err);
			const appError = normalizeError(err);
			toast.error("リストタイトル更新失敗", { description: appError.message });
			set({ taskLists: originalLists }); // Revert
			throw err;
		}
	},

	updateTaskListDate: async (taskListId, newDate) => {
		// Optimistic update
		const originalLists = get().taskLists;
		set((state) => ({
			taskLists: state.taskLists.map((list) =>
				list.id === taskListId ? { ...list, dueDate: newDate } : list,
			),
		}));

		try {
			await apiClient.patch(`/api/tasklists/${taskListId}`, {
				dueDate: newDate,
			});
		} catch (err) {
			console.error("Failed to update task list date:", err);
			const appError = normalizeError(err);
			toast.error("リスト日付更新失敗", { description: appError.message });
			set({ taskLists: originalLists }); // Revert
			throw err;
		}
	},

	updateTaskListCompletion: async (taskListId, isCompleted) => {
		// Optimistic update
		const originalLists = get().taskLists;
		set((state) => ({
			taskLists: state.taskLists.map((list) =>
				list.id === taskListId ? { ...list, isCompleted } : list,
			),
		}));

		try {
			await apiClient.patch(`/api/tasklists/${taskListId}`, { isCompleted });
		} catch (err) {
			console.error("Failed to update task list completion:", err);
			const appError = normalizeError(err);
			toast.error("タスクリストを完了できません", {
				description: appError.message,
			});
			set({ taskLists: originalLists }); // Revert
			throw err;
		}
	},

	deleteTaskList: async (taskListId) => {
		try {
			await apiClient.delete(`/api/tasklists/${taskListId}`);
			set((state) => ({
				taskLists: state.taskLists.filter((list) => list.id !== taskListId),
				allTasks: state.allTasks.filter((t) => t.taskListId !== taskListId),
			}));
			toast.success("タスクリストを削除しました");
		} catch (err) {
			console.error("Failed to delete task list:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
		}
	},

	createTask: async (taskListId, title, dueDate, executionDate) => {
		try {
			const response = await apiClient.post<Task>("/api/tasks", {
				title,
				taskListId,
				dueDate,
				executionDate,
			});
			const newTask = response.data;

			set((state) => ({
				taskLists: state.taskLists.map((list) => {
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
						return { ...list, tasks: sortTasks(updatedTasks) };
					}
					return list;
				}),
				allTasks: [...state.allTasks, newTask],
			}));

			toast.success("タスクを追加しました");
		} catch (err) {
			console.error("Failed to create task:", err);
			const appError = normalizeError(err);
			toast.error("作成失敗", { description: appError.message });
			throw err;
		}
	},

	updateTask: async (taskId, updates) => {
		// Optimistic update
		const originalLists = get().taskLists;
		const originalTasks = get().allTasks;
		set((state) => ({
			taskLists: state.taskLists.map((list) => ({
				...list,
				tasks: list.tasks
					? list.tasks.map((task) =>
							task.id === taskId ? { ...task, ...updates } : task,
						)
					: [],
			})),
			allTasks: state.allTasks.map((task) =>
				task.id === taskId ? { ...task, ...updates } : task,
			),
		}));

		try {
			await apiClient.patch(`/api/tasks/${taskId}`, updates);
		} catch (err) {
			console.error("Failed to update task:", err);
			const appError = normalizeError(err);
			toast.error("更新失敗", { description: appError.message });
			set({ taskLists: originalLists, allTasks: originalTasks }); // Revert
			throw err;
		}
	},

	deleteTask: async (taskId) => {
		try {
			await apiClient.delete(`/api/tasks/${taskId}`);
			set((state) => ({
				taskLists: state.taskLists.map((list) => ({
					...list,
					tasks: list.tasks ? list.tasks.filter((t) => t.id !== taskId) : [],
				})),
				allTasks: state.allTasks.filter((t) => t.id !== taskId),
			}));
			toast.success("タスクを削除しました");
		} catch (err) {
			console.error("Failed to delete task:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
		}
	},
}));
