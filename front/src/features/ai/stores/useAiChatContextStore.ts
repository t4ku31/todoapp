import { create } from "zustand";
import type { Task } from "@/features/todo/types";

interface AiChatContextState {
	contextTasks: Task[];
	// タスクを追加（重複は無視）
	addTask: (task: Task) => void;
	// タスクを削除
	removeTask: (taskId: number) => void;
	// 複数タスクを一括設定
	setContextTasks: (tasks: Task[]) => void;
	// 全クリア
	clearContextTasks: () => void;
	// タスクがコンテキストに含まれているか確認
	hasTask: (taskId: number) => boolean;
	// Conversation State
	conversationId: string | null;
	setConversationId: (id: string | null) => void;
	projectTitle: string | undefined;
	setProjectTitle: (title: string | undefined) => void;
}

export const useAiChatContextStore = create<AiChatContextState>((set, get) => ({
	contextTasks: [],

	addTask: (task) =>
		set((state) => {
			// 既に存在する場合は追加しない
			if (state.contextTasks.some((t) => t.id === task.id)) {
				return state;
			}
			return { contextTasks: [...state.contextTasks, task] };
		}),

	removeTask: (taskId) =>
		set((state) => ({
			contextTasks: state.contextTasks.filter((t) => t.id !== taskId),
		})),

	setContextTasks: (tasks) => set({ contextTasks: tasks }),

	clearContextTasks: () => set({ contextTasks: [] }),

	hasTask: (taskId) => get().contextTasks.some((t) => t.id === taskId),
	conversationId: null,
	setConversationId: (id) => set({ conversationId: id }),
	projectTitle: undefined,
	setProjectTitle: (title) => set({ projectTitle: title }),
}));
