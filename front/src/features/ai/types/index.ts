import type { Task } from "@/features/todo/types";

export interface BackendSyncTask {
	id?: number; // Database ID (null/undefined for new)
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
	subtasks?: string[];
	status?: string;
}

export interface ParsedTask extends Omit<BackendSyncTask, "id"> {
	id: string; // Frontend ID (UUID)
	originalId?: number; // Maps to BackendSyncTask.id
	selected: boolean;
	originalTask?: Task;
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
	currentTasks: Task[];
	projectTitle?: string;
}

export interface AiChatResponse {
	message: string;
	result?: {
		projectTitle?: string;
		projectDescription?: string;
		tasks?: BackendSyncTask[];
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
