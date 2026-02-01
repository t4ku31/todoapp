import { toast } from "sonner";
import { create } from "zustand";
import { useTodoStore } from "@/store/useTodoStore";
import { normalizeError } from "@/utils/error";
import type { ParsedTask } from "../types";

interface AiPreviewState {
	aiPreviewTasks: ParsedTask[];
	setAiPreviewTasks: (tasks: ParsedTask[]) => void;
	clearAiPreviewTasks: () => void;
	updateAiPreviewTask: (taskId: string, updates: Partial<ParsedTask>) => void;
	toggleAiPreviewSelection: (taskId: string) => void;
	saveAiPreviewTasks: () => Promise<void>;
	loading: boolean;
}

export const useAiPreviewStore = create<AiPreviewState>((set, get) => ({
	aiPreviewTasks: [],
	loading: false,

	setAiPreviewTasks: (tasks) => set({ aiPreviewTasks: tasks }),

	clearAiPreviewTasks: () => set({ aiPreviewTasks: [] }),

	updateAiPreviewTask: (taskId, updates) =>
		set((state) => ({
			aiPreviewTasks: state.aiPreviewTasks.map((t) =>
				t.id === taskId ? { ...t, ...updates } : t,
			),
		})),

	toggleAiPreviewSelection: (taskId) =>
		set((state) => ({
			aiPreviewTasks: state.aiPreviewTasks.map((t) =>
				t.id === taskId ? { ...t, selected: !t.selected } : t,
			),
		})),

	saveAiPreviewTasks: async () => {
		const { aiPreviewTasks } = get();
		const { fetchTaskLists, syncTasks } = useTodoStore.getState();

		const selectedTasks = aiPreviewTasks.filter((t) => t.selected);
		if (selectedTasks.length === 0) return;

		set({ loading: true });

		try {
			const syncPayload = selectedTasks.map((t) => ({
				id: t.originalId && t.originalId > 0 ? t.originalId : undefined,
				title: t.title,
				description: t.description,
				executionDate: t.executionDate,
				scheduledStartAt: t.scheduledStartAt,
				scheduledEndAt: t.scheduledEndAt,
				isAllDay: t.isAllDay,
				estimatedPomodoros: t.estimatedPomodoros,
				categoryName: t.categoryName,
				taskListTitle: t.taskListTitle,
				isRecurring: t.isRecurring,
				recurrencePattern: t.recurrencePattern,
				isDeleted: t.isDeleted,
				subtasks: t.subtasks,
				status: t.status,
			}));
			console.log("selectedTasks", selectedTasks);
			console.log("syncPayload", syncPayload);

			const result = await syncTasks(syncPayload);
			console.log("result", result);

			if (result.success) {
				toast.success(result.message || "タスクを保存しました");
				set({ aiPreviewTasks: [] });
				await fetchTaskLists();
			} else {
				toast.error(result.message || "保存中にエラーが発生しました。");
			}
		} catch (error) {
			console.error("Failed to save tasks:", error);
			const appError = normalizeError(error);
			toast.error("保存中にエラーが発生しました", {
				description: appError.message,
			});
		} finally {
			set({ loading: false });
		}
	},
}));
