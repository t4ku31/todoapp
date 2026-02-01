import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskViewParams } from "@/features/todo/hooks/useTaskViewParams";

interface FilterHeaderProps {
	taskCount: number;
	onToggleSidebar?: () => void;
	isSidebarOpen: boolean;
}

export function FilterHeader({
	taskCount,
	onToggleSidebar,
	isSidebarOpen,
}: FilterHeaderProps) {
	const { title } = useTaskViewParams();
	return (
		<div className="flex items-center gap-4 py-2">
			{onToggleSidebar && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onToggleSidebar}
					className="text-gray-500 hover:text-gray-900"
					title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを表示"}
				>
					{isSidebarOpen ? (
						<PanelLeftClose className="h-5 w-5" />
					) : (
						<PanelLeftOpen className="h-5 w-5" />
					)}
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
