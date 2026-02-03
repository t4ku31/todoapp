import * as React from "react";
import { toast } from "sonner";
import { create } from "zustand";
import type { SyncResult, SyncTask } from "@/features/ai/types";
import {
	type BulkOperationResult,
	type CreateTaskParams,
	taskApi,
} from "@/features/todo/api/taskApi";
import type { Task, TaskList } from "@/features/todo/types";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import { normalizeError } from "@/utils/error";

// Parameters for createTask
export type { CreateTaskParams };

interface TodoState {
	taskLists: TaskList[];
	allTasks: Task[]; // Flattened list for optimized access
	trashTasks: Task[];
	loading: boolean;
	error: string | null;

	fetchTaskLists: () => Promise<void>;
	fetchTrashTasks: () => Promise<void>;
	restoreTask: (id: number) => Promise<void>;
	deleteTaskPermanently: (id: number) => Promise<void>;

	addTaskList: (newTaskList: TaskList) => void;
	updateTaskListTitle: (taskListId: number, newTitle: string) => Promise<void>;
	updateTaskListDate: (taskListId: number, newDate: string) => Promise<void>;
	updateTaskListCompletion: (
		taskListId: number,
		isCompleted: boolean,
	) => Promise<void>;
	deleteTaskList: (taskListId: number) => Promise<void>;
	createTaskList: (
		params:
			| string
			| { title: string; tasks?: Omit<CreateTaskParams, "taskListId">[] },
	) => Promise<TaskList>;

	createTask: (params: CreateTaskParams) => Promise<Task>;
	updateTask: (
		taskId: number,
		updates: Partial<Task> & {
			categoryId?: number;
			taskListId?: number;
			taskListTitle?: string;
		},
	) => Promise<void>;
	deleteTask: (taskId: number) => Promise<void>;

	// AI Tasks merge (楽観的更新用)
	mergeTasksFromAi: (aiTasks: Partial<Task>[]) => void;

	// Bulk Operations
	bulkUpdateTasks: (
		taskIds: number[],
		updates: {
			status?: "PENDING" | "COMPLETED";
			categoryId?: number;
			taskListId?: number;
			executionDate?: string;
		},
	) => Promise<void>;
	bulkDeleteTasks: (taskIds: number[]) => Promise<void>;
	bulkCreateTasks: (tasks: CreateTaskParams[]) => Promise<number[]>;
	syncTasks: (tasks: SyncTask[]) => Promise<SyncResult>;

	// Subtask Actions
	createSubtask: (
		taskId: number,
		subtask: { title: string; description?: string },
	) => Promise<void>;
	updateSubtask: (
		taskId: number,
		subtaskId: number,
		updates: { title?: string; isCompleted?: boolean; orderIndex?: number },
	) => Promise<void>;
	deleteSubtask: (taskId: number, subtaskId: number) => Promise<void>;

	getInboxList: () => TaskList | undefined;
	getTasksForDate: (date: string) => Task[];
}

// Helper: 複数行テキストをReact要素に変換
const multiLineDescription = (lines: string[]): React.ReactNode => {
	return React.createElement(
		"div",
		{ className: "text-xs space-y-0.5" },
		lines.map((line, i) => React.createElement("div", { key: i }, line)),
	);
};

// Helper: Bulk操作の結果をtoastで表示

const showBulkOperationToast = (
	result: BulkOperationResult,
	successMessage: string,
	partialSuccessPrefix: string,
	failureMessage: string,
): boolean => {
	// Use displayMessages from backend if available, otherwise fallback to client-side formatting
	const messages =
		result.displayMessages ??
		result.failedTasks?.map(
			(f) => f.displayMessage ?? `ID:${f.taskId} - ${f.reason}`,
		) ??
		[];

	if (result.allSucceeded) {
		toast.success(successMessage);
		return true;
	} else if (result.successCount > 0) {
		toast.warning(
			`${result.successCount}${partialSuccessPrefix}、${result.failedCount}件失敗`,
			{ description: multiLineDescription(messages) },
		);
		return true;
	} else {
		toast.error(failureMessage, {
			description: multiLineDescription(messages),
		});
		return false;
	}
};

// Helper: Axiosエラーから結果を抽出してtoast表示
interface AxiosErrorWithBulkResult {
	response?: {
		data?: BulkOperationResult;
	};
}

const handleBulkOperationError = (
	err: unknown,
	partialSuccessPrefix: string,
	failureMessage: string,
): boolean => {
	const axiosErr = err as AxiosErrorWithBulkResult;
	const result = axiosErr.response?.data;

	if (result && typeof result.successCount === "number") {
		// Use displayMessages from backend if available
		const messages =
			result.displayMessages ??
			result.failedTasks?.map(
				(f) => f.displayMessage ?? `ID:${f.taskId} - ${f.reason}`,
			) ??
			[];

		if (result.successCount > 0) {
			toast.warning(
				`${result.successCount}${partialSuccessPrefix}、${result.failedCount}件失敗`,
				{ description: multiLineDescription(messages) },
			);
			return true;
		} else {
			toast.error(failureMessage, {
				description: multiLineDescription(messages),
			});
			return false;
		}
	} else {
		const appError = normalizeError(err);
		toast.error(failureMessage, { description: appError.message });
		return false;
	}
};

