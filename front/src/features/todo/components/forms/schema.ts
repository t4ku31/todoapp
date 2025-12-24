import { z } from "zod";

export const taskSchema = z.object({
	title: z.string().min(1, "タイトルを入力してください"),

	executionDate: z.date().optional(),
	categoryId: z.number().optional(),
});

export const taskListSchema = z.object({
	title: z.string().min(1, "リスト名を入力してください"),
	date: z.date().optional(),
	tasks: z.array(taskSchema),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type TaskListFormValues = z.infer<typeof taskListSchema>;
