import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ClearButtonProps {
	isCompleted: boolean;
	onToggleCompletion: () => Promise<void>;
	disabled?: boolean;
	disabledReason?: string;
}

export function ClearButton({
	isCompleted,
	onToggleCompletion,
	disabled = false,
	disabledReason,
}: ClearButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = async () => {
		if (disabled) return;

		setIsLoading(true);
		try {
			await onToggleCompletion();
		} catch (error) {
			console.error("Failed to toggle task list completion:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const button = isCompleted ? (
		<Button
			variant="outline"
			size="sm"
			onClick={handleClick}
			disabled={isLoading}
			className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
		>
			{isLoading ? (
				"Reverting..."
			) : (
				<>
					<CheckCircle2 className="w-4 h-4 mr-2" />
					Completed
				</>
			)}
		</Button>
	) : (
		<Button
			variant="outline"
			size="sm"
			onClick={handleClick}
			disabled={isLoading || disabled}
			className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
		>
			{isLoading ? "Clearing..." : "Clear"}
		</Button>
	);

	// Show tooltip if disabled and reason provided
	if (disabled && disabledReason && !isCompleted) {
		return (
			<div className="relative group">
				{button}
				<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
					{disabledReason}
					<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
				</div>
			</div>
		);
	}

	return button;
}
