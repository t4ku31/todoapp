import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useTaskViewParams } from "@/features/todo/hooks/useTaskViewParams";
interface FilterHeaderProps {
	taskCount: number;
	isSidebarOpen: boolean;
	onToggleSidebar?: () => void;
}

export function FilterHeader({
	taskCount,
	isSidebarOpen,
	onToggleSidebar,
}: FilterHeaderProps) {
	const { title } = useTaskViewParams();
	return (
		<div className="flex items-center gap-4 py-2">
			{!isSidebarOpen && onToggleSidebar && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onToggleSidebar}
					className="text-gray-500 hover:text-gray-900"
					title="サイドバーを表示"
				>
					<PanelLeft className="h-5 w-5" />
				</Button>
			)}
			<div className="flex items-baseline gap-3">
				<h1 className="text-2xl font-bold text-gray-900">{title}</h1>
				<span className="text-sm text-gray-500 font-medium">
					{taskCount} 件
				</span>
			</div>
		</div>
	);
}
