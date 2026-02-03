import {
	ChevronDown,
	ChevronUp,
	FolderPlus,
	ListTodo,
	Plus,
	Save,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ParsedTask } from "../../types";
import { isExistingTask } from "../../utils/aiUtils";
import { AiPreviewTaskItem } from "./AiPreviewTaskItem";

interface AiTaskPreviewListProps {
	tasks: ParsedTask[];
	onToggleSelection: (taskId: number) => void;
	onUpdateTask: (taskId: number, updates: Partial<ParsedTask>) => void;
	onSave: () => void;
	isLoading: boolean;
	expanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
}

// タスクをsuggestedTaskListでグループ化
function groupTasksByList(
	tasks: ParsedTask[],
): Map<string | null, ParsedTask[]> {
	const groups = new Map<string | null, ParsedTask[]>();

	for (const task of tasks) {
		const listName = task.taskListTitle || null;
		const group = groups.get(listName) || [];
		group.push(task);
		groups.set(listName, group);
	}

	return groups;
}

export function AiTaskPreviewList({
	tasks,
	onToggleSelection,
	onUpdateTask,
	onSave,
	isLoading,
	expanded: controlledExpanded,
	onExpandedChange: controlledOnExpandedChange,
}: AiTaskPreviewListProps) {
	const [internalExpanded, setInternalExpanded] = useState(false);

	const isExpanded =
		controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
	const onExpandedChange = controlledOnExpandedChange || setInternalExpanded;

	if (tasks.length === 0) return null;

	const selectedTaskCount = tasks.filter((t) => t.selected).length;
	const modifiedTaskCount = tasks.filter(
		(t) => t.selected && isExistingTask(t),
	).length;

	// グループ化
	const groupedTasks = groupTasksByList(tasks);
	const hasMultipleLists = groupedTasks.size > 1 || !groupedTasks.has(null);

	// 新規作成されるリスト数をカウント
	const newListNames = Array.from(groupedTasks.keys()).filter(
		(name) => name !== null,
	);

	const getButtonContent = () => {
		if (newListNames.length > 0) {
			return (
				<>
					<FolderPlus className="h-4 w-4 mr-2" />
					リスト作成 & 保存 ({selectedTaskCount}件)
				</>
			);
		}
		if (tasks.some((t) => t.selected && t.isDeleted)) {
			return (
				<>
					<Save className="h-4 w-4 mr-2" />
					変更を適用・削除 ({selectedTaskCount}件)
				</>
			);
		}
		if (modifiedTaskCount > 0) {
			return (
				<>
					<Save className="h-4 w-4 mr-2" />
					変更を保存 ({selectedTaskCount}件)
				</>
			);
		}
		return (
			<>
				<Plus className="h-4 w-4 mr-2" />
				タスクを追加 ({selectedTaskCount}件)
			</>
		);
	};

	return (
		<div className="border-t border-gray-100 bg-white">
			<button
				type="button"
				className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
				onClick={() => onExpandedChange(!isExpanded)}
			>
				<div className="flex items-center gap-2">
					<ListTodo className="h-4 w-4 text-indigo-600" />
					<span>生成されたタスク ({tasks.length}件)</span>
					{selectedTaskCount > 0 && (
						<span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
							{selectedTaskCount}件選択中
						</span>
					)}
					{newListNames.length > 0 && (
						<span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
							<FolderPlus className="h-3 w-3" />
							{newListNames.length}新規リスト
						</span>
					)}
				</div>
				{isExpanded ? (
					<ChevronDown className="h-4 w-4 text-gray-400" />
				) : (
					<ChevronUp className="h-4 w-4 text-gray-400" />
				)}
			</button>

			{isExpanded && (
				<div className="max-h-[400px] overflow-y-auto px-4 py-4 bg-gray-50/50">
					{hasMultipleLists ? (
						// リストごとにグループ化して表示
						<div className="space-y-6">
							{Array.from(groupedTasks.entries()).map(
								([listName, groupTasks]) => (
									<TaskListGroup
										key={listName || "default"}
										listName={listName}
										tasks={groupTasks}
										onToggleSelection={onToggleSelection}
										onUpdateTask={onUpdateTask}
									/>
								),
							)}
						</div>
					) : (
						// 単一リスト（従来の表示）
						<div className="space-y-3">
							{tasks.map((task, index) => (
								<AiPreviewTaskItem
									key={task.id}
									task={task}
									index={index}
									onUpdateTask={onUpdateTask}
									onToggleSelection={onToggleSelection}
								/>
							))}
						</div>
					)}

					{/* 保存ボタン */}
					<div className="sticky bottom-0 mt-4 pt-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
						<Button
							onClick={onSave}
							disabled={isLoading || selectedTaskCount === 0}
							className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
							size="lg"
						>
							{getButtonContent()}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// リストグループコンポーネント
interface TaskListGroupProps {
	listName: string | null;
	tasks: ParsedTask[];
	onToggleSelection: (taskId: number) => void;
	onUpdateTask: (taskId: number, updates: Partial<ParsedTask>) => void;
}

function TaskListGroup({
	listName,
	tasks,
	onToggleSelection,
	onUpdateTask,
}: TaskListGroupProps) {
	return (
		<div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
			{/* リストヘッダー */}
			<div
				className={cn(
					"px-4 py-2 text-xs font-semibold flex items-center gap-2",
					listName
						? "bg-purple-50 text-purple-700 border-b border-purple-100"
						: "bg-gray-50 text-gray-600 border-b border-gray-100",
				)}
			>
				{listName ? (
					<>
						<FolderPlus className="h-3.5 w-3.5" />
						<span className="text-sm">{listName}</span>
						<span className="text-purple-500 font-normal ml-1">
							(新規リスト)
						</span>
					</>
				) : (
					<>
						<ListTodo className="h-3.5 w-3.5" />
						<span className="text-sm">既存リストへ追加</span>
					</>
				)}
				<span className="ml-auto bg-white px-2 py-0.5 rounded-full text-gray-500 border border-gray-100">
					{tasks.length} items
				</span>
			</div>

			{/* タスク一覧 */}
			<div className="p-3 space-y-2 bg-gray-50/30">
				{tasks.map((task, index) => (
					<AiPreviewTaskItem
						key={task.id}
						task={task}
						index={index}
						onUpdateTask={onUpdateTask}
						onToggleSelection={onToggleSelection}
					/>
				))}
			</div>
		</div>
	);
}
