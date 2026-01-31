import { useDroppable } from "@dnd-kit/core";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DroppableNavItemProps {
	droppableId: string;
	icon: React.ElementType;
	label: string;
	path: string;
	count?: number;
	aiCount?: number;
	color?: string;
	actions?: React.ReactNode;
}

export function DroppableNavItem({
	droppableId,
	icon: Icon,
	label,
	path,
	count,
	aiCount,
	color,
	actions,
}: DroppableNavItemProps) {
	const location = useLocation();
	const isActive = location.pathname === path;

	const { isOver, setNodeRef } = useDroppable({
		id: droppableId,
	});

	return (
		<div ref={setNodeRef}>
			<Link
				to={path}
				className={cn(
					"flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 group/item",
					isActive
						? "bg-indigo-50 text-indigo-700 font-medium shadow-sm ring-1 ring-indigo-200"
						: "text-gray-600 hover:bg-indigo-50 hover:text-indigo-900",
					// Highlight when dragging over
					isOver && "ring-2 ring-indigo-400 bg-indigo-100 scale-[1.02]",
				)}
			>
				<div className="flex items-center gap-3 min-w-0 flex-1">
					{color ? (
						<div
							className="h-4 w-4 rounded flex-shrink-0"
							style={{ backgroundColor: color }}
						/>
					) : (
						<Icon className="h-4 w-4 flex-shrink-0" />
					)}
					<span className="truncate">{label}</span>
				</div>
				<div className="flex items-center gap-1">
					{count !== undefined && count > 0 && (
						<span
							className={cn(
								"text-xs font-medium px-1.5 py-0.5 rounded-full",
								isActive
									? "bg-indigo-100 text-indigo-600"
									: "bg-gray-100 text-gray-500",
							)}
						>
							{count}
						</span>
					)}
					{aiCount !== undefined && aiCount > 0 && (
						<span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 animate-pulse">
							+{aiCount}
						</span>
					)}
					{actions && (
						<div
							className="opacity-0 group-hover/item:opacity-100 transition-opacity"
							onPointerDown={(e) => e.stopPropagation()}
						>
							{actions}
						</div>
					)}
				</div>
			</Link>
		</div>
	);
}
