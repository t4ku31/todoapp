import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { RecurrenceConfig } from "@/features/todo/types";
import {
	type DayOfWeek,
	dayOfWeekSchema,
	type Frequency,
	frequencySchema,
} from "../components/forms/schema";

// Schema for internal recurrence form
export const recurrenceFormSchema = z.object({
	frequency: frequencySchema.optional(),
	days: z.array(dayOfWeekSchema).default([]),
	endType: z.enum(["never", "on_date", "after_count"]).default("never"),
	until: z.date().optional(),
	occurrences: z.number().min(1).default(10),
	customDates: z.array(z.date()).default([]),
	scheduledStartAt: z.date().optional(),
});

export type RecurrenceFormValues = z.infer<typeof recurrenceFormSchema>;

interface UseRecurrenceFormProps {
	recurrenceRule?: RecurrenceConfig;
	selectedDate?: Date;
	customDates?: Date[];
}

export function useRecurrenceForm({
	recurrenceRule,
	selectedDate,
	customDates = [],
}: UseRecurrenceFormProps) {
	// Parse recurrence rule for initial form state
	const parseRecurrence = useCallback(
		(rule?: RecurrenceConfig): RecurrenceFormValues => {
			const dayMap: Record<string, DayOfWeek> = {
				SUNDAY: "SUNDAY",
				MONDAY: "MONDAY",
				TUESDAY: "TUESDAY",
				WEDNESDAY: "WEDNESDAY",
				THURSDAY: "THURSDAY",
				FRIDAY: "FRIDAY",
				SATURDAY: "SATURDAY",
			};

			return {
				frequency: rule?.frequency as Frequency | undefined,
				days: rule?.byDay ? rule?.byDay.map((d) => dayMap[d] || "MONDAY") : [],
				endType: rule?.until
					? "on_date"
					: rule?.count
						? "after_count"
						: "never",
				until: rule?.until,
				occurrences: rule?.count || 10,
				customDates: customDates,
				scheduledStartAt: selectedDate,
			};
		},
		[customDates, selectedDate],
	);

	const defaultValues = parseRecurrence(recurrenceRule);

	const form = useForm<RecurrenceFormValues>({
		defaultValues,
	});

	const convertToConfig = (
		data: RecurrenceFormValues,
	): RecurrenceConfig | undefined => {
		if (data.frequency) {
			const config: RecurrenceConfig = {
				frequency: data.frequency,
			};

			if (data.frequency === "WEEKLY" && data.days.length > 0) {
				config.byDay = data.days;
			}

			if (data.endType === "on_date" && data.until) {
				config.until = data.until;
			} else if (data.endType === "after_count") {
				config.count = data.occurrences;
			}

			return config;
		}

		if (data.frequency === undefined && data.customDates.length > 0) {
			return {
				frequency: "CUSTOM",
				occurs: data.customDates,
			};
		}

		return undefined;
	};

	return {
		form,
		convertToConfig,
	};
}
