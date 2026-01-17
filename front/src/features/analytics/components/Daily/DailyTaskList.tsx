import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAnalyticsStore } from "@/features/analytics/stores/useAnalyticsStore";
import type { DailyTaskSummary } from "@/features/analytics/types";
import { useTodoStore } from "@/store/useTodoStore";
import { CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useState } from "react";

interface DailyTaskListProps {
	data?: DailyTaskSummary[] | null;
	isLoading?: boolean;
}

export function DailyTaskList({ data, isLoading = false }: DailyTaskListProps) {
	const [showCompleted, setShowCompleted] = useState(true);
	const [localTasks, setLocalTasks] = useState<DailyTaskSummary[]>(data || []);
	const { updateTask } = useTodoStore();
	const { updateDailyTaskStatus } = useAnalyticsStore();

	// Sync local state with props
	if (
		data &&
		data !== localTasks &&
		JSON.stringify(data) !== JSON.stringify(localTasks)
	) {
		setLocalTasks(data);
	}

	const visibleTasks = showCompleted
		? localTasks
		: localTasks.filter((t) => !t.completed);

	const handleStatusChange = async (taskId: number, completed: boolean) => {
		// Optimistic update - local component state
		setLocalTasks((prev) =>
			prev.map((t) =>
				t.taskId === taskId
					? { ...t, completed, status: completed ? "COMPLETED" : "PENDING" }
					: t,
			),
		);

		// Also update the analytics store (for KPI cards)
		updateDailyTaskStatus(taskId, completed);

		// API call
		try {
			await updateTask(taskId, {
				status: completed ? "COMPLETED" : "PENDING",
			});
		} catch {
			// Revert on error
			setLocalTasks((prev) =>
				prev.map((t) =>
					t.taskId === taskId
						? {
								...t,
								completed: !completed,
								status: !completed ? "COMPLETED" : "PENDING",
							}
						: t,
				),
			);
			// Rollback analytics store
			updateDailyTaskStatus(taskId, !completed);
		}
	};

	const maxFocusMinutes = Math.max(1, ...localTasks.map((t) => t.focusMinutes));

	return (
		<Card className="p-4 h-full flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between mb-3 shrink-0">
				<div className="flex items-center gap-2">
					<ListTodo className="h-4 w-4 text-purple-500" />
					<span className="font-medium text-sm">タスク</span>
				</div>
				<button
					type="button"
					className="text-xs text-gray-500 hover:text-gray-700"
					onClick={() => setShowCompleted(!showCompleted)}
				>
					{showCompleted ? "完了を隠す" : "全て表示"}
				</button>
			</div>

			{/* Task List */}
			<div className="flex-1 overflow-y-auto space-y-1">
				{isLoading ? (
					<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
						Loading...
					</div>
				) : visibleTasks.length === 0 ? (
					<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
						{localTasks.length > 0 && !showCompleted
							? "All tasks completed!"
							: "No tasks scheduled"}
					</div>
				) : (
					visibleTasks.map((task) => (
						<div
							key={task.taskId}
							className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
						>
							{/* Checkbox */}
							<Checkbox
								checked={task.completed}
								onCheckedChange={(checked) =>
									handleStatusChange(task.taskId, checked as boolean)
								}
								style={{
									backgroundColor: task.completed
										? task.categoryColor || "#8b5cf6"
										: undefined,
									borderColor: task.completed
										? task.categoryColor || "#8b5cf6"
										: undefined,
								}}
								className="data-[state=checked]:text-white"
							/>

							{/* Task Info */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`text-sm truncate ${
											task.completed
												? "text-gray-400 line-through"
												: "text-gray-700"
										}`}
									>
										{task.taskTitle}
									</span>
									<div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
										{task.completed ? (
											<CheckCircle2 size={12} className="text-green-500" />
										) : (
											<Clock size={12} />
										)}
										<span>{task.focusMinutes}m</span>
									</div>
								</div>
								{/* Progress bar */}
								<div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all duration-300"
										style={{
											width: `${(task.focusMinutes / maxFocusMinutes) * 100}%`,
											backgroundColor: task.categoryColor || "#8b5cf6",
										}}
									/>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</Card>
	);
}
