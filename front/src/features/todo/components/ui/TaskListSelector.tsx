import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/store/useTodoStore";
import { Check, FolderInput } from "lucide-react";
import { useState } from "react";
import { IconBadge } from "./IconBadge";

interface TaskListSelectorProps {
	currentTaskListId: number;
	onTaskListChange: (taskListId: number) => void;
	className?: string;
	onOpenChange?: (open: boolean) => void;
}

export function TaskListSelector({
	currentTaskListId,
	onTaskListChange,
	onOpenChange,
	className,
}: TaskListSelectorProps) {
	const taskLists = useTodoStore((state) => state.taskLists);
	const [open, setOpen] = useState(false);

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		onOpenChange?.(newOpen);
	};

	const selectedList = taskLists.find((list) => list.id === currentTaskListId);

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<IconBadge
					icon={FolderInput}
					variant="outline"
					className={className}
					onPointerDown={(e) => e.stopPropagation()}
				>
					{selectedList?.title || "リストを選択"}
				</IconBadge>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<ScrollArea className="h-48 p-1">
					<div className="space-y-1">
						{taskLists.map((list) => (
							<button
								key={list.id}
								type="button"
								onClick={() => {
									onTaskListChange(list.id);
									handleOpenChange(false);
								}}
								className={cn(
									"w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 transition-colors outline-none text-left",
									list.id === currentTaskListId && "bg-gray-100 font-medium",
								)}
							>
								<span className="flex-1 truncate">{list.title}</span>
								{list.id === currentTaskListId && (
									<Check className="ml-2 h-4 w-4" />
								)}
							</button>
						))}
					</div>
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
