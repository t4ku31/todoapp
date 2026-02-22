import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeError } from "@/utils/error";
import {
	type BulkOperationResult,
	type CreateTaskParams,
	taskApi,
} from "../api/taskApi";
import type { TaskList } from "../types";
import { sortTasks } from "../utils/taskSorter";
import { taskKeys } from "./queryKeys";

// --- Task List Mutations ---

export const useCreateTaskListMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (
			params:
				| string
				| { title: string; tasks?: Omit<CreateTaskParams, "taskListId">[] },
		) => taskApi.createTaskList(params),
		onSuccess: (newList) => {
			if (newList.tasks) {
				newList.tasks = sortTasks(newList.tasks);
			}
			queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
				if (!old) return [newList];
				return [...old, newList];
			});
			toast.success("リストを作成しました");
		},
		onError: (err) => {
			console.error("Failed to create task list:", err);
			const appError = normalizeError(err);
			toast.error("リスト作成失敗", { description: appError.message });
		},
	});
};

export const useUpdateTaskListTitleMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			taskListId,
			title,
		}: {
			taskListId: number;
			title: string;
		}) => taskApi.updateTaskListTitle(taskListId, title),
		onMutate: async ({ taskListId, title }) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
			const previous = queryClient.getQueryData<TaskList[]>(taskKeys.lists());
			if (previous) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) =>
					old
						? old.map((list) =>
								list.id === taskListId ? { ...list, title } : list,
							)
						: [],
				);
			}
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous)
				queryClient.setQueryData(taskKeys.lists(), context.previous);
			toast.error("リストタイトル更新失敗");
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
	});
};

export const useDeleteTaskListMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (taskListId: number) => taskApi.deleteTaskList(taskListId),
		onMutate: async (taskListId) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
			const previousLists = queryClient.getQueryData<TaskList[]>(
				taskKeys.lists(),
			);

			if (previousLists) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
					if (!old) return old;
					return old.filter((list) => list.id !== taskListId);
				});
			}

			return { previousLists };
		},
		onError: (err, _taskListId, context) => {
			if (context?.previousLists) {
				queryClient.setQueryData(taskKeys.lists(), context.previousLists);
			}
			console.error("Failed to delete task list:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
		},
		onSuccess: () => {
			toast.success("タスクリストを削除しました");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
		},
	});
};

// --- Bulk Operations ---

import * as React from "react";

const multiLineDescription = (lines: string[]): React.ReactNode => {
	return React.createElement(
		"div",
		{ className: "text-xs space-y-0.5" },
		lines.map((line, i) => React.createElement("div", { key: i }, line)),
	);
};

const showBulkOperationToast = (
	result: BulkOperationResult,
	successMessage: string,
	partialSuccessPrefix: string,
	failureMessage: string,
): boolean => {
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

export const useBulkUpdateTasksMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			taskIds,
			updates,
		}: {
			taskIds: number[];
			updates: {
				status?: "PENDING" | "COMPLETED";
				categoryId?: number;
				taskListId?: number;
				scheduledStartAt?: Date | null;
			};
		}) => taskApi.bulkUpdateTasks(taskIds, updates),
		onMutate: async ({ taskIds, updates }) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
			const previousLists = queryClient.getQueryData<TaskList[]>(
				taskKeys.lists(),
			);

			if (previousLists) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
					if (!old) return old;
					return old.map((list) => ({
						...list,
						tasks: list.tasks?.map((task) =>
							taskIds.includes(task.id)
								? { ...task, ...updates, status: updates.status ?? task.status }
								: task,
						),
					}));
				});
			}
			return { previousLists };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousLists)
				queryClient.setQueryData(taskKeys.lists(), context.previousLists);
			toast.error("一括更新失敗");
		},
		onSuccess: (result) => {
			showBulkOperationToast(
				result,
				`${result.successCount}件のタスクを更新しました`,
				"件更新",
				"一括更新失敗",
			);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
	});
};

export const useBulkDeleteTasksMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (taskIds: number[]) => taskApi.bulkDeleteTasks(taskIds),
		onMutate: async (taskIds) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
			const previousLists = queryClient.getQueryData<TaskList[]>(
				taskKeys.lists(),
			);

			if (previousLists) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
					if (!old) return old;
					return old.map((list) => ({
						...list,
						tasks: list.tasks?.filter((task) => !taskIds.includes(task.id)),
					}));
				});
			}
			return { previousLists };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousLists)
				queryClient.setQueryData(taskKeys.lists(), context.previousLists);
			toast.error("一括削除失敗");
		},
		onSuccess: (result) => {
			showBulkOperationToast(
				result,
				`${result.successCount}件のタスクをゴミ箱に移動しました`,
				"件削除",
				"一括削除失敗",
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			queryClient.invalidateQueries({ queryKey: taskKeys.trash() });
		},
	});
};
