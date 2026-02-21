import type {
	CreateTaskParams,
	UpdateTaskParams,
} from "@/features/todo/api/taskApi";
import { create } from "zustand";
import { createBulkSlice } from "./slices/createBulkSlice";
import { createSyncSlice } from "./slices/createSyncSlice";
import { createTaskListSlice } from "./slices/createTaskListSlice";
import { createTaskSlice } from "./slices/createTaskSlice";
import { createViewSlice } from "./slices/createViewSlice";
import type { TodoState } from "./slices/types";

// Re-export types for backward compatibility
export type { CreateTaskParams, UpdateTaskParams };

export const useTodoStore = create<TodoState>()((set, get, api) => ({
	...createTaskSlice(set, get, api),
	...createTaskListSlice(set, get, api),
	...createBulkSlice(set, get, api),
	...createSyncSlice(set, get, api),
	...createViewSlice(set, get, api),

	// Shared state
	loading: false,
	error: null,
	isInitialized: false,
	setLoading: (loading) => set({ loading }),
	setError: (error) => set({ error }),
}));
