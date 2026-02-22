import { Calendar, Clock, GripVertical, Tag } from "lucide-react";
import { memo } from "react";
import type { Task } from "@/features/task/types";
import { AiStatusBadge } from "./AiStatusBadge";

interface AiOriginalTaskItemProps {
	task: Task;
}

export const AiOriginalTaskItem = memo(function AiOriginalTaskItem({
	task,
}: AiOriginalTaskItemProps) {
	return (
		<div className="relative">
			<AiStatusBadge variant="original" className="-top-3 -left-2 shadow-sm">
				Original
			</AiStatusBadge>
			<div className="relative px-4 py-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-300 transition-all duration-200 group">
				<div className="flex items-center gap-2">
					{/* Drag Handle (Visual only) */}
					<div className="text-gray-300">
						<GripVertical className="w-4 h-4" />
					</div>

					<div className="flex-1 min-w-0">
						<span className="text-base font-medium text-gray-500 truncate block">
							{task.title}
						</span>
					</div>
				</div>

				{/* Chips / Info Section */}
				<div className="flex items-center gap-2 flex-wrap pl-6 mt-2">
					{/* Category */}
					<div className="flex items-center gap-1.5 px-2 py-1 bg-white/50 rounded-md border border-gray-100 text-gray-400">
						<Tag className="w-3.5 h-3.5" />
						<span className="text-xs">
							{task.category?.name || "No Category"}
						</span>
					</div>

					{/* Date */}
					<div className="flex items-center gap-1.5 px-2 py-1 bg-white/50 rounded-md border border-gray-100 text-gray-400">
						<Calendar className="w-3.5 h-3.5" />
						<span className="text-xs">
							{task.scheduledStartAt
								? task.scheduledStartAt.toLocaleDateString()
								: "No Date"}
						</span>
					</div>

					{/* Pomodoro */}
					{task.estimatedPomodoros !== undefined && (
						<div className="flex items-center gap-1.5 px-2 py-1 bg-white/50 rounded-md border border-gray-100 text-gray-400">
							<Clock className="w-3.5 h-3.5" />
							<span className="text-xs">{task.estimatedPomodoros}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});
