import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Subtask } from "@/features/todo/types";
import { useTodoStore } from "@/store/useTodoStore";

interface TaskItemSubtaskListProps {
	taskId: number;
	subtasks: Subtask[];
}

interface SortableSubtaskItemProps {
	subtask: Subtask;
	taskId: number;
	onUpdate: (
		taskId: number,
		subtaskId: number,
		updates: { title?: string; isCompleted?: boolean },
	) => Promise<void>;
	onDelete: (taskId: number, subtaskId: number) => Promise<void>;
}

function SortableSubtaskItem({
	subtask,
	taskId,
	onUpdate,
	onDelete,
}: SortableSubtaskItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(subtask.title);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: subtask.id,
		transition: {
			duration: 200, // アニメーション時間 (ms)
			easing: "cubic-bezier(0.25, 1, 0.5, 1)", // スムーズなイージング
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 10 : undefined,
		position: isDragging ? ("relative" as const) : undefined,
	};

	const handleTitleSave = () => {
		if (editTitle.trim() && editTitle !== subtask.title) {
			onUpdate(taskId, subtask.id, { title: editTitle.trim() });
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleTitleSave();
		} else if (e.key === "Escape") {
			setEditTitle(subtask.title);
			setIsEditing(false);
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 py-1.5 px-2 group/sub rounded-md hover:bg-slate-50 transition-colors"
		>
			{/* Drag Handle */}
			<div
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none"
			>
				<GripVertical className="w-3 h-3" />
			</div>

			<Checkbox
				checked={subtask.isCompleted}
				onCheckedChange={(checked) =>
					onUpdate(taskId, subtask.id, { isCompleted: !!checked })
				}
				className="h-3.5 w-3.5 rounded-sm border-gray-300 data-[state=checked]:bg-slate-500 data-[state=checked]:border-slate-500 transition-all"
			/>

			{isEditing ? (
				<Input
					value={editTitle}
					onChange={(e) => setEditTitle(e.target.value)}
					onBlur={handleTitleSave}
					onKeyDown={handleKeyDown}
					className="h-6 text-sm flex-1 py-0 px-1"
					autoFocus
				/>
			) : (
				<button
					type="button"
					onClick={() => setIsEditing(true)}
					className={`text-sm flex-1 truncate cursor-text hover:bg-slate-100 rounded px-1 text-left ${
						subtask.isCompleted ? "line-through text-gray-400" : "text-gray-600"
					}`}
				>
					{subtask.title}
				</button>
			)}

			<Button
				variant="ghost"
				size="icon"
				className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 transition-opacity"
				onClick={() => onDelete(taskId, subtask.id)}
			>
				<Trash2 className="h-3 w-3 text-red-400 hover:text-red-500" />
			</Button>
		</div>
	);
}

export function TaskItemSubtaskList({
	taskId,
	subtasks,
}: TaskItemSubtaskListProps) {
	const { updateSubtask, deleteSubtask, createSubtask } = useTodoStore();
	const [isAdding, setIsAdding] = useState(false);
	const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Sort subtasks by orderIndex
	const sortedSubtasks = [...(subtasks || [])].sort(
		(a, b) => a.orderIndex - b.orderIndex,
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = sortedSubtasks.findIndex((s) => s.id === active.id);
			const newIndex = sortedSubtasks.findIndex((s) => s.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				// Calculate new orderIndex
				const movedSubtask = sortedSubtasks[oldIndex];
				const newOrderIndex = newIndex;

				// Update the moved subtask's orderIndex
				updateSubtask(taskId, movedSubtask.id, { orderIndex: newOrderIndex });

				// Update other affected subtasks' orderIndexes
				sortedSubtasks.forEach((s, index) => {
					if (s.id !== movedSubtask.id) {
						let adjustedIndex = index;
						if (oldIndex < newIndex) {
							// Moving down
							if (index > oldIndex && index <= newIndex) {
								adjustedIndex = index - 1;
							}
						} else {
							// Moving up
							if (index >= newIndex && index < oldIndex) {
								adjustedIndex = index + 1;
							}
						}
						if (adjustedIndex !== s.orderIndex) {
							updateSubtask(taskId, s.id, { orderIndex: adjustedIndex });
						}
					}
				});
			}
		}
	};

	const handleAddSubtask = async () => {
		if (newSubtaskTitle.trim()) {
			await createSubtask(taskId, { title: newSubtaskTitle.trim() });
			setNewSubtaskTitle("");
			setIsAdding(false);
		}
	};

	const handleAddKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleAddSubtask();
		} else if (e.key === "Escape") {
			setNewSubtaskTitle("");
			setIsAdding(false);
		}
	};

	return (
		<div className="space-y-0.5 mt-2 pl-2 border-l-2 border-indigo-100/50 ml-1 animate-in slide-in-from-top-1 duration-200">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={sortedSubtasks.map((s) => s.id)}
					strategy={verticalListSortingStrategy}
				>
					{sortedSubtasks.map((subtask) => (
						<SortableSubtaskItem
							key={subtask.id}
							subtask={subtask}
							taskId={taskId}
							onUpdate={updateSubtask}
							onDelete={deleteSubtask}
						/>
					))}
				</SortableContext>
			</DndContext>

			{/* Add Subtask Section */}
			{isAdding ? (
				<div className="flex items-center gap-2 py-1.5 px-2">
					<div className="w-3" /> {/* Spacer for alignment with drag handle */}
					<div className="w-3.5" /> {/* Spacer for alignment with checkbox */}
					<Input
						value={newSubtaskTitle}
						onChange={(e) => setNewSubtaskTitle(e.target.value)}
						onBlur={() => {
							if (!newSubtaskTitle.trim()) {
								setIsAdding(false);
							}
						}}
						onKeyDown={handleAddKeyDown}
						placeholder="サブタスクを追加..."
						className="h-6 text-sm flex-1 py-0 px-1"
						autoFocus
					/>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setIsAdding(true)}
					className="flex items-center gap-2 py-1.5 px-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-slate-50 rounded-md transition-colors w-full"
				>
					<Plus className="w-3 h-3" />
					<span>サブタスクを追加</span>
				</button>
			)}
		</div>
	);
}
