import { useQuery } from "@tanstack/react-query";
import { taskApi } from "../../api/taskApi";
import { sortTasks } from "../../utils/taskSorter";
import { taskKeys } from "../queryKeys";

/**
 * Fetches all task lists and their associated tasks.
 * Automatically sorts tasks within each list.
 */
export const useTaskListsQuery = (options?: { enabled?: boolean }) => {
	return useQuery({
		queryKey: taskKeys.lists(),
		queryFn: async () => {
			const data = await taskApi.fetchTaskLists();
			return data.map((list) => ({
				...list,
				tasks: sortTasks(list.tasks || []),
			}));
		},
		enabled: options?.enabled ?? true,
		// Cache for 24 hours, stale immediately to refetch in background if navigating
		staleTime: 0,
		gcTime: 1000 * 60 * 10, // 10 minutes
	});
};

/**
 * Fetches tasks currently in the trash.
 */
export const useTrashTasksQuery = (options?: { enabled?: boolean }) => {
	return useQuery({
		queryKey: taskKeys.trash(),
		queryFn: async () => {
			const data = await taskApi.fetchTrashTasks();
			return data.map((t) => ({ ...t, isDeleted: true }));
		},
		enabled: options?.enabled ?? true,
	});
};
