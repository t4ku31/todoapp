import { apiClient } from "@/config/env";
import type { TaskList } from "@/features/todo/types";
import { useTodoStore } from "@/store/useTodoStore";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAiChatContextStore } from "../stores/useAiChatContextStore";
import { useAiPreviewStore } from "../stores/useAiPreviewStore";
import type {
	AiChatResponse,
	ChatAnalysisRequest,
	ChatHistoryMessage,
	ChatMessage,
	ParsedTask,
} from "../types";
import { getUserId, taskToParsedTask } from "../utils/aiUtils";

// 会話メタデータ型
interface Conversation {
	id: string;
	userId: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

interface UseAiChatProps {
	isOpen: boolean;
	onClose: () => void;
	taskLists: TaskList[];
	defaultTaskListId: number;
}

export function useAiChat({ isOpen, onClose, taskLists }: UseAiChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [projectTitle, setProjectTitle] = useState<string | undefined>();

	const { contextTasks } = useAiChatContextStore();

	// Conversation management
	const [conversationId, setConversationId] = useState<string>("");
	const [conversationTitle, setConversationTitle] =
		useState<string>("New Chat");
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isInitializing, setIsInitializing] = useState(true);

	// Fetch active conversation on mount
	useEffect(() => {
		const initConversation = async () => {
			if (!isOpen) return; // Only fetch when panel is opened to save resources

			try {
				const response = await apiClient.post<Conversation>(
					"/api/ai/conversations",
					{ title: "New Chat" },
				);
				if (response.data?.id) {
					setConversationId(response.data.id);
					setConversationTitle(response.data.title || "New Chat");
				}
				// Fetch conversation list
				const listResponse = await apiClient.get<Conversation[]>(
					"/api/ai/conversations",
				);
				if (listResponse.data) {
					setConversations(listResponse.data);
				}
			} catch (error) {
				console.error("Failed to fetch active conversation:", error);
				// Fallback to local generation if backend fails (offline etc?)
				const newId = `${getUserId()}:${Date.now()}`;
				setConversationId(newId);
			} finally {
				setIsInitializing(false);
			}
		};

		if (isOpen && !conversationId) {
			initConversation();
		}
	}, [isOpen, conversationId]);

	const [selectedTaskListId, setSelectedTaskListId] = useState<string>("new");

	const [isMinimized, setIsMinimized] = useState(false);
	const [isTaskListExpanded, setIsTaskListExpanded] = useState(false);

	// Store から取得
	const fetchTaskLists = useTodoStore((state) => state.fetchTaskLists);
	const {
		aiPreviewTasks,
		setAiPreviewTasks,
		clearAiPreviewTasks,
		updateAiPreviewTask,
		toggleAiPreviewSelection,
	} = useAiPreviewStore();

	// 新しいチャットを開始
	const handleNewChat = useCallback(async () => {
		try {
			const response = await apiClient.post<Conversation>(
				"/api/ai/conversations",
				{ title: "New Chat" },
			);

			if (response.data?.id) {
				setConversationId(response.data.id);
				setConversationTitle(response.data.title || "New Chat");
				// Add to conversation list
				setConversations((prev) => {
					return [response.data, ...prev];
				});
			}
		} catch (error) {
			console.error(
				"[handleNewChat] Failed to create new conversation:",
				error,
			);
			// Fallback to local ID
			const newId = `${getUserId()}:${Date.now()}`;

			setConversationId(newId);
			setConversationTitle("New Chat");
		}
		setMessages([
			{
				id: "welcome",
				role: "assistant",
				content:
					"新しい会話を開始しました！✨\nタスクの作成や編集をお手伝いします。",
			},
		]);
		setAiPreviewTasks([]);
		setProjectTitle(undefined);
		setSelectedTaskListId("new");
		setInput("");
		setIsTaskListExpanded(false);
		clearAiPreviewTasks();
	}, [clearAiPreviewTasks, setAiPreviewTasks]);

