import { Check, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CompletedSection } from "@/features/todo/components/ui/CompletedSection";
import type { Task } from "@/types/types";

interface TaskSelectorProps {
	isOpen: boolean;
	onToggle: () => void;
	currentTask: Task | null;
	todaysTasks: Task[];
	allTodayTasks: Task[];
	currentTaskId: number | null;
	onSelectTask: (taskId: number | null) => void;
	onCompleteTask: (taskId: number) => void;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
}

export function TaskSelector({
	isOpen,
	onToggle,
	currentTask,
	todaysTasks,
	allTodayTasks,
	currentTaskId,
	onSelectTask,
	onCompleteTask,
	onUpdateTask,
}: TaskSelectorProps) {
	return (
		<div className="w-full max-w-md relative z-50 flex justify-center">
			<Card className="border-none shadow-lg w-80 h-16">
				<button
					type="button"
					onClick={onToggle}
					className="w-full flex items-center justify-center px-4 py-3 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
				>
					<span className="text-sm font-medium truncate">
						{currentTask ? currentTask.title : "タスクを選択..."}
					</span>
					<ChevronDown
						className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
					/>
				</button>
			</Card>

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 border border-gray-100">
					<button
						type="button"
						onClick={() => {
							onSelectTask(null);
							onToggle();
						}}
						className="w-full px-4 py-3 text-left text-gray-600 hover:bg-gray-50 text-sm"
					>
						タスクなし
					</button>
					{todaysTasks.map((task) => (
						<div
							key={task.id}
							className={`w-full px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2
                ${currentTaskId === task.id ? "bg-purple-50" : ""}`}
						>
							{/* Completion checkbox */}
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onCompleteTask(task.id);
								}}
								className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-colors"
								title="完了"
							>
								<Check className="w-3 h-3 text-transparent hover:text-green-500" />
							</button>
							{/* Task selection */}
							<button
								type="button"
								onClick={() => {
									onSelectTask(task.id);
									onToggle();
								}}
								className={`flex-1 text-left flex items-center gap-2
                  ${currentTaskId === task.id ? "text-purple-700" : "text-gray-700"}`}
							>
								<span
									className="w-2 h-2 rounded-full flex-shrink-0"
									style={{ backgroundColor: task.category?.color || "#9ca3af" }}
								/>
								<span className="truncate">{task.title}</span>
							</button>
						</div>
					))}

					{/* Completed Tasks Section */}
					<CompletedSection
						tasks={allTodayTasks}
						onUpdateTask={onUpdateTask}
						variant="simple"
						renderItem={(task) => (
							<div
								key={task.id}
								className="w-full px-4 py-2 text-sm flex items-center gap-2"
							>
								<button
									type="button"
									onClick={() => onUpdateTask(task.id, { status: "PENDING" })}
									className="w-5 h-5 rounded-full bg-green-500 hover:bg-gray-300 flex items-center justify-center transition-colors"
									title="未完了に戻す"
								>
									<Check className="w-3 h-3 text-white" />
								</button>
								<span
									className="w-2 h-2 rounded-full flex-shrink-0 opacity-50"
									style={{ backgroundColor: task.category?.color || "#9ca3af" }}
								/>
								<span className="truncate text-gray-500 line-through">
									{task.title}
								</span>
							</div>
						)}
						className="border-t border-gray-100 mt-2"
					/>
				</div>
			)}
		</div>
	);
}
