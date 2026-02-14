import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	message?: string;
	className?: string;
}

const sizeClasses = {
	sm: "h-6 w-6",
	md: "h-8 w-8",
	lg: "h-10 w-10",
};

export function LoadingSpinner({
	size = "md",
	message = "読み込み中...",
	className,
}: LoadingSpinnerProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-center w-full h-full",
				className,
			)}
		>
			<div className="flex flex-col items-center gap-3">
				<Loader2
					className={cn(sizeClasses[size], "animate-spin text-indigo-500")}
				/>
				{message && <span className="text-sm text-gray-500">{message}</span>}
			</div>
		</div>
	);
}
