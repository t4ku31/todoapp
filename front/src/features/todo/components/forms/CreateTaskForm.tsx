import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TaskListSelector } from "../ui/TaskListSelector";
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
	defaultExecutionDate?: Date;
    showListSelector?: boolean;
}

/**
 * Component for creating a new task.
 */
export const CreateTaskForm = forwardRef<HTMLInputElement, CreateTaskFormProps>(
	(
		{
			taskListId,
			onCreateTask,
			className,
			placeholder,
			autoFocus,
			disabled,
			defaultExecutionDate,
            showListSelector = true,
		},
		_ref,
	) => {
		const [selectedTaskListId, setSelectedTaskListId] = useState(taskListId);

		// Sync local state if prop changes
		useEffect(() => {
			setSelectedTaskListId(taskListId);
		}, [taskListId]);

		const form = useForm<TaskFormValues>({
			resolver: zodResolver(taskSchema),
			defaultValues: {
				title: "",
				dueDate: undefined,
				executionDate: defaultExecutionDate,
				categoryId: undefined,
			},
		});

		// Update form value when defaultExecutionDate changes (e.g. calendar date selection)
		useEffect(() => {
			if (defaultExecutionDate) {
				form.setValue("executionDate", defaultExecutionDate);
			}
		}, [defaultExecutionDate, form]);

		const onSubmit = async (data: TaskFormValues) => {
			try {
				await onCreateTask(
					selectedTaskListId,
					data.title,
					data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
					data.executionDate
						? format(data.executionDate, "yyyy-MM-dd")
						: null,
					data.categoryId,
				);
				form.reset({
					title: "",
					dueDate: undefined,
					executionDate: defaultExecutionDate, // Reset to current default
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
					<div className="flex items-center gap-1">
						{showListSelector && (
                            <TaskListSelector
                                currentTaskListId={selectedTaskListId}
                                onTaskListChange={setSelectedTaskListId}
                                className="w-[110px]"
						    />
                        )}
						<Button
							onClick={form.handleSubmit(onSubmit)}
							size="icon"
							disabled={
								disabled ||
								form.formState.isSubmitting ||
								!form.formState.isValid
							}
							className="h-8 w-8 ml-1"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				}
			/>
		);
	},
);


