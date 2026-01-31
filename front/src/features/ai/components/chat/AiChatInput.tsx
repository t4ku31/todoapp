import { Send } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AiChatInputProps {
	input: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	isLoading: boolean;
	placeholder?: string;
}

export function AiChatInput({
	input,
	onInputChange,
	onSend,
	isLoading,
	placeholder = "メッセージを入力...",
}: AiChatInputProps) {
	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	};

	return (
		<div className="p-2 shrink-0">
			<div className="flex items-center gap-2">
				<Input
					value={input}
					onChange={(e) => onInputChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={isLoading}
					className="flex-1 h-10 bg-transparent border-none focus-visible:ring-0 shadow-none text-sm"
				/>
				<Button
					onClick={onSend}
					disabled={!input.trim() || isLoading}
					size="icon"
					className="h-10 w-10 bg-indigo-500 hover:bg-indigo-600 rounded-xl"
				>
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
