import { useAiChatContextStore } from "@/features/ai/stores/useAiChatContextStore";
import type { Task, TaskList } from "@/features/todo/types";
import { useTodoStore } from "@/store/useTodoStore";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";

interface UseTaskDragAndDropProps {
	taskLists: TaskList[];
	isSelectionMode: boolean;
	setIsSelectionMode: (isSelectionMode: boolean) => void;
	selectedTaskIds: Set<number>;
	setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<number>>>;
	setIsAiChatOpen: (isOpen: boolean) => void;
}

export function useTaskDragAndDrop({
	taskLists,
	isSelectionMode,
	setIsSelectionMode,
	selectedTaskIds,
	setSelectedTaskIds,
	setIsAiChatOpen,
}: UseTaskDragAndDropProps) {
	const { updateTask, bulkUpdateTasks } = useTodoStore();
	const [activeTask, setActiveTask] = useState<Task | null>(null);

	const handleDragStart = (event: DragStartEvent) => {
		if (event.active.data.current?.task) {
			const draggedTask = event.active.data.current.task as Task;
			setActiveTask(draggedTask);
			// If dragging a selected task in selection mode, keep selection
			// If dragging unselected task, add it to selection temporarily
			if (isSelectionMode && !selectedTaskIds.has(draggedTask.id)) {
				setSelectedTaskIds((prev) => new Set(prev).add(draggedTask.id));
			}
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveTask(null);
			return;
		}

		const task = active.data.current?.task as Task;
		const targetId = over.id as string;

		if (!task) {
			setActiveTask(null);
			return;
		}

		// Determine which tasks to move
		const tasksToMove =
			isSelectionMode && selectedTaskIds.size > 0
				? Array.from(selectedTaskIds)
				: [task.id];

		// Handle different drop targets
		if (targetId === "ai-context-drop-zone") {
			// AIコンテキストへのドロップ
			const { addTask } = useAiChatContextStore.getState();
			// Note: We use allTasks from store directly or we can rely on passed taskLists if they contain all tasks.
			// Ideally useTodoStore.getState().allTasks is standard for access outside of render loop which this is (event handler).
			const currentAllTasks = useTodoStore.getState().allTasks;

			// 選択されたタスクまたはドラッグしたタスクを追加
			for (const taskId of tasksToMove) {
				const taskToAdd = currentAllTasks.find((t) => t.id === taskId);
				if (taskToAdd) {
					addTask(taskToAdd);
				}
			}
			// AIチャットパネルを開く
			setIsAiChatOpen(true);
			// today target case
		} else if (targetId === "today") {
			const today = new Date();
			const todayString = today.toISOString().split("T")[0];

			if (tasksToMove.length > 1) {
				bulkUpdateTasks(tasksToMove, { startDate: today });
			} else if (task.startDate?.toISOString().split("T")[0] !== todayString) {
				updateTask(task.id, { startDate: today });
			}
		} else if (targetId === "inbox") {
			const inboxList = taskLists.find((l) => l.title === "Inbox");
			if (inboxList) {
				if (tasksToMove.length > 1) {
					bulkUpdateTasks(tasksToMove, { taskListId: inboxList.id });
				} else if (task.taskListId !== inboxList.id) {
					updateTask(task.id, { taskListId: inboxList.id });
				}
			}
		} else if (targetId.startsWith("tasklist-")) {
			const newTaskListId = Number.parseInt(
				targetId.replace("tasklist-", ""),
				10,
			);
			if (tasksToMove.length > 1) {
				bulkUpdateTasks(tasksToMove, { taskListId: newTaskListId });
			} else if (task.taskListId !== newTaskListId) {
				updateTask(task.id, { taskListId: newTaskListId });
			}
		} else if (targetId.startsWith("category-")) {
			const newCategoryId = Number.parseInt(
				targetId.replace("category-", ""),
				10,
			);
			if (tasksToMove.length > 1) {
				bulkUpdateTasks(tasksToMove, { categoryId: newCategoryId });
			} else if (task.category?.id !== newCategoryId) {
				updateTask(task.id, { categoryId: newCategoryId });
			}
		}

		setActiveTask(null);
		// Clear selection after bulk move
		if (isSelectionMode && tasksToMove.length > 1) {
			setSelectedTaskIds(new Set());
			setIsSelectionMode(false);
		}
	};

	return {
		activeTask,
		handleDragStart,
		handleDragEnd,
	};
}