	// 会話を選択
	const handleSelectConversation = useCallback(
		async (conversation: Conversation) => {
			setConversationId(conversation.id);
			setConversationTitle(conversation.title || "New Chat");
			setInput("");
			setAiPreviewTasks([]);
			setProjectTitle(undefined);
			setSelectedTaskListId("new");
			setIsTaskListExpanded(false);
			clearAiPreviewTasks();

			setIsLoading(true);
			try {
				const response = await apiClient.get<ChatHistoryMessage[]>(
					"/api/ai/messages",
					{
						params: { conversationId: conversation.id },
					},
				);

				if (response.data && response.data.length > 0) {
					const historyMessages: ChatMessage[] = response.data
						.filter((msg) => msg.role !== "system" && msg.role !== "tool") // Filter out system/tool messages if needed
						.map((msg, index) => ({
							id: `history-${index}-${Date.now()}`,
							role: msg.role as "user" | "assistant",
							content: msg.content,
						}));
					setMessages(historyMessages);
					console.log("historyMessages", historyMessages);
				} else {
					// Fallback if no messages found
					setMessages([
						{
							id: "welcome",
							role: "assistant",
							content: `「${conversation.title}」の会話を読み込みました。\n続きからどうぞ！`,
						},
					]);
				}
			} catch (error) {
				console.error("Failed to load conversation history:", error);
				setMessages([
					{
						id: "error",
						role: "assistant",
						content: "会話履歴の読み込みに失敗しました。",
					},
				]);
			} finally {
				setIsLoading(false);
			}
		},
		[clearAiPreviewTasks, setAiPreviewTasks],
	);

	// 会話タイトルを更新
	const updateConversationTitle = useCallback(
		async (id: string, newTitle: string) => {
			try {
				await apiClient.patch(`/api/ai/conversations/${id}/title`, {
					title: newTitle,
				});
				// Update local state
				setConversations((prev) =>
					prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
				);
				// If updating current conversation, update title
				if (id === conversationId) {
					setConversationTitle(newTitle);
				}
			} catch (error) {
				console.error("[updateConversationTitle] Failed:", error);
			}
		},
		[conversationId],
	);

	// 会話を削除
	const deleteConversation = useCallback(
		async (id: string) => {
			try {
				await apiClient.delete(`/api/ai/conversations/${id}`);
				setConversations((prev) => prev.filter((c) => c.id !== id));
				toast.success("チャットを削除しました");

				if (id === conversationId) {
					await handleNewChat();
				}
			} catch (error) {
				console.error("[deleteConversation] Failed:", error);
				toast.error("削除に失敗しました");
			}
		},
		[conversationId, handleNewChat],
	);

