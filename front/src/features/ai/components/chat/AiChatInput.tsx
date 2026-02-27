import { Send } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface AiChatInputProps {
	input: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	isLoading: boolean;
	placeholder?: string;
	onRowsChange?: (rows: number) => void;
}

export function AiChatInput({
	input,
	onInputChange,
	onSend,
	isLoading,
	placeholder = "メッセージを入力...",
	onRowsChange,
}: AiChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// 入力内容に合わせて高さを自動調整
	useEffect(() => {
		const textarea = textareaRef.current;
		// 依存配列の警告を回避するため、意図的に input を条件に含める
		if (textarea && input !== undefined) {
			textarea.style.height = "auto";
			textarea.style.height = `${textarea.scrollHeight}px`;

			// 行数の計算（パディングを考慮）
			const style = window.getComputedStyle(textarea);
			const lineHeight = parseInt(style.lineHeight, 10) || 20; // デフォルト 20px
			const pt = parseInt(style.paddingTop, 10) || 0;
			const pb = parseInt(style.paddingBottom, 10) || 0;
			const visualRows = Math.floor(
				(textarea.scrollHeight - pt - pb) / lineHeight,
			);

			if (onRowsChange) {
				onRowsChange(visualRows);
			}
		}
	}, [input, onRowsChange]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
		onSend();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			// IME変換中のEnterを無視するかどうかは必要に応じて追加（e.nativeEvent.isComposing等）
			e.preventDefault();
			if (!input.trim() || isLoading) return;
			onSend();
		}
	};

	return (
		<div className="p-2 shrink-0">
			<form
				onSubmit={handleSubmit}
				className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 border rounded-xl px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all"
			>
				<div className="flex-1">
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => onInputChange(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={isLoading}
						rows={1}
						maxLength={4000}
						className="w-full bg-transparent rounded-lg border-none focus-visible:ring-0 shadow-none text-sm resize-none min-h-[40px] max-h-[200px] py-2 px-3 outline-none overflow-y-auto"
					/>
				</div>
				<div className="flex flex-col items-center gap-1">
					{input.length > 2000 && (
						<div
							className={`text-[10px] leading-none mb-0.5 ${
								input.length >= 4000
									? "text-destructive font-medium"
									: "text-muted-foreground"
							}`}
						>
							{input.length}
						</div>
					)}
					<Button
						type="submit"
						disabled={!input.trim() || isLoading}
						size="icon"
						className="h-10 w-10 mb-0.5 shrink-0 bg-indigo-500 hover:bg-indigo-600 rounded-xl"
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</div>
	);
}
