import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarDays, CalendarRange, Repeat } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useRecurrenceForm } from "@/features/task/hooks/useRecurrenceForm";
import { cn } from "@/lib/utils";
import type { Frequency, TaskFormValues } from "../forms/schema";
import { DatePickerContent, type RecurrenceData } from "./DatePickerContent";

interface DateSchedulerProps {
	className?: string;
	activeColor?: string;
	onOpenChange?: (open: boolean) => void;
}

const REPEAT_FREQUENCIES: { value: Frequency; label: string }[] = [
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "CUSTOM", label: "Custom" },
];

export function DateScheduler({
	className,
	activeColor = "text-indigo-600",
	onOpenChange,
}: DateSchedulerProps) {
	const { control, setValue } = useFormContext<TaskFormValues>();
	// Watch form values
	const dateMode = useWatch({ control, name: "dateMode" }) || "single";
	const recurrenceRule = useWatch({ control, name: "recurrenceRule" });
	const scheduledStartAt = useWatch({ control, name: "scheduledStartAt" });
	const scheduledEndAt = useWatch({ control, name: "scheduledEndAt" });

	const frequency = recurrenceRule?.frequency;
	const occurs = recurrenceRule?.occurs || [];

	const { form, convertToConfig } = useRecurrenceForm({
		recurrenceRule,
		selectedDate: scheduledStartAt,
	});

	const [isOpen, setIsOpen] = useState(false);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		onOpenChange?.(open);
	};

	// Format display text based on mode
	const getDisplayText = () => {
		switch (dateMode) {
			case "single":
				return scheduledStartAt
					? format(scheduledStartAt, "M/d", { locale: enUS })
					: null;
			case "range":
				if (scheduledStartAt && scheduledEndAt) {
					return `${format(scheduledStartAt, "M/d")}-${format(scheduledEndAt, "M/d")}`;
				}
				if (scheduledStartAt) {
					return `${format(scheduledStartAt, "M/d")}~`;
				}
				return null;
			case "repeat":
				if (frequency === "CUSTOM" && occurs.length > 0) {
					return `${occurs.length} days`;
				}
				return frequency ? getRepeatLabel(frequency) : null;
			default:
				return null;
		}
	};

	const getRepeatLabel = (freq: Frequency) => {
		const found = REPEAT_FREQUENCIES.find((f) => f.value === freq);
		return found ? found.label : freq;
	};

	const getIcon = () => {
		switch (dateMode) {
			case "range":
				return <CalendarRange className="w-5 h-5" />;
			case "repeat":
				return <Repeat className="w-5 h-5" />;
			default:
				return <CalendarDays className="w-5 h-5" />;
		}
	};

	const hasValue =
		scheduledStartAt || scheduledEndAt || frequency || occurs.length > 0;

	const displayText = getDisplayText();

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"h-8 px-2 hover:bg-gray-100/50 gap-1 font-normal transition-colors",
						hasValue ? activeColor : "text-gray-400",
						className,
					)}
				>
					{getIcon()}
					{displayText && (
						<span className="text-sm font-medium">{displayText}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="end">
				<DatePickerContent
					defaultMode={dateMode}
					selectedDate={scheduledStartAt}
					dateRange={
						scheduledStartAt || scheduledEndAt
							? { from: scheduledStartAt, to: scheduledEndAt }
							: undefined
					}
					recurrenceRule={recurrenceRule}
					customDates={occurs}
					form={form}
					onDateSelect={(date: Date | undefined) => {
						setValue("dateMode", "single");
						setValue("scheduledStartAt", date);
						setValue("scheduledEndAt", undefined);
						setValue("recurrenceRule", undefined);
					}}
					onStartDateChange={(date: Date | undefined) => {
						setValue("scheduledStartAt", date);
					}}
					onRangeSelect={(range: DateRange | undefined) => {
						setValue("dateMode", "range");
						// Ensure from <= to by swapping if needed
						if (range?.from && range?.to && range.to < range.from) {
							setValue("scheduledStartAt", range.to);
							setValue("scheduledEndAt", range.from);
						} else {
							setValue("scheduledStartAt", range?.from);
							setValue("scheduledEndAt", range?.to);
						}
						setValue("recurrenceRule", undefined);
					}}
					onRecurrenceChange={(data: RecurrenceData) => {
						if (data.isRecurring) {
							setValue("dateMode", "repeat");
							setValue("recurrenceRule", data.recurrenceRule);
						} else {
							setValue("recurrenceRule", undefined);
							// setValue("recurringConfig", undefined); // Clear config - Removed invalid field
							setValue("dateMode", "single");
						}
					}}
					onSubmit={(data) => {
						const config = convertToConfig(data);
						if (config) {
							setValue("dateMode", "repeat");
							setValue("recurrenceRule", config);
						} else {
							setValue("dateMode", "single");
							setValue("recurrenceRule", undefined);
						}
						setIsOpen(false);
					}}
					onCustomDatesChange={(_dates: Date[]) => {}}
					onClose={() => setIsOpen(false)}
				/>
			</PopoverContent>
		</Popover>
	);
}
