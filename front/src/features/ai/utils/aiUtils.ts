import type {
	Category,
	Subtask,
	Task,
	TaskStatus,
} from "@/features/todo/types";
import {
	deserializeRecurrenceConfig,
	serializeRecurrenceConfig,
} from "@/features/todo/utils/recurrenceUtils";
import type { CreateTaskParams } from "@/store/useTodoStore";
import type { AiChatResponse, ParsedTask, SyncTask } from "../types";

export const createEmptySubtask = (orderIndex: number): Subtask => ({
	title: "",
	isCompleted: false,
	id: -Date.now(),
	orderIndex,
});

// Generate a random negative integer for temporary IDs
const generateTempId = () => -Math.floor(Math.random() * 1000000000) - 1;

// Normalize subtasks from AI response (string | object) to Subtask[]
export const normalizeSubtasks = (
	raw: (string | Partial<Subtask>)[] | undefined,
): Subtask[] | undefined => {
	if (!raw) return undefined;
	return raw
		.filter((s) => s !== null && s !== undefined)
		.map((s, i) => {
			if (typeof s === "string") {
				return {
					id: generateTempId(),
					title: s,
					isCompleted: false,
					orderIndex: i,
				};
			}
			return {
				id: s.id ?? generateTempId(),
				title: s.title ?? "",
				isCompleted: s.isCompleted ?? false,
				orderIndex: s.orderIndex ?? i,
			};
		});
};

export const getUserId = () => {
	if (typeof window === "undefined") return "guest";
	let id = localStorage.getItem("todo_app_user_id");
	if (!id) {
		id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		localStorage.setItem("todo_app_user_id", id);
	}
	return id;
};

// Helper: Check if task is existing (ID > 0)
export const isExistingTask = (task: ParsedTask): boolean =>
	typeof task.id === "number" && task.id > 0;

export const taskToParsedTask = (task: Task): ParsedTask => ({
	id: task.id, // Task.id is number, keeping it as is
	title: task.title,
	description: task.description,
	startDate: task.startDate,
	scheduledStartAt: task.scheduledStartAt,
	scheduledEndAt: task.scheduledEndAt,
	isAllDay: task.isAllDay,
	estimatedPomodoros: task.estimatedPomodoros ?? undefined,
	categoryName: task.category?.name,
	isRecurring: task.isRecurring,
	recurrenceRule: task.recurrenceRule,
	subtasks: task.subtasks,
	status: task.status,
	selected: false, // Default to unselected for existing tasks context, or true if selection mode
	originalTask: task, // Keep reference
});

