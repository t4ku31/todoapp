import type {
	Category,
	Subtask,
	Task,
	TaskStatus,
} from "@/features/todo/types";
import type { CreateTaskParams } from "@/store/useTodoStore";
import type { AiChatResponse, ParsedTask, SyncTask } from "../types";

export const createEmptySubtask = (orderIndex: number): Subtask => ({
	title: "",
	isCompleted: false,
	id: -Date.now(),
	orderIndex,
});

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
	executionDate: task.executionDate ?? undefined,
	scheduledStartAt: task.scheduledStartAt ?? undefined,
	scheduledEndAt: task.scheduledEndAt ?? undefined,
	isAllDay: task.isAllDay,
	estimatedPomodoros: task.estimatedPomodoros ?? undefined,
	categoryName: task.category?.name,
	isRecurring: task.isRecurring,
	recurrencePattern: task.recurrenceRule ?? undefined,
	subtasks: task.subtasks,
	status: task.status,
	selected: false, // Default to unselected for existing tasks context, or true if selection mode
	originalTask: task, // Keep reference
});

export const toSyncTask = (task: Task | ParsedTask): SyncTask => {
	// 1. Common fields mapping
	const base: SyncTask = {
		id: task.id > 0 ? task.id : undefined, // Negative ID -> undefined (create)
		title: task.title,
		description: task.description,
		executionDate: task.executionDate,
		scheduledStartAt: task.scheduledStartAt,
		scheduledEndAt: task.scheduledEndAt,
		isAllDay: task.isAllDay,
		estimatedPomodoros: task.estimatedPomodoros,
		isRecurring: task.isRecurring,
		isDeleted: task.isDeleted,
		status: task.status,
		// Convert subtasks to strict Subtask[]
		subtasks: task.subtasks?.map((s, index) => {
			if (typeof s === "string") {
				return {
					title: s,
					isCompleted: false,
					id: -Date.now() - index,
					orderIndex: index,
				};
			}
			return s;
		}),
	};

	// 2. Handle specific fields (ParsedTest has flat categoryName, Task has Category object)
	if ("category" in task && task.category) {
		base.categoryName = task.category.name;
	} else if ("categoryName" in task) {
		base.categoryName = task.categoryName;
	}

	if ("recurrenceRule" in task && task.recurrenceRule) {
		base.recurrencePattern = task.recurrenceRule; // Task
	} else if ("recurrencePattern" in task) {
		base.recurrencePattern = task.recurrencePattern; // ParsedTask
	}

	// TaskListTitle is usually not strictly required for context but good to have
	if ("suggestedTaskListTitle" in task && task.suggestedTaskListTitle) {
		base.taskListTitle = task.suggestedTaskListTitle;
	} else if ("taskListTitle" in task) {
		base.taskListTitle = task.taskListTitle;
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

		// Exclude 'id' from rest spread to avoid type issues if backend sends undefined/null
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id: _, ...rest } = responseTask;

		return {
			...rest,
			id: finalId,
			status: responseTask.status ?? matchedTask?.status,
			selected: true,
			taskListTitle: responseTask.taskListTitle,
			subtasks: responseTask.subtasks ?? matchedTask?.subtasks,
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
			executionDate: t.executionDate,
			scheduledStartAt: t.scheduledStartAt,
			scheduledEndAt: t.scheduledEndAt,
			isAllDay: t.isAllDay,
			estimatedPomodoros: t.estimatedPomodoros,
			category: category,
			isRecurring: t.isRecurring,
			recurrenceRule: t.recurrencePattern,
			subtasks: t.subtasks?.map((s, i) => {
				if (typeof s === "string") {
					return {
						id: -Date.now() - i,
						title: s,
						isCompleted: false,
						orderIndex: i,
					};
				}
				return {
					id: s.id ?? -i,
					title: s.title,
					isCompleted: s.isCompleted ?? false,
					orderIndex: s.orderIndex ?? i,
				};
			}),
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
			executionDate: task.executionDate || null,
			categoryId: categoryId,
			estimatedPomodoros: task.estimatedPomodoros,
			isRecurring: task.isRecurring || false,
			scheduledStartAt: task.scheduledStartAt || null,
			scheduledEndAt: task.scheduledEndAt || null,
			isAllDay: task.isAllDay ?? true,
			status: task.status,
			subtasks: task.subtasks?.map((s) => {
				if (typeof s === "string") {
					return { title: s };
				}
				return { title: s.title };
			}),
		};
	});

	return {
		tasksToCreate,
		modifiedTasks,
	};
};
