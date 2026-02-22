import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AiChatPanel } from "@/features/ai/components/AiChatPanel";
import type {
	CreateTaskParams,
	UpdateTaskParams,
} from "@/features/task/api/taskApi";
import { useTaskDragAndDrop } from "@/features/task/hooks/useTaskDragAndDrop";
import {
	useCreateTaskMutation,
	useDeleteTaskMutation,
	useUpdateTaskMutation,
} from "@/features/task/queries/task/useTaskMutations";
import { useTaskListsQuery } from "@/features/task/queries/task/useTaskQueries";
import { cn } from "@/lib/utils";
import { TaskDetailPanel } from "./detail-panel/TaskDetailPanel";
import { FilteredTaskView } from "./list-view/FilteredTaskView";
import { TaskSidebar } from "./sidebar/TaskSidebar";

export default function TodoView() {
	const location = useLocation();

	const { data: taskLists = [], isLoading: isTaskListsLoading } =
		useTaskListsQuery();

	const createTaskMutation = useCreateTaskMutation();
	const updateTaskMutation = useUpdateTaskMutation();
	const deleteTaskMutation = useDeleteTaskMutation();

	// Create wrapper functions to match the props expected by FilteredTaskView
	const handleCreateTask = async (params: CreateTaskParams) => {
		return createTaskMutation.mutateAsync(params);
	};

	const handleUpdateTask = async (
		taskId: number,
		updates: UpdateTaskParams,
	) => {
		return updateTaskMutation.mutateAsync({ taskId, updates });
	};

	const handleDeleteTask = async (taskId: number) => {
		return deleteTaskMutation.mutateAsync(taskId);
	};

	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	// Bulk selection state (lifted from FilteredTaskView for DnD support)
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
		new Set(),
	);

	// AI Chat dialog state
	const [isAiChatOpen, setIsAiChatOpen] = useState(false);

	// DnD Hook
	const { activeTask, handleDragStart, handleDragEnd } = useTaskDragAndDrop({
		taskLists,
		isSelectionMode,
		setIsSelectionMode,
		selectedTaskIds,
		setSelectedTaskIds,
		setIsAiChatOpen,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reacting to route changes
	useEffect(() => {
		// Close detail panel when route changes
		setSelectedTaskId(null);
	}, [location.pathname]);

	// Responsive Layout Handling
	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 1024px)");

		const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
			if (!e.matches) {
				setIsSidebarOpen(false); // Close on mobile/tablet
				setSelectedTaskId(null); // Close detail panel on mobile/tablet
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

	const handleTaskSelect = (taskId: number | null) => {
		setSelectedTaskId(taskId);
	};

	const handleCloseDetail = () => {
		setSelectedTaskId(null);
	};

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<div className="relative flex h-full overflow-hidden bg-gray-50/50">
				{isTaskListsLoading ? (
					<LoadingSpinner size="lg" />
				) : (
					<>
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
								onUpdateTask={handleUpdateTask}
								onDeleteTask={handleDeleteTask}
								onCreateTask={handleCreateTask}
								onTaskSelect={handleTaskSelect}
								selectedTaskId={selectedTaskId}
								onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
								isSidebarOpen={isSidebarOpen}
							/>
						</div>

						{/* Task Detail Panel - Overlay (<lg), Side-by-side (>=lg) */}
						{selectedTaskId && (
							<div
								className={cn(
									// Common
									"h-full bg-white border-l border-gray-100 z-30",
									"animate-in slide-in-from-right duration-300",

									// Mobile/Tablet (<lg): Absolute Overlay
									"absolute inset-y-0 right-0 shadow-2xl",

									// Width: Full on mobile, 400px on tablet/desktop
									"w-full sm:w-[400px]",

									// Desktop (>=lg): Static (Side-by-side)
									"lg:static lg:shadow-none lg:z-auto",
								)}
							>
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

						{/* AI Chat Floating Button - always visible */}
						<button
							type="button"
							onClick={() => setIsAiChatOpen(true)}
							className={cn(
								"fixed bottom-6 right-6 z-50",
								"flex items-center justify-center",
								"w-14 h-14 rounded-full",
								"bg-gradient-to-br from-indigo-500 to-purple-600",
								"text-white shadow-lg shadow-indigo-500/30",
								"hover:shadow-xl hover:shadow-indigo-500/40",
								"hover:scale-105 active:scale-95",
								"transition-all duration-200",
								// Hide when chat panel is visible
								isAiChatOpen && "hidden",
							)}
							title="AIアシスタント"
						>
							<Sparkles className="w-6 h-6" />
						</button>

						{/* AI Chat Panel */}
						<AiChatPanel
							isOpen={isAiChatOpen}
							onClose={() => setIsAiChatOpen(false)}
							taskLists={taskLists}
							defaultTaskListId={
								taskLists.find((l) => l.title === "Inbox")?.id ?? 0
							}
						/>
					</>
				)}
			</div>
		</DndContext>
	);
}
