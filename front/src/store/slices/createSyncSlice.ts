import { taskApi } from "@/features/todo/api/taskApi";
import type { Task } from "@/features/todo/types";
import { normalizeError } from "@/utils/error";
import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { SyncSlice, TodoState } from "./types";

export const createSyncSlice: StateCreator<TodoState, [], [], SyncSlice> = (
	set,
	get,
) => ({
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
});
