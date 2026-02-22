import { apiClient } from "@/config/env";
import type { SyncResult, SyncTask } from "@/features/ai/types";
import type { RecurrenceConfig, Task, TaskList } from "@/features/task/types";
import {
	deserializeRecurrenceConfig,
	serializeRecurrenceConfig,
} from "@/features/task/utils/recurrenceUtils";

// Internal helper types for API raw data
interface RawRecurrenceConfig
	extends Omit<RecurrenceConfig, "until" | "occurs"> {
	until?: string;
	occurs?: string[];
}
interface RawTask
	extends Omit<
		Task,
		| "recurrenceRule"
		| "dueDate"
		| "scheduledStartAt"
		| "scheduledEndAt"
		| "completedAt"
	> {
	recurrenceRule?: RawRecurrenceConfig;
	dueDate?: string | null;
	scheduledStartAt?: string | null;
	scheduledEndAt?: string | null;
	completedAt?: string | null;
}
interface RawTaskList extends Omit<TaskList, "tasks"> {
	tasks: RawTask[];
}

// Helper to parse date string as local date
const parseLocalDate = (dateStr?: string | null): Date | null => {
	if (!dateStr) return null;
	const [year, month, day] = dateStr.split("-").map(Number);
	return new Date(year, month - 1, day);
};

// Helper to parse datetime string as Date
const parseDateTime = (dateTimeStr?: string | null): Date | null => {
	if (!dateTimeStr) return null;
	return new Date(dateTimeStr);
};

