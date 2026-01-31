import type { Task } from "@/features/todo/types";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { TaskItem } from "../TaskItem";

interface WeekTaskViewProps {
	filteredTasks: Task[];
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
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
	const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

	const getTasksForDay = (date: Date) => {
		return filteredTasks.filter((task) => {
			if (!task.executionDate) return false;
			// executionDate is likely YYYY-MM-DD or ISO.
			// TaskItem EditableDate uses string.
			// Assuming ISO or YYYY-MM-DD.
			// parseISO handles YYYY-MM-DD well.
			return isSameDay(parseISO(task.executionDate), date);
		});
	};

	return (
		<div className="space-y-8 pb-10">
			{days.map((date) => {
				const dayTasks = getTasksForDay(date);
				if (dayTasks.length === 0) return null;

				const dateTitle = format(date, "M月d日 (E)", { locale: ja });
				const isToday = isSameDay(date, today);

				return (
					<div key={date.toISOString()} className="space-y-3">
						<h3
							className={`font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}
						>
							{dateTitle}
						</h3>
						<div className="space-y-2">
							{dayTasks.map((task) => (
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
				);
			})}

			{completedTasks.length > 0 && (
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

			{filteredTasks.length === 0 && completedTasks.length === 0 && (
				<div className="flex flex-col items-center justify-center h-64 text-gray-400">
					<p>今週のタスクはありません</p>
				</div>
			)}
		</div>
	);
}
