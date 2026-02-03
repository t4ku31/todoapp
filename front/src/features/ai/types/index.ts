import type { Subtask, Task } from "@/features/todo/types";

export interface SyncTask {
	id?: number; // Database ID (positive) or Null (create)
	title: string;
	description?: string;
	executionDate?: string;
	scheduledStartAt?: string;
	scheduledEndAt?: string;
	isAllDay?: boolean;
	estimatedPomodoros?: number;
	categoryName?: string;
	taskListTitle?: string;
	isRecurring?: boolean;
	recurrencePattern?: string;
	isDeleted?: boolean;
	subtasks?: Subtask[];
	status?: string;
}

export interface ParsedTask extends Omit<SyncTask, "id" | "subtasks"> {
	id: number; // Positive (DB) or Negative (Preview)
	selected: boolean;
	originalTask?: Task;
	subtasks?: (Subtask | string)[];
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	advice?: string;
}

export interface ChatHistoryMessage {
	role: string;
	content: string;
	createdAt: string;
	advice?: string;
}

export interface ChatAnalysisRequest {
	conversationId?: string;
	prompt: string;
	currentTasks: SyncTask[];
	projectTitle?: string;
}

export interface AiChatResponse {
	message: string;
	result?: {
		projectTitle?: string;
		projectDescription?: string;
		tasks?: SyncTask[];
		totalEstimatedMinutes?: number;
		advice?: string;
	};
	success: boolean;
	suggestedTitle?: string;
}

export interface SyncResult {
	success: boolean;
	message: string;
	createdCount: number;
	updatedCount: number;
	deletedCount: number;
}
