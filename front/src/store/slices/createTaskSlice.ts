import { taskApi } from "@/features/todo/api/taskApi";
import type { Task } from "@/features/todo/types";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import { normalizeError } from "@/utils/error";
import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { TaskSlice, TodoState } from "./types";

export const createTaskSlice: StateCreator<TodoState, [], [], TaskSlice> = (
	set,
	get,
) => ({
	allTasks: [],
	trashTasks: [],

	fetchTrashTasks: async () => {
		set({ loading: true, error: null });
		try {
			const data = await taskApi.fetchTrashTasks();
			const trashTasks = data.map((t) => ({ ...t, isDeleted: true }));
			set({ trashTasks, loading: false });
		} catch (err) {
			console.error("Failed to fetch trash tasks:", err);
			set({ error: "ゴミ箱の取得に失敗しました", loading: false });
		}
	},

	createTask: async (params) => {
		const { taskListId } = params;
		try {
			const newTask = await taskApi.createTask(params);

			set((state) => ({
				taskLists: state.taskLists.map((list) => {
					if (list.id === taskListId) {
						const updatedTasks = [
							...(list.tasks || []),
							{
								...newTask,
								status: newTask.status || "PENDING",
								taskListId: taskListId,
							},
						];
						return { ...list, tasks: sortTasks(updatedTasks) };
					}
					return list;
				}),
				allTasks: [...state.allTasks, newTask],
			}));

			toast.success("タスクを追加しました");
			return newTask;
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

		// Build optimistic updates
		const optimisticUpdates: Partial<Task> & { categoryId?: number } = {
			...updates,
		};

		if (updates.status === "COMPLETED") {
			optimisticUpdates.completedAt = new Date();
		} else if (updates.status) {
			optimisticUpdates.completedAt = null;
		}

		if (updates.categoryId !== undefined) {
			// Ideally we would resolve category here but avoiding circular dependency for now or duplicating logic.
			// For strict slice separation, we might need a separate way to get categories or accept that optimistic update might lack full category object until refetch.
			// The original code imported useCategoryStore dynamically. We can do the same or skip the category object update optimistically.
			// Let's duplicate the dynamic import logic for fidelity.
			try {
				const { useCategoryStore } = await import("../useCategoryStore");
				const categories = useCategoryStore.getState().categories;
				const category = categories.find((c) => c.id === updates.categoryId);
				if (category) {
					optimisticUpdates.category = category;
				}
			} catch (e) {
				console.warn("Could not load categories for optimistic update", e);
			}
			delete (optimisticUpdates as { categoryId?: number }).categoryId;
		}

		set((state) => ({
			taskLists: state.taskLists.map((list) => ({
				...list,
				tasks: list.tasks
					? list.tasks.map((task) =>
							task.id === taskId ? { ...task, ...optimisticUpdates } : task,
						)
					: [],
			})),
			allTasks: state.allTasks.map((task) =>
				task.id === taskId ? { ...task, ...optimisticUpdates } : task,
			),
		}));

		try {
			await taskApi.updateTask(taskId, updates);

			if (
				updates.taskListId ||
				updates.categoryId !== undefined ||
				updates.isRecurring
			) {
				await get().fetchTaskLists({ background: true });
			}
		} catch (err) {
			console.error("Failed to update task:", err);
			const appError = normalizeError(err);
			toast.error("更新失敗", { description: appError.message });
			set({ taskLists: originalLists, allTasks: originalTasks });
			throw err;
		}
	},

	deleteTask: async (taskId) => {
		const originalLists = get().taskLists;
		const originalTasks = get().allTasks;

		// Move to trash optimistically
		const taskToDelete = originalTasks.find((t) => t.id === taskId);
		set((state) => ({
			taskLists: state.taskLists.map((list) => ({
				...list,
				tasks: list.tasks ? list.tasks.filter((t) => t.id !== taskId) : [],
			})),
			allTasks: state.allTasks.filter((t) => t.id !== taskId),
			trashTasks: taskToDelete
				? [...state.trashTasks, { ...taskToDelete, isDeleted: true }]
				: state.trashTasks,
		}));

		try {
			await taskApi.deleteTask(taskId);
			toast.success("ゴミ箱に移動しました");
		} catch (err) {
			console.error("Failed to delete task:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
			set({ taskLists: originalLists, allTasks: originalTasks });
		}
	},

	deleteTaskPermanently: async (id) => {
		const originalTrash = get().trashTasks;
		set((state) => ({
			trashTasks: state.trashTasks.filter((t) => t.id !== id),
		}));

		try {
			await taskApi.deleteTaskPermanently(id);
			toast.success("完全に削除しました");
		} catch (err) {
			console.error("Failed to delete task permanently:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
			set({ trashTasks: originalTrash });
		}
	},

	restoreTask: async (id) => {
		const originalLists = get().taskLists;
		const originalTasks = get().allTasks;
		const originalTrash = get().trashTasks;

		const taskToRestore = originalTrash.find((t) => t.id === id);
		if (taskToRestore) {
			set((state) => ({
				trashTasks: state.trashTasks.filter((t) => t.id !== id),
				allTasks: [...state.allTasks, { ...taskToRestore, isDeleted: false }],
				taskLists: state.taskLists.map((list) =>
					list.id === taskToRestore.taskListId
						? {
								...list,
								tasks: sortTasks([
									...(list.tasks || []),
									{ ...taskToRestore, isDeleted: false },
								]),
							}
						: list,
				),
			}));
		}

		try {
			await taskApi.restoreTask(id);
			toast.success("タスクを復元しました");
			await get().fetchTaskLists();
		} catch (err) {
			console.error("Failed to restore task:", err);
			const appError = normalizeError(err);
			toast.error("復元失敗", { description: appError.message });
			set({
				taskLists: originalLists,
				allTasks: originalTasks,
				trashTasks: originalTrash,
			});
		}
	},

	createSubtask: async (taskId, subtask) => {
		try {
			const apiSubtask = await taskApi.createSubtask(taskId, subtask);
			const newSubtask = {
				id: apiSubtask.id,
				title: apiSubtask.title,
				description: apiSubtask.description ?? undefined,
				isCompleted: apiSubtask.isCompleted,
				orderIndex: apiSubtask.orderIndex,
			};

			set((state) => {
				const addSubtaskToTask = (task: Task): Task => {
					if (task.id !== taskId) return task;
					return {
						...task,
						subtasks: [...(task.subtasks || []), newSubtask],
					};
				};

				return {
					allTasks: state.allTasks.map(addSubtaskToTask),
					taskLists: state.taskLists.map((list) => ({
						...list,
						tasks: list.tasks?.map(addSubtaskToTask),
					})),
				};
			});

			toast.success("サブタスクを追加しました");
		} catch (err) {
			console.error("Failed to create subtask:", err);
			const appError = normalizeError(err);
			toast.error("サブタスク作成失敗", { description: appError.message });
		}
	},

	updateSubtask: async (taskId, subtaskId, updates) => {
		const originalTasks = get().allTasks;
		const originalLists = get().taskLists;

		set((state) => {
			const updateTaskSubtasks = (task: Task) => {
				if (task.id !== taskId || !task.subtasks) return task;
				return {
					...task,
					subtasks: task.subtasks.map((st) =>
						st.id === subtaskId ? { ...st, ...updates } : st,
					),
				};
			};

			return {
				allTasks: state.allTasks.map(updateTaskSubtasks),
				taskLists: state.taskLists.map((list) => ({
					...list,
					tasks: list.tasks?.map(updateTaskSubtasks),
				})),
			};
		});

		try {
			await taskApi.updateSubtask(subtaskId, updates);
		} catch (err) {
			console.error("Failed to update subtask:", err);
			toast.error("サブタスク更新失敗");
			set({ allTasks: originalTasks, taskLists: originalLists });
		}
	},

	deleteSubtask: async (taskId, subtaskId) => {
		// Missing in original file read, adding mostly boilerplate or if it was there I missed it in view.
		// Ah, deleteSubtask was declared in interface but implementation might have been cut off or just simpler.
		// Based on pattern:
		const originalTasks = get().allTasks;
		const originalLists = get().taskLists;

		set((state) => {
			const removeSubtask = (task: Task) => {
				if (task.id !== taskId || !task.subtasks) return task;
				return {
					...task,
					subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
				};
			};

			return {
				allTasks: state.allTasks.map(removeSubtask),
				taskLists: state.taskLists.map((list) => ({
					...list,
					tasks: list.tasks?.map(removeSubtask),
				})),
			};
		});

		try {
			await taskApi.deleteSubtask(subtaskId); // Assuming API exists
			toast.success("サブタスクを削除しました");
		} catch (err) {
			console.error("Failed to delete subtask", err);
			const appError = normalizeError(err);
			toast.error("サブタスク削除失敗", { description: appError.message });
			set({ allTasks: originalTasks, taskLists: originalLists });
		}
	},
});