// Helper to serialize date to yyyy-MM-dd
const serializeLocalDate = (date: Date | null | undefined): string | null => {
	if (!date) return null;
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// Helper to serialize datetime to ISO string
const serializeDateTime = (date: Date | null | undefined): string | null => {
	if (!date) return null;
	return date.toISOString();
};

const deserializeTask = (task: RawTask): Task => {
	return {
		...task,
		recurrenceRule: deserializeRecurrenceConfig(task.recurrenceRule),
		dueDate: parseLocalDate(task.dueDate),
		completedAt: parseDateTime(task.completedAt),
		scheduledStartAt: parseDateTime(task.scheduledStartAt),
		scheduledEndAt: parseDateTime(task.scheduledEndAt),
	};
};

export interface CreateTaskParams {
	taskListId: number;
	taskListTitle?: string;
	title: string;
	dueDate?: Date | null;
	categoryId?: number;
	estimatedPomodoros?: number;
	subtasks?: {
		title: string;
		description?: string;
		isCompleted?: boolean;
		orderIndex?: number;
	}[];
	isRecurring?: boolean;
	recurrenceRule?: RecurrenceConfig | null;
	customDates?: string[];
	scheduledStartAt?: Date | null;
	scheduledEndAt?: Date | null;
	isAllDay?: boolean;
	status?: string;
}

export interface UpdateTaskParams extends Partial<Omit<Task, "category">> {
	categoryId?: number;
	taskListTitle?: string;
}

export interface BulkOperationResult {
	successCount: number;
	failedCount: number;
	allSucceeded: boolean;
	displayMessages?: string[]; // Pre-formatted from backend
	failedTasks?: {
		taskId: number;
		reason: string;
		errorCode: string;
		displayMessage?: string;
	}[];
}

export const taskApi = {
	fetchTaskLists: async (): Promise<TaskList[]> => {
		const response = await apiClient.get<RawTaskList[]>("/api/tasklists");
		return response.data.map((list) => ({
			...list,
			tasks: list.tasks.map(deserializeTask),
		}));
	},

	fetchTrashTasks: async (): Promise<Task[]> => {
		const response = await apiClient.get<RawTask[]>("/api/tasks/trash");
		return response.data.map(deserializeTask);
	},

	restoreTask: async (id: number): Promise<void> => {
		await apiClient.post(`/api/tasks/${id}/restore`);
	},

	deleteTaskPermanently: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/tasks/${id}/permanent`);
	},

	updateTaskListTitle: async (
		taskListId: number,
		title: string,
	): Promise<void> => {
		await apiClient.patch(`/api/tasklists/${taskListId}`, { title });
	},

	updateTaskListDate: async (
		taskListId: number,
		dueDate: string,
	): Promise<void> => {
		await apiClient.patch(`/api/tasklists/${taskListId}`, { dueDate });
	},

	updateTaskListCompletion: async (
		taskListId: number,
		isCompleted: boolean,
	): Promise<void> => {
		await apiClient.patch(`/api/tasklists/${taskListId}`, { isCompleted });
	},

	deleteTaskList: async (taskListId: number): Promise<void> => {
		await apiClient.delete(`/api/tasklists/${taskListId}`);
	},

	createTaskList: async (
		params:
			| string
			| { title: string; tasks?: Omit<CreateTaskParams, "taskListId">[] },
	): Promise<TaskList> => {
		const payload =
			typeof params === "string"
				? { title: params, tasks: [] }
				: {
						title: params.title,
						tasks: (params.tasks || []).map((t) => ({
							...t,
							recurrenceRule: serializeRecurrenceConfig(t.recurrenceRule),
						})),
					};
		const response = await apiClient.post<RawTaskList>(
			"/api/tasklists",
			payload,
		);
		return {
			...response.data,
			tasks: response.data.tasks.map(deserializeTask),
		};
	},

	createTask: async (params: CreateTaskParams): Promise<Task> => {
		const payload = {
			...params,
			recurrenceRule: serializeRecurrenceConfig(params.recurrenceRule),
			dueDate: serializeLocalDate(params.dueDate),
			scheduledStartAt: serializeDateTime(params.scheduledStartAt),
			scheduledEndAt: serializeDateTime(params.scheduledEndAt),
		};
		const response = await apiClient.post<RawTask>("/api/tasks", payload);
		return deserializeTask(response.data);
	},

	updateTask: async (
		taskId: number,
		updates: UpdateTaskParams,
	): Promise<void> => {
		const payload = {
			...updates,
			recurrenceRule: serializeRecurrenceConfig(updates.recurrenceRule),
			dueDate: serializeLocalDate(updates.dueDate),
			scheduledStartAt: serializeDateTime(updates.scheduledStartAt),
			scheduledEndAt: serializeDateTime(updates.scheduledEndAt),
		};
		await apiClient.patch(`/api/tasks/${taskId}`, payload);
	},

	deleteTask: async (taskId: number): Promise<void> => {
		await apiClient.delete(`/api/tasks/${taskId}`);
	},

	bulkUpdateTasks: async (
		taskIds: number[],
		updates: {
			status?: "PENDING" | "COMPLETED";
			categoryId?: number;
			taskListId?: number;
			scheduledStartAt?: Date | null;
		},
	): Promise<BulkOperationResult> => {
		const payload = {
			taskIds,
			status: updates.status,
			categoryId: updates.categoryId,
			taskListId: updates.taskListId,
			scheduledStartAt: serializeDateTime(updates.scheduledStartAt),
		};
		const response = await apiClient.patch<BulkOperationResult>(
			"/api/tasks/bulk",
			payload,
		);
		return response.data;
	},

	bulkDeleteTasks: async (taskIds: number[]): Promise<BulkOperationResult> => {
		const response = await apiClient.delete<BulkOperationResult>(
			"/api/tasks/bulk",
			{
				data: { taskIds },
			},
		);
		return response.data;
	},

	bulkCreateTasks: async (
		tasks: CreateTaskParams[],
	): Promise<{
		successCount: number;
		createdTaskIds: number[];
		allSucceeded: boolean;
		errorMessage?: string;
	}> => {
		const payload = tasks.map((t) => ({
			...t,
			recurrenceRule: serializeRecurrenceConfig(t.recurrenceRule),
		}));
		const response = await apiClient.post("/api/tasks/batch", {
			tasks: payload,
		});
		return response.data;
	},

	syncTasks: async (tasks: SyncTask[]): Promise<SyncResult> => {
		const response = await apiClient.post<SyncResult>("/api/tasks/sync", tasks);
		return response.data;
	},

	createSubtask: async (
		taskId: number,
		subtask: { title: string; description?: string },
	): Promise<{
		id: number;
		taskId: number;
		title: string;
		description: string | null;
		isCompleted: boolean;
		orderIndex: number;
	}> => {
		const response = await apiClient.post(
			`/api/tasks/${taskId}/subtasks`,
			subtask,
		);
		return response.data;
	},

	updateSubtask: async (
		subtaskId: number,
		updates: { title?: string; isCompleted?: boolean; orderIndex?: number },
	): Promise<void> => {
		await apiClient.patch(`/api/subtasks/${subtaskId}`, updates);
	},

	deleteSubtask: async (subtaskId: number): Promise<void> => {
		await apiClient.delete(`/api/subtasks/${subtaskId}`);
	},
};
