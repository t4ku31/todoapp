import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Subtask } from "@/features/todo/types";
import { cn } from "@/lib/utils";
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

interface SortableSubtaskListProps {
	subtasks: Subtask[];
	onUpdate: (id: number, updates: Partial<Subtask>) => void;
	onDelete: (id: number) => void;
	onAdd: (title: string) => void;
	onReorder: (newSubtasks: Subtask[]) => void;
	className?: string;
	placeholder?: string;
}

interface SortableSubtaskItemProps {
	subtask: Subtask;
	onUpdate: (id: number, updates: Partial<Subtask>) => void;
	onDelete: (id: number) => void;
}

function SortableSubtaskItem({
	subtask,
	onUpdate,
	onDelete,
}: SortableSubtaskItemProps) {
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
			duration: 200,
			easing: "cubic-bezier(0.25, 1, 0.5, 1)",
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 10 : undefined,
		position: isDragging ? ("relative" as const) : undefined,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 py-1.5 px-2 group/sub rounded-md hover:bg-slate-50 transition-colors"
		>
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
					onUpdate(subtask.id, { isCompleted: !!checked })
				}
				className="h-3.5 w-3.5 rounded-sm border-gray-300 data-[state=checked]:bg-slate-500 data-[state=checked]:border-slate-500 transition-all"
			/>

			<Input
				value={subtask.title}
				onChange={(e) => onUpdate(subtask.id, { title: e.target.value })}
				className="h-6 text-sm flex-1 py-0 px-1 border-none bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-0"
				placeholder="サブタスクを入力..."
			/>

			<Button
				variant="ghost"
				size="icon"
				className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 transition-opacity"
				onClick={() => onDelete(subtask.id)}
			>
				<Trash2 className="h-3 w-3 text-red-400 hover:text-red-500" />
			</Button>
		</div>
	);
}

export function SortableSubtaskList({
	subtasks,
	onUpdate,
	onDelete,
	onAdd,
	onReorder,
	className,
	placeholder = "サブタスクを追加...",
}: SortableSubtaskListProps) {
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

	const validSubtasks = (subtasks || []).filter(
		(s): s is Subtask => s !== null && s !== undefined && typeof s === "object",
	);

	const sortedSubtasks = [...validSubtasks].sort(
		(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = sortedSubtasks.findIndex((s) => s.id === active.id);
			const newIndex = sortedSubtasks.findIndex((s) => s.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newSubtasks = [...sortedSubtasks];
				const [removed] = newSubtasks.splice(oldIndex, 1);
				newSubtasks.splice(newIndex, 0, removed);

				// Update orderIndex for all items
				const reorderedSubtasks = newSubtasks.map((st, idx) => ({
					...st,
					orderIndex: idx,
				}));

				onReorder(reorderedSubtasks);
			}
		}
	};

	const handleAddSubtask = () => {
		if (newSubtaskTitle.trim()) {
			onAdd(newSubtaskTitle.trim());
			setNewSubtaskTitle("");
			// Keep adding mode for continuous entry? Or close it?
			// Let's keep it open for quick entry of multiple items
		} else {
			setIsAdding(false);
		}
	};

	const handleAddKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault(); // Prevent form submission if inside a form
			handleAddSubtask();
		} else if (e.key === "Escape") {
			setNewSubtaskTitle("");
			setIsAdding(false);
		}
	};

	return (
		<div className={cn("space-y-0.5", className)}>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={sortedSubtasks
						.map((s) => s.id)
						.filter((id) => id !== null && id !== undefined)}
					strategy={verticalListSortingStrategy}
				>
					{sortedSubtasks.map((subtask) => (
						<SortableSubtaskItem
							key={subtask.id}
							subtask={subtask}
							onUpdate={onUpdate}
							onDelete={onDelete}
						/>
					))}
				</SortableContext>
			</DndContext>

			{isAdding ? (
				<div className="flex items-center gap-2 py-1.5 px-2">
					<Button
						type="button"
						size="icon"
						className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shrink-0"
						onClick={handleAddSubtask}
						disabled={!newSubtaskTitle.trim()}
					>
						<Plus className="h-4 w-4" />
					</Button>

					<Input
						value={newSubtaskTitle}
						onChange={(e) => setNewSubtaskTitle(e.target.value)}
						onBlur={() => {
							if (!newSubtaskTitle.trim()) {
								setIsAdding(false);
							} else {
								handleAddSubtask();
							}
						}}
						onKeyDown={handleAddKeyDown}
						placeholder={placeholder}
						className="h-6 text-sm flex-1 py-0 px-1 border-none bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-0"
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
					<span>{placeholder}</span>
				</button>
			)}
		</div>
	);
}
