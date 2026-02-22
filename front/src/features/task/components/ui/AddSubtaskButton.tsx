import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddSubtaskButtonProps {
	onClick: () => void;
	hasSubtasks: boolean;
	/* Optional active color class override. Defaults to 'text-indigo-600' when active. */
	activeColorClass?: string;
	className?: string;
}

export function AddSubtaskButton({
	onClick,
	hasSubtasks,
	activeColorClass = "text-indigo-600",
	className,
}: AddSubtaskButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={cn(
				"shrink-0 h-7 w-7 hover:bg-indigo-50 transition-colors",
				hasSubtasks ? activeColorClass : "text-gray-400",
				className,
			)}
			onClick={onClick}
			title="Add subtask"
		>
			<ListTree className="w-5 h-5" />
		</Button>
	);
}
