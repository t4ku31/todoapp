import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types/types";
import { DeleteButton } from "./ui/DeleteButton";
import { EditableDate } from "./ui/EditableDate";
import { EditableTitle } from "./ui/EditableTitle";
import { StatusChangeButton } from "./ui/StatusChangeButton";

interface TaskItemProps {
	task: Task;
	onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
	onDeleteTask: (taskId: number) => Promise<void>;
}

export function TaskItem({
	task,
	onUpdateTask,
	onDeleteTask,
}: TaskItemProps) {
	return (
		<div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
			<div className="flex items-center gap-4 flex-1">
				<Checkbox
					checked={task.status === "COMPLETED"}
					onCheckedChange={(checked) =>
						onStatusChange(task.id, checked ? "COMPLETED" : "PENDING")
					}
					className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 transition-colors"
				/>

				<div className="flex-1 min-w-0">
					<EditableTitle
						id={task.id}
						title={task.title}
						onTitleChange={onTaskTitleChange}
						className={`text-base font-medium text-gray-700 truncate ${task.status === "COMPLETED" ? "line-through text-gray-400" : ""}`}
					/>
					<div className="flex items-center gap-2 mt-1">
						<Badge
							variant="secondary"
							className="text-xs font-normal bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors px-2 py-0.5 rounded-full"
						>
							Work
						</Badge>
						{/* Placeholder for Due Date if we add it to Task entity later */}
						<div className="flex items-center gap-1 text-xs text-gray-400">
							<CalendarIcon className="w-3 h-3" />
							<span>Due 24</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
				<StatusChangeButton
					status={task.status}
					onChange={(newStatus) => onStatusChange(task.id, newStatus)}
				/>
				<DeleteButton
					onDelete={() => onDeleteTask(task.id)}
					title="Delete Task?"
					description="This action cannot be undone."
				/>
			</div>
		</div>
	);
}
