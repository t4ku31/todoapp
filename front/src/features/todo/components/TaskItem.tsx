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
						onUpdateTask(task.id, { status: checked ? "COMPLETED" : "PENDING" })
					}
					className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 transition-colors"
				/>

				<div className="flex-1 min-w-0">
					<EditableTitle
						id={task.id}
						title={task.title}
						onTitleChange={(id, title) => onUpdateTask(id, { title })}
						className={`text-base font-medium text-gray-700 truncate ${task.status === "COMPLETED" ? "line-through text-gray-400" : ""}`}
					/>
					<div className="flex items-center gap-2 mt-1">
						{/* category placeholder */}
						<Badge
							variant="secondary"
							className="text-xs font-normal bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors px-2 py-0.5 rounded-full"
						>
							Work
						</Badge>
						<EditableDate
							id={task.id}
							date={task.dueDate ?? null}
							type="dueDate"
							onDateChange={(id, date) => onUpdateTask(id, { dueDate: date })}
						/>
						<EditableDate
							id={task.id}
							date={task.executionDate ?? null}
							type="executionDate"
							onDateChange={(id, date) => onUpdateTask(id, { executionDate: date })}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<StatusChangeButton
					status={task.status}
					onChange={(newStatus) => onUpdateTask(task.id, { status: newStatus })}
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
