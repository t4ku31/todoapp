import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EditableDurationProps {
	id: number;
	duration: number | null | undefined;
	onDurationChange: (id: number, duration: number | undefined) => Promise<void>;
	onOpenChange?: (open: boolean) => void;
}

export function EditableDuration({
	id,
	duration,
	onDurationChange,
	onOpenChange,
}: EditableDurationProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(duration?.toString() ?? "");
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync local state when prop changes or popover opens
	useEffect(() => {
		if (isOpen) {
			setInputValue(duration?.toString() ?? "");
		}
	}, [isOpen, duration]);

	const handleSave = async () => {
		const val = inputValue ? parseInt(inputValue, 10) : undefined;
		if (val !== duration) {
			await onDurationChange(id, val);
		}
		setIsOpen(false);
		onOpenChange?.(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		}
	};

	return (
		<Popover
			open={isOpen}
			onOpenChange={(newOpen) => {
				setIsOpen(newOpen);
				onOpenChange?.(newOpen);
				if (!newOpen) {
					// Reset on close without save? Or auto-save?
					// Usually auto-save on blur/close is better UX for this kind of popover
					// But we have handleSave called explicitly on Enter.
					// Let's autosave on close if changed?
					// For now, let's stick to explicit action or Enter.
					// Actually, typical editable popover might save on close.
					// Let's keep it simple: Enter to save.
				}
			}}
		>
			<PopoverTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"border-none font-normal cursor-pointer hover:scale-105 transition-all duration-200",
						duration
							? "bg-amber-100 text-amber-700 hover:bg-amber-200"
							: "text-muted-foreground hover:bg-gray-100/80 hover:text-gray-700",
					)}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<div className="flex items-center text-sm">
						<Clock className="mr-1.5 h-3.5 w-3.5" />
						<span>{duration ? `${duration} min` : "時間"}</span>
					</div>
				</Badge>
			</PopoverTrigger>
			<PopoverContent
				className="w-40 p-2"
				align="start"
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div className="space-y-2">
					<p className="text-xs font-semibold text-center text-gray-500">
						予想時間 (分)
					</p>
					<div className="flex gap-2">
						<Input
							ref={inputRef}
							type="number"
							min="0"
							placeholder="0"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
							className="h-8 text-sm"
							autoFocus
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
