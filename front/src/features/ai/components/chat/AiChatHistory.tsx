import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessage, ParsedTask } from "../../types";
import { AiChatTaskCard } from "./AiChatTaskCard";

interface AiChatHistoryProps {
	messages: ChatMessage[];
	isLoading: boolean;
}

export function AiChatHistory({ messages, isLoading }: AiChatHistoryProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom directly manipulating the scrollable viewport
	// biome-ignore lint/correctness/useExhaustiveDependencies: Auto-scroll behavior triggers
	useEffect(() => {
		if (scrollRef.current) {
			const scrollContainer = scrollRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			) as HTMLElement;
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			} else {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		}
		console.log("messages", messages);
	}, [messages, isLoading]);

	const renderMessageContent = (message: ChatMessage) => {
		const content = message.content.trim();
		let jsonData = null;

		// Try to parse JSON from Markdown code block or raw JSON
		if (message.role === "assistant") {
			try {
				let jsonStr = "";
				if (content.startsWith("{") && content.endsWith("}")) {
					jsonStr = content;
				} else if (content.includes("```")) {
					// Extract content inside ```json ... ``` or just ``` ... ```
					const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
					if (match?.[1]) {
						const inner = match[1].trim();
						if (inner.startsWith("{") && inner.endsWith("}")) {
							jsonStr = inner;
						}
					}
				}

				if (jsonStr) {
					jsonData = JSON.parse(jsonStr);
				}
			} catch {
				// Failed to parse, treat as text
			}
		}

		if (jsonData?.tasks && Array.isArray(jsonData.tasks)) {
			return (
				<div className="flex flex-col gap-2 w-full max-w-[90%]">
					{jsonData.tasks.map((task: ParsedTask, index: number) => (
						<AiChatTaskCard
							key={task.id || index}
							task={task}
							onClick={() => {}}
							onToggleSelect={() => {}}
						/>
					))}
					{jsonData.advice && (
						<div
							className={cn(
								"max-w-full rounded-2xl px-3.5 py-2.5 bg-gray-100 text-gray-800",
							)}
						>
							<p className="text-sm whitespace-pre-wrap leading-relaxed">
								{jsonData.advice}
							</p>
						</div>
					)}
				</div>
			);
		}

		return (
			<div
				className={cn(
					"max-w-[85%] rounded-2xl px-3.5 py-2.5",
					message.role === "user"
						? "bg-indigo-500 text-white"
						: "bg-gray-100 text-gray-800",
				)}
			>
				<p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
			</div>
		);
	};

	return (
		<ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
			<div className="space-y-3">
				{messages.map((message) => (
					<div
						key={message.id}
						className={cn(
							"flex",
							message.role === "user" ? "justify-end" : "justify-start",
						)}
					>
						{renderMessageContent(message)}
					</div>
				))}

				{isLoading && (
					<div className="flex justify-start">
						<div className="bg-gray-100 rounded-2xl px-3.5 py-2.5">
							<div className="flex items-center gap-2 text-gray-500">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span className="text-sm">考え中...</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
