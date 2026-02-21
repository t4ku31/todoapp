import type { SyncResult, SyncTask } from "@/features/ai/types";
import type {
	CreateTaskParams,
	UpdateTaskParams,
} from "@/features/todo/api/taskApi";
import type { Task, TaskList } from "@/features/todo/types";

export interface TaskSlice {
	// State
	allTasks: Task[];
	trashTasks: Task[];

	// Actions
	fetchTrashTasks: () => Promise<void>;
	createTask: (params: CreateTaskParams) => Promise<Task>;
	updateTask: (taskId: number, updates: UpdateTaskParams) => Promise<void>;
	deleteTask: (taskId: number) => Promise<void>;
	deleteTaskPermanently: (id: number) => Promise<void>;
	restoreTask: (id: number) => Promise<void>;

	// Subtasks
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
}

export interface TaskListSlice {
	// State
	taskLists: TaskList[];

	// Actions
	fetchTaskLists: (options?: {
		force?: boolean;
		background?: boolean;
	}) => Promise<void>;
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
	getInboxList: () => TaskList | undefined;
}

export interface BulkSlice {
	bulkUpdateTasks: (
		taskIds: number[],
		updates: {
			status?: "PENDING" | "COMPLETED";
			categoryId?: number;
			taskListId?: number;
			scheduledStartAt?: Date | null;
		},
	) => Promise<void>;
	bulkDeleteTasks: (taskIds: number[]) => Promise<void>;
	bulkCreateTasks: (tasks: CreateTaskParams[]) => Promise<number[]>;
}

export interface SyncSlice {
	mergeTasksFromAi: (aiTasks: Partial<Task>[]) => void;
	syncTasks: (tasks: SyncTask[]) => Promise<SyncResult>;
}

export interface ViewSlice {
	getTasksForDate: (date: Date) => Task[];
}

export interface TodoState
	extends TaskSlice,
		TaskListSlice,
		BulkSlice,
		SyncSlice,
		ViewSlice {
	loading: boolean;
	error: string | null;
	isInitialized: boolean;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
}
