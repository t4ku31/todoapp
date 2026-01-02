import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarCheck2, Plus } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CategorySelect } from "../ui/CategorySelect";
import { TaskListSelector } from "../ui/TaskListSelector";
import { type TaskFormValues, taskSchema } from "./schema";

interface CreateTaskFormProps {
	taskListId: number;
	onCreateTask: (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		categoryId?: number,
		estimatedDuration?: number,
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
			showListSelector = true,
			showExecutionDate = true,
		},
		_ref,
	) => {
		const [selectedTaskListId, setSelectedTaskListId] = useState(taskListId);
		const [onOpen, setOnOpen] = useState(false);
		// Sync local state if prop changes
		useEffect(() => {
			setSelectedTaskListId(taskListId);
		}, [taskListId]);

		const form = useForm<TaskFormValues>({
			resolver: zodResolver(taskSchema),
			defaultValues: {
				title: "",
				executionDate: new Date(),
				categoryId: undefined,
				estimatedDuration: undefined,
			},
		});

		const onSubmit = async (data: TaskFormValues) => {
			try {
				await onCreateTask(
					selectedTaskListId,
					data.title,
					null,
					data.executionDate
						? format(data.executionDate, "yyyy-MM-dd")
						: format(new Date(), "yyyy-MM-dd"),
					data.categoryId,
					data.estimatedDuration,
				);
				form.reset({
					title: "",
					executionDate: new Date(),
					categoryId: undefined,
					estimatedDuration: undefined,
				});
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

		return (
			<div
				className={cn(
					"bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden",
					"focus-within:shadow-md focus-within:ring-5 focus-within:ring-indigo-500 focus-within:border-transparent",
					onOpen && "shadow-md ring-5 ring-indigo-500 border-transparent",
					className,
				)}
			>
				{/* Top half: Input */}
				<Controller
					control={form.control}
					name="title"
					render={({ field }) => (
						<Input
							{...field}
							onKeyDown={handleKeyDown}
							placeholder={placeholder || "新しいタスクを追加..."}
							autoFocus={autoFocus}
							disabled={disabled || form.formState.isSubmitting}
							className="border-none shadow-none text-base px-4 py-3 h-auto focus-visible:ring-0 rounded-none placeholder:text-gray-400"
							value={field.value || ""}
						/>
					)}
				/>

				{/* Bottom half: Controls */}
				<div className="flex items-center justify-between px-3 pb-3 pt-1">
					<div className="flex items-center gap-2">
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

						<Controller
							control={form.control}
							name="estimatedDuration"
							render={({ field }) => (
								<Popover onOpenChange={setOnOpen}>
									<PopoverTrigger asChild>
										<Badge
											variant="outline"
											className={cn(
												"border-none font-normal cursor-pointer hover:scale-105 transition-all duration-200 ease-in-out",
												field.value
													? "bg-amber-100 text-amber-700 hover:bg-amber-200"
													: "text-muted-foreground hover:bg-gray-100/80 hover:text-gray-700",
											)}
										>
											<span className="text-xs">
												{field.value ? `${field.value} min` : "時間"}
											</span>
										</Badge>
									</PopoverTrigger>
									<PopoverContent className="w-40 p-2" align="start">
										<div className="space-y-2">
											<p className="text-xs font-semibold text-center text-gray-500">
												予想時間 (分)
											</p>
											<Input
												type="number"
												min="0"
												placeholder="0"
												value={field.value || ""}
												onChange={(e) => {
													const val = e.target.value
														? parseInt(e.target.value, 10)
														: undefined;
													field.onChange(val);
												}}
												className="h-8 text-sm"
												autoFocus
											/>
										</div>
									</PopoverContent>
								</Popover>
							)}
						/>

						{showExecutionDate && (
							<Controller
								control={form.control}
								name="executionDate"
								render={({ field }) => (
									<Popover onOpenChange={setOnOpen}>
										<PopoverTrigger asChild>
											<Badge
												size="sm"
												// onClick={() => setOnOpen(true)} // Handled by Popover onOpenChange
												className={cn(
													"border-none font-normal cursor-pointer hover:scale-105 transition-all duration-200 ease-in-out",
													field.value
														? "bg-indigo-500 text-white hover:bg-indigo-600"
														: "text-muted-foreground hover:bg-gray-100/80 hover:text-gray-700",
												)}
											>
												<CalendarCheck2
													className={cn(
														"h-4 w-4 mr-1.5",
														field.value ? "text-white" : "",
													)}
												/>
												<span
													className={cn(
														"text-xs",
														field.value ? "text-white" : "",
													)}
												>
													{field.value ? format(field.value, "M/d") : "日付"}
												</span>
											</Badge>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<div className="p-2 border-b text-xs font-semibold text-center text-blue-600">
												実行日 (Execution Date)
											</div>
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								)}
							/>
						)}

						{showListSelector && (
							<TaskListSelector
								currentTaskListId={selectedTaskListId}
								onTaskListChange={setSelectedTaskListId}
								onOpenChange={setOnOpen}
							/>
						)}
					</div>

					<div className="flex items-center gap-2">
						<Button
							onClick={(e) => {
								e.preventDefault();
								form.handleSubmit(onSubmit)();
								setOnOpen(false);
							}}
							size="icon"
							disabled={
								disabled ||
								form.formState.isSubmitting ||
								!form.formState.isValid
							}
							className={cn(
								"h-8 w-8 rounded-full transition-all duration-200 shadow-sm",
								form.formState.isValid
									? "bg-indigo-500 hover:bg-indigo-600 text-white"
									: "bg-indigo-200 text-indigo-600 hover:bg-indigo-200",
							)}
						>
							<Plus className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>
		);
	},
);

CreateTaskForm.displayName = "CreateTaskForm";
