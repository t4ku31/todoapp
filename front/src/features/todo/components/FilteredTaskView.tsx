import { format } from "date-fns";
import {
	CheckCircle2,
	ListChecks,
	PanelLeftClose,
	PanelLeftOpen,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTodoStore } from "@/store/useTodoStore";
import type { Task } from "@/types/types";
import { CreateTaskForm } from "./forms/CreateTaskForm";
import { TaskItem } from "./TaskItem";
import { CompletedSection } from "./ui/CompletedSection";

interface FilteredTaskViewProps {
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		categoryId?: number,
		estimatedPomodoros?: number,
		subtasks?: { title: string; description?: string }[],
	) => Promise<void>;
	onTaskSelect?: (taskId: number | null) => void;
	selectedTaskId?: number | null;
	// Bulk selection props (controlled from parent for DnD support)
	isSelectionMode?: boolean;
	setIsSelectionMode?: (value: boolean) => void;
	selectedTaskIds?: Set<number>;
	setSelectedTaskIds?: (
		value: Set<number> | ((prev: Set<number>) => Set<number>),
	) => void;
	onToggleSidebar?: () => void;
	isSidebarOpen?: boolean;
}

type ViewType =
	| "today"
	| "week"
	| "inbox"
	| "list"
	| "category"
	| "completed"
	| "trash"
	| "search"
	| "all";

