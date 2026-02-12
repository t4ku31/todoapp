import { format } from "date-fns";
import { useCallback } from "react";
import type { TaskList } from "@/features/todo/types";

export function useSidebarStats(taskLists: TaskList[]) {
	const getTodayCount = useCallback(() => {
		const today = format(new Date(), "yyyy-MM-dd");
		return taskLists.reduce((count, list) => {
			return (
				count +
				(list.tasks?.filter(
					(t) =>
						!t.isDeleted &&
						t.status !== "COMPLETED" &&
						t.startDate &&
						format(t.startDate, "yyyy-MM-dd") === today,
				).length || 0)
			);
		}, 0);
	}, [taskLists]);

	const getNext7DaysCount = useCallback(() => {
		const today = new Date();
		const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
		return taskLists.reduce((count, list) => {
			return (
				count +
				(list.tasks?.filter((t) => {
					if (t.isDeleted || t.status === "COMPLETED" || !t.startDate)
						return false;
					const startDate = new Date(t.startDate);
					return startDate >= today && startDate <= next7Days;
				}).length || 0)
			);
		}, 0);
	}, [taskLists]);

	const getInboxCount = useCallback(() => {
		const inboxList = taskLists.find((l) => l.title === "Inbox");
		return (
			inboxList?.tasks?.filter((t) => !t.isDeleted && t.status !== "COMPLETED")
				.length || 0
		);
	}, [taskLists]);

	const getListTaskCount = useCallback(
		(listId: number) => {
			const list = taskLists.find((l) => l.id === listId);
			return (
				list?.tasks?.filter((t) => !t.isDeleted && t.status !== "COMPLETED")
					.length || 0
			);
		},
		[taskLists],
	);

	return {
		getTodayCount,
		getNext7DaysCount,
		getInboxCount,
		getListTaskCount,
	};
}
