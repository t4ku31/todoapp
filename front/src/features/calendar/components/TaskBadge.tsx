import type { Task } from "@/types/types";

export function TaskBadge({ task, className }: { task: Task; className?: string }) {
	const isCompleted = task.status === "COMPLETED";
	const categoryColor = task.category?.color ?? "#9ca3af";

	return (
		<div
			className={`text-[11px] xl:text-[13px] px-1.5 xl:px-2 py-0.5 xl:py-1 rounded-md truncate w-full font-normal border ${
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
