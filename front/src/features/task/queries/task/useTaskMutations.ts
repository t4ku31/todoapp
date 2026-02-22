import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyticsKeys } from "@/features/analytics/queries/analyticsKeys";
import { normalizeError } from "@/utils/error";
import {
	type CreateTaskParams,
	taskApi,
	type UpdateTaskParams,
} from "../../api/taskApi";
import type { Task, TaskList } from "../../types";
import { sortTasks } from "../../utils/taskSorter";
import { taskKeys } from "../queryKeys";

export const useCreateTaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (params: CreateTaskParams) => taskApi.createTask(params),
		//This function will be fired before the mutation function is fired
		onMutate: async (newParams) => {
			//cancel all queries
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
			//get previous data from cache
			const previousLists = queryClient.getQueryData<TaskList[]>(
				taskKeys.lists(),
			);
			//optimistic update
			if (previousLists) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
					if (!old) return old;
					return old.map((list) => {
						if (list.id === newParams.taskListId) {
							// Temporary optimistic task
							const optimisticTask = {
								id: Date.now(),
								...newParams,
								status: newParams.status || "PENDING",
								taskListId: newParams.taskListId,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							} as unknown as Task;

							const updatedTasks = [...(list.tasks || []), optimisticTask];
							return { ...list, tasks: sortTasks(updatedTasks) };
						}
						return list;
					});
				});
			}

			return { previousLists };
		},
		onError: (err, _newParams, context) => {
			if (context?.previousLists) {
				queryClient.setQueryData(taskKeys.lists(), context.previousLists);
			}
			console.error("Failed to create task:", err);
			const appError = normalizeError(err);
			toast.error("作成失敗", { description: appError.message });
		},
		onSuccess: () => {
			toast.success("タスクを追加しました");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
		},
	});
};

export const useUpdateTaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			taskId,
			updates,
		}: {
			taskId: number;
			updates: UpdateTaskParams;
		}) => taskApi.updateTask(taskId, updates),
		onMutate: async ({ taskId, updates }) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

			const previousLists = queryClient.getQueryData<TaskList[]>(
				taskKeys.lists(),
			);

			const optimisticUpdates: Partial<Task> = { ...updates };
			if (updates.status === "COMPLETED") {
				optimisticUpdates.completedAt = new Date();
			} else if (updates.status) {
				optimisticUpdates.completedAt = null;
			}

			if (previousLists) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
					if (!old) return old;
					return old.map((list) => ({
						...list,
						tasks: list.tasks
							? list.tasks.map((task) =>
									task.id === taskId ? { ...task, ...optimisticUpdates } : task,
								)
							: [],
					}));
				});
			}

			return { previousLists };
		},
		onError: (err, _variables, context) => {
			if (context?.previousLists) {
				queryClient.setQueryData(taskKeys.lists(), context.previousLists);
			}
			console.error("Failed to update task:", err);
			const appError = normalizeError(err);
			toast.error("更新失敗", { description: appError.message });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
		},
	});
};

export const useDeleteTaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (taskId: number) => taskApi.deleteTask(taskId),
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
			const previousLists = queryClient.getQueryData<TaskList[]>(
				taskKeys.lists(),
			);

			if (previousLists) {
				queryClient.setQueryData<TaskList[]>(taskKeys.lists(), (old) => {
					if (!old) return old;
					return old.map((list) => ({
						...list,
						tasks: list.tasks ? list.tasks.filter((t) => t.id !== taskId) : [],
					}));
				});
			}

			return { previousLists };
		},
		onError: (err, _taskId, context) => {
			if (context?.previousLists) {
				queryClient.setQueryData(taskKeys.lists(), context.previousLists);
			}
			console.error("Failed to delete task:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
		},
		onSuccess: () => {
			toast.success("ゴミ箱に移動しました");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
			queryClient.invalidateQueries({ queryKey: taskKeys.trash() });
			queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
		},
	});
};

export const useCreateSubtaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			taskId,
			subtask,
		}: {
			taskId: number;
			subtask: { title: string; description?: string };
		}) => taskApi.createSubtask(taskId, subtask),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
		},
		onError: (err) => {
			console.error("Failed to create subtask:", err);
			const appError = normalizeError(err);
			toast.error("サブタスク作成失敗", { description: appError.message });
		},
	});
};

export const useUpdateSubtaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			subtaskId,
			updates,
		}: {
			subtaskId: number;
			updates: { title?: string; isCompleted?: boolean; orderIndex?: number };
		}) => taskApi.updateSubtask(subtaskId, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
		},
		onError: (err) => {
			console.error("Failed to update subtask:", err);
			const appError = normalizeError(err);
			toast.error("サブタスク更新失敗", { description: appError.message });
		},
	});
};

export const useDeleteSubtaskMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (subtaskId: number) => taskApi.deleteSubtask(subtaskId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
		},
		onError: (err) => {
			console.error("Failed to delete subtask:", err);
			const appError = normalizeError(err);
			toast.error("サブタスク削除失敗", { description: appError.message });
		},
	});
};
