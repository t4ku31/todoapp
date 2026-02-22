import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import * as React from "react";
import { GroupedVirtuoso } from "react-virtuoso";
import type { UpdateTaskParams } from "@/features/task/api/taskApi";
import type { Task } from "@/features/task/types";
import { TaskItem } from "../../TaskItem";

interface WeekTaskViewProps {
	filteredTasks: Task[];
	onUpdateTask: (taskId: number, updates: UpdateTaskParams) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
	completedTasks: Task[];
}

export function WeekTaskView({
	filteredTasks,
	onUpdateTask,
	onDeleteTask,
	onTaskSelect,
	selectedTaskId,
	completedTasks,
}: WeekTaskViewProps) {
	const today = startOfDay(new Date());
	const days = React.useMemo(
		() => Array.from({ length: 7 }, (_, i) => addDays(today, i)),
		[today],
	);

	// Group tasks by day
	// flattenedTasks: Array of tasks sorted by group (day)
	// groupCounts: Array of numbers, where each number is the count of tasks in that group (day)
	const { flattenedTasks, groupCounts, activeDays } = React.useMemo(() => {
		// Initialize buckets for 7 days
		const tasksByDayIndex: Task[][] = Array.from({ length: 7 }, () => []);

		// Single pass distribution
		for (const task of filteredTasks) {
			if (!task.scheduledStartAt) continue;
			// Simple date comparison without heavy library calls if possible,
			// but for correctness with timezones, let's stick to isSameDay or find index
			const taskDate = new Date(task.scheduledStartAt);
			const dayIndex = days.findIndex((d) => isSameDay(taskDate, d));
			if (dayIndex >= 0) {
				tasksByDayIndex[dayIndex].push(task);
			}
		}

		const flattened: Task[] = [];
		const counts: number[] = [];
		const activeConfigs: { date: Date; title: string; isToday: boolean }[] = [];

		days.forEach((date, i) => {
			const dayTasks = tasksByDayIndex[i];
			if (dayTasks.length > 0) {
				flattened.push(...dayTasks);
				counts.push(dayTasks.length);
				activeConfigs.push({
					date,
					title: format(date, "M月d日 (E)", { locale: ja }),
					isToday: isSameDay(date, today),
				});
			}
		});

		return {
			flattenedTasks: flattened,
			groupCounts: counts,
			activeDays: activeConfigs,
		};
	}, [filteredTasks, days, today]);

	// Header component for GroupedVirtuoso (Completed tasks are rendered here as they are separate from the virtualized list)
	// Note: Ideally, completed tasks should also be virtualized if there are many, but usually they are few in weekly view.
	// If performance is an issue with completed tasks, they should be included in the flattened list or handled separately.
	// For now, mirroring the previous structure: Completed tasks at the bottom became tricky with GroupedVirtuoso as it only expects one list.
	// Virtuoso `Footer` prop can be used for completed tasks.
	const Footer = React.useCallback(() => {
		return (
			<div className="pb-10 pt-8 border-t border-gray-100 mt-8">
				{completedTasks.length > 0 && (
					<>
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
					</>
				)}

				{flattenedTasks.length === 0 && completedTasks.length === 0 && (
					<div className="flex flex-col items-center justify-center h-64 text-gray-400">
						<p>今週のタスクはありません</p>
					</div>
				)}
			</div>
		);
	}, [
		completedTasks,
		flattenedTasks.length,
		onUpdateTask,
		onDeleteTask,
		onTaskSelect,
		selectedTaskId,
	]);

	const groupContent = React.useCallback(
		(index: number) => {
			const config = activeDays[index];
			return (
				<div className="pt-8 pb-3 bg-gray-50 sticky top-0 z-10">
					<h3
						className={`font-medium ${config.isToday ? "text-blue-600" : "text-gray-500"}`}
					>
						{config.title}
					</h3>
				</div>
			);
		},
		[activeDays],
	);

	// GroupedVirtuoso itemContent signature: (index: number) => ReactNode
	const itemContent = React.useCallback(
		(index: number) => {
			const task = flattenedTasks[index];
			return (
				<div className="pb-2 pr-4">
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
		[flattenedTasks, onUpdateTask, onDeleteTask, onTaskSelect, selectedTaskId],
	);

	return (
		<GroupedVirtuoso
			style={{ height: "100%" }}
			groupCounts={groupCounts}
			itemContent={itemContent}
			groupContent={groupContent}
			components={{
				Footer,
			}}
		/>
	);
}
