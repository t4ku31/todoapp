import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ListTree, Plus } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import {
	Controller,
	FormProvider,
	useFieldArray,
	useForm,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CategorySelect } from "../ui/CategorySelect";
import { DateScheduler } from "../ui/DateScheduler";
import { PomodoroInput } from "../ui/PomodoroInput";
import { SubtaskList } from "../ui/SubtaskList";
import { type TaskFormValues, taskSchema } from "./schema";

interface CreateTaskFormProps {
	taskListId: number;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		categoryId?: number,
		estimatedPomodoros?: number,
		subtasks?: { title: string; description?: string }[],
		isRecurring?: boolean,
		recurrenceRule?: string | null,
		customDates?: string[],
	) => Promise<void>;
	className?: string;
	placeholder?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	defaultExecutionDate?: Date;
	showListSelector?: boolean;
	showExecutionDate?: boolean;
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
			showExecutionDate = true,
		},
		_ref,
	) => {
		const [selectedTaskListId, setSelectedTaskListId] = useState(taskListId);
		const [, setOnOpen] = useState(false);
		// Sync local state if prop changes
		useEffect(() => {
			setSelectedTaskListId(taskListId);
		}, [taskListId]);

		const form = useForm<TaskFormValues>({
			resolver: zodResolver(taskSchema),
			defaultValues: {
				title: "",
				dateMode: "single",
				executionDate: new Date(),
				startDate: undefined,
				endDate: undefined,
				repeatFrequency: undefined,
				categoryId: undefined,
				estimatedPomodoros: 0,
				subtasks: [],
			},
		});

		const {
			fields: subtaskFields,
			append: appendSubtask,
			remove: removeSubtask,
			replace: replaceSubtasks,
		} = useFieldArray({
			control: form.control,
			name: "subtasks",
		});

		const onSubmit = async (data: TaskFormValues) => {
			try {
				// Build recurrence rule if in repeat mode
				let isRecurring = false;
				let recurrenceRule: string | null = null;
				let customDatesForApi: string[] | undefined;

				if (data.dateMode === "repeat" && data.repeatFrequency) {
					if (data.repeatFrequency === "custom") {
						// Custom mode uses customDates array
						if (data.customDates && data.customDates.length > 0) {
							customDatesForApi = data.customDates.map((d) =>
								format(d, "yyyy-MM-dd"),
							);
						}
					} else {
						// Regular repeat mode
						isRecurring = true;
						const rule: Record<string, unknown> = {
							frequency: data.repeatFrequency,
						};
						if (data.repeatDays && data.repeatDays.length > 0) {
							rule.daysOfWeek = data.repeatDays;
						}
						if (data.repeatEndType === "on_date" && data.repeatEndDate) {
							rule.endDate = format(data.repeatEndDate, "yyyy-MM-dd");
						} else if (
							data.repeatEndType === "after_count" &&
							data.repeatEndCount
						) {
							rule.occurrences = data.repeatEndCount;
						}
						recurrenceRule = JSON.stringify(rule);
					}
				}

				await onCreateTask(
					selectedTaskListId,
					data.title,
					null,
					data.executionDate
						? format(data.executionDate, "yyyy-MM-dd")
						: format(new Date(), "yyyy-MM-dd"),
					data.categoryId,
					data.estimatedPomodoros,
					// Filter out empty subtasks
					data.subtasks?.filter((s) => s.title.trim() !== ""),
					isRecurring,
					recurrenceRule,
					customDatesForApi,
				);
				form.reset({
					title: "",
					dateMode: "single",
					executionDate: new Date(),
					startDate: undefined,
					endDate: undefined,
					repeatFrequency: undefined,
					repeatEndType: undefined,
					repeatEndDate: undefined,
					repeatEndCount: undefined,
					repeatDays: undefined,
					customDates: undefined,
					categoryId: undefined,
					estimatedPomodoros: 0,
					subtasks: [],
				});
				setTimeout(() => replaceSubtasks([]), 0);
				// Optionally reset focus to input?
			} catch (error) {
				console.error(error);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			// Prevent submission if IME is composing (for Japanese input mainly)
			if (e.nativeEvent.isComposing) return;

			if (e.key === "Enter") {
				e.preventDefault();
				form.handleSubmit(onSubmit)();
			}
		};

		// Global keyboard handler for Ctrl+Enter / Cmd+Enter to submit from anywhere
		const handleFormKeyDown = (e: React.KeyboardEvent) => {
			if (e.nativeEvent.isComposing) return;

			// Ctrl+Enter or Cmd+Enter submits from anywhere in the form
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit(onSubmit)();
			}
		};

		const watchedCategoryId = form.watch("categoryId");
		const hasSubtasks = subtaskFields.length > 0;

		const activeColorClass = watchedCategoryId
			? "text-indigo-600"
			: "text-gray-400";

		// Toggle for subtask expansion? Or always show if present?
		// If has subtasks, we show them.

		return (
			<FormProvider {...form}>
				<form
					className={cn(
						"group bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 relative",
						"focus-within:shadow-md focus-within:ring-4 focus-within:ring-indigo-500 focus-within:border-indigo-500",
						className,
					)}
					onKeyDown={handleFormKeyDown}
					onSubmit={(e) => {
						e.preventDefault();
						// Submission is handled manually via keydown/click handlers calling handleSubmit
					}}
				>
					{/* Main Input Row */}
					<div className="flex items-center px-3 py-1.5 gap-2">
						{/* Left Icon: ListTree - Clickable to add subtask */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className={cn(
								"shrink-0 h-7 w-7 hover:bg-indigo-50 transition-colors",
								hasSubtasks ? "text-indigo-600" : activeColorClass,
							)}
							onClick={() => {
								// Add a new subtask - SubtaskList will auto-focus via useEffect
								appendSubtask({ title: "", description: "" });
							}}
							title="Add subtask"
						>
							<ListTree className="w-5 h-5" />
						</Button>

						{/* Input Field */}
						<Controller
							control={form.control}
							name="title"
							render={({ field }) => (
								<Input
									{...field}
									onKeyDown={handleKeyDown}
									placeholder={placeholder || "タスクを追加..."}
									autoFocus={autoFocus}
									disabled={disabled || form.formState.isSubmitting}
									className="flex-1 border-none shadow-none focus-visible:ring-0 px-0 py-0 h-auto text-base placeholder:text-gray-400"
									value={field.value || ""}
									autoComplete="off"
								/>
							)}
						/>

						{/* Right Side Controls (Inline) */}
						<div className="flex items-center gap-1 shrink-0">
							{/* Category Select (Hidden trigger or Small Dot?) 
                                The image doesn't show a big selector. 
                                Maybe we keep it as a dot or integrate it?
                                For now, relying on the user to use the existing CategorySelect but styled minimally.
                             */}
							<Controller
								control={form.control}
								name="categoryId"
								render={({ field }) => (
									<CategorySelect
										selectedCategoryId={field.value}
										onCategoryChange={(value) => field.onChange(value)}
										onOpenChange={setOnOpen}
									/>
								)}
							/>

							{/* Pomodoro Input */}
							<Controller
								control={form.control}
								name="estimatedPomodoros"
								render={({ field }) => (
									<PomodoroInput
										value={field.value}
										onChange={field.onChange}
										className="w-auto h-8 px-1"
										color={
											field.value && field.value > 0
												? "text-indigo-500"
												: "text-gray-400"
										}
									/>
								)}
							/>

							{/* Date Scheduler - Single/Range/Repeat */}
							{showExecutionDate && <DateScheduler onOpenChange={setOnOpen} />}

							{/* Create Button */}
							<Button
								type="button"
								size="icon"
								className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shrink-0"
								onClick={() => form.handleSubmit(onSubmit)()}
								disabled={
									disabled ||
									form.formState.isSubmitting ||
									!form.watch("title")?.trim()
								}
								title="作成 (Ctrl+Enter)"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Subtasks Section - Renders below if exists */}
					<div
						className={cn(
							"transition-all duration-300 ease-in-out border-t border-transparent",
							hasSubtasks
								? "border-gray-100 pb-2"
								: "h-0 overflow-hidden opacity-0",
						)}
					>
						<div className="px-2 pt-1">
							<SubtaskList
								fields={subtaskFields}
								append={appendSubtask}
								remove={removeSubtask}
							/>
						</div>
					</div>
				</form>
			</FormProvider>
		);
	},
);

CreateTaskForm.displayName = "CreateTaskForm";
