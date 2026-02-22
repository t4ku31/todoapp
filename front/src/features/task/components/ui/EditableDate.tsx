import { format, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Flag, Repeat } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useRecurrenceForm } from "@/features/task/hooks/useRecurrenceForm";
import type { RecurrenceConfig } from "@/features/task/types";
import { DatePickerContent, type RecurrenceData } from "./DatePickerContent";
import { IconBadge } from "./IconBadge";

interface EditableDateProps {
	id: string;
	type?: "dueDate" | "scheduledDate";
	date?: Date | string | null;
	onDateChange: (id: string, newDate: Date) => Promise<void>;
	onRecurrenceChange?: (
		id: string,
		recurrence: RecurrenceData,
	) => Promise<void>;
	onOpenChange?: (open: boolean) => void;
	// Current recurrence state for initialization
	isRecurring?: boolean;
	recurrenceRule?: RecurrenceConfig;
}

export function EditableDate({
	id,
	type,
	date,
	onDateChange,
	onRecurrenceChange,
	onOpenChange,
	isRecurring: initialIsRecurring = false,
	recurrenceRule: initialRecurrenceRule,
}: EditableDateProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Single date mode
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		date ? new Date(date) : undefined,
	);

	// Range mode
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [endDate, setEndDate] = useState<Date | undefined>();

	// Recurrence form logic
	const { form, convertToConfig } = useRecurrenceForm({
		recurrenceRule: initialRecurrenceRule,
		selectedDate: date ? new Date(date) : undefined,
	});

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		onOpenChange?.(open);

		if (open && date) {
			setSelectedDate(new Date(date));
		}
	};

	const getIconComponent = () => {
		if (initialIsRecurring) return Repeat;
		return type === "dueDate" ? Flag : CalendarIcon;
	};

	const getColorScheme = (): "indigo" | "amber" | "rose" => {
		if (type === "dueDate") {
			return date && isBefore(new Date(date), startOfDay(new Date()))
				? "rose"
				: "amber";
		}
		return "indigo";
	};

	// Helper to get display text for current state
	const getDisplayText = () => {
		if (initialIsRecurring && initialRecurrenceRule) {
			if (
				initialRecurrenceRule.frequency === "CUSTOM" &&
				initialRecurrenceRule.occurs
			) {
				return `${initialRecurrenceRule.occurs.length} days`;
			}
			return initialRecurrenceRule.frequency;
		}
		return selectedDate ? format(selectedDate, "M/d") : null;
	};

	const displayText = getDisplayText();

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<IconBadge
					icon={getIconComponent()}
					variant="soft"
					colorScheme={getColorScheme()}
					onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
				>
					{displayText || (type === "dueDate" ? "期限" : "実行日")}
				</IconBadge>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0"
				align="center"
				side="right"
				sideOffset={8}
				collisionPadding={16}
				onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
			>
				<DatePickerContent
					defaultMode={initialIsRecurring ? "repeat" : "single"}
					selectedDate={selectedDate}
					dateRange={
						startDate || endDate ? { from: startDate, to: endDate } : undefined
					}
					recurrenceRule={initialRecurrenceRule}
					customDates={initialRecurrenceRule?.occurs}
					form={form}
					onDateSelect={async (newDate: Date | undefined) => {
						if (newDate) {
							setSelectedDate(newDate);
							setIsOpen(false);

							// Clear recurrence when selecting a single date
							if (onRecurrenceChange) {
								await onRecurrenceChange(id, {
									isRecurring: false,
									recurrenceRule: undefined,
								});
							}

							await onDateChange(id, newDate);
							onOpenChange?.(false);
						}
					}}
					onStartDateChange={async (newDate: Date | undefined) => {
						if (newDate) {
							// Just update the date without clearing recurrence
							await onDateChange(id, newDate);
						}
					}}
					onRangeSelect={async (range: DateRange | undefined) => {
						if (range) {
							setStartDate(range.from);
							setEndDate(range.to);

							// If both dates selected, use the start date
							if (range.from) {
								// Clear recurrence when selecting a date range
								if (onRecurrenceChange) {
									await onRecurrenceChange(id, {
										isRecurring: false,
										recurrenceRule: undefined,
									});
								}

								await onDateChange(id, range.from);
							}
						}
					}}
					onRecurrenceChange={async (data: RecurrenceData) => {
						console.log("EditableDate onRecurrenceChange data:", data); // DEBUG
						if (onRecurrenceChange) {
							await onRecurrenceChange(id, data);
						}
					}}
					onCustomDatesChange={(_dates: Date[]) => {
						// Optional immediate feedback
					}}
					onSubmit={(data) => {
						const config = convertToConfig(data);
						if (config) {
							onRecurrenceChange?.(id, {
								isRecurring: true,
								recurrenceRule: config,
							});
						} else {
							onRecurrenceChange?.(id, {
								isRecurring: false,
								recurrenceRule: undefined,
							});
						}
						setIsOpen(false);
					}}
					onClose={() => setIsOpen(false)}
				/>
			</PopoverContent>
		</Popover>
	);
}
