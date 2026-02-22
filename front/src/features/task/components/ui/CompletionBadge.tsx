import type { Task } from "@/features/task/types";

interface CompletionBadgeProps {
	tasks: Task[];
	className?: string;
}

export function CompletionBadge({ tasks, className }: CompletionBadgeProps) {
	const totalTasks = tasks.length || 0;
	const completedTasks =
		tasks.filter((t) => t.status === "COMPLETED").length || 0;

	const percentage =
		totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

	return (
		<div className={`flex items-center gap-2 ${className || ""}`}>
			<span className="font-medium text-xl text-gray-700 tabular-nums">
				{completedTasks}/{totalTasks}
			</span>

			<div className="relative w-24 h-6 rounded-full overflow-hidden border border-gray-200 bg-gray-100 inner-shadow-xl shadow-sm animate-in zoom-in-95 fade-in duration-500">
				{/* <div
					className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-green-300 transition-all duration-700 ease-out animate-wave"
					style={{
						width: `${percentage}%`,
					}}
				/> */}
				<div
					className="absolute top-0 left-0 h-full transition-all duration-700 ease-out animate-shimmer"
					style={{
						width: `${percentage}%`,
						// グラデーションの色と、動かすための背景サイズ設定
						backgroundImage:
							"linear-gradient(90deg, #14b8a6, #34d399, #86efac, #14b8a6)",
						backgroundSize: "200% 100%",
					}}
				/>
			</div>
		</div>
	);
}
