import { type BulkOperationResult, taskApi } from "@/features/todo/api/taskApi";
import { normalizeError } from "@/utils/error";
import * as React from "react";
import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { BulkSlice, TodoState } from "./types";

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

export const createBulkSlice: StateCreator<TodoState, [], [], BulkSlice> = (
	set,
	get,
) => ({
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
});
