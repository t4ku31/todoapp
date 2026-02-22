import type { Task, TaskStatus } from "@/features/task/types";

const statusOrder: Record<TaskStatus, number> = {
	IN_PROGRESS: 0,
	PENDING: 1,
	COMPLETED: 2,
};

export const sortTasks = (tasks: Task[]): Task[] => {
	return [...tasks].sort((a, b) => {
		const orderA = statusOrder[a.status] ?? 99;
		const orderB = statusOrder[b.status] ?? 99;
		return orderA - orderB;
	});
};
