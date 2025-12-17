import type { Task } from "@/types/types";

export function TaskBadge({ task, className }: { task: Task; className?: string }) {
	const isCompleted = task.status === "COMPLETED";
	const categoryColor = task.category?.color ?? "#9ca3af";

	return (
		<div
			className={`text-[11px] px-2 py-1 rounded-md truncate w-full font-medium border ${
				isCompleted ? "bg-gray-100 text-gray-500 line-through border-transparent" : "border-transparent"
			} ${className}`}
			style={
				!isCompleted
					? {
							backgroundColor: `${categoryColor}20`,
							color: categoryColor,
							borderColor: `${categoryColor}40`,
					  }
					: undefined
			}
			title={task.title}
		>
			{task.title}
		</div>
	);
}