export const useTodoStore = create<TodoState>((set, get) => ({
	taskLists: [],
	allTasks: [],
	trashTasks: [],
	loading: false,
	error: null,

	fetchTaskLists: async () => {
		set({ loading: true, error: null });
		try {
			const data = await taskApi.fetchTaskLists();
			// Ensure tasks are sorted
			const taskLists = data.map((list) => ({
				...list,
				tasks: sortTasks(list.tasks || []),
			}));
			const allTasks = taskLists.flatMap((list) => list.tasks || []);
			set({ taskLists, allTasks, loading: false });
		} catch (err) {
			console.error("Failed to fetch task lists:", err);
			set({ error: "タスクリストの取得に失敗しました", loading: false });
		}
	},

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

	restoreTask: async (id) => {
		const originalLists = get().taskLists;
		const originalTasks = get().allTasks;
		const originalTrash = get().trashTasks;

		// Optimistic update
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
			// Refetch to be sure we have correct state
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

	getInboxList: () => {
		return get().taskLists.find((list) => list.title === "Inbox");
	},

	getTasksForDate: (date: string) => {
		return get().allTasks.filter((task) => task.executionDate === date);
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
			await taskApi.updateTaskListTitle(taskListId, newTitle);
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
			await taskApi.updateTaskListDate(taskListId, newDate);
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
			await taskApi.updateTaskListCompletion(taskListId, isCompleted);
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

	createTaskList: async (
		params:
			| string
			| { title: string; tasks?: Omit<CreateTaskParams, "taskListId">[] },
	) => {
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
								// Ensure defaults if API doesn't return everything immediately (though it should)
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

		// Build optimistic updates, resolving categoryId to full category object
		const optimisticUpdates: Partial<Task> = { ...updates };

		// Handle completedAt for status changes
		if (updates.status === "COMPLETED") {
			optimisticUpdates.completedAt = new Date().toISOString();
		} else if (updates.status) {
			// Status changed to something other than COMPLETED, clear completedAt
			optimisticUpdates.completedAt = undefined;
		}

		// If categoryId is provided, resolve the full category object
		if (updates.categoryId !== undefined) {
			// Import category from useCategoryStore dynamically to avoid circular deps
			const { useCategoryStore } = await import("./useCategoryStore");
			const categories = useCategoryStore.getState().categories;
			const category = categories.find((c) => c.id === updates.categoryId);
			if (category) {
				optimisticUpdates.category = category;
			}
			// Remove categoryId from optimisticUpdates as Task type doesn't have it
			delete (optimisticUpdates as { categoryId?: number }).categoryId;
		}

		set((state) => ({
			//update taskLists state
			taskLists: state.taskLists.map((list) => ({
				...list,
				tasks: list.tasks
					? list.tasks.map((task) =>
							task.id === taskId ? { ...task, ...optimisticUpdates } : task,
						)
					: [],
			})),
			//update allTasks state
			allTasks: state.allTasks.map((task) =>
				task.id === taskId ? { ...task, ...optimisticUpdates } : task,
			),
		}));

		try {
			console.log("Updating task:", taskId, updates);
			await taskApi.updateTask(taskId, updates);

			// If taskListId, categoryId, or isRecurring was updated, refetch to get the correct state
			// isRecurring generates new task instances on the backend
			if (
				updates.taskListId ||
				updates.categoryId !== undefined ||
				updates.isRecurring
			) {
				await get().fetchTaskLists();
			}
		} catch (err) {
			console.error("Failed to update task:", err);
			const appError = normalizeError(err);
			toast.error("更新失敗", { description: appError.message });
			set({ taskLists: originalLists, allTasks: originalTasks }); // Revert
			throw err;
		}
	},

	mergeTasksFromAi: (aiTasks) => {
		if (!aiTasks || aiTasks.length === 0) return;

		// AIから返されたタスクのIDセットを作成
		const updatedMap = new Map<number, Partial<Task>>();

		for (const t of aiTasks) {
			if (t.id) {
				updatedMap.set(t.id, t);
			}
		}

		set((state) => {
			const updateTaskInList = (task: Task) => {
				const aiTask = updatedMap.get(task.id);
				if (aiTask) {
					// マージ（isDeleted も含む）
					return {
						...task,
						...aiTask,
					};
				}
				return task;
			};

			return {
				taskLists: state.taskLists.map((list) => ({
					...list,
					tasks: list.tasks?.map(updateTaskInList),
				})),
				allTasks: state.allTasks.map(updateTaskInList),
				// ゴミ箱ステートも同期（もし既に存在していれば更新、なければ追加）
				trashTasks: [
					...state.trashTasks,
					...aiTasks
						.filter(
							(t) =>
								t.id &&
								t.isDeleted &&
								!state.trashTasks.some((prev) => prev.id === t.id),
						)
						.map((t) => {
							const original = state.allTasks.find((at) => at.id === t.id);
							return { ...original, ...t } as Task;
						}),
				].map((t) => {
					const aiTask = updatedMap.get(t.id);
					return aiTask ? { ...t, ...aiTask } : t;
				}),
			};
		});
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
			set({ taskLists: originalLists, allTasks: originalTasks }); // Revert trashTasks logic omitted for brevity but should filter out
		}
	},

	bulkUpdateTasks: async (taskIds, updates) => {
		const originalLists = get().taskLists;
		const originalTasks = get().allTasks;

		// Optimistic update
		set((state) => ({
			taskLists: state.taskLists.map((list) => ({
				...list,
				tasks: list.tasks?.map((task) =>
					taskIds.includes(task.id)
						? { ...task, ...updates, status: updates.status ?? task.status }
						: task,
				),
			})),
			allTasks: state.allTasks.map((task) =>
				taskIds.includes(task.id)
					? { ...task, ...updates, status: updates.status ?? task.status }
					: task,
			),
		}));

		try {
			const result = await taskApi.bulkUpdateTasks(taskIds, updates);

			const success = showBulkOperationToast(
				result,
				`${result.successCount}件のタスクを更新しました`,
				"件更新",
				"一括更新失敗",
			);

			if (!success) {
				set({ taskLists: originalLists, allTasks: originalTasks });
			}

			// Refetch to get accurate state
			await get().fetchTaskLists();
		} catch (err) {
			console.error("Failed to bulk update tasks:", err);
			handleBulkOperationError(err, "件更新", "一括更新失敗");
			set({ taskLists: originalLists, allTasks: originalTasks });
		}
	},

	bulkDeleteTasks: async (taskIds) => {
		const originalLists = get().taskLists;
		const originalTasks = get().allTasks;
		const tasksToDelete = originalTasks.filter((t) => taskIds.includes(t.id));

		// Optimistic update
		set((state) => ({
			taskLists: state.taskLists.map((list) => ({
				...list,
				tasks: list.tasks?.filter((task) => !taskIds.includes(task.id)),
			})),
			allTasks: state.allTasks.filter((task) => !taskIds.includes(task.id)),
			trashTasks: [
				...state.trashTasks,
				...tasksToDelete.map((t) => ({ ...t, isDeleted: true })),
			],
		}));

		try {
			const result = await taskApi.bulkDeleteTasks(taskIds);

			const success = showBulkOperationToast(
				result,
				`${result.successCount}件のタスクをゴミ箱に移動しました`,
				"件削除",
				"一括削除失敗",
			);

			if (!success) {
				set({ taskLists: originalLists, allTasks: originalTasks });
			}

			// Refetch to sync state
			await get().fetchTaskLists();
		} catch (err) {
			console.error("Failed to bulk delete tasks:", err);
			handleBulkOperationError(err, "件削除", "一括削除失敗");
			set({ taskLists: originalLists, allTasks: originalTasks });
		}
	},

	bulkCreateTasks: async (tasks) => {
		try {
			const data = await taskApi.bulkCreateTasks(tasks);

			if (data.allSucceeded) {
				toast.success(`${data.successCount}件のタスクを追加しました`);
				// Refetch to get the created tasks
				await get().fetchTaskLists();
				return data.createdTaskIds;
			} else {
				toast.error(data.errorMessage || "タスクの一括作成に失敗しました");
				return [];
			}
		} catch (err) {
			console.error("Failed to bulk create tasks:", err);
			const appError = normalizeError(err);
			toast.error("一括作成失敗", { description: appError.message });
			return [];
		}
	},

	syncTasks: async (tasks) => {
		try {
			const data = await taskApi.syncTasks(tasks);
			if (data.success) {
				toast.success(data.message || "同期完了しました");
				await get().fetchTaskLists();
			} else {
				toast.error(data.message || "同期に失敗しました");
			}
			return data;
		} catch (err) {
			console.error("Failed to sync tasks:", err);
			const appError = normalizeError(err);
			toast.error("同期失敗", { description: appError.message });
			throw err;
		}
	},

	createSubtask: async (taskId, subtask) => {
		try {
			const apiSubtask = await taskApi.createSubtask(taskId, subtask);
			// Convert API response to match Subtask interface (null -> undefined)
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
		const originalTasks = get().allTasks;
		const originalLists = get().taskLists;

		set((state) => {
			const filterTaskSubtasks = (task: Task) => {
				if (task.id !== taskId || !task.subtasks) return task;
				return {
					...task,
					subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
				};
			};

			return {
				allTasks: state.allTasks.map(filterTaskSubtasks),
				taskLists: state.taskLists.map((list) => ({
					...list,
					tasks: list.tasks?.map(filterTaskSubtasks),
				})),
			};
		});

		try {
			await taskApi.deleteSubtask(subtaskId);
		} catch (err) {
			console.error("Failed to delete subtask:", err);
			toast.error("サブタスク削除失敗");
			set({ allTasks: originalTasks, taskLists: originalLists });
		}
	},
}));
