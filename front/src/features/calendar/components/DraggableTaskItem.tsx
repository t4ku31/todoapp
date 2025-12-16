import type { Task } from "@/types/types";
import { useDraggable } from "@dnd-kit/core";
import { TaskBadge } from "./TaskBadge";

export function DraggableTaskItem({ task }: { task: Task }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `task-${task.id}`,
		data: { task },
	});

	// When using DragOverlay, we generally don't move the original item.
	// It stays in place but becomes invisible or transparent to act as a placeholder.
	// The Overlay is what the user sees moving.
	const style = {
		opacity: isDragging ? 0.3 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="w-full cursor-grab active:cursor-grabbing"
		>
			<TaskBadge task={task} />
		</div>
	);
}