export function FilteredTaskView({
	onUpdateTask,
	onDeleteTask,
	onCreateTask,
	onTaskSelect,
	selectedTaskId,
	isSelectionMode: controlledIsSelectionMode,
	setIsSelectionMode: controlledSetIsSelectionMode,
	selectedTaskIds: controlledSelectedTaskIds,
	setSelectedTaskIds: controlledSetSelectedTaskIds,
	onToggleSidebar,
	isSidebarOpen = true,
}: FilteredTaskViewProps) {
	const location = useLocation();
	const {
		taskLists,
		trashTasks,
		fetchTrashTasks,
		restoreTask,
		deleteTaskPermanently,
		bulkUpdateTasks,
		bulkDeleteTasks,
	} = useTodoStore();
	const categories = useCategoryStore((state) => state.categories);
	const [searchParams] = useSearchParams();

	// Internal bulk selection state (used as fallback when not controlled)
	const [internalIsSelectionMode, internalSetIsSelectionMode] = useState(false);
	const [internalSelectedTaskIds, internalSetSelectedTaskIds] = useState<
		Set<number>
	>(new Set());

	// Use controlled state if provided, otherwise use internal state
	const isSelectionMode = controlledIsSelectionMode ?? internalIsSelectionMode;
	const setIsSelectionMode =
		controlledSetIsSelectionMode ?? internalSetIsSelectionMode;
	const selectedTaskIds = controlledSelectedTaskIds ?? internalSelectedTaskIds;
	const setSelectedTaskIds =
		controlledSetSelectedTaskIds ?? internalSetSelectedTaskIds;

	const searchQuery = searchParams.get("q") || "";

	// Helper to extract ID from path (e.g., /tasks/list/123 -> 123)
	const getIdFromPath = (): number | null => {
		const path = location.pathname;
		const listMatch = path.match(/\/tasks\/list\/(\d+)/);
		if (listMatch) return Number(listMatch[1]);
		const categoryMatch = path.match(/\/tasks\/category\/(\d+)/);
		if (categoryMatch) return Number(categoryMatch[1]);
		return null;
	};

	const pathId = getIdFromPath();

	// Determine view type from URL
	const getViewType = (): ViewType => {
		const path = location.pathname;
		if (path.includes("/tasks/today")) return "today";
		if (path.includes("/tasks/week")) return "week";
		if (path.includes("/tasks/inbox")) return "inbox";
		if (path.match(/\/tasks\/list\/\d+/)) return "list";
		if (path.match(/\/tasks\/category\/\d+/)) return "category";
		if (path.includes("/tasks/completed")) return "completed";
		if (path.includes("/tasks/trash")) return "trash";
		if (path.includes("/tasks/search")) return "search";
		return "all";
	};

	const viewType = getViewType();

	useEffect(() => {
		if (viewType === "trash") {
			fetchTrashTasks();
		}
	}, [viewType, fetchTrashTasks]);

	// Get title based on view
	const getTitle = (): string => {
		switch (viewType) {
			case "today":
				return "今日";
			case "week":
				return "次の7日間";
			case "inbox":
				return "受信トレイ";
			case "list": {
				const list = taskLists.find((l) => l.id === pathId);
				return list?.title || "リスト";
			}
			case "category": {
				const category = categories.find((c) => c.id === pathId);
				return category?.name || "カテゴリ";
			}
			case "completed":
				return "完了";
			case "trash":
				return "ゴミ箱";
			case "search":
				return `検索: ${searchQuery}`;
			default:
				return "すべてのタスク";
		}
	};

	// Filter tasks based on view type
	const getFilteredTasks = (): Task[] => {
		const allTasks = taskLists.flatMap((list) => list.tasks || []);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		// Use date-fns format to get local date string (yyyy-MM-dd)
		const todayStr = format(today, "yyyy-MM-dd");

		const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

		// Helper to filter out recurring child tasks
		const excludeRecurringChildren = (tasks: Task[]) =>
			tasks.filter((t) => !t.recurrenceParentId);

		switch (viewType) {
			case "today":
				// Show all tasks including recurring children for date-based views
				return allTasks.filter(
					(t) =>
						t.status !== "COMPLETED" &&
						t.executionDate &&
						t.executionDate.startsWith(todayStr),
				);
			case "week":
				// Show all tasks including recurring children for date-based views
				return allTasks.filter((t) => {
					if (t.status === "COMPLETED" || !t.executionDate) return false;
					const execDate = new Date(t.executionDate);
					return execDate >= today && execDate <= next7Days;
				});
			case "inbox": {
				const inboxList = taskLists.find((l) => l.title === "Inbox");
				const inboxTasks =
					inboxList?.tasks?.filter((t) => t.status !== "COMPLETED") || [];
				// Exclude recurring children from inbox view
				return excludeRecurringChildren(inboxTasks);
			}
			case "list": {
				const list = taskLists.find((l) => l.id === pathId);
				const listTasks =
					list?.tasks?.filter((t) => t.status !== "COMPLETED") || [];
				// Exclude recurring children from list view (already filtered on backend, but double-check)
				return excludeRecurringChildren(listTasks);
			}
			case "category": {
				const categoryTasks = allTasks.filter(
					(t) => t.status !== "COMPLETED" && t.category?.id === pathId,
				);
				// Exclude recurring children from category view
				return excludeRecurringChildren(categoryTasks);
			}
			case "completed":
				return allTasks.filter((t) => t.status === "COMPLETED");
			case "trash":
				return trashTasks;
			case "search": {
				if (!searchQuery) return [];
				const query = searchQuery.toLowerCase();
				return allTasks.filter(
					(t) =>
						t.title.toLowerCase().includes(query) ||
						t.category?.name?.toLowerCase().includes(query),
				);
			}
			default:
				return allTasks.filter((t) => t.status !== "COMPLETED");
		}
	};

	// Get default task list ID for creating new tasks
	const getDefaultTaskListId = (): number => {
		if (viewType === "list" && pathId) {
			return pathId;
		}
		if (viewType === "inbox") {
			const inboxList = taskLists.find((l) => l.title === "Inbox");
			return inboxList?.id || taskLists[0]?.id || 0;
		}
		return taskLists[0]?.id || 0;
	};

	const filteredTasks = getFilteredTasks();
	const title = getTitle();
	const defaultTaskListId = getDefaultTaskListId();

	// Show completed section for views other than "completed"
	const showCompletedSection = viewType !== "completed" && viewType !== "trash";

	// Get completed tasks for the current view
	const getCompletedTasks = (): Task[] => {
		const allTasks = taskLists.flatMap((list) => list.tasks || []);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		// Use date-fns format to get local date string (yyyy-MM-dd)
		const todayStr = format(today, "yyyy-MM-dd");
		const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

		switch (viewType) {
			case "today":
				return allTasks.filter(
					(t) =>
						t.status === "COMPLETED" &&
						t.executionDate &&
						t.executionDate.startsWith(todayStr),
				);
			case "week":
				return allTasks.filter((t) => {
					if (t.status !== "COMPLETED" || !t.executionDate) return false;
					const execDate = new Date(t.executionDate);
					return execDate >= today && execDate <= next7Days;
				});
			case "inbox": {
				const inboxList = taskLists.find((l) => l.title === "Inbox");
				return inboxList?.tasks?.filter((t) => t.status === "COMPLETED") || [];
			}
			case "list": {
				const list = taskLists.find((l) => l.id === pathId);
				return list?.tasks?.filter((t) => t.status === "COMPLETED") || [];
			}
			case "category": {
				return allTasks.filter(
					(t) => t.status === "COMPLETED" && t.category?.id === pathId,
				);
			}
			default:
				return [];
		}
	};

	// Bulk selection handlers
	const toggleSelectionMode = () => {
		if (isSelectionMode) {
			setSelectedTaskIds(new Set());
		}
		setIsSelectionMode(!isSelectionMode);
	};

	const toggleTaskSelection = (taskId: number) => {
		setSelectedTaskIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(taskId)) {
				newSet.delete(taskId);
			} else {
				newSet.add(taskId);
			}
			return newSet;
		});
	};

	const handleBulkComplete = async () => {
		if (selectedTaskIds.size === 0) return;
		await bulkUpdateTasks(Array.from(selectedTaskIds), { status: "COMPLETED" });
		setSelectedTaskIds(new Set());
		setIsSelectionMode(false);
	};

	const handleBulkDelete = async () => {
		if (selectedTaskIds.size === 0) return;
		await bulkDeleteTasks(Array.from(selectedTaskIds));
		setSelectedTaskIds(new Set());
		setIsSelectionMode(false);
	};

	const selectAll = () => {
		const allIds = new Set(filteredTasks.map((t) => t.id));
		setSelectedTaskIds(allIds);
	};

	// Helper to deselect task when clicking background
	const handleBackgroundClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onTaskSelect?.(null);
		}
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: Background click handling for deselection
		// biome-ignore lint/a11y/noStaticElementInteractions: Background click handling for deselection
		<div
			className="flex flex-col gap-6 h-full p-6"
			onClick={handleBackgroundClick}
		>
			{/* Header */}
			<div className="flex justify-between items-center shrink-0">
				<div className="flex items-center gap-4">
					{onToggleSidebar && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onToggleSidebar}
							className={cn(
								"transition-colors",
								isSidebarOpen
									? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
									: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm ring-1 ring-indigo-200",
							)}
							title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
						>
							{isSidebarOpen ? (
								<PanelLeftClose className="w-5 h-5" />
							) : (
								<PanelLeftOpen className="w-5 h-5" />
							)}
						</Button>
					)}
					<h1 className="text-2xl font-bold">{title}</h1>
					<span className="text-sm text-gray-500">
						{filteredTasks.length} タスク
					</span>
				</div>
				{viewType !== "trash" && viewType !== "completed" && (
					<Button
						variant={isSelectionMode ? "default" : "outline"}
						size="sm"
						onClick={toggleSelectionMode}
						className="flex items-center gap-2"
					>
						<ListChecks className="w-4 h-4" />
						{isSelectionMode ? "選択終了" : "選択"}
					</Button>
				)}
			</div>

			{/* Bulk Action Toolbar */}
			{isSelectionMode && (
				<div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 shrink-0">
					<div className="flex items-center gap-4">
						<span className="text-sm font-medium text-indigo-700">
							{selectedTaskIds.size}件選択中
						</span>
						<Button variant="ghost" size="sm" onClick={selectAll}>
							すべて選択
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSelectedTaskIds(new Set())}
						>
							選択解除
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2 text-teal-600 border-teal-200 hover:bg-teal-50"
							onClick={handleBulkComplete}
							disabled={selectedTaskIds.size === 0}
						>
							<CheckCircle2 className="w-4 h-4" />
							完了
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
							onClick={handleBulkDelete}
							disabled={selectedTaskIds.size === 0}
						>
							<Trash2 className="w-4 h-4" />
							削除
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={toggleSelectionMode}
							className="text-gray-500"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Task Input - Only show for certain views */}
			{viewType !== "completed" &&
				viewType !== "trash" &&
				defaultTaskListId > 0 && (
					<div className="shrink-0">
						<CreateTaskForm
							taskListId={defaultTaskListId}
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
					<div className="space-y-6 ">
						{(() => {
							// Group completed tasks by completedAt date
							const now = new Date();
							const today = new Date(now);
							today.setHours(0, 0, 0, 0);
							const yesterday = new Date(today);
							yesterday.setDate(yesterday.getDate() - 1);
							const weekAgo = new Date(today);
							weekAgo.setDate(weekAgo.getDate() - 7);

							const sections: {
								key: string;
								label: string;
								tasks: Task[];
							}[] = [
								{ key: "today", label: "Today", tasks: [] },
								{ key: "yesterday", label: "Yesterday", tasks: [] },
								{ key: "thisWeek", label: "This Week", tasks: [] },
								{ key: "older", label: "Older", tasks: [] },
								{ key: "unknown", label: "日付不明", tasks: [] },
							];

							// Sort tasks by completedAt (newest first)
							const sortedTasks = [...filteredTasks].sort((a, b) => {
								if (!a.completedAt && !b.completedAt) return 0;
								if (!a.completedAt) return 1;
								if (!b.completedAt) return -1;
								return (
									new Date(b.completedAt).getTime() -
									new Date(a.completedAt).getTime()
								);
							});

							sortedTasks.forEach((task) => {
								if (!task.completedAt) {
									sections[4].tasks.push(task); // unknown
									return;
								}

								const completedDate = new Date(task.completedAt);
								completedDate.setHours(0, 0, 0, 0);

								if (completedDate.getTime() === today.getTime()) {
									sections[0].tasks.push(task); // today
								} else if (completedDate.getTime() === yesterday.getTime()) {
									sections[1].tasks.push(task); // yesterday
								} else if (completedDate >= weekAgo) {
									sections[2].tasks.push(task); // this week
								} else {
									sections[3].tasks.push(task); // older
								}
							});

							return sections.map((section) => {
								if (section.tasks.length === 0) return null;

								return (
									<div key={section.key} className="space-y-2">
										<h3 className="text-sm font-semibold text-gray-500 border-b pb-1 flex items-center justify-between">
											<span>{section.label}</span>
											<span className="text-xs font-normal text-gray-400">
												{section.tasks.length}件
											</span>
										</h3>
										<div className="space-y-2">
											{section.tasks.map((task) => (
												<TaskItem
													key={task.id}
													task={task}
													onUpdateTask={onUpdateTask}
													onDeleteTask={onDeleteTask}
													onSelect={onTaskSelect}
													isSelected={selectedTaskId === task.id}
												/>
											))}
										</div>
									</div>
								);
							});
						})()}
						{filteredTasks.length === 0 && (
							<p className="text-gray-400 text-sm text-center py-8">
								完了したタスクはありません
							</p>
						)}
					</div>
				) : viewType === "week" ? (
					<div className="space-y-6">
						{(() => {
							// Group tasks by date for "week" view
							const today = new Date();
							today.setHours(0, 0, 0, 0);
							// Create map for next 7 days
							const daysMap = new Map<string, Task[]>();
							const daysOrder: string[] = [];

							for (let i = 0; i < 7; i++) {
								const date = new Date(today);
								date.setDate(today.getDate() + i);
								const dateStr = format(date, "yyyy-MM-dd");
								daysMap.set(dateStr, []);
								daysOrder.push(dateStr);
							}

							// Distribute tasks (pending)
							filteredTasks.forEach((task) => {
								if (task.executionDate) {
									const dateStr = task.executionDate.split("T")[0];
									if (daysMap.has(dateStr)) {
										daysMap.get(dateStr)?.push(task);
									}
								}
							});

							const completedWeekTasks = getCompletedTasks();

							return daysOrder.map((dateStr, index) => {
								const tasks = daysMap.get(dateStr) || [];
								if (tasks.length === 0 && index !== 0) return null; // Skip empty days except today

								const date = new Date(dateStr);
								let label = format(date, "EEE", {
									locale: undefined,
								}).toUpperCase(); // MON, TUE...
								if (index === 0) label = "Today";
								else if (index === 1) label = "Tomorrow";
								else
									label = `${format(date, "EEE").toUpperCase()} ${format(date, "M/d")}`;

								return (
									<div key={dateStr} className="space-y-2">
										<h3 className="text-sm font-semibold text-gray-500 border-b pb-1">
											{label}
										</h3>
										<div className="space-y-2">
											{tasks.length > 0 ? (
												tasks.map((task) => (
													<TaskItem
														key={task.id}
														task={task}
														onUpdateTask={onUpdateTask}
														onDeleteTask={onDeleteTask}
														onSelect={onTaskSelect}
														isSelected={selectedTaskId === task.id}
													/>
												))
											) : (
												<p className="text-xs text-gray-400 py-2">タスクなし</p>
											)}
										</div>
										{/* Completed items for this specific day */}
										{(() => {
											const completedForDay = completedWeekTasks.filter(
												(t) =>
													t.executionDate &&
													t.executionDate.startsWith(dateStr),
											);
											if (completedForDay.length === 0) return null;
											return (
												<div className="mt-2 pl-4 border-l-2 border-gray-100">
													{completedForDay.map((task) => (
														<TaskItem
															key={task.id}
															task={task}
															onUpdateTask={onUpdateTask}
															onDeleteTask={onDeleteTask}
															onSelect={onTaskSelect}
															isSelected={selectedTaskId === task.id}
														/>
													))}
												</div>
											);
										})()}
									</div>
								);
							});
						})()}
					</div>
				) : (
					<>
						<div className="space-y-2">
							{filteredTasks.length > 0 ? (
								filteredTasks.map((task) => (
									<div
										key={task.id}
										className={`flex items-start gap-2 ${isSelectionMode ? "pl-2" : ""}`}
									>
										{isSelectionMode && (
											<input
												type="checkbox"
												checked={selectedTaskIds.has(task.id)}
												onChange={() => toggleTaskSelection(task.id)}
												className="mt-4 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
											/>
										)}
										<div className="flex-1">
											<TaskItem
												task={task}
												onUpdateTask={onUpdateTask}
												onDeleteTask={
													viewType === "trash"
														? deleteTaskPermanently
														: onDeleteTask
												}
												isTrash={viewType === "trash"}
												onRestore={
													viewType === "trash" ? restoreTask : undefined
												}
												onSelect={isSelectionMode ? undefined : onTaskSelect}
												isSelected={
													!isSelectionMode && selectedTaskId === task.id
												}
											/>
										</div>
									</div>
								))
							) : (
								<p className="text-gray-400 text-sm text-center py-8">
									タスクがありません
								</p>
							)}
						</div>

						{/* Completed Section (Standard View) */}
						{showCompletedSection && (
							<CompletedSection
								tasks={getCompletedTasks()}
								onUpdateTask={onUpdateTask}
								onDeleteTask={onDeleteTask}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}
