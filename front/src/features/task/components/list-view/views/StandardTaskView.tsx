/**
 * Memoized item component for Virtuoso to prevent unnecessary re-renders.
 * StandardTaskView passes inline functions for onUpdateTask, which are not stable if not wrapped in useCallback in parent.
 * But here we assume onUpdateTask from StandardTaskView props is stable (if parent fixes it).
 *
 * However, Virtuoso rerenders items when context changes.
 */

import * as React from "react";
import { Virtuoso } from "react-virtuoso";
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
	// Header component for Virtuoso: Renders AI previews and padding
	const Header = React.useCallback(() => {
		return (
			<div className="pt-8 pb-5">
				{/* AI Preview: New Tasks */}
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
		);
	}, [aiNewTaskPreviews, updateAiPreviewTask, toggleAiPreviewSelection]);

	// Footer component for Virtuoso: Renders completed tasks and empty state
	const Footer = React.useCallback(() => {
		return (
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
		);
	}, [
		showCompletedSection,
		completedTasks,
		filteredTasks.length,
		aiNewTaskPreviews.length,
		onUpdateTask,
		onDeleteTask,
		onTaskSelect,
		selectedTaskId,
	]);

	// Item renderer for Virtuoso
	const itemContent = React.useCallback(
		(_index: number, task: Task) => {
			const aiEditPreview = aiEditPreviewMap.get(task.id);
			if (aiEditPreview) {
				// 削除タスクの場合はPreview表示（Diff表示しない）
				if (aiEditPreview.isDeleted) {
					return (
						<div className="mb-5 pr-4">
							<AiPreviewTaskItem
								key={`preview-del-${task.id}`}
								task={aiEditPreview}
								index={0}
								onUpdateTask={updateAiPreviewTask}
								onToggleSelection={toggleAiPreviewSelection}
							/>
						</div>
					);
				}

				return (
					<div className="mb-5 pr-4">
						<AiDiffTaskItem
							key={`diff-${task.id}`}
							originalTask={task}
							previewTask={aiEditPreview}
							onUpdateTask={updateAiPreviewTask}
							onToggleSelection={toggleAiPreviewSelection}
						/>
					</div>
				);
			}
			return (
				<div className="mb-5 pr-4">
					<TaskItem
						key={task.id}
						task={task}
						onUpdateTask={onUpdateTask}
						onDeleteTask={onDeleteTask}
						onSelect={(id) => onTaskSelect?.(id)}
						isSelected={selectedTaskId === task.id}
					/>
				</div>
			);
		},
		[
			aiEditPreviewMap,
			updateAiPreviewTask,
			toggleAiPreviewSelection,
			onUpdateTask,
			onDeleteTask,
			onTaskSelect,
			selectedTaskId,
		],
	);

	// Virtuoso directly handles scrolling, so we give it height 100% to fill the parent container
	return (
		<Virtuoso
			style={{ height: "100%" }}
			data={filteredTasks}
			itemContent={itemContent}
			components={{
				Header,
				Footer,
			}}
		/>
	);
}
