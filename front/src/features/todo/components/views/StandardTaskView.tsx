import { AiPreviewTaskItem } from "@/features/ai/components/preview/AiPreviewTaskItem";
import type { ParsedTask } from "@/features/ai/types";
import type { Task } from "@/features/todo/types";
import { TaskItem } from "../TaskItem";

interface StandardTaskViewProps {
	aiNewTaskPreviews: ParsedTask[];
	filteredTasks: Task[];
	aiEditPreviewMap: Map<number, ParsedTask>;
	updateAiPreviewTask: (taskId: string, updates: Partial<ParsedTask>) => void;
	toggleAiPreviewSelection: (id: string) => void;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
	showCompletedSection: boolean;
	completedTasks: Task[];
}

export function StandardTaskView({
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
		<div className="space-y-8 pb-10">
			{/* AI Preview: New Tasks */}
			{aiNewTaskPreviews.length > 0 && (
				<div className="space-y-2">
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

			{/* Existing Tasks (with AI edit overlay) */}
			<div className="space-y-2">
				{filteredTasks.map((task) => {
					const aiEditPreview = aiEditPreviewMap.get(task.id);
					if (aiEditPreview) {
						return (
							<AiPreviewTaskItem
								key={`preview-${task.id}`}
								task={aiEditPreview}
								index={0}
								onUpdateTask={updateAiPreviewTask}
								onToggleSelection={toggleAiPreviewSelection}
							/>
						);
					}
					return (
						<TaskItem
							key={task.id}
							task={task}
							onUpdateTask={onUpdateTask}
							onDeleteTask={onDeleteTask}
							onSelect={(id) => onTaskSelect?.(id)}
							isSelected={selectedTaskId === task.id}
						/>
					);
				})}
			</div>

			{showCompletedSection && completedTasks.length > 0 && (
				<div className="pt-8 border-t border-gray-100">
					<h3 className="font-medium text-gray-400 mb-4">完了したタスク</h3>
					<div className="space-y-2 opacity-60">
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
	);
}
