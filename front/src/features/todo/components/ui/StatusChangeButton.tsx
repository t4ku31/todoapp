import type React from "react";
import type { TaskStatus } from "@/types/types";

/**
 * Order of status transition:
 * PENDING -> IN_PROGRESS -> COMPLETED -> PENDING (Cycle)
 */
const nextStatusMap: Record<TaskStatus, TaskStatus> = {
	PENDING: "IN_PROGRESS",
	IN_PROGRESS: "COMPLETED",
	COMPLETED: "PENDING",
};

/**
 * Label and color definition for each status
 */
const statusMeta: Record<TaskStatus, { label: string; bg: string }> = {
	PENDING: { label: "PENDING", bg: "bg-slate-200 text-gray-800" },
	IN_PROGRESS: { label: "IN_PROGRESS", bg: "bg-indigo-500 text-white" },
	COMPLETED: { label: "COMPLETED", bg: "bg-teal-500 text-white" },
};

type Props = {
	/** Current status */
	status: TaskStatus;
	/** Handler called when status changes */
	onChange: (newStatus: TaskStatus) => void;
};

export const StatusChangeButton: React.FC<Props> = ({ status, onChange }) => {
	const handleClick = () => {
		const newStatus = nextStatusMap[status];
		onChange(newStatus);
	};

	const { label, bg } = statusMeta[status];

	return (
		<div className="flex items-center gap-2">
			{status === "IN_PROGRESS" && (
				<span className="relative flex h-2.5 w-2.5">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
					<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
				</span>
			)}
			<button
				type="button"
				onClick={handleClick}
				onPointerDown={(e) => e.stopPropagation()}
				className={`px-3 py-1 rounded text-xs font-medium ${bg} hover:opacity-90 transition-colors hover:scale-105 transition-all duration-200`}
			>
				{label}
			</button>
		</div>
	);
};
