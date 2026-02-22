import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import * as React from "react";
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

export const WeekTaskView = React.memo(function WeekTaskView({
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
	const tasksByDay = React.useMemo(() => {
		const result: {
			date: Date;
			title: string;
			isToday: boolean;
			tasks: Task[];
		}[] = [];

		for (const date of days) {
			const dayTasks = filteredTasks.filter(
				(task) =>
					task.scheduledStartAt &&
					isSameDay(new Date(task.scheduledStartAt), date),
			);
			if (dayTasks.length > 0) {
				result.push({
					date,
					title: format(date, "M月d日 (E)", { locale: ja }),
					isToday: isSameDay(date, today),
					tasks: dayTasks,
				});
			}
		}

		return result;
	}, [filteredTasks, days, today]);

	return (
		<div className="h-full overflow-y-auto">
			{/* Grouped Tasks */}
			{tasksByDay.map((group) => (
				<div key={group.title}>
					<div className="pt-8 pb-3 bg-gray-50 sticky top-0 z-10">
						<h3
							className={`font-medium ${group.isToday ? "text-blue-600" : "text-gray-500"}`}
						>
							{group.title}
						</h3>
					</div>
					{group.tasks.map((task) => (
						<div key={task.id} className="pb-2 pr-4">
							<TaskItem
								task={task}
								onUpdateTask={onUpdateTask}
								onDeleteTask={onDeleteTask}
								onSelect={(id) => onTaskSelect?.(id)}
								isSelected={selectedTaskId === task.id}
							/>
						</div>
					))}
				</div>
			))}

			{/* Footer: Completed Tasks & Empty State */}
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

				{tasksByDay.length === 0 && completedTasks.length === 0 && (
					<div className="flex flex-col items-center justify-center h-64 text-gray-400">
						<p>今週のタスクはありません</p>
					</div>
				)}
			</div>
		</div>
	);
});
