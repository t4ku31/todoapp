import { z } from "zod";

// Repeat frequency options
export const repeatFrequencySchema = z.enum([
	"daily",
	"weekly",
	"monthly",
	"yearly",
	"custom",
]);

export type RepeatFrequency = z.infer<typeof repeatFrequencySchema>;

// Date mode: single execution date, date range, or repeating
export const dateModeSchema = z.enum(["single", "range", "repeat"]);

export type DateMode = z.infer<typeof dateModeSchema>;

// Repeat unit for custom frequency
export const repeatUnitSchema = z.enum(["day", "week", "month", "year"]);

export type RepeatUnit = z.infer<typeof repeatUnitSchema>;

// Days of week for weekly repeat
export const dayOfWeekSchema = z.enum([
	"sun",
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
]);

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

// Repeat end type: never, on date, or after X occurrences
export const repeatEndTypeSchema = z.enum(["never", "on_date", "after_count"]);

export type RepeatEndType = z.infer<typeof repeatEndTypeSchema>;

export const taskSchema = z
	.object({
		title: z.string().min(1, "タイトルを入力してください"),

		// Date Configuration
		dateMode: dateModeSchema,
		executionDate: z.date().optional(), // Single date mode
		startDate: z.date().optional(), // Range mode start
		endDate: z.date().optional(), // Range mode end

		// Repeat Configuration
		repeatFrequency: repeatFrequencySchema.optional(),
		repeatInterval: z.number().min(1).optional(), // Every X units (e.g., every 2 weeks)
		repeatUnit: repeatUnitSchema.optional(), // Unit for custom repeat
		repeatDays: z.array(dayOfWeekSchema).optional(), // Specific days for weekly
		customDates: z.array(z.date()).optional(), // Multiple specific dates for custom

		// Repeat End Configuration
		repeatEndType: repeatEndTypeSchema.optional(), // How the repeat ends
		repeatEndDate: z.date().optional(), // End date when repeatEndType is "on_date"
		repeatEndCount: z.number().min(1).optional(), // Number of occurrences when repeatEndType is "after_count"

		categoryId: z.number().optional(),
		estimatedPomodoros: z.number().optional(),
		subtasks: z
			.array(
				z.object({
					title: z.string(), // Allow empty - will be filtered in onSubmit
					description: z.string().optional(),
				}),
			)
			.optional(),
	})
	.refine(
		(data) => {
			// Only validate if both dates are set
			if (data.startDate && data.endDate) {
				return data.endDate >= data.startDate;
			}
			return true;
		},
		{
			message: "終了日は開始日以降にしてください",
			path: ["endDate"],
		},
	);

export const taskListSchema = z.object({
	title: z.string().min(1, "リスト名を入力してください"),
	date: z.date().optional(),
	tasks: z.array(taskSchema),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type TaskListFormValues = z.infer<typeof taskListSchema>;
