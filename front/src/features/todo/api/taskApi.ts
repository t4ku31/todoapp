import { apiClient } from "@/config/env";
import type { SyncResult, SyncTask } from "@/features/ai/types";
import type { Task, TaskList } from "@/features/todo/types";

// Parameters for createTask
export interface CreateTaskParams {
	taskListId: number;
	taskListTitle?: string;
	title: string;
	dueDate?: string | null;
	executionDate?: string | null;
	categoryId?: number;
	estimatedPomodoros?: number;
	subtasks?: {
		title: string;
		description?: string;
		isCompleted?: boolean;
		orderIndex?: number;
	}[];
	isRecurring?: boolean;
	recurrenceRule?: string | null;
	customDates?: string[];
	scheduledStartAt?: string | null;
	scheduledEndAt?: string | null;
	isAllDay?: boolean;
	status?: string;
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
		const response = await apiClient.get<TaskList[]>("/api/tasklists");
		return response.data;
	},

	fetchTrashTasks: async (): Promise<Task[]> => {
		const response = await apiClient.get<Task[]>("/api/tasks/trash");
		return response.data;
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
				: { title: params.title, tasks: params.tasks || [] };
		const response = await apiClient.post<TaskList>("/api/tasklists", payload);
		return response.data;
	},

	createTask: async (params: CreateTaskParams): Promise<Task> => {
		const response = await apiClient.post<Task>("/api/tasks", params);
		return response.data;
	},

	updateTask: async (
		taskId: number,
		updates: Partial<Task> & { categoryId?: number; taskListTitle?: string },
	): Promise<void> => {
		await apiClient.patch(`/api/tasks/${taskId}`, updates);
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
			executionDate?: string;
		},
	): Promise<BulkOperationResult> => {
		const response = await apiClient.patch<BulkOperationResult>(
			"/api/tasks/bulk",
			{
				taskIds,
				...updates,
			},
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
		const response = await apiClient.post("/api/tasks/batch", { tasks });
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
