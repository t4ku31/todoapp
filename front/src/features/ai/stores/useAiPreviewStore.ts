import { create } from "zustand";
import type { ParsedTask } from "../types";

interface AiPreviewState {
	aiPreviewTasks: ParsedTask[];
	setAiPreviewTasks: (tasks: ParsedTask[]) => void;
	clearAiPreviewTasks: () => void;
	updateAiPreviewTask: (taskId: number, updates: Partial<ParsedTask>) => void;
	toggleAiPreviewSelection: (taskId: number) => void;
}

export const useAiPreviewStore = create<AiPreviewState>((set) => ({
	aiPreviewTasks: [],

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
}));
