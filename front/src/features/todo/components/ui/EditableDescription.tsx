import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableDescriptionProps {
	id: number | string;
	description?: string;
	onDescriptionChange: (
		id: number | string,
		newDescription: string,
	) => Promise<void>;
	className?: string;
	placeholder?: string;
	initialMaxLines?: number;
}

export function EditableDescription({
	id,
	description = "",
	onDescriptionChange,
	className,
	placeholder = "メモを追加...",
	initialMaxLines,
}: EditableDescriptionProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [editedDescription, setEditedDescription] = useState(description);
	const [isSaving, setIsSaving] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setEditedDescription(description || "");
	}, [description]);

	// Focus textarea when entering edit mode
	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.focus();
			// Set cursor to end
			textareaRef.current.setSelectionRange(
				textareaRef.current.value.length,
				textareaRef.current.value.length,
			);
		}
	}, [isEditing]);

	const handleSave = async () => {
		if (editedDescription === (description || "")) {
			setIsEditing(false);
			return;
		}

		setIsSaving(true);
		try {
			await onDescriptionChange(id, editedDescription);
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to save description:", error);
			setEditedDescription(description || "");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setEditedDescription(description || "");
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancel();
		}
	};
	// Edit mode
	if (isEditing) {
		return (
			<div className="w-full space-y-2 outline-none">
				<Textarea
					ref={textareaRef}
					value={editedDescription}
					onChange={(e) => setEditedDescription(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSave}
					disabled={isSaving}
					placeholder={placeholder}
					className={cn(
						"min-h-[80px] text-sm resize-none focus-visible:ring-indigo-500",
						className,
					)}
				/>
				<div className="text-xs text-muted-foreground flex justify-end gap-2">
					{isSaving ? (
						<span>保存中...</span>
					) : (
						<span>Escでキャンセル, Ctrl+Enterで保存</span>
					)}
				</div>
			</div>
		);
	}

	// View mode
	const lines = description ? description.split("\n").length : 0;
	const shouldClamp =
		initialMaxLines && (lines > initialMaxLines || description?.length > 200); // Simple heuristic for now, better to rely on CSS line-clamp detection but that requires ref
	const isClamped = shouldClamp && !isExpanded;

	return (
		<div className="relative group">
			<button
				type="button"
				className={cn(
					"group/btn relative cursor-pointer rounded-md p-1 -ml-1 hover:bg-muted/50 transition-colors w-full text-left",
					!description && "text-muted-foreground italic",
				)}
				onClick={() => setIsEditing(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsEditing(true);
					}
				}}
			>
				<div
					className={cn(
						"text-sm whitespace-pre-wrap break-words",
						isClamped && "line-clamp-[var(--max-lines)] text-muted-foreground",
						className,
					)}
					style={
						isClamped
							? ({ "--max-lines": initialMaxLines } as React.CSSProperties)
							: undefined
					}
				>
					{description || placeholder}
				</div>
				<Pencil className="absolute top-2 right-2 w-3 h-3 text-muted-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity" />
			</button>

			{shouldClamp && description && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setIsExpanded(!isExpanded);
					}}
					className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 select-none"
				>
					{isExpanded ? (
						<>
							<ChevronUp className="w-3 h-3" />
							<span>Show less</span>
						</>
					) : (
						<>
							<ChevronDown className="w-3 h-3" />
							<span>Show more</span>
						</>
					)}
				</button>
			)}
		</div>
	);
}
