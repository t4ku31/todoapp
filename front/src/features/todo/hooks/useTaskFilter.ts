import { useAiChatContextStore } from "@/features/ai/stores/useAiChatContextStore";
import type { Task } from "@/features/todo/types";
import { useTodoStore } from "@/store/useTodoStore";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import type { ViewType } from "./useTaskViewParams";

export function useTaskFilter(
	viewType: ViewType,
	pathId: number | null,
	searchQuery: string,
) {
	const { taskLists, trashTasks, fetchTrashTasks } = useTodoStore();
	const { setContextTasks } = useAiChatContextStore();

	useEffect(() => {
		if (viewType === "trash") {
			fetchTrashTasks();
		}
	}, [viewType, fetchTrashTasks]);

	// Filter tasks based on view type
	const filteredTasks = useMemo((): Task[] => {
		const allTasks = taskLists.flatMap((list) => list.tasks || []);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		// Use date-fns format to get local date string (yyyy-MM-dd)
		const todayStr = format(today, "yyyy-MM-dd");

		const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

		// Helper to filter out recurring child tasks
		const excludeRecurringChildren = (tasks: Task[]) =>
			tasks.filter((t) => !t.recurrenceParentId);

		switch (viewType) {
			case "today":
				// Show all tasks including recurring children for date-based views
				return allTasks.filter(
					(t) =>
						!t.isDeleted &&
						t.status !== "COMPLETED" &&
						t.executionDate &&
						t.executionDate.startsWith(todayStr),
				);
			case "week":
				// Show all tasks including recurring children for date-based views
				return allTasks.filter(
					(t) =>
						!t.isDeleted &&
						t.status !== "COMPLETED" &&
						t.executionDate &&
						new Date(t.executionDate) >= today &&
						new Date(t.executionDate) <= next7Days,
				);
			case "inbox": {
				const inboxList = taskLists.find((l) => l.title === "Inbox");
				const inboxTasks =
					inboxList?.tasks?.filter(
						(t) => !t.isDeleted && t.status !== "COMPLETED",
					) || [];
				// Exclude recurring children from inbox view
				return excludeRecurringChildren(inboxTasks);
			}
			case "list": {
				const list = taskLists.find((l) => l.id === pathId);
				const listTasks =
					list?.tasks?.filter(
						(t) => !t.isDeleted && t.status !== "COMPLETED",
					) || [];
				// Exclude recurring children from list view (already filtered on backend, but double-check)
				return excludeRecurringChildren(listTasks);
			}
			case "category": {
				const categoryTasks = allTasks.filter(
					(t) =>
						!t.isDeleted &&
						t.status !== "COMPLETED" &&
						t.category?.id === pathId,
				);
				// Exclude recurring children from category view
				return excludeRecurringChildren(categoryTasks);
			}
			case "completed":
				return allTasks.filter(
					(t) => t.isDeleted !== true && t.status === "COMPLETED",
				);
			case "trash": {
				const deletedFromAllTasks = allTasks.filter(
					(t) => t.isDeleted === true,
				);
				const mergedTrash = [...trashTasks];

				for (const task of deletedFromAllTasks) {
					// Add task to mergedTrash if it's not already there
					if (!mergedTrash.some((mt) => mt.id === task.id)) {
						mergedTrash.push(task);
					}
				}
				return mergedTrash;
			}
			case "search": {
				if (!searchQuery) return [];
				const query = searchQuery.toLowerCase();
				return allTasks.filter(
					(t) => !t.isDeleted && t.title.toLowerCase().includes(query),
				);
			}
			default:
				return allTasks.filter((t) => !t.isDeleted && t.status !== "COMPLETED");
		}
	}, [taskLists, viewType, pathId, trashTasks, searchQuery]);

	// Completed tasks based on view type
	const completedTasks = useMemo((): Task[] => {
		if (viewType === "completed" || viewType === "trash") {
			return [];
		}

		const allTasks = taskLists.flatMap((list) => list.tasks || []);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = format(today, "yyyy-MM-dd");
		const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

		switch (viewType) {
			case "today":
				return allTasks.filter(
					(t) =>
						t.status === "COMPLETED" && t.executionDate?.startsWith(todayStr),
				);
			case "week":
				return allTasks.filter((t) => {
					if (t.status !== "COMPLETED" || !t.executionDate) return false;
					const execDate = new Date(t.executionDate);
					return execDate >= today && execDate <= next7Days;
				});
			case "inbox": {
				const inboxList = taskLists.find((l) => l.title === "Inbox");
				return inboxList?.tasks?.filter((t) => t.status === "COMPLETED") || [];
			}
			case "list": {
				const list = taskLists.find((l) => l.id === pathId);
				return list?.tasks?.filter((t) => t.status === "COMPLETED") || [];
			}
			case "category": {
				return allTasks.filter(
					(t) => t.status === "COMPLETED" && t.category?.id === pathId,
				);
			}
			default:
				return [];
		}
	}, [taskLists, viewType, pathId]);

	// Update context tasks whenever filters change
	useEffect(() => {
		setContextTasks(filteredTasks);
	}, [filteredTasks, setContextTasks]);

	return { filteredTasks, completedTasks };
}
