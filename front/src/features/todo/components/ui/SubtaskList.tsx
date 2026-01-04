import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { UseFieldArrayReturn } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import type { TaskFormValues } from "../forms/schema";

interface SubtaskListProps {
	className?: string;
	fields: UseFieldArrayReturn<TaskFormValues, "subtasks">["fields"];
	append: UseFieldArrayReturn<TaskFormValues, "subtasks">["append"];
	remove: UseFieldArrayReturn<TaskFormValues, "subtasks">["remove"];
}

export function SubtaskList({
	className,
	fields,
	append,
	remove,
}: SubtaskListProps) {
	const { register } = useFormContext<TaskFormValues>();

	// Ref to the last input for auto-focus
	const lastInputRef = useRef<HTMLInputElement>(null);

	// Auto-focus new inputs when added
	useEffect(() => {
		if (fields.length > 0 && lastInputRef.current) {
			lastInputRef.current.focus();
		}
	}, [fields.length]);

	// Don't render anything if no subtasks
	if (fields.length === 0) {
		return null;
	}

	return (
		<div className={cn("space-y-1 relative ml-3", className)}>
			{/* Vertical Guide Line */}
			<div className="absolute left-0 top-[-8px] bottom-0 w-px bg-gray-200" />

			<div className="space-y-1">
				{fields.map((field, index) => (
					<div
						key={field.id}
						className="relative flex items-center gap-2 group animate-in fade-in slide-in-from-top-1 duration-200"
					>
						{/* Tree Connector: L shape */}
						<div className="absolute left-0 top-0 h-[18px] w-3 border-b-2 border-gray-200 rounded-bl-sm -ml-[1px]" />

						<Input
							{...register(`subtasks.${index}.title` as const)}
							placeholder="Subtask..."
							className="flex-1 h-7 text-sm bg-transparent border-none focus:bg-gray-50 focus:ring-0 shadow-none px-2 ml-3 hover:bg-gray-50/50 transition-colors placeholder:text-gray-300"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									append({ title: "", description: "" });
								}
								if (
									e.key === "Backspace" &&
									(e.target as HTMLInputElement).value === ""
								) {
									e.preventDefault();
									remove(index);
								}
							}}
							// Use callback ref to handle both RHF registration and auto-focus
							ref={(e) => {
								const { ref: rhfRef } = register(
									`subtasks.${index}.title` as const,
								);
								if (typeof rhfRef === "function") {
									rhfRef(e);
								} else if (rhfRef) {
									(
										rhfRef as React.MutableRefObject<HTMLInputElement | null>
									).current = e;
								}

								if (index === fields.length - 1) {
									lastInputRef.current = e;
								}
							}}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50"
							onClick={() => remove(index)}
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
