import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "original" | "edit" | "new" | "delete";

interface AiStatusBadgeProps {
	variant: BadgeVariant;
	children: ReactNode;
	className?: string;
}

export function AiStatusBadge({
	variant,
	children,
	className,
}: AiStatusBadgeProps) {
	const variants = {
		original: "bg-white/80 text-gray-400 border-gray-100",
		edit: "bg-indigo-100/80 text-indigo-600 border-indigo-200",
		new: "bg-yellow-100/80 text-yellow-600 border-yellow-200",
		delete: "bg-red-100/80 text-red-600 border-red-200",
	};

	return (
		<div
			className={cn(
				"absolute px-2 py-0.5 backdrop-blur text-[10px] font-medium rounded-full border shadow-sm z-10",
				variants[variant],
				className,
			)}
		>
			{children}
		</div>
	);
}
