import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { TaskInput } from "./TaskInput";
import { type TaskFormValues, taskSchema } from "./schema";

interface CreateTaskFormProps {
	taskListId: number;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		categoryId?: number,
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
		_ref,
	) => {
		const form = useForm<TaskFormValues>({
			resolver: zodResolver(taskSchema),
			defaultValues: {
				title: "",
				dueDate: undefined,
				executionDate: undefined,
				categoryId: undefined,
			},
		});

		const onSubmit = async (data: TaskFormValues) => {
			try {
				await onCreateTask(
					taskListId,
					data.title,
					data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
					data.executionDate ? format(data.executionDate, "yyyy-MM-dd") : null,
					data.categoryId,
				);
				form.reset({
					title: "",
					dueDate: undefined, 
					executionDate: undefined,
					categoryId: undefined,
				});
			} catch (error) {
				console.error(error);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				form.handleSubmit(onSubmit)();
			}
		};

		return (
			<TaskInput
				control={form.control}
				onKeyDown={handleKeyDown}
				className={className}
				placeholder={placeholder || "新しいタスクを追加..."}
				autoFocus={autoFocus}
				disabled={disabled || form.formState.isSubmitting}
				endAdornment={
					<Button
						onClick={form.handleSubmit(onSubmit)}
						size="icon"
						disabled={disabled || form.formState.isSubmitting || !form.formState.isValid}
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

