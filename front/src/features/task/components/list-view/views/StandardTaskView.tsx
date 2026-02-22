import * as React from "react";
import { AiDiffTaskItem } from "@/features/ai/components/preview/AiDiffTaskItem";
import { AiPreviewTaskItem } from "@/features/ai/components/preview/AiPreviewTaskItem";
import type { ParsedTask } from "@/features/ai/types";
import type { UpdateTaskParams } from "@/features/task/api/taskApi";
import type { Task } from "@/features/task/types";
import { TaskItem } from "../../TaskItem";

interface StandardTaskViewProps {
	aiNewTaskPreviews: ParsedTask[];
	filteredTasks: Task[];
	aiEditPreviewMap: Map<number, ParsedTask>;
	updateAiPreviewTask: (taskId: number, updates: Partial<ParsedTask>) => void;
	toggleAiPreviewSelection: (id: number) => void;
	onUpdateTask: (taskId: number, updates: UpdateTaskParams) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
	showCompletedSection: boolean;
	completedTasks: Task[];
}

export const StandardTaskView = React.memo(function StandardTaskView({
	aiNewTaskPreviews,
	filteredTasks,
	aiEditPreviewMap,
	updateAiPreviewTask,
	toggleAiPreviewSelection,
	onUpdateTask,
	onDeleteTask,
	onTaskSelect,
	selectedTaskId,
	showCompletedSection,
	completedTasks,
}: StandardTaskViewProps) {
	return (
		<div className="h-full overflow-y-auto">
			{/* Header: AI Preview Tasks */}
			<div className="pt-8 pb-5">
				{aiNewTaskPreviews.length > 0 && (
					<div className="space-y-5 mb-8 pr-8">
						{aiNewTaskPreviews.map((preview, index) => (
							<AiPreviewTaskItem
								key={preview.id}
								task={preview}
								index={index}
								onUpdateTask={updateAiPreviewTask}
								onToggleSelection={toggleAiPreviewSelection}
							/>
						))}
					</div>
				)}
			</div>

			{/* Task Items */}
			{filteredTasks.map((task) => {
				const aiEditPreview = aiEditPreviewMap.get(task.id);
				if (aiEditPreview) {
					if (aiEditPreview.isDeleted) {
						return (
							<div key={task.id} className="mb-5 pr-4">
								<AiPreviewTaskItem
									task={aiEditPreview}
									index={0}
									onUpdateTask={updateAiPreviewTask}
									onToggleSelection={toggleAiPreviewSelection}
								/>
							</div>
						);
					}
					return (
						<div key={task.id} className="mb-5 pr-4">
							<AiDiffTaskItem
								originalTask={task}
								previewTask={aiEditPreview}
								onUpdateTask={updateAiPreviewTask}
								onToggleSelection={toggleAiPreviewSelection}
							/>
						</div>
					);
				}
				return (
					<div key={task.id} className="mb-5 pr-4">
						<TaskItem
							task={task}
							onUpdateTask={onUpdateTask}
							onDeleteTask={onDeleteTask}
							onSelect={(id) => onTaskSelect?.(id)}
							isSelected={selectedTaskId === task.id}
						/>
					</div>
				);
			})}

			{/* Footer: Completed Tasks & Empty State */}
			<div className="pb-10">
				{showCompletedSection && completedTasks.length > 0 && (
					<div className="pt-8 border-t border-gray-100 mt-5">
						<h3 className="font-medium text-gray-400 mb-4">完了したタスク</h3>
						<div className="space-y-2 opacity-60 pr-4">
							{completedTasks.map((task) => (
								<TaskItem
									key={task.id}
									task={task}
									onUpdateTask={onUpdateTask}
									onDeleteTask={onDeleteTask}
									onSelect={(id) => onTaskSelect?.(id)}
									isSelected={selectedTaskId === task.id}
								/>
							))}
						</div>
					</div>
				)}

				{filteredTasks.length === 0 &&
					aiNewTaskPreviews.length === 0 &&
					(!showCompletedSection || completedTasks.length === 0) && (
						<div className="flex flex-col items-center justify-center h-64 text-gray-400">
							<p>タスクはありません</p>
						</div>
					)}
			</div>
		</div>
	);
});
