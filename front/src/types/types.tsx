export interface auth {
	email: string;
	password: string;
}

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Category {
	id: number;
	name: string;
	color?: string;
}

export interface Task {
	id: number;
	title: string;
	status: TaskStatus;
	taskListId: number;
	dueDate?: string;
	executionDate?: string;
	category?: Category;
}

export interface TaskList {
	id: number;
	title: string;
	dueDate?: string; // ISO 8601 date string (e.g., "2025-11-28")
	isCompleted: boolean;
	tasks?: Task[];
}
