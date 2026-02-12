import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowRight, Calendar, Tag, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ParsedTask } from "../../types";

interface AiChatTaskCardProps {
	task: ParsedTask;
	onClick: () => void;
	onToggleSelect: (id: number) => void;
}

const formatDate = (dateStr?: string) => {
	if (!dateStr) return "";
	try {
		return format(new Date(dateStr), "M/d(E)", { locale: ja });
	} catch (e) {
		console.error("Failed to format date:", e);
		return dateStr;
	}
};

// 差分表示用のコンポーネント
const DiffField = <T extends string | number>({
	original,
	current,
	label,
	formatValue = (v) => String(v),
}: {
	original?: T;
	current?: T;
	label?: string;
	formatValue?: (v: T) => string;
}) => {
	if (original === current || original === undefined) {
		return <span>{current != null ? formatValue(current) : ""}</span>;
	}

	return (
		<div className="flex flex-wrap items-center gap-1 text-sm">
			{label && <span className="text-gray-500 mr-1">{label}:</span>}
			<span className="line-through text-gray-400 text-xs decoration-gray-400/50">
				{original != null ? formatValue(original) : ""}
			</span>
			<div className="flex items-center text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400">
				<ArrowRight className="w-3 h-3 mr-1" />
				{current != null ? formatValue(current) : ""}
			</div>
		</div>
	);
};

export const AiChatTaskCard: React.FC<AiChatTaskCardProps> = ({
	task,
	onClick,
	onToggleSelect,
}) => {
	const isNew = task.id < 0;
	const isModified = task.id > 0 && !!task.originalTask;

	return (
		<div
			className={cn(
				"group relative border rounded-lg p-3 transition-all hover:shadow-md",
				task.selected
					? "bg-white border-primary/40 shadow-sm dark:bg-gray-800"
					: "bg-gray-50 border-transparent opacity-60 hover:opacity-100 dark:bg-gray-900",
				isNew &&
					task.selected &&
					"border-green-200 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10",
				isModified &&
					task.selected &&
					"border-amber-200 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-900/10",
			)}
		>
			<div className="flex items-start gap-3">
				<div className="pt-1">
					<Checkbox
						checked={task.selected}
						onCheckedChange={() => onToggleSelect(task.id)}
						onClick={(e) => e.stopPropagation()}
						aria-label="Select task"
					/>
				</div>

				<button
					type="button"
					onClick={onClick}
					className="flex-1 min-w-0 space-y-1.5 text-left bg-transparent border-none p-0 cursor-pointer font-inherit"
				>
					<div className="flex items-center gap-2">
						{/* ステータスバッジ */}
						{task.isDeleted ? (
							<Badge
								variant="destructive"
								className="text-[10px] px-1.5 py-0 h-4"
							>
								Delete
							</Badge>
						) : isNew ? (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0 h-4 border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
							>
								New
							</Badge>
						) : isModified ? (
							<Badge
								variant="outline"
								className="text-[10px] px-1.5 py-0 h-4 border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
							>
								Edit
							</Badge>
						) : null}

						<div
							className={cn(
								"font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1",
								task.isDeleted && "line-through text-gray-400",
							)}
						>
							<div className="flex items-center gap-2">
								{isModified ? (
									<DiffField
										original={task.originalTask?.status}
										current={task.status}
										label="Status"
									/>
								) : null}
								{isModified ? (
									<DiffField
										original={task.originalTask?.title}
										current={task.title}
									/>
								) : (
									task.title
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
						{(task.startDate ||
							(isModified && task.originalTask?.startDate)) && (
							<div className="flex items-center gap-1">
								<Calendar className="w-3 h-3" />
								{isModified ? (
									<DiffField
										original={task.originalTask?.startDate?.toISOString()}
										current={task.startDate?.toISOString()}
										formatValue={formatDate}
									/>
								) : (
									<span>
										{task.startDate
											? formatDate(task.startDate.toISOString())
											: ""}
									</span>
								)}
							</div>
						)}

						{(task.estimatedPomodoros ||
							(isModified && task.originalTask?.estimatedPomodoros)) && (
							<div className="flex items-center gap-1">
								<Timer className="w-3 h-3" />
								{isModified ? (
									<DiffField
										original={task.originalTask?.estimatedPomodoros}
										current={task.estimatedPomodoros}
										formatValue={(v) => (v ? `${v}ポモ` : "")}
									/>
								) : (
									<span>{task.estimatedPomodoros}ポモ</span>
								)}
							</div>
						)}

						{(task.categoryName ||
							(isModified && task.originalTask?.category?.name)) && (
							<div className="flex items-center gap-1">
								<Tag className="w-3 h-3" />
								{isModified ? (
									<DiffField
										original={task.originalTask?.category?.name}
										current={task.categoryName}
									/>
								) : (
									<span>{task.categoryName}</span>
								)}
							</div>
						)}
					</div>

					{/* サブタスクなどの追加情報があれば表示 */}
					{task.subtasks && task.subtasks.length > 0 && (
						<div className="text-xs text-gray-400 pl-4 border-l-2 border-gray-100 dark:border-gray-800 mt-1">
							{task.subtasks.length} subtasks
						</div>
					)}
				</button>
			</div>
		</div>
	);
};
