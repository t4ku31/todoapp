import { CheckCircle2, Eraser, ListTodo } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskSummary } from "@/features/analytics/types";
import { useTodoStore } from "@/store/useTodoStore";

interface TaskSummaryCardProps {
	data?: TaskSummary[] | null;
	isLoading?: boolean;
}

export function TaskSummaryCard({
	data,
	isLoading = false,
}: TaskSummaryCardProps) {
	const [showCompleted, setShowCompleted] = useState(true);
	const [localTasks, setLocalTasks] = useState<TaskSummary[]>(data || []);
	const { updateTask } = useTodoStore();

	useEffect(() => {
		setLocalTasks(data || []);
	}, [data]);

	const handleStatusChange = (taskId: number, checked: boolean) => {
		// Optimistic update
		setLocalTasks((prev) =>
			prev.map((t) =>
				t.taskId === taskId
					? {
							...t,
							isCompleted: checked,
							status: checked ? "COMPLETED" : "PENDING",
						}
					: t,
			),
		);

		// API Call
		updateTask(taskId, { status: checked ? "COMPLETED" : "PENDING" });
	};

	const visibleTasks = showCompleted
		? localTasks
		: localTasks.filter((t) => !t.isCompleted);

	const completedCount = localTasks.filter((t) => t.isCompleted).length;
	const totalCount = localTasks.length;
	const completionRate =
		totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	// Find max focus minutes for proportional bars
	const maxFocusMinutes = Math.max(
		...localTasks.map((t) => t.focusMinutes || 0),
		1,
	);

	return (
		<Card className="flex flex-col h-full bg-white shadow-sm border-gray-100 p-4">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
					<ListTodo size={16} className="text-purple-500" />
					Task Summary
				</h3>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-xs flex items-center gap-1">
						<CheckCircle2 size={12} />
						{completedCount}/{totalCount} ({completionRate}%)
					</Badge>
					<Button
						variant="ghost"
						size="icon"
						className={`h-6 w-6 ${!showCompleted ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
						onClick={() => setShowCompleted(!showCompleted)}
						title={
							showCompleted ? "Clear completed tasks" : "Show completed tasks"
						}
					>
						<Eraser size={14} />
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-auto space-y-2">
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
							className="flex items-center gap-3 py-2 border-b last:border-b-0"
						>
							<Checkbox
								checked={task.isCompleted}
								onCheckedChange={(checked) =>
									handleStatusChange(task.taskId, checked as boolean)
								}
								style={{
									backgroundColor: task.isCompleted
										? task.categoryColor || "#8b5cf6"
										: undefined,
									borderColor: task.isCompleted
										? task.categoryColor || "#8b5cf6"
										: undefined,
								}}
								className="data-[state=checked]:text-white"
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`text-sm truncate ${
											task.isCompleted
												? "text-gray-400 line-through"
												: "text-gray-700"
										}`}
									>
										{task.taskTitle}
									</span>
									<span className="text-xs text-gray-500 whitespace-nowrap">
										{task.focusMinutes}m
									</span>
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
