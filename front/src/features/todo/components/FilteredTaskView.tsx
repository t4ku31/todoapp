import { AiSaveButton } from "@/features/ai/components/preview/AiSaveButton";
import { useAiPreviewStore } from "@/features/ai/stores/useAiPreviewStore";
import type { ParsedTask } from "@/features/ai/types";
import { useTaskFilter } from "@/features/todo/hooks/useTaskFilter";
import { useTaskViewParams } from "@/features/todo/hooks/useTaskViewParams";
import type { Task } from "@/features/todo/types";
import { type CreateTaskParams, useTodoStore } from "@/store/useTodoStore";
import { useMemo } from "react";
import { CreateTaskForm } from "./forms/CreateTaskForm";
import { FilterHeader } from "./parts/FilterHeader";
import { CompletedTaskView } from "./views/CompletedTaskView";
import { StandardTaskView } from "./views/StandardTaskView";
import { TrashTaskView } from "./views/TrashTaskView";
import { WeekTaskView } from "./views/WeekTaskView";

interface FilteredTaskViewProps {
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (params: CreateTaskParams) => Promise<Task>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
	onToggleSidebar?: () => void;
	isSidebarOpen?: boolean;
}

export function FilteredTaskView({
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
	onTaskSelect,
	selectedTaskId,
	onToggleSidebar,
	isSidebarOpen = true,
}: FilteredTaskViewProps) {
	// 1. Hooks
	const { viewType, pathId, searchQuery, defaultTaskListId } =
		useTaskViewParams();
	const { filteredTasks, completedTasks } = useTaskFilter(
		viewType,
		pathId,
		searchQuery,
	);
	const { restoreTask, deleteTaskPermanently } = useTodoStore();

	const handleBackgroundClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onTaskSelect?.(null);
		}
	};
	const { aiPreviewTasks, updateAiPreviewTask, toggleAiPreviewSelection } =
		useAiPreviewStore();

	const { aiNewTaskPreviews, aiEditPreviewMap } = useMemo(() => {
		const aiNewTaskPreviews: ParsedTask[] = [];
		const aiEditPreviewMap = new Map<number, ParsedTask>();

		if (!aiPreviewTasks || aiPreviewTasks.length === 0) {
			return { aiNewTaskPreviews, aiEditPreviewMap };
		}

		aiPreviewTasks.forEach((t) => {
			if (t.originalId) {
				const originalTask = filteredTasks.find((bt) => bt.id === t.originalId);
				if (originalTask) {
					aiEditPreviewMap.set(t.originalId, { ...t, originalTask });
				}
			} else {
				aiNewTaskPreviews.push(t);
			}
		});

		return { aiNewTaskPreviews, aiEditPreviewMap };
	}, [aiPreviewTasks, filteredTasks]);

	// View specific logic
	const showCompletedSection = viewType !== "completed" && viewType !== "trash";
	const showCreateTaskForm = viewType !== "trash" && viewType !== "completed";
	const defaultCategoryId =
		viewType === "category" ? (pathId ?? undefined) : undefined;
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: Background click handling for deselection
		// biome-ignore lint/a11y/noStaticElementInteractions: Background click handling for deselection
		<div
			className="flex flex-col gap-6 h-full p-6"
			onClick={handleBackgroundClick}
		>
			<FilterHeader
				taskCount={filteredTasks.length}
				isSidebarOpen={isSidebarOpen}
				onToggleSidebar={onToggleSidebar}
			/>

			{showCreateTaskForm && (
				<div className="shrink-0 space-y-3">
					<CreateTaskForm
						taskListId={defaultTaskListId}
						defaultCategoryId={defaultCategoryId}
						onCreateTask={onCreateTask}
						showListSelector={viewType === "today" || viewType === "week"}
					/>
				</div>
			)}

			{/* Task List */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Background click handling for deselection */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Background click handling for deselection */}
			<div
				className="flex-1 overflow-y-auto min-h-0 px-5 py-8"
				onClick={handleBackgroundClick}
			>
				{viewType === "completed" ? (
					<CompletedTaskView
						tasks={filteredTasks}
						onUpdateTask={onUpdateTask}
						onDeleteTask={onDeleteTask}
						onTaskSelect={onTaskSelect}
						selectedTaskId={selectedTaskId}
					/>
				) : viewType === "week" ? (
					<WeekTaskView
						filteredTasks={filteredTasks}
						onUpdateTask={onUpdateTask}
						onDeleteTask={onDeleteTask}
						onTaskSelect={onTaskSelect}
						selectedTaskId={selectedTaskId}
						completedTasks={completedTasks}
					/>
				) : viewType === "trash" ? (
					<TrashTaskView
						tasks={filteredTasks}
						onDeletePermanently={deleteTaskPermanently}
						onRestore={restoreTask}
						onTaskSelect={onTaskSelect}
						selectedTaskId={selectedTaskId}
					/>
				) : (
					<StandardTaskView
						aiNewTaskPreviews={aiNewTaskPreviews}
						filteredTasks={filteredTasks}
						aiEditPreviewMap={aiEditPreviewMap}
						updateAiPreviewTask={updateAiPreviewTask}
						toggleAiPreviewSelection={toggleAiPreviewSelection}
						onUpdateTask={onUpdateTask}
						onDeleteTask={onDeleteTask}
						onTaskSelect={onTaskSelect}
						selectedTaskId={selectedTaskId}
						showCompletedSection={showCompletedSection}
						completedTasks={completedTasks}
					/>
				)}
			</div>
			<AiSaveButton />
		</div>
	);
}
