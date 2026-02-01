import type { Category, Task, TaskStatus } from "@/features/todo/types";
import type { CreateTaskParams } from "@/store/useTodoStore";
import type { AiChatResponse, ParsedTask } from "../types";

export const getUserId = () => {
	if (typeof window === "undefined") return "guest";
	let id = localStorage.getItem("todo_app_user_id");
	if (!id) {
		id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		localStorage.setItem("todo_app_user_id", id);
	}
	return id;
};

// ヘルパー: 既存タスクかどうかを判定
export const isExistingTask = (task: ParsedTask): boolean =>
	task.originalId !== undefined && task.originalId > 0;

export const taskToParsedTask = (task: Task): ParsedTask => ({
	id: `existing-${task.id}`,
	originalId: task.id,
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
	subtasks: task.subtasks?.map((s) => s.title),
	status: task.status,
	selected: true,
});

export const mergeTasks = (
	currentTasks: ParsedTask[],
	responseTasks: NonNullable<AiChatResponse["result"]>["tasks"],
): ParsedTask[] => {
	return (responseTasks || []).map((t, index) => {
		// 1. AIが返したidが正の数なら、それを信頼（既存タスク）
		// BackendSyncTask uses 'id' instead of 'originalId'
		const aiOriginalId = t.id && t.id > 0 ? t.id : undefined;

		// 2. AIがIDを返さない場合、タイトルでマッチング
		let matchedTask: ParsedTask | undefined;
		if (!aiOriginalId) {
			matchedTask = currentTasks.find((et) => et.title === t.title);
		}

		// 既存タスクのIDを解決
		const resolvedOriginalId =
			aiOriginalId ||
			(matchedTask?.originalId && matchedTask.originalId > 0
				? matchedTask.originalId
				: undefined);

		// Destructure id out to avoid conflict with ParsedTask.id (string)
		// biome-ignore lint/correctness/noUnusedVariables: Destructuring to omit id
		const { id, ...rest } = t;

		return {
			...rest,
			id: matchedTask?.id ?? `task-${Date.now()}-${index}`,
			originalId: resolvedOriginalId,
			status: t.status ?? matchedTask?.status,
			selected: true,
			taskListTitle: t.taskListTitle, // Ensure this is carried over if needed
		} as ParsedTask;
	});
};

export const generateDiffMessage = (
	tasks: ParsedTask[],
	advice?: string,
): string => {
	let diffMessage = advice || "タスクを生成しました。";

	// originalId で判定
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
	return parsedTasks.map((t, index) => {
		const category = t.categoryName
			? categories.find((c) => c.name === t.categoryName)
			: undefined;

		// 既存タスクは originalId、新規タスクは負のIDを割り当て
		const taskId = t.originalId ?? -(Date.now() + index);

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
			subtasks: t.subtasks?.map((title, i) => ({
				id: -i,
				title,
				isCompleted: false,
				orderIndex: i,
			})),
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
	// originalId で判定（正の数 = 既存、それ以外 = 新規）
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
			subtasks: task.subtasks?.map((s) => ({ title: s })),
		};
	});

	return {
		tasksToCreate,
		modifiedTasks,
	};
};
