import type { TaskStatus } from "@/types/types";
import React from "react";

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
    PENDING: { label: "未着手", bg: "bg-gray-200 text-gray-800" },
    IN_PROGRESS: { label: "作業中", bg: "bg-blue-500 text-white" },
    COMPLETED: { label: "完了", bg: "bg-green-600 text-white" },
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
        <button
            type="button"
            onClick={handleClick}
            className={`px-3 py-1 rounded text-xs font-medium ${bg} hover:opacity-90 transition-colors`}
        >
            {label}
        </button>
    );
};