	// パネルが開かれたときの初期メッセージ
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			setMessages([
				{
					id: "welcome",
					role: "assistant",
					content:
						"こんにちは！✨ タスクの作成や編集をお手伝いします。\n\n何かお手伝いできることはありますか？",
				},
			]);
		}
	}, [isOpen, messages.length]);

	// TaskList選択時に既存タスクを読み込む
	const handleTaskListSelect = useCallback(
		(taskListId: string) => {
			setSelectedTaskListId(taskListId);

			if (taskListId === "new") {
				// コンテキストストアからタスクを取得
				const initialTasks = contextTasks.map(taskToParsedTask);
				setAiPreviewTasks(initialTasks);

				setProjectTitle(undefined);

				const messageContent =
					initialTasks.length > 0
						? `現在表示中の${initialTasks.length}件のタスクをコンテキストとして読み込みました。`
						: "新規作成モードに切り替えました。タスクの作成や編集をお手伝いします。";

				setMessages((prev) => [
					...prev,
					{
						id: `system-${Date.now()}`,
						role: "assistant",
						content: messageContent,
					},
				]);
				return;
			}

			const taskList = taskLists.find((tl) => tl.id === Number(taskListId));
			if (taskList) {
				const existingTasks =
					taskList.tasks
						?.filter((t) => t.status !== "COMPLETED")
						.map(taskToParsedTask) ?? [];

				setAiPreviewTasks(existingTasks);
				setProjectTitle(taskList.title);

				setMessages((prev) => [
					...prev,
					{
						id: `loaded-${Date.now()}`,
						role: "assistant",
						content: `「${taskList.title}」から ${existingTasks.length}件のタスクを読み込みました。`,
					},
				]);
			}
		},
		[taskLists, contextTasks, setAiPreviewTasks],
	);

	// タスクの選択状態をトグル
	const toggleTaskSelection = useCallback(
		(taskId: string) => {
			toggleAiPreviewSelection(taskId);
		},
		[toggleAiPreviewSelection],
	);

	// ドラフトタスクを更新
	const updateDraftTask = useCallback(
		(taskId: string, updates: Partial<ParsedTask>) => {
			updateAiPreviewTask(taskId, updates);
		},
		[updateAiPreviewTask],
	);

	// 選択したタスクを保存
	const saveSelectedTasks = useCallback(async () => {
		const { aiPreviewTasks } = useAiPreviewStore.getState();
		const selectedTasks = aiPreviewTasks.filter((t) => t.selected);

		if (selectedTasks.length === 0) return;

		setIsLoading(true);
		console.log("selectedTasks", selectedTasks);
		try {
			// Convert ParsedTask to BackendSyncTask
			const syncTasks = selectedTasks.map((t) => ({
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

			console.log("syncTasks", syncTasks);
			const result = await useTodoStore.getState().syncTasks(syncTasks);

			console.log("result", result);
			if (result.success) {
				setMessages((prev) => [
					...prev,
					{
						id: `saved-${Date.now()}`,
						role: "assistant",
						content: result.message || "タスクを保存しました。",
					},
				]);

				// 保存完了後の処理
				setAiPreviewTasks([]);
				clearAiPreviewTasks();
				setIsTaskListExpanded(false);

				// 念の為リストを再取得（完全同期）
				await fetchTaskLists();
			} else {
				setMessages((prev) => [
					...prev,
					{
						id: `error-${Date.now()}`,
						role: "assistant",
						content: result.message || "保存中にエラーが発生しました。",
					},
				]);
			}
		} catch (error) {
			console.error("Failed to save tasks:", error);
			setMessages((prev) => [
				...prev,
				{
					id: `error-${Date.now()}`,
					role: "assistant",
					content: "保存中にエラーが発生しました。",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	}, [fetchTaskLists, clearAiPreviewTasks, setAiPreviewTasks]);

	// AIにプロンプトを送信
	const sendMessage = useCallback(async () => {
		if (!input.trim() || isLoading) return;

		const userMessage: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: input.trim(),
		};

		setMessages((prev) => [...prev, userMessage]);
		const userInput = input.trim();
		setInput("");
		setIsLoading(true);

		try {
			// コンテキストタスク（DnDで追加されたタスク）を統合
			const contextTasksList = useAiChatContextStore.getState().contextTasks;
			const currentPreviewTasks = useAiPreviewStore.getState().aiPreviewTasks;

			// Merge tasks: Preview tasks take precedence if they modify an existing task
			// We can simply pass all of them; the backend agent should handle duplicates or we filter here.
			// Let's filter: if a task is in preview, use that version.
			// contextTasks are Task[] (number IDs). aiPreviewTasks are ParsedTask[] (string or number ID).

			const blendedTasks = [...contextTasksList];

			//get original id from preview tasks
			const previewOriginalIds = new Set(
				currentPreviewTasks
					.map((t) => t.originalId)
					.filter((id): id is number => typeof id === "number"),
			);
			//only context task that is not in preview
			// Filter out context tasks that are currently being previewed (modified)
			const nonOverlappingContext = blendedTasks.filter(
				(t) => !previewOriginalIds.has(t.id),
			);

			const finalContextTasks = [
				...nonOverlappingContext,
				...currentPreviewTasks,
			];
			console.log("~~~~~~~~~~~~~~~~~~~~finalContextTasks", finalContextTasks);
			const request: ChatAnalysisRequest = {
				conversationId,
				prompt: userInput,
				currentTasks: finalContextTasks.map((t) => ({
					...t,
					id: "originalId" in t ? (t.originalId ?? t.id) : t.id,
				})) as any[],
				projectTitle,
			};
			console.log("~~~~~~~~~~~~~~~~~~~~request", request);

			const response = await apiClient.post<AiChatResponse>(
				"/api/ai/tasks/chat",
				request,
			);

			console.log("~~~~~~~~~~~~~~~~~~~~response from chat", response);
			if (response.data.success) {
				const result = response.data;

				// 提案されたタスクをセット
				if (result.result?.tasks) {
					// Use current aiPreviewTasks state
					const currentTasks = useAiPreviewStore.getState().aiPreviewTasks;
					// Shallow copy for mutation
					const nextTasks = [...currentTasks];
					console.log("nextTasks", nextTasks);

					result.result.tasks.forEach((t) => {
						// 既存タスクの判定
						// 1. BackendSyncTask has ID (could be number '1' or string 'preview-...')
						// 2. Try to find match in current preview tasks (nextTasks) by:
						//    a. originalId (if t.id is number) -> matches DB task
						//    b. id (if t.id is string) -> matches previously generated preview task
						const existingIndex = nextTasks.findIndex((pt) => {
							if (!t.id) return false;

							// Check if t.id matches the task's original DB ID (if t.id is a number)
							if (typeof t.id === "number" && pt.originalId === t.id) {
								return true;
							}

							// Check if t.id matches the preview task's frontend ID (string match)
							// This handles the case where AI returns the same ID we generated for the preview
							if (pt.id === t.id) {
								return true;
							}

							return false;
						});

						// console.log("existingIndex", existingIndex);
						// console.log("t", t);

						const mappedTask: ParsedTask = {
							id:
								existingIndex >= 0
									? nextTasks[existingIndex].id
									: `preview-${Date.now()}-${Math.random()}`,
							// originalId should be set only if it's a real DB ID (number)
							originalId: typeof t.id === "number" ? t.id : undefined,
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
							status:
								t.status ??
								(existingIndex >= 0
									? nextTasks[existingIndex].status
									: "PENDING"),
							selected: true,
							originalTask:
								t.id && typeof t.id === "number"
									? useTodoStore
											.getState()
											.allTasks.find((task) => task.id === t.id)
									: undefined,
						};

						if (existingIndex >= 0) {
							// 更新: Merge with existing to keep other props if any (though mappedTask overwrites most)
							// We strictly overwrite with AI's latest suggestion but keep the ID.
							nextTasks[existingIndex] = mappedTask;
						} else {
							// 新規追加
							nextTasks.push(mappedTask);
						}
					});
					console.log("nextTasks", nextTasks);
					setAiPreviewTasks(nextTasks);
					setIsTaskListExpanded(true);
				}

				if (result.result?.projectTitle) {
					setProjectTitle(result.result.projectTitle);
				}

				setMessages((prev) => [
					...prev,
					{
						id: `assistant-${Date.now()}`,
						role: "assistant",
						content:
							result.message ||
							result.result?.advice ||
							"タスクを提案しました。確認してください。",
					},
				]);

				if (result.suggestedTitle) {
					const newTitle = result.suggestedTitle;
					setConversationTitle(newTitle);
					setConversations((prev) =>
						prev.map((c) =>
							c.id === conversationId ? { ...c, title: newTitle } : c,
						),
					);
				}
			} else {
				setMessages((prev) => [
					...prev,
					{
						id: `error-${Date.now()}`,
						role: "assistant",
						content:
							response.data.message ||
							"申し訳ありません。もう一度お試しください。",
					},
				]);
			}
		} catch (error) {
			console.error("Failed to process message:", error);
			setMessages((prev) => [
				...prev,
				{
					id: `error-${Date.now()}`,
					role: "assistant",
					content: "エラーが発生しました。もう一度お試しください。",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	}, [input, isLoading, projectTitle, conversationId, setAiPreviewTasks]);

	// パネルを閉じてリセット
	const handleClose = useCallback(() => {
		onClose();
		clearAiPreviewTasks();
		setTimeout(() => {
			setMessages([]);
			setAiPreviewTasks([]);
			setInput("");
			setProjectTitle(undefined);
			setSelectedTaskListId("new");
			setIsMinimized(false);
			setIsTaskListExpanded(false);
			setConversationId("");
			setConversationTitle("New Chat");
		}, 300);
	}, [onClose, clearAiPreviewTasks, setAiPreviewTasks]);

	return {
		messages,
		tasks: aiPreviewTasks,
		input,
		isLoading,
		isInitializing,
		isMinimized,
		selectedTaskListId,
		isTaskListExpanded,
		// Conversation management
		conversationId,
		conversationTitle,
		conversations,
		// Actions
		setIsMinimized,
		setIsTaskListExpanded,
		setInput,
		handleNewChat,
		handleTaskListSelect,
		handleSelectConversation,
		updateConversationTitle,
		deleteConversation,
		handleClose,
		saveSelectedTasks,
		toggleTaskSelection,
		updateDraftTask,
		sendMessage,
	};
}
