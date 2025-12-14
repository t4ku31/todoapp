
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { forwardRef, useState } from "react";
import { TaskInput, type TaskInputState } from "./TaskInput";

interface CreateTaskFormProps {
	taskListId: number;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
	) => Promise<void>;
	className?: string;
	placeholder?: string;
	autoFocus?: boolean;
	disabled?: boolean;
}

/**
 * Component for creating a new task.
 */
export const CreateTaskForm = forwardRef<HTMLInputElement, CreateTaskFormProps>(
	(
		{ taskListId, onCreateTask, className, placeholder, autoFocus, disabled },
		ref,
	) => {
		const [state, setState] = useState<TaskInputState>({
			title: "",
			dueDate: new Date(),
			executionDate: new Date(),
		});
		const [isSubmitting, setIsSubmitting] = useState(false);

		const handleSubmit = async () => {
			if (!state.title.trim() || isSubmitting) return;

			try {
				setIsSubmitting(true);
				await onCreateTask(
					taskListId,
					state.title,
					state.dueDate ? format(state.dueDate, "yyyy-MM-dd") : null,
					state.executionDate ? format(state.executionDate, "yyyy-MM-dd") : null,
				);
				setState({
					title: "",
					dueDate: new Date(),
					executionDate: new Date(),
				});
			} finally {
				setIsSubmitting(false);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleSubmit();
			}
		};

		return (
			<TaskInput
				ref={ref}
				value={state}
				onChange={setState}
				onKeyDown={handleKeyDown}
				className={className}
				placeholder={placeholder || "新しいタスクを追加..."}
				autoFocus={autoFocus}
				disabled={disabled || isSubmitting}
				endAdornment={
					<Button
						onClick={() => handleSubmit()}
						size="icon"
						disabled={disabled || isSubmitting || !state.title.trim()}
						className="h-8 w-8"
					>
						<Plus className="h-4 w-4" />
					</Button>
				}
			/>
		);
	},
);

CreateTaskForm.displayName = "CreateTaskForm";

