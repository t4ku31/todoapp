import type { Task } from "@/types/types";

export function TaskBadge({ task, className }: { task: Task; className?: string }) {
	return (
		<div
			className={`text-[11px] px-2 py-1 rounded-md truncate w-full font-medium ${
				task.status === "COMPLETED"
					? "bg-gray-100 text-gray-500 line-through"
					: "bg-blue-100 text-blue-700 hover:bg-blue-200"
			} ${className}`}
			title={task.title}
		>
			{task.title}
		</div>
	);
}
