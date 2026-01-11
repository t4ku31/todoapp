import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { FilteredTaskView } from "./FilteredTaskView";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { TaskSidebar } from "./TaskSidebar";

export default function TodoView() {
	const location = useLocation();
	const fetchCategories = useCategoryStore((state) => state.fetchCategories);
	const {
		fetchTaskLists,
		createTask,
		updateTask,
		deleteTask,
		bulkUpdateTasks,
	} = useTodoStore();

	const [activeTask, setActiveTask] = useState<Task | null>(null);
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	// Bulk selection state (lifted from FilteredTaskView for DnD support)
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
		new Set(),
	);

	useEffect(() => {
		fetchTaskLists();
		fetchCategories();
	}, [fetchTaskLists, fetchCategories]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reacting to route changes
	useEffect(() => {
		// Close detail panel when route changes
		setSelectedTaskId(null);
	}, [location.pathname]);

	// Responsive Sidebar Handling
	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 1024px)");

		const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
			if (!e.matches) {
				setIsSidebarOpen(false); // Close on mobile/tablet
			} else {
				setIsSidebarOpen(true); // Open on desktop
			}
		};

		// Initial check
		handleResize(mediaQuery);

		// Listener
		mediaQuery.addEventListener("change", handleResize);
		return () => mediaQuery.removeEventListener("change", handleResize);
	}, []);

	const handleDragStart = (event: DragStartEvent) => {
		if (event.active.data.current?.task) {
			const draggedTask = event.active.data.current.task as Task;
			setActiveTask(draggedTask);
			// If dragging a selected task in selection mode, keep selection
			// If dragging unselected task, add it to selection temporarily
			if (isSelectionMode && !selectedTaskIds.has(draggedTask.id)) {
				setSelectedTaskIds((prev) => new Set(prev).add(draggedTask.id));
			}
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveTask(null);
			return;
		}

		const task = active.data.current?.task as Task;
		const targetId = over.id as string;

		if (!task) {
			setActiveTask(null);
			return;
		}

		// Determine which tasks to move
		const tasksToMove =
			isSelectionMode && selectedTaskIds.size > 0
				? Array.from(selectedTaskIds)
				: [task.id];

		// Handle different drop targets
		if (targetId === "today") {
			const today = new Date().toISOString().split("T")[0];
			if (tasksToMove.length > 1) {
				bulkUpdateTasks(tasksToMove, { executionDate: today });
			} else if (task.executionDate !== today) {
				updateTask(task.id, { executionDate: today });
			}
		} else if (targetId === "inbox") {
			const inboxList = useTodoStore
				.getState()
				.taskLists.find((l) => l.title === "Inbox");
			if (inboxList) {
				if (tasksToMove.length > 1) {
					bulkUpdateTasks(tasksToMove, { taskListId: inboxList.id });
				} else if (task.taskListId !== inboxList.id) {
					updateTask(task.id, { taskListId: inboxList.id });
				}
			}
		} else if (targetId.startsWith("tasklist-")) {
			const newTaskListId = Number.parseInt(
				targetId.replace("tasklist-", ""),
				10,
			);
			if (tasksToMove.length > 1) {
				bulkUpdateTasks(tasksToMove, { taskListId: newTaskListId });
			} else if (task.taskListId !== newTaskListId) {
				updateTask(task.id, { taskListId: newTaskListId });
			}
		} else if (targetId.startsWith("category-")) {
			const newCategoryId = Number.parseInt(
				targetId.replace("category-", ""),
				10,
			);
			if (tasksToMove.length > 1) {
				bulkUpdateTasks(tasksToMove, { categoryId: newCategoryId });
			} else if (task.category?.id !== newCategoryId) {
				updateTask(task.id, { categoryId: newCategoryId });
			}
		}

		setActiveTask(null);
		// Clear selection after bulk move
		if (isSelectionMode && tasksToMove.length > 1) {
			setSelectedTaskIds(new Set());
			setIsSelectionMode(false);
		}
	};

	const handleTaskSelect = (taskId: number | null) => {
		setSelectedTaskId(taskId);
	};

	const handleCloseDetail = () => {
		setSelectedTaskId(null);
	};

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="relative flex h-full overflow-hidden bg-gray-50/50">
				{/* Task Sidebar */}
				<div
					className={cn(
						// Common transitions
						"transition-all duration-300 ease-spring z-40",

						// Mobile/Tablet: Floating Card Overlay
						"absolute left-4 top-16 bottom-4 w-64 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl",
						!isSidebarOpen &&
							"lg:hidden opacity-0 -translate-x-4 scale-95 pointer-events-none",
						isSidebarOpen && "opacity-100 translate-x-0 scale-100",

						// Desktop: Fixed Sidebar
						"lg:relative lg:top-0 lg:left-0 lg:bottom-0 lg:rounded-none lg:shadow-none lg:border-none lg:border-r lg:bg-transparent lg:opacity-100 lg:translate-x-0 lg:scale-100 lg:pointer-events-auto",
						isSidebarOpen
							? "lg:w-64 lg:mr-0"
							: "lg:w-0 lg:border-none lg:overflow-hidden",
					)}
				>
					<TaskSidebar
						className={cn(
							"w-64 h-full",
							"lg:rounded-none lg:bg-transparent",
							"rounded-2xl",
						)}
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 h-full w-full">
					<FilteredTaskView
						key={location.pathname} // Force re-render on route change
						onUpdateTask={updateTask}
						onDeleteTask={deleteTask}
						onCreateTask={createTask}
						onTaskSelect={handleTaskSelect}
						selectedTaskId={selectedTaskId}
						isSelectionMode={isSelectionMode}
						setIsSelectionMode={setIsSelectionMode}
						selectedTaskIds={selectedTaskIds}
						setSelectedTaskIds={setSelectedTaskIds}
						onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
						isSidebarOpen={isSidebarOpen}
					/>
				</div>

				{/* Task Detail Panel - Overlay */}
				{selectedTaskId && (
					<div className="absolute right-0 top-0 bottom-0 z-30 h-full w-[400px] shadow-2xl bg-white border-l border-gray-100 animate-in slide-in-from-right duration-300">
						<TaskDetailPanel
							taskId={selectedTaskId}
							onClose={handleCloseDetail}
						/>
					</div>
				)}

				{/* Drag Overlay */}
				<DragOverlay>
					{activeTask ? (
						<div className="opacity-90 rotate-2 cursor-grabbing pointer-events-none">
							<div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-lg ring-2 ring-indigo-400">
								<div className="flex items-center gap-4 flex-1">
									<div className="text-base font-medium text-gray-700">
										{activeTask.title}
									</div>
									{isSelectionMode && selectedTaskIds.size > 1 && (
										<span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
											+{selectedTaskIds.size - 1}件
										</span>
									)}
								</div>
							</div>
						</div>
					) : null}
				</DragOverlay>
			</div>
		</DndContext>
	);
}
