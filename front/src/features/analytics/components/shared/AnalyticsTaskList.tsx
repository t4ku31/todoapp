import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { GroupedTaskSummary } from "@/features/analytics/types";
import { useTodoStore } from "@/store/useTodoStore";
import { format } from "date-fns";
import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Eraser,
	ListTodo,
	Repeat,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsTaskListProps {
	data?: GroupedTaskSummary[] | null;
	isLoading?: boolean;
	onStatusChange: (taskId: number, completed: boolean) => void;
	title?: string;
}

export function AnalyticsTaskList({
	data,
	isLoading = false,
	onStatusChange,
	title = "Task Summary",
}: AnalyticsTaskListProps) {
	const [showCompleted, setShowCompleted] = useState(true);
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
	const [localGroups, setLocalGroups] = useState<GroupedTaskSummary[]>(
		data || [],
	);
	const { updateTask } = useTodoStore();

	useEffect(() => {
		setLocalGroups(data || []);
	}, [data]);

	const toggleExpand = (parentTaskId: number) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(parentTaskId)) {
				next.delete(parentTaskId);
			} else {
				next.add(parentTaskId);
			}
			return next;
		});
	};

	const handleStatusChange = async (taskId: number, checked: boolean) => {
		// Store previous state for rollback
		const prevGroups = localGroups;

		// Optimistic update - local component state
		setLocalGroups((prev) =>
			prev.map((group) => {
				const updatedChildren = group.children.map((child) =>
					child.taskId === taskId
						? {
								...child,
								completed: checked,
								status: checked ? "COMPLETED" : "PENDING",
							}
						: child,
				);
				const completedCount = updatedChildren.filter(
					(c) => c.completed,
				).length;
				return {
					...group,
					children: updatedChildren,
					completedCount,
					// Update progress percentage if needed, though mostly visual
				};
			}),
		);

		// Notify parent store
		onStatusChange(taskId, checked);

		// API Call with error handling
		try {
			await updateTask(taskId, { status: checked ? "COMPLETED" : "PENDING" });
		} catch (error) {
			console.error("Failed to update task status:", error);
			// Rollback on error
			setLocalGroups(prevGroups);
			// Rollback parent store
			onStatusChange(taskId, !checked);
		}
	};

	// Filter groups based on showCompleted
	const visibleGroups = showCompleted
		? localGroups
		: localGroups.filter(
				(g) => g.completedCount < g.totalCount || g.totalCount === 0,
			);

	const totalCompletedCount = localGroups.reduce(
		(acc, g) => acc + g.completedCount,
		0,
	);
	const totalCount = localGroups.reduce((acc, g) => acc + g.totalCount, 0);
	const completionRate =
		totalCount > 0 ? Math.round((totalCompletedCount / totalCount) * 100) : 0;

	// Find max focus minutes for proportional bars
	const maxFocusMinutes = Math.max(
		...localGroups.map((g) => g.totalFocusMinutes || 0),
		1,
	);

	return (
		<Card className="flex flex-col h-full bg-white shadow-sm border-gray-100 p-4">
			<div className="flex justify-between items-center mb-4 shrink-0">
				<h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
					<ListTodo size={16} className="text-purple-500" />
					{title}
				</h3>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className="text-xs flex items-center gap-1">
						<CheckCircle2 size={12} />
						{totalCompletedCount}/{totalCount} ({completionRate}%)
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

			<div className="flex-1 overflow-auto space-y-1">
				{isLoading ? (
					<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
						Loading...
					</div>
				) : visibleGroups.length === 0 ? (
					<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
						{localGroups.length > 0 && !showCompleted
							? "All tasks completed!"
							: "No tasks scheduled"}
					</div>
				) : (
					visibleGroups.map((group) => {
						const isExpanded = expandedIds.has(group.parentTaskId);
						const isFullyCompleted =
							group.completedCount === group.totalCount && group.totalCount > 0;
						// Show grouping UI for recurring tasks
						const showGroupingUI = group.recurring;

						return (
							<div key={group.parentTaskId} className="mb-1">
								{/* Group Header Row */}
								<div
									className={`flex items-center gap-2 py-2 px-2 rounded-lg transition-colors ${
										showGroupingUI ? "cursor-pointer hover:bg-gray-50" : ""
									}`}
									{...(showGroupingUI
										? {
												role: "button",
												tabIndex: 0,
												onClick: () => toggleExpand(group.parentTaskId),
												onKeyDown: (e: React.KeyboardEvent) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														toggleExpand(group.parentTaskId);
													}
												},
											}
										: {})}
								>
									{/* Expand/Collapse Icon or Checkbox */}
									{showGroupingUI ? (
										<button
											type="button"
											className="text-gray-400 hover:text-gray-600"
											onClick={(e) => {
												e.stopPropagation();
												toggleExpand(group.parentTaskId);
											}}
										>
											{isExpanded ? (
												<ChevronDown size={16} />
											) : (
												<ChevronRight size={16} />
											)}
										</button>
									) : (
										// Non-recurring: Show checkbox directly
										<Checkbox
											checked={isFullyCompleted}
											onCheckedChange={(checked) => {
												if (group.children.length === 1) {
													handleStatusChange(
														group.children[0].taskId,
														checked as boolean,
													);
												}
											}}
											style={{
												backgroundColor: isFullyCompleted
													? group.categoryColor || "#8b5cf6"
													: undefined,
												borderColor: isFullyCompleted
													? group.categoryColor || "#8b5cf6"
													: undefined,
											}}
											className="data-[state=checked]:text-white"
										/>
									)}

									{/* Task Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 min-w-0">
												{showGroupingUI && (
													<Repeat
														size={12}
														className="text-blue-500 shrink-0"
													/>
												)}
												<span
													className={`text-sm truncate ${
														isFullyCompleted
															? "text-gray-400 line-through"
															: "text-gray-700"
													}`}
												>
													{group.title}
												</span>
												{showGroupingUI && (
													<Badge
														variant="secondary"
														className="text-[10px] px-1.5 py-0 shrink-0"
													>
														{group.completedCount}/{group.totalCount}
													</Badge>
												)}
											</div>
											<span className="text-xs text-gray-500 whitespace-nowrap">
												{group.totalFocusMinutes}m
											</span>
										</div>
										{/* Progress bar */}
										<div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
											<div
												className="h-full rounded-full transition-all duration-300"
												style={{
													width: `${(group.totalFocusMinutes / maxFocusMinutes) * 100}%`,
													backgroundColor: group.categoryColor || "#8b5cf6",
												}}
											/>
										</div>
									</div>
								</div>

								{/* Expanded Children */}
								{showGroupingUI && isExpanded && (
									<div className="ml-6 pl-2 border-l-2 border-gray-200 space-y-1 mt-1">
										{group.children.map((child) => (
											<div
												key={child.taskId}
												className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50"
											>
												<Checkbox
													checked={child.completed}
													onCheckedChange={(checked) =>
														handleStatusChange(child.taskId, checked as boolean)
													}
													style={{
														backgroundColor: child.completed
															? group.categoryColor || "#8b5cf6"
															: undefined,
														borderColor: child.completed
															? group.categoryColor || "#8b5cf6"
															: undefined,
													}}
													className="data-[state=checked]:text-white h-4 w-4"
												/>
												<div className="flex-1 flex items-center justify-between min-w-0">
													<span
														className={`text-xs ${
															child.completed
																? "text-gray-400 line-through"
																: "text-gray-600"
														}`}
													>
														{child.startDate
															? format(new Date(child.startDate), "M/d (EEE)")
															: "—"}
													</span>
													<div className="flex items-center gap-2">
														{child.completed ? (
															<CheckCircle2
																size={12}
																className="text-green-500"
															/>
														) : (
															<span className="w-3" />
														)}
														<span className="text-xs text-gray-400">
															{child.focusMinutes}m
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
		</Card>
	);
}
