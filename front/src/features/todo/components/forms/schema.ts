import { z } from "zod";

// Date mode: single execution date, date range, or repeating
export const dateModeSchema = z.enum(["single", "range", "repeat"]);

export type DateMode = z.infer<typeof dateModeSchema>;

// Days of week - matches RecurrenceConfig.byDay
export const dayOfWeekSchema = z.enum([
	"SUNDAY",
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
]);

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

// Frequency - matches RecurrenceConfig.frequency
export const frequencySchema = z.enum([
	"DAILY",
	"WEEKLY",
	"MONTHLY",
	"YEARLY",
	"CUSTOM",
]);

export type Frequency = z.infer<typeof frequencySchema>;

// RecurrenceConfig schema - directly matches RecurrenceConfig type
export const recurrenceConfigSchema = z.object({
	frequency: frequencySchema,
	interval: z.number().min(1).optional(),
	byDay: z.array(dayOfWeekSchema).optional(),
	until: z.date().optional(),
	count: z.number().min(1).optional(),
	occurs: z.array(z.date()).optional(),
});

export type RecurrenceConfigFormValues = z.infer<typeof recurrenceConfigSchema>;

export const taskSchema = z
	.object({
		title: z.string().min(1, "タイトルを入力してください"),

		// Date Configuration
		dateMode: dateModeSchema,
		scheduledStartAt: z.date().optional(), // Start datetime for all modes
		scheduledEndAt: z.date().optional(), // Range mode end
		isRecurring: z.boolean().optional(),
		// Recurrence Configuration - unified with RecurrenceConfig type
		recurrenceRule: recurrenceConfigSchema.optional(),

		categoryId: z.number().optional(),
		estimatedPomodoros: z.number().optional(),
		subtasks: z
			.array(
				z.object({
					title: z.string(), // Allow empty - will be filtered in onSubmit
					description: z.string().optional(),
					isCompleted: z.boolean().optional(),
					orderIndex: z.number().optional(),
				}),
			)
			.optional(),
	})
	.refine(
		(data) => {
			// Only validate if both dates are set
			if (data.scheduledStartAt && data.scheduledEndAt) {
				return data.scheduledEndAt >= data.scheduledStartAt;
			}
			return true;
		},
		{
			message: "終了日は開始日以降にしてください",
			path: ["scheduledEndAt"],
		},
	);

export const taskListSchema = z.object({
	title: z.string().min(1, "リスト名を入力してください"),
	date: z.date().optional(),
	tasks: z.array(taskSchema),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type TaskListFormValues = z.infer<typeof taskListSchema>;
