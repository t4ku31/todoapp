import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SyncTask } from "@/features/ai/types";
import { normalizeError } from "@/utils/error";
import { type CreateTaskParams, taskApi } from "../../api/taskApi";
import type { Task } from "../../types";
import { taskKeys } from "../queryKeys";

// --- Trash Mutations ---

export const useRestoreTaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (taskId: number) => taskApi.restoreTask(taskId),
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.trash() });
			const previousTrash = queryClient.getQueryData<Task[]>(taskKeys.trash());

			if (previousTrash) {
				queryClient.setQueryData<Task[]>(taskKeys.trash(), (old) =>
					old ? old.filter((t) => t.id !== taskId) : [],
				);
			}
			return { previousTrash };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousTrash)
				queryClient.setQueryData(taskKeys.trash(), context.previousTrash);
			toast.error("復元失敗");
		},
		onSuccess: () => {
			toast.success("タスクを復元しました");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			queryClient.invalidateQueries({ queryKey: taskKeys.trash() });
		},
	});
};

export const useDeleteTaskPermanentlyMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (taskId: number) => taskApi.deleteTaskPermanently(taskId),
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.trash() });
			const previousTrash = queryClient.getQueryData<Task[]>(taskKeys.trash());

			if (previousTrash) {
				queryClient.setQueryData<Task[]>(taskKeys.trash(), (old) =>
					old ? old.filter((t) => t.id !== taskId) : [],
				);
			}
			return { previousTrash };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousTrash)
				queryClient.setQueryData(taskKeys.trash(), context.previousTrash);
			toast.error("削除失敗");
		},
		onSuccess: () => {
			toast.success("完全に削除しました");
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.trash() }),
	});
};

// --- Sync Mutations ---

export const useSyncTasksMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tasks: SyncTask[]) => taskApi.syncTasks(tasks),
		onSuccess: (data) => {
			if (data.success) {
				toast.success(data.message || "同期完了しました");
				queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			} else {
				toast.error(data.message || "同期に失敗しました");
			}
		},
		onError: (err) => {
			console.error("Failed to sync tasks:", err);
			const appError = normalizeError(err);
			toast.error("同期失敗", { description: appError.message });
		},
	});
};

export const useBulkCreateTasksMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tasks: CreateTaskParams[]) => taskApi.bulkCreateTasks(tasks),
		onSuccess: (data) => {
			if (data.allSucceeded) {
				toast.success(`${data.successCount}件のタスクを追加しました`);
				queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			} else {
				toast.error(data.errorMessage || "タスクの一括作成に失敗しました");
			}
		},
		onError: (err) => {
			console.error("Failed to bulk create tasks:", err);
			const appError = normalizeError(err);
			toast.error("一括作成失敗", { description: appError.message });
		},
	});
};
