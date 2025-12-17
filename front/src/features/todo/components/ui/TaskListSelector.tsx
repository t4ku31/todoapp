import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/store/useTodoStore";
import { FolderInput } from "lucide-react";

interface TaskListSelectorProps {
	currentTaskListId: number;
	onTaskListChange: (taskListId: number) => void;
	className?: string;
}

export function TaskListSelector({
	currentTaskListId,
	onTaskListChange,
	className,
}: TaskListSelectorProps) {
	const taskLists = useTodoStore((state) => state.taskLists);

	return (
		<Select
			value={currentTaskListId.toString()}
			onValueChange={(value: string) => onTaskListChange(Number(value))}
		>
			<SelectTrigger className={cn("h-7 w-[140px] text-xs border-none bg-transparent hover:bg-gray-100 transition-colors", className)}>
				<FolderInput className="w-3 h-3 mr-1" />
				<SelectValue placeholder="リストを選択" />
			</SelectTrigger>
			<SelectContent>
				{taskLists.map((list) => (
					<SelectItem key={list.id} value={list.id.toString()}>
						{list.title}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
