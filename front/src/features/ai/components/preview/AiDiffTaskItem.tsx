import { CornerDownRight } from "lucide-react";
import { AiOriginalTaskItem } from "@/features/ai";
import type { ParsedTask } from "@/features/ai/types";
import type { Task } from "@/features/task/types";
import { AiPreviewTaskItem } from "./AiPreviewTaskItem";

interface AiDiffTaskItemProps {
	originalTask: Task;
	previewTask: ParsedTask;
	onUpdateTask: (taskId: number, updates: Partial<ParsedTask>) => void;
	onToggleSelection: (taskId: number) => void;
}

export function AiDiffTaskItem({
	originalTask,
	previewTask,
	onUpdateTask,
	onToggleSelection,
}: AiDiffTaskItemProps) {
	return (
		<div className="relative flex flex-col gap-4 p-5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
			{/* Connector Line */}
			<div className="absolute left-[2.25rem] top-12 bottom-12 w-0.5 bg-indigo-200/50 -z-10" />

			{/* Original Task */}
			<div className="relative flex-1 w-full min-w-0">
				<div className="opacity-70 scale-[0.98] origin-left transition-opacity hover:opacity-100">
					<AiOriginalTaskItem
						key={`original-${originalTask.id}`}
						task={originalTask}
					/>
				</div>
			</div>

			<div className="flex flex-1">
				<div className="flex items-center gap-3 text-indigo-400 pl-4">
					<CornerDownRight className="w-5 h-5" />
				</div>

				{/* Preview Task */}
				<div className="relative pl-8 flex-1 w-full min-w-0">
					<div className="flex-1 shadow-lg shadow-indigo-100/50 rounded-xl">
						<AiPreviewTaskItem
							key={`preview-${previewTask.id}`}
							task={previewTask}
							index={0}
							onUpdateTask={onUpdateTask}
							onToggleSelection={onToggleSelection}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
