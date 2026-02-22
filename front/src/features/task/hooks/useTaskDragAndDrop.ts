import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useAiChatContextStore } from "@/features/ai/stores/useAiChatContextStore";
import { taskKeys } from "@/features/task/queries/queryKeys";
import { useBulkUpdateTasksMutation } from "@/features/task/queries/task/useTaskListMutations";
import { useUpdateTaskMutation } from "@/features/task/queries/task/useTaskMutations";
import type { Task, TaskList } from "@/features/task/types";

interface UseTaskDragAndDropProps {
	taskLists: TaskList[];
	isSelectionMode: boolean;
	setIsSelectionMode: (isSelectionMode: boolean) => void;
	selectedTaskIds: Set<number>;
	setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<number>>>;
	setIsAiChatOpen: (isOpen: boolean) => void;
}

/** targetId からプレフィックスを除去して数値IDを取得する */
const parseIdFromTarget = (targetId: string, prefix: string): number =>
	Number.parseInt(targetId.replace(prefix, ""), 10);

export function useTaskDragAndDrop({
	taskLists,
	isSelectionMode,
	setIsSelectionMode,
	selectedTaskIds,
	setSelectedTaskIds,
	setIsAiChatOpen,
}: UseTaskDragAndDropProps) {
	const queryClient = useQueryClient();
	const updateTaskMutation = useUpdateTaskMutation();
	const bulkUpdateTasksMutation = useBulkUpdateTasksMutation();

	const [activeTask, setActiveTask] = useState<Task | null>(null);

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			if (event.active.data.current?.task) {
				const draggedTask = event.active.data.current.task as Task;
				setActiveTask(draggedTask);
				// 未選択タスクをドラッグした場合は一時的に選択に追加
				if (isSelectionMode && !selectedTaskIds.has(draggedTask.id)) {
					setSelectedTaskIds((prev) => new Set(prev).add(draggedTask.id));
				}
			}
		},
		[isSelectionMode, selectedTaskIds, setSelectedTaskIds],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
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

			const tasksToMove =
				isSelectionMode && selectedTaskIds.size > 0
					? Array.from(selectedTaskIds)
					: [task.id];

			const isBulk = tasksToMove.length > 1;

			/** 単一 or 一括で更新を振り分ける共通ヘルパー */
			const applyUpdate = (
				updates: Parameters<
					typeof bulkUpdateTasksMutation.mutate
				>[0]["updates"],
				skipSingle = false,
			) => {
				if (isBulk) {
					bulkUpdateTasksMutation.mutate({ taskIds: tasksToMove, updates });
				} else if (!skipSingle) {
					updateTaskMutation.mutate({ taskId: task.id, updates });
				}
			};

			// --- Drop target ごとの処理 ---
			if (targetId === "ai-context-drop-zone") {
				const { addTask } = useAiChatContextStore.getState();
				const cached =
					queryClient.getQueryData<TaskList[]>(taskKeys.lists()) || [];
				const allTasks = cached.flatMap((list) => list.tasks || []);

				for (const id of tasksToMove) {
					const found = allTasks.find((t) => t.id === id);
					if (found) addTask(found);
				}
				setIsAiChatOpen(true);
			} else if (targetId === "today") {
				const today = new Date();
				const todayStr = today.toISOString().split("T")[0];
				applyUpdate(
					{ scheduledStartAt: today },
					task.scheduledStartAt?.toISOString().split("T")[0] === todayStr,
				);
			} else if (targetId === "inbox") {
				const inboxList = taskLists.find((l) => l.title === "Inbox");
				if (inboxList) {
					applyUpdate(
						{ taskListId: inboxList.id },
						task.taskListId === inboxList.id,
					);
				}
			} else if (targetId.startsWith("tasklist-")) {
				const id = parseIdFromTarget(targetId, "tasklist-");
				applyUpdate({ taskListId: id }, task.taskListId === id);
			} else if (targetId.startsWith("category-")) {
				const id = parseIdFromTarget(targetId, "category-");
				applyUpdate({ categoryId: id }, task.category?.id === id);
			}

			setActiveTask(null);
			if (isSelectionMode && isBulk) {
				setSelectedTaskIds(new Set());
				setIsSelectionMode(false);
			}
		},
		[
			isSelectionMode,
			selectedTaskIds,
			taskLists,
			queryClient,
			bulkUpdateTasksMutation,
			updateTaskMutation,
			setSelectedTaskIds,
			setIsSelectionMode,
			setIsAiChatOpen,
		],
	);

	return {
		activeTask,
		handleDragStart,
		handleDragEnd,
	};
}
