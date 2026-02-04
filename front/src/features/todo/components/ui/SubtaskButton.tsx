import { ListTree } from "lucide-react";
import type { FC, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { IconBadge } from "./IconBadge";

interface SubtaskButtonProps {
	completedCount: number;
	totalCount: number;
	isOpen: boolean;
	onClick: (e: MouseEvent) => void;
	className?: string;
}

export const SubtaskButton: FC<SubtaskButtonProps> = ({
	completedCount,
	totalCount,
	isOpen,
	onClick,
	className,
}) => {
	return (
		<IconBadge
			icon={ListTree}
			variant={isOpen ? "soft" : "outline"}
			colorScheme={isOpen ? "indigo" : undefined}
			className={cn("transition-colors", className)}
			onClick={(e) => {
				e.stopPropagation();
				onClick(e);
			}}
		>
			{completedCount}/{totalCount}
		</IconBadge>
	);
};
