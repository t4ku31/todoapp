import { isSameDay } from "date-fns";
import type { StateCreator } from "zustand";
import type { TodoState, ViewSlice } from "./types";

export const createViewSlice: StateCreator<TodoState, [], [], ViewSlice> = (
	_set,
	get,
) => ({
	getTasksForDate: (date: Date) => {
		return get().allTasks.filter(
			(task) => task.scheduledStartAt && isSameDay(task.scheduledStartAt, date),
		);
	},
});
