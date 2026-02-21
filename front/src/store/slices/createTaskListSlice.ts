import { taskApi } from "@/features/todo/api/taskApi";
import type { TaskList } from "@/features/todo/types";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import { normalizeError } from "@/utils/error";
import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { TaskListSlice, TodoState } from "./types";

export const createTaskListSlice: StateCreator<
	TodoState,
	[],
	[],
	TaskListSlice
> = (set, get) => ({
	taskLists: [],

	fetchTaskLists: async (options = {}) => {
		const { force = false, background = false } = options;
		const state = get();

		if (state.loading && !force) return;
		if (state.isInitialized && !force && !background) return;

		if (!background) {
			set({ loading: true, error: null });
		} else {
			set({ error: null });
		}

		try {
			const data = await taskApi.fetchTaskLists();
			// Ensure tasks are sorted
			const taskLists = data.map((list) => ({
				...list,
				tasks: sortTasks(list.tasks || []),
			}));
			const allTasks = taskLists.flatMap((list) => list.tasks || []);

			set({ taskLists, allTasks, isInitialized: true });

			if (!background) {
				set({ loading: false });
			}
		} catch (err) {
			console.error("Failed to fetch task lists:", err);
			set({ error: "タスクリストの取得に失敗しました", loading: false });
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
		const originalLists = get().taskLists;
		set((state) => ({
			taskLists: state.taskLists.map((list) =>
				list.id === taskListId ? { ...list, title: newTitle } : list,
			),
		}));

		try {
			await taskApi.updateTaskListTitle(taskListId, newTitle);
		} catch (err) {
			console.error("Failed to update task list title:", err);
			const appError = normalizeError(err);
			toast.error("リストタイトル更新失敗", { description: appError.message });
			set({ taskLists: originalLists });
			throw err;
		}
	},

	updateTaskListDate: async (taskListId, newDate) => {
		const originalLists = get().taskLists;
		set((state) => ({
			taskLists: state.taskLists.map((list) =>
				list.id === taskListId ? { ...list, dueDate: newDate } : list,
			),
		}));

		try {
			await taskApi.updateTaskListDate(taskListId, newDate);
		} catch (err) {
			console.error("Failed to update task list date:", err);
			const appError = normalizeError(err);
			toast.error("リスト日付更新失敗", { description: appError.message });
			set({ taskLists: originalLists });
			throw err;
		}
	},

	updateTaskListCompletion: async (taskListId, isCompleted) => {
		const originalLists = get().taskLists;
		set((state) => ({
			taskLists: state.taskLists.map((list) =>
				list.id === taskListId ? { ...list, isCompleted } : list,
			),
		}));

		try {
			await taskApi.updateTaskListCompletion(taskListId, isCompleted);
		} catch (err) {
			console.error("Failed to update task list completion:", err);
			const appError = normalizeError(err);
			toast.error("タスクリストを完了できません", {
				description: appError.message,
			});
			set({ taskLists: originalLists });
			throw err;
		}
	},

	deleteTaskList: async (taskListId) => {
		try {
			await taskApi.deleteTaskList(taskListId);
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

	createTaskList: async (params) => {
		try {
			const newList = await taskApi.createTaskList(params);

			// Tasks returned in newList might need sorting
			if (newList.tasks) {
				newList.tasks = sortTasks(newList.tasks);
			}

			set((state) => ({
				taskLists: [...state.taskLists, newList],
				// Add new tasks to allTasks as well
				allTasks: [...state.allTasks, ...(newList.tasks || [])],
			}));
			toast.success("リストを作成しました");
			return newList;
		} catch (err) {
			console.error("Failed to create task list:", err);
			const appError = normalizeError(err);
			toast.error("リスト作成失敗", { description: appError.message });
			throw err;
		}
	},

	getInboxList: () => {
		return get().taskLists.find((list) => list.title === "Inbox");
	},
});
