import type { Subtask, Task } from "@/features/todo/types";
import type { SerializedRecurrenceConfig } from "@/features/todo/utils/recurrenceUtils";

// SyncTask is for Gemini API communication - uses string dates
export interface SyncTask {
	id?: number; // Database ID (positive) or Null (create)
	title: string;
	description?: string;
	scheduledStartAt?: string;
	scheduledEndAt?: string;
	isAllDay?: boolean;
	estimatedPomodoros?: number;
	categoryName?: string;
	taskListTitle?: string;
	isRecurring?: boolean;
	recurrenceRule?: SerializedRecurrenceConfig;
	isDeleted?: boolean;
	subtasks?: Subtask[];
	status?: string;
}

// ParsedTask extends Task with AI-specific additions
export interface ParsedTask
	extends Omit<
		Task,
		"status" | "taskListId" | "dueDate" | "completedAt" | "category"
	> {
	status?: string; // Optional string (Task has required TaskStatus)
	categoryName?: string; // AI returns name, not object
	taskListTitle?: string; // AI returns title, not ID
	selected: boolean; // UI selection state
	originalTask?: Task; // Reference for diff
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