// Helper to serialize date to yyyy-MM-dd string
const serializeLocalDate = (date: Date | null | undefined): string | null => {
	if (!date) return null;
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// Helper to serialize datetime to ISO string
const serializeDateTime = (
	date: Date | null | undefined,
): string | undefined => {
	if (!date) return undefined;
	return date.toISOString();
};

export const toSyncTask = (task: Task | ParsedTask): SyncTask => {
	// 1. Common fields mapping
	const base: SyncTask = {
		id: task.id > 0 ? task.id : undefined, // Negative ID -> undefined (create)
		title: task.title,
		description: task.description,
		startDate: serializeLocalDate(task.startDate),
		scheduledStartAt: serializeDateTime(task.scheduledStartAt),
		scheduledEndAt: serializeDateTime(task.scheduledEndAt),
		isAllDay: task.isAllDay,
		estimatedPomodoros: task.estimatedPomodoros,
		isRecurring: task.isRecurring,
		recurrenceRule: serializeRecurrenceConfig(task.recurrenceRule) ?? undefined,
		isDeleted: task.isDeleted,
		status: task.status,
	};

	// 2. Handle category (Task has category object, ParsedTask has categoryName string)
	if ("category" in task && task.category) {
		base.categoryName = task.category.name;
	} else if ("categoryName" in task) {
		base.categoryName = task.categoryName;
	}

	// 3. Handle taskListTitle (Task has taskListId, ParsedTask may have taskListTitle)
	if ("taskListTitle" in task) {
		base.taskListTitle = task.taskListTitle;
	} else if ("suggestedTaskListTitle" in task && task.suggestedTaskListTitle) {
		base.taskListTitle = task.suggestedTaskListTitle;
	}

	// 4. Handle subtasks (now always Subtask[])
	if (task.subtasks) {
		base.subtasks = task.subtasks;
	}

	return base;
};

export const mergeTasks = (
	currentTasks: ParsedTask[],
	responseTasks: NonNullable<AiChatResponse["result"]>["tasks"],
): ParsedTask[] => {
	// Map response tasks to ParsedTask
	return (responseTasks || []).map((responseTask, index) => {
		// 1. If AI returns a positive ID, it's an update to an existing task
		const existingId =
			typeof responseTask.id === "number" && responseTask.id > 0
				? responseTask.id
				: undefined;

		// 2. Try to match by title if no good ID provided
		let matchedTask: ParsedTask | undefined;
		if (existingId) {
			matchedTask = currentTasks.find((ct) => ct.id === existingId);
		} else {
			matchedTask = currentTasks.find((ct) => ct.title === responseTask.title);
		}

		// Resolved ID: Use existing ID if matched, otherwise generate negative ID
		const finalId = existingId ?? matchedTask?.id ?? -(Date.now() + index);

		// Exclude fields that need explicit handling
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const {
			id: _,
			recurrenceRule: serializedRule,
			startDate,
			scheduledStartAt,
			scheduledEndAt,
			...rest
		} = responseTask;

		// Deserialize recurrenceRule from string dates to Date objects
		const recurrenceRule = deserializeRecurrenceConfig(serializedRule);

		// Parse date strings to Date objects
		const parseLocalDate = (s?: string | null): Date | null => {
			if (!s) return null;
			const [year, month, day] = s.split("-").map(Number);
			return new Date(year, month - 1, day);
		};
		const parseDateTime = (s?: string | null): Date | null => {
			if (!s) return null;
			return new Date(s);
		};

		return {
			...rest,
			id: finalId,
			startDate: parseLocalDate(startDate),
			scheduledStartAt: parseDateTime(scheduledStartAt),
			scheduledEndAt: parseDateTime(scheduledEndAt),
			recurrenceRule,
			status: responseTask.status ?? matchedTask?.status,
			selected: true,
			taskListTitle: responseTask.taskListTitle,
			subtasks:
				normalizeSubtasks(responseTask.subtasks) ?? matchedTask?.subtasks,
			// If we matched an existing task, keep the reference
			originalTask: matchedTask?.originalTask,
		} as ParsedTask;
	});
};

export const generateDiffMessage = (
	tasks: ParsedTask[],
	advice?: string,
): string => {
	let diffMessage = advice || "タスクを生成しました。";

	const createCount = tasks.filter((t) => !isExistingTask(t)).length;
	const modifyCount = tasks.filter((t) => isExistingTask(t)).length;

	if (createCount > 0 || modifyCount > 0) {
		diffMessage += "\n\n";
		if (createCount > 0) {
			diffMessage += `🆕 **${createCount}件の新規タスク**:\n`;
			diffMessage += tasks
				.filter((t) => !isExistingTask(t))
				.map((t) => `• ${t.title}`)
				.join("\n");
			diffMessage += "\n";
		}
		if (modifyCount > 0) {
			if (createCount > 0) diffMessage += "\n";
			diffMessage += `📝 **${modifyCount}件の変更タスク**:\n`;
			diffMessage += tasks
				.filter((t) => isExistingTask(t))
				.map((t) => `• ${t.title}`)
				.join("\n");
		}
	}
	return diffMessage;
};

export const createPreviewTasks = (
	parsedTasks: ParsedTask[],
	categories: Category[],
	taskListId: number,
): Task[] => {
	return parsedTasks.map((t) => {
		const category = t.categoryName
			? categories.find((c) => c.name === t.categoryName)
			: undefined;

		// Use ID directly (negative for new, positive for existing)
		// Frontend Components should handle negative IDs as temporary
		const taskId = t.id;

		return {
			id: taskId,
			title: t.title,
			description: t.description,
			status: (t.status as TaskStatus) || "PENDING",
			taskListId: taskListId,
			startDate: t.startDate,
			scheduledStartAt: t.scheduledStartAt,
			scheduledEndAt: t.scheduledEndAt,
			isAllDay: t.isAllDay,
			estimatedPomodoros: t.estimatedPomodoros,
			category: category,
			isRecurring: t.isRecurring,
			recurrenceRule: t.recurrenceRule,
			subtasks: t.subtasks,
			isDeleted: false,
			suggestedTaskListTitle: t.taskListTitle,
		} as Task;
	});
};

export const prepareTasksForSave = (
	selectedTasks: ParsedTask[],
	categories: Category[],
	taskListId: number,
	taskListTitle?: string,
) => {
	const newTasks = selectedTasks.filter((t) => !isExistingTask(t));
	const modifiedTasks = selectedTasks.filter((t) => isExistingTask(t));

	const tasksToCreate: CreateTaskParams[] = newTasks.map((task) => {
		const categoryId = task.categoryName
			? categories.find((c) => c.name === task.categoryName)?.id
			: undefined;

		return {
			title: task.title,
			taskListId,
			taskListTitle,
			startDate: task.startDate || null,
			categoryId: categoryId,
			estimatedPomodoros: task.estimatedPomodoros,
			isRecurring: task.isRecurring || false,
			recurrenceRule:
				task.isRecurring && task.recurrenceRule
					? task.recurrenceRule
					: undefined,
			scheduledStartAt: task.scheduledStartAt || null,
			scheduledEndAt: task.scheduledEndAt || null,
			isAllDay: task.isAllDay ?? true,
			status: task.status,
			subtasks: task.subtasks?.map((s) => ({ title: s.title })),
		};
	});

	return {
		tasksToCreate,
		modifiedTasks,
	};
};
