export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Category {
	id: number;
	name: string;
	color?: string;
}

export interface RecurrenceConfig {
	frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
	interval?: number;
	byDay?: (
		| "SUNDAY"
		| "MONDAY"
		| "TUESDAY"
		| "WEDNESDAY"
		| "THURSDAY"
		| "FRIDAY"
		| "SATURDAY"
	)[];
	until?: Date;
	count?: number;
	occurs?: Date[];
}

export interface Task {
	id: number;
	title: string;
	status: TaskStatus;
	taskListId: number;
	dueDate: Date | null;
	category?: Category;
	estimatedPomodoros?: number;
	subtasks?: Subtask[];
	completedAt: Date | null;
	isRecurring?: boolean;
	recurrenceRule?: RecurrenceConfig;
	recurrenceParentId?: number;
	isDeleted?: boolean;
	description?: string;
	// Calendar scheduling fields
	scheduledStartAt: Date | null;
	scheduledEndAt: Date | null;
	isAllDay?: boolean;
	suggestedTaskListTitle?: string;
}

export interface Subtask {
	id: number;
	title: string;
	description?: string;
	isCompleted: boolean;
	orderIndex: number;
}

export interface TaskList {
	id: number;
	title: string;
	dueDate?: string; // ISO 8601 date string (e.g., "2025-11-28")
	isCompleted: boolean;
	tasks?: Task[];
}
