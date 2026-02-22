import type { TaskList } from "@/features/task/types";
import { cn } from "@/lib/utils";
import { useAiChat } from "../hooks/useAiChat";
import { AiChatHeader } from "./chat/AiChatHeader";
import { AiChatHistory } from "./chat/AiChatHistory";
import { AiChatInput } from "./chat/AiChatInput";
import { AiContextPanel } from "./context/AiContextPanel";

interface AiChatPanelProps {
	isOpen: boolean;
	onClose: () => void;
	taskLists: TaskList[];
	defaultTaskListId: number;
}

export function AiChatPanel(props: AiChatPanelProps) {
	const { isOpen } = props;
	const {
		messages,
		input,
		isLoading,
		isInitializing,
		isMinimized,
		// Conversation management
		conversationId,
		conversationTitle,
		conversations,
		// Actions
		setIsMinimized,
		setInput,
		handleNewChat,
		handleSelectConversation,
		updateConversationTitle,
		deleteConversation,
		handleClose,
		sendMessage,
	} = useAiChat(props);

	if (!isOpen) return null;

	return (
		<div
			className={cn(
				"fixed z-50 transition-all duration-300 ease-out",
				// 位置とサイズ
				isMinimized
					? "bottom-6 right-6 w-80 h-14"
					: "bottom-6 right-6 w-[420px] h-[600px] max-h-[80vh]",
				// スタイル
				"bg-white/95 backdrop-blur-xl",
				"border border-gray-300",
				"rounded-2xl transition-shadow duration-300",
				isMinimized
					? "shadow-[0_20px_50px_rgba(79,70,229,0.2)] shadow-indigo-500/20"
					: "shadow-2xl shadow-gray-900/10",
				// アニメーション
				"animate-in slide-in-from-bottom-4 fade-in duration-300",
			)}
		>
			<AiChatHeader
				conversationTitle={conversationTitle}
				conversations={conversations}
				currentConversationId={conversationId}
				isMinimized={isMinimized}
				isInitializing={isInitializing}
				onSelectConversation={handleSelectConversation}
				onNewChat={handleNewChat}
				onUpdateTitle={updateConversationTitle}
				onDeleteConversation={deleteConversation}
				onToggleMinimize={() => setIsMinimized(!isMinimized)}
				onClose={handleClose}
			/>

			{/* コンテンツ (最小化時は非表示) */}
			{!isMinimized && (
				<div className="flex flex-col h-[calc(100%-56px)]">
					{/* チャットエリア */}
					<AiChatHistory messages={messages} isLoading={isLoading} />

					{/* 入力セクション (コンテキスト + 入力欄) */}
					<div className="px-4 pb-4">
						<div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm focus-within:ring-[2px] focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-200 overflow-hidden">
							<div className="pt-2">
								<AiContextPanel />
							</div>
							<div className="border-t border-gray-200 mx-2" />
							<AiChatInput
								input={input}
								onInputChange={setInput}
								onSend={sendMessage}
								isLoading={isLoading}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
