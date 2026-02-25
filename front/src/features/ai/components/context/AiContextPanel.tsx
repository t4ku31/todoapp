import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, Paperclip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAiChatContextStore } from "@/features/ai/stores/useAiChatContextStore";
import type { Task } from "@/features/task/types";
import { cn } from "@/lib/utils";

interface AiContextPanelProps {
	onAddClick?: () => void;
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
}

export function AiContextPanel({
	onAddClick,
	isExpanded,
	setIsExpanded,
}: AiContextPanelProps) {
	const { contextTasks, removeTask, clearContextTasks } =
		useAiChatContextStore();

	// ドロップゾーンの設定
	const { isOver, setNodeRef } = useDroppable({
		id: "ai-context-drop-zone",
	});

	const hasContext = contextTasks.length > 0;

	return (
		<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
			<div
				ref={setNodeRef}
				className={cn(
					"mx-2 mb-0.5 rounded-lg transition-all duration-200",
					isOver
						? "bg-indigo-50/50 ring-4 ring-indigo-500/10"
						: "bg-transparent",
				)}
			>
				{/* ヘッダー - コンテキストがあるかドラッグ中のみ表示 */}
				{hasContext || isOver ? (
					<div className="flex items-center justify-between w-full px-2.5 py-1.5">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-1.5 text-left group"
							>
								<ChevronDown
									className={cn(
										"w-3.5 h-3.5 text-gray-400 transition-transform duration-300",
										!isExpanded && "rotate-180",
									)}
								/>
								<div className="flex items-center gap-1.5 underline-offset-4 group-hover:underline">
									<Paperclip className="w-3.5 h-3.5 text-gray-500" />
									<span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
										Attached Context
									</span>
									<span className="text-[11px] font-medium text-indigo-500 bg-indigo-50 px-1.5 rounded-full">
										{contextTasks.length}
									</span>
								</div>
							</button>
						</CollapsibleTrigger>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								clearContextTasks();
							}}
							className="text-[10px] font-medium text-gray-400 hover:text-red-500 transition-colors px-2 py-0.5 rounded-md hover:bg-red-50"
						>
							Clear
						</button>
					</div>
				) : null}

				<CollapsibleContent>
					<div className={cn("px-2.5 pb-2.5", !hasContext && "pt-1")}>
						{hasContext ? (
							<div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-0.5 scrollbar-thin">
								{contextTasks.map((task) => (
									<TaskChip
										key={task.id}
										task={task}
										onRemove={() => removeTask(task.id)}
									/>
								))}
							</div>
						) : isOver ? (
							<div className="py-2 text-center border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/30">
								<p className="text-xs font-medium text-indigo-500">
									Drop to attach
								</p>
							</div>
						) : null}

						{/* 追加ボタン */}
						{onAddClick && hasContext && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onAddClick}
								className="w-full mt-2 h-7 text-[10px] font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
							>
								<Plus className="w-3 h-3 mr-1" />
								Add more context...
							</Button>
						)}
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

interface TaskChipProps {
	task: Task;
	onRemove: () => void;
}

function TaskChip({ task, onRemove }: TaskChipProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px]",
				"bg-white border border-gray-200 text-gray-600 shadow-sm",
				"max-w-[160px] group hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200",
			)}
		>
			<div
				className="w-1.5 h-1.5 rounded-full flex-shrink-0"
				style={{ backgroundColor: task.category?.color ?? "#6366f1" }}
			/>
			<span className="truncate font-medium" title={task.title}>
				{task.title}
			</span>
			<button
				type="button"
				onClick={onRemove}
				className="ml-0.5 p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
			>
				<X className="w-2.5 h-2.5" />
			</button>
		</div>
	);
}
