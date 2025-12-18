import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { apiClient } from "@/config/env";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/store/useTodoStore";
import type { TaskList } from "@/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Check, Plus, Trash2, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { TaskInput } from "./TaskInput";
import { type TaskListFormValues, taskListSchema } from "./schema";

interface CreateTaskListFormProps {
	onTaskListCreated: (newTaskList: TaskList) => void;
	onCancel: () => void;
	className?: string;
}

export default function CreateTaskListForm({
	onTaskListCreated,
	onCancel,
	className,
}: CreateTaskListFormProps) {
	const defaultCategoryId = useTodoStore((state) => state.categories[0]?.id);
	
	const form = useForm<TaskListFormValues>({
		resolver: zodResolver(taskListSchema),
		defaultValues: {
			title: "",
			date: new Date(),
			tasks: [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "tasks",
	});

	// Add new task
	const handleAddTask = () => {
		append({
			title: "",
			executionDate: new Date(),
			categoryId: defaultCategoryId,
		});
	};

	// Save task list
	const onSubmit = async (data: TaskListFormValues) => {
		console.log("arg from onSubmit:", data);

		const validTasks = data.tasks.filter((t) => t.title && t.title.trim() !== "").map((t) => ({
			title: t.title,
			executionDate: t.executionDate
				? format(t.executionDate, "yyyy-MM-dd")
				: null,
			categoryId: t.categoryId,
		}));
		console.log("validTasks from onSubmit:", validTasks);
		if (validTasks.length === 0 && !data.title) return; // Should be handled by validation but extra safety

		const tasklist = {
			title: data.title,
			tasks: validTasks,
			dueDate: data.date ? format(data.date, "yyyy-MM-dd") : null,
		};

		try {
			console.log("Request new list:", tasklist);
			const response = await apiClient.post<TaskList>(
				"/api/tasklists",
				tasklist,
			);
			console.log("Response new list:", response.data);
			onTaskListCreated(response.data);
		} catch (error) {
			console.error("Failed to create task list:", error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			form.handleSubmit(onSubmit)();
		} else if (e.key === "Escape") {
			onCancel();
		}
	};

	return (
		<div
			className={`flex flex-col gap-3 p-4 border rounded-lg bg-card shadow-sm ${className}`}
		>
			<div className="flex items-center gap-2">
				<Input
					autoFocus
					{...form.register("title")}
					onKeyDown={handleKeyDown}
					placeholder="リスト名を入力..."
					className="font-semibold"
				/>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant={"outline"}
							className={cn(
								"w-[240px] justify-start text-left font-normal",
								!form.watch("date") && "text-muted-foreground",
							)}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{form.watch("date") ? (
								format(form.getValues("date")!, "PPP")
							) : (
								<span>Pick a date</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={form.watch("date")}
							onSelect={(date) => form.setValue("date", date)}
							initialFocus
							className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
						/>
					</PopoverContent>
				</Popover>
				<Button
					onClick={form.handleSubmit(onSubmit)}
					size="sm"
					variant="outline"
					className="h-9 w-9 p-0 shrink-0"
				>
					<Check className="size-4" />
				</Button>
				<Button
					onClick={onCancel}
					size="sm"
					variant="ghost"
					className="h-9 w-9 p-0 shrink-0"
				>
					<X className="size-4" />
				</Button>
			</div>

			<div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
				{fields.map((field, index) => (
					<div key={field.id} className="flex items-center gap-2">
						<TaskInput
							control={form.control}
							namePrefix={`tasks.${index}`}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddTask();
								}
							}}
							placeholder={`タスク ${index + 1}`}
							className="flex-1"
							endAdornment={
								<Button
									onClick={() => remove(index)}
									size="sm"
									variant="ghost"
									className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
								>
									<Trash2 className="size-4" />
								</Button>
							}
						/>
					</div>
				))}
				<Button
					onClick={handleAddTask}
					variant="ghost"
					size="sm"
					className="text-muted-foreground hover:text-foreground h-8 px-2"
				>
					<Plus className="size-3 mr-1" />
					タスクを追加
				</Button>
			</div>
		</div>
	);
}
