import { Check, ChevronDown } from "lucide-react";
import { CompletedSection } from "@/features/todo/components/ui/CompletedSection";
import type { Task } from "@/features/todo/types";

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
		<div className="w-full max-w-sm relative z-50 flex justify-center">
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex items-center justify-between px-2 py-2 bg-transparent border-b border-gray-300 hover:border-purple-400 transition-all group"
			>
				<span className="text-sm font-medium truncate text-gray-700 group-hover:text-purple-600">
					{currentTask ? currentTask.title : "タスクを選択..."}
				</span>
				<ChevronDown
					className={`w-4 h-4 text-gray-400 transition-transform group-hover:text-purple-500 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
					<div className="max-h-64 overflow-y-auto p-1.5 flex flex-col gap-0.5">
						<button
							type="button"
							onClick={() => {
								onSelectTask(null);
								onToggle();
							}}
							className="w-full px-4 py-2.5 text-left text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
						>
							タスクなし
						</button>
						{todaysTasks.map((task) => (
							<div
								key={task.id}
								className={`w-full h-11 px-1 rounded-lg hover:bg-gray-100 flex items-center gap-1 transition-colors group
                ${currentTaskId === task.id ? "bg-purple-50" : ""}`}
							>
								{/* Completion checkbox - Sibling 1 */}
								<button
									type="button"
									onClick={() => onCompleteTask(task.id)}
									className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-100/50 group/check shrink-0"
									title="完了"
								>
									<div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover/check:border-green-500 flex items-center justify-center transition-colors">
										<Check className="w-3 h-3 text-transparent group-hover/check:text-green-500" />
									</div>
								</button>

								{/* Task selection - Sibling 2 */}
								<button
									type="button"
									onClick={() => {
										onSelectTask(task.id);
										onToggle();
									}}
									className={`flex-1 h-9 px-2 text-left flex items-center gap-2 rounded-lg transition-colors truncate
                  ${currentTaskId === task.id ? "text-purple-700 font-medium" : "text-gray-700 hover:text-purple-600"}`}
								>
									<span
										className="w-2 h-2 rounded-full flex-shrink-0"
										style={{
											backgroundColor: task.category?.color || "#9ca3af",
										}}
									/>
									<span className="truncate text-sm">{task.title}</span>
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
									className="w-full px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
								>
									<button
										type="button"
										onClick={() => onUpdateTask(task.id, { status: "PENDING" })}
										className="w-5 h-5 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shrink-0"
										title="未完了に戻す"
									>
										<Check className="w-3 h-3 text-white" />
									</button>
									<span
										className="w-2 h-2 rounded-full flex-shrink-0 opacity-50"
										style={{
											backgroundColor: task.category?.color || "#9ca3af",
										}}
									/>
									<span className="truncate text-gray-400 line-through">
										{task.title}
									</span>
								</div>
							)}
							className="border-t border-gray-100 mt-1 pt-1"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
