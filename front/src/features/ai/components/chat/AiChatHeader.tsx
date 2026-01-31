import {
	Check,
	ChevronDown,
	Minus,
	Pencil,
	Plus,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteButton } from "@/features/todo/components/ui/DeleteButton";
import { cn } from "@/lib/utils";

// 会話メタデータ型 (useAiChat.ts と重複しているため、types/index.ts などに移動すべきだが、一旦ここで定義)
// TODO: Shared interfaces should be in features/ai/types/index.ts
export interface Conversation {
	id: string;
	userId: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

interface ConversationEditInputProps {
	value: string;
	onChange: (value: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

function ConversationEditInput({
	value,
	onChange,
	onConfirm,
	onCancel,
}: ConversationEditInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<input
			ref={inputRef}
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") onConfirm();
				if (e.key === "Escape") onCancel();
			}}
			onBlur={onConfirm}
			className="flex-1 text-sm px-1 py-0.5 border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
		/>
	);
}

interface AiChatHeaderProps {
	// State
	conversationTitle: string;
	conversations: Conversation[];
	currentConversationId: string;
	isMinimized: boolean;
	isInitializing?: boolean;

	// Actions
	onSelectConversation: (conv: Conversation) => void;
	onNewChat: () => void;
	onUpdateTitle: (id: string, title: string) => void;
	onDeleteConversation: (id: string) => void;
	onToggleMinimize: () => void;
	onClose: () => void;
}

// 日付グループ化のヘルパー
function formatConversationDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

	if (date >= today) return "今日";
	if (date >= yesterday) return "昨日";
	if (date >= weekAgo) return "過去7日間";
	return "過去30日間";
}

export function AiChatHeader({
	conversationTitle,
	conversations,
	currentConversationId,
	isMinimized,
	isInitializing,
	onSelectConversation,
	onNewChat,
	onUpdateTitle,
	onDeleteConversation,
	onToggleMinimize,
	onClose,
}: AiChatHeaderProps) {
	// インライン編集用の状態
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");

	// 編集開始
	const startEdit = useCallback((id: string, currentTitle: string) => {
		setEditingId(id);
		setEditValue(currentTitle || "New Chat");
	}, []);

	// 編集確定
	const confirmEdit = useCallback(() => {
		if (!editingId) return;
		if (editValue.trim()) {
			onUpdateTitle(editingId, editValue.trim());
		}
		setEditingId(null);
		setEditValue("");
	}, [editingId, editValue, onUpdateTitle]);

	// 編集キャンセル
	const cancelEdit = useCallback(() => {
		setEditingId(null);
		setEditValue("");
	}, []);

	// 会話をグループ化
	const groupedConversations = conversations.reduce(
		(acc, conv) => {
			const group = formatConversationDate(conv.updatedAt);
			if (!acc[group]) acc[group] = [];
			acc[group].push(conv);
			return acc;
		},
		{} as Record<string, typeof conversations>,
	);

	return (
		<div
			className={cn(
				"flex items-center justify-between px-4 shrink-0",
				"border-b border-gray-200",
				isMinimized ? "h-14" : "h-14",
			)}
		>
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
					<Sparkles className="w-4 h-4 text-white" />
				</div>
				<div>
					{/* 会話タイトル（ドロップダウン） */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors"
							>
								<span className="max-w-[140px] truncate">
									{conversationTitle}
								</span>
								<ChevronDown className="w-3 h-3" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-72 max-h-80 overflow-y-auto"
						>
							{Object.entries(groupedConversations).map(([group, convs]) => (
								<div key={group}>
									<DropdownMenuLabel className="text-xs text-gray-400 font-normal">
										{group}
									</DropdownMenuLabel>
									{convs.map((conv) => (
										<div
											key={conv.id}
											className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 rounded-sm cursor-pointer group"
										>
											{editingId === conv.id ? (
												// 編集モード
												<ConversationEditInput
													value={editValue}
													onChange={setEditValue}
													onConfirm={confirmEdit}
													onCancel={cancelEdit}
												/>
											) : (
												// 表示モード
												<>
													<button
														type="button"
														onClick={() => onSelectConversation(conv)}
														className="flex-1 text-left text-sm truncate"
													>
														{conv.title || "New Chat"}
													</button>
													<div className="flex items-center gap-1">
														{conv.id === currentConversationId && (
															<Check className="w-4 h-4 text-indigo-600" />
														)}
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																startEdit(conv.id, conv.title);
															}}
															className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
															title="タイトルを編集"
														>
															<Pencil className="w-3 h-3 text-gray-500" />
														</button>
														<DeleteButton
															onDelete={() => onDeleteConversation(conv.id)}
															title="チャットを削除しますか？"
															description="この操作は元に戻せません。"
															trigger={
																<button
																	type="button"
																	className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity ml-0.5"
																	title="履歴を削除"
																>
																	<Trash2 className="w-3 h-3 text-red-400 hover:text-red-500" />
																</button>
															}
														/>
													</div>
												</>
											)}
										</div>
									))}
									<DropdownMenuSeparator />
								</div>
							))}
							{conversations.length === 0 && (
								<div className="px-2 py-1.5 text-sm text-gray-400">
									{isInitializing ? "読み込み中..." : "履歴なし"}
								</div>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="flex items-center gap-1">
				{/* 新規会話作成ボタン */}
				{!isMinimized && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-gray-400 hover:text-indigo-600"
						onClick={onNewChat}
						title="新しい会話を作成"
					>
						<Plus className="h-4 w-4" />
					</Button>
				)}

				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-gray-400 hover:text-gray-600"
					onClick={onToggleMinimize}
				>
					<Minus className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-gray-400 hover:text-gray-600"
					onClick={onClose}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
