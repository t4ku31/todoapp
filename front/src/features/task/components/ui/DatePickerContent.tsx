import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarDays, CalendarRange, Repeat } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { RecurrenceFormValues } from "@/features/task/hooks/useRecurrenceForm";
import type { RecurrenceConfig } from "@/features/task/types";
import { cn } from "@/lib/utils";
import type { DayOfWeek, Frequency } from "../forms/schema";

export type DateMode = "single" | "range" | "repeat";

export interface RecurrenceData {
	isRecurring: boolean;
	recurrenceRule?: RecurrenceConfig;
}

interface DatePickerContentProps {
	defaultMode?: DateMode;
	selectedDate?: Date;
	dateRange?: DateRange;
	recurrenceRule?: RecurrenceConfig;
	customDates?: Date[];
	onDateSelect: (date: Date | undefined) => void;
	onRangeSelect: (range: DateRange | undefined) => void;
	onRecurrenceChange: (data: RecurrenceData) => void;
	onCustomDatesChange?: (dates: Date[]) => void;
	onClose: () => void;
	onStartDateChange?: (date: Date | undefined) => void;
	form: UseFormReturn<RecurrenceFormValues>;
	onSubmit: (data: RecurrenceFormValues) => void;
}

const REPEAT_FREQUENCIES: { value: Frequency; label: string }[] = [
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "YEARLY", label: "Yearly" },
	{ value: "CUSTOM", label: "Custom" },
];

const dayOptions: { value: DayOfWeek; label: string }[] = [
	{ value: "SUNDAY", label: "S" },
	{ value: "MONDAY", label: "M" },
	{ value: "TUESDAY", label: "T" },
	{ value: "WEDNESDAY", label: "W" },
	{ value: "THURSDAY", label: "T" },
	{ value: "FRIDAY", label: "F" },
	{ value: "SATURDAY", label: "S" },
];
export function DatePickerContent({
	defaultMode = "single",
	selectedDate,
	dateRange,
	onDateSelect,
	onRangeSelect,
	onCustomDatesChange,
	onClose,
	onStartDateChange,
	form,
	onSubmit,
}: DatePickerContentProps) {
	// Internal state for mode (Uncontrolled)
	const [internalMode, setInternalMode] = useState<DateMode>(defaultMode);
	const currentMode = internalMode;

	const handleModeChange = (newMode: DateMode) => {
		setInternalMode(newMode);
	};

	const { watch, setValue, handleSubmit } = form;

	const repeatFrequency = watch("frequency");
	const repeatDays = watch("days");
	const repeatEndType = watch("endType");
	const repeatEndDate = watch("until");
	const repeatEndCount = watch("occurrences");
	const customDates = watch("customDates");
	const repeatStartDate = watch("scheduledStartAt");

	const getRepeatLabel = (freq: Frequency) => {
		const found = REPEAT_FREQUENCIES.find((f) => f.value === freq);
		return found ? found.label : freq;
	};

	const getDayFullLabel = (day: DayOfWeek) => {
		const labels: Record<DayOfWeek, string> = {
			SUNDAY: "Sun",
			MONDAY: "Mon",
			TUESDAY: "Tue",
			WEDNESDAY: "Wed",
			THURSDAY: "Thu",
			FRIDAY: "Fri",
			SATURDAY: "Sat",
		};
		return labels[day] || day;
	};

	const getEndSummary = () => {
		switch (repeatEndType) {
			case "never":
				return "Forever";
			case "on_date":
				return repeatEndDate
					? `Until ${format(repeatEndDate, "MMM d", { locale: enUS })}`
					: "Until...";
			case "after_count":
				return `${repeatEndCount} times`;
			default:
				return "";
		}
	};

	const handleCustomDateSelectInternal = (dates: Date[] | undefined) => {
		const newDates = dates || [];
		setValue("customDates", newDates);
		onCustomDatesChange?.(newDates);
	};

	return (
		<div className="w-auto p-0" onPointerDown={(e) => e.stopPropagation()}>
			{/* Tab Selector */}
			<div className="flex border-b">
				<button
					type="button"
					onClick={() => handleModeChange("single")}
					className={cn(
						"flex-1 px-4 py-2 text-sm font-medium transition-colors",
						currentMode === "single"
							? "border-b-2 border-indigo-500 text-indigo-600"
							: "text-gray-500 hover:text-gray-700",
					)}
				>
					<CalendarDays className="w-4 h-4 inline-block mr-1" />
					Date
				</button>
				<button
					type="button"
					onClick={() => handleModeChange("range")}
					className={cn(
						"flex-1 px-4 py-2 text-sm font-medium transition-colors",
						currentMode === "range"
							? "border-b-2 border-indigo-500 text-indigo-600"
							: "text-gray-500 hover:text-gray-700",
					)}
				>
					<CalendarRange className="w-4 h-4 inline-block mr-1" />
					Range
				</button>
				<button
					type="button"
					onClick={() => handleModeChange("repeat")}
					className={cn(
						"flex-1 px-4 py-2 text-sm font-medium transition-colors",
						currentMode === "repeat"
							? "border-b-2 border-indigo-500 text-indigo-600"
							: "text-gray-500 hover:text-gray-700",
					)}
				>
					<Repeat className="w-4 h-4 inline-block mr-1" />
					Repeat
				</button>
			</div>

			{/* Content based on active tab */}
			<div className="p-2 pb-3">
				{currentMode === "single" && (
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={(date) => {
							onDateSelect(date);
							if (date) onClose();
						}}
						locale={enUS}
						initialFocus
						className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
					/>
				)}

				{currentMode === "range" && (
					<div className="space-y-3">
						<div className="text-xs font-medium text-gray-500 px-2">
							Start - End
						</div>
						<Calendar
							mode="range"
							selected={dateRange}
							onSelect={(range) => {
								onRangeSelect(range);
							}}
							locale={enUS}
							numberOfMonths={1}
							initialFocus
							className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
						/>
					</div>
				)}

				{currentMode === "repeat" && (
					<div className="p-3 min-w-[280px] max-w-[320px] max-h-[400px] flex flex-col overflow-y-auto">
						{/* Frequency Selection */}
						<div className="space-y-2 flex-shrink-0">
							<div className="text-xs font-medium text-gray-700">Repeat</div>
							<div className="flex flex-wrap gap-1.5">
								{REPEAT_FREQUENCIES.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() => {
											if (repeatFrequency === option.value) {
												setValue("frequency", undefined);
												setValue("endType", "never");
											} else {
												setValue("frequency", option.value);
												if (repeatEndType === "never") {
													setValue("endType", "never");
												}
											}
										}}
										className={cn(
											"px-2.5 py-1.5 text-xs rounded-md border-2 transition-all font-medium",
											repeatFrequency === option.value
												? "border-indigo-500 bg-indigo-50 text-indigo-700"
												: "border-gray-200 hover:border-indigo-300 text-gray-600",
										)}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>

						{/* Weekly: Day of week selection */}
						{repeatFrequency === "WEEKLY" && (
							<div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
								<div className="text-xs font-medium text-gray-700 mb-1.5">
									Days
								</div>
								<div className="flex gap-1">
									{dayOptions.map((day) => {
										const isSelected = repeatDays.includes(day.value);
										return (
											<button
												key={day.value}
												type="button"
												onClick={() => {
													if (isSelected) {
														setValue(
															"days",
															repeatDays.filter(
																(d: DayOfWeek) => d !== day.value,
															),
														);
													} else {
														setValue("days", [...repeatDays, day.value]);
													}
												}}
												className={cn(
													"w-8 h-8 rounded-full text-xs font-medium transition-all",
													isSelected
														? "bg-indigo-500 text-white"
														: "bg-gray-100 text-gray-600 hover:bg-indigo-100",
													day.value === "SUNDAY" &&
														!isSelected &&
														"text-red-500",
													day.value === "SATURDAY" &&
														!isSelected &&
														"text-blue-500",
												)}
											>
												{day.label}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Custom: Multi-select calendar */}
						{repeatFrequency === "CUSTOM" && (
							<div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
								<div className="text-xs font-medium text-gray-700 mb-1.5">
									Select dates
								</div>
								<Calendar
									mode="multiple"
									selected={customDates}
									onSelect={handleCustomDateSelectInternal}
									locale={enUS}
									className="p-2 [&_table]:w-full [&_table]:border-collapse [&_td]:w-8 [&_td]:h-8 [&_th]:w-8 [&_th]:h-8 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_th]:text-xs [&_button]:w-8 [&_button]:h-8 [&_button]:text-xs"
								/>
								{customDates.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{customDates
											.sort((a: Date, b: Date) => a.getTime() - b.getTime())
											.slice(0, 5)
											.map((d: Date) => (
												<span
													key={d.toISOString()}
													className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
												>
													{format(d, "M/d", { locale: enUS })}
												</span>
											))}
										{customDates.length > 5 && (
											<span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
												+{customDates.length - 5} more
											</span>
										)}
									</div>
								)}
							</div>
						)}

						{/* Start Date - for daily/weekly/monthly */}
						{repeatFrequency && repeatFrequency !== "CUSTOM" && (
							<div className="mt-3 pt-3 border-t border-gray-100">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-gray-700">
										Start
									</span>
									<Popover>
										<PopoverTrigger asChild>
											<button
												type="button"
												className={cn(
													"px-2 py-1 text-xs rounded border transition-all",
													repeatStartDate
														? "border-indigo-300 bg-indigo-50 text-indigo-700"
														: "border-gray-200 text-gray-500 hover:border-indigo-300",
												)}
											>
												{repeatStartDate
													? format(repeatStartDate, "MMM d", { locale: enUS })
													: "Select date"}
											</button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="end">
											<Calendar
												mode="single"
												selected={repeatStartDate}
												onSelect={(date) => {
													setValue("scheduledStartAt", date);
													onStartDateChange?.(date);
												}}
												locale={enUS}
												className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
							</div>
						)}

						{/* Repeat End Section - for all repeat types except custom */}
						{repeatFrequency && repeatFrequency !== "CUSTOM" && (
							<div className="mt-3 pt-3 border-t border-gray-100">
								<div className="text-xs font-medium text-gray-700 mb-2">
									Ends
								</div>
								<div className="space-y-1.5">
									{/* Never */}
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="radio"
											name="repeatEndType"
											checked={repeatEndType === "never"}
											onChange={() => setValue("endType", "never")}
											className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
										/>
										<span className="text-xs text-gray-700">Never</span>
									</label>

									{/* On Date */}
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="radio"
											name="repeatEndType"
											checked={repeatEndType === "on_date"}
											onChange={() => setValue("endType", "on_date")}
											className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
										/>
										<span className="text-xs text-gray-700">On</span>
										{repeatEndType === "on_date" && (
											<Popover>
												<PopoverTrigger asChild>
													<button
														type="button"
														className={cn(
															"px-2 py-0.5 text-xs rounded border transition-all",
															repeatEndDate
																? "border-indigo-300 bg-indigo-50 text-indigo-700"
																: "border-gray-200 text-gray-500 hover:border-indigo-300",
														)}
													>
														{repeatEndDate
															? format(repeatEndDate, "MMM d, yyyy", {
																	locale: enUS,
																})
															: "Select date"}
													</button>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={repeatEndDate}
														onSelect={(date) => setValue("until", date)}
														locale={enUS}
														className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
														initialFocus
													/>
												</PopoverContent>
											</Popover>
										)}
									</label>

									{/* After X occurrences */}
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="radio"
											name="repeatEndType"
											checked={repeatEndType === "after_count"}
											onChange={() => {
												setValue("endType", "after_count");
												if (!repeatEndCount) {
													setValue("occurrences", 10);
												}
											}}
											className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
										/>
										<span className="text-xs text-gray-700">After</span>
										{repeatEndType === "after_count" && (
											<>
												<input
													type="number"
													min={1}
													max={999}
													value={repeatEndCount}
													onChange={(e) =>
														setValue(
															"occurrences",
															Number.parseInt(e.target.value, 10) || 1,
														)
													}
													className="w-14 px-2 py-0.5 text-xs border rounded text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
												/>
												<span className="text-xs text-gray-700">times</span>
											</>
										)}
									</label>
								</div>
							</div>
						)}

						{/* Summary */}
						{repeatFrequency && (
							<div className="mt-3 p-2 bg-indigo-50 rounded-lg flex-shrink-0">
								<div className="text-xs text-indigo-700">
									<span className="font-medium">
										{getRepeatLabel(repeatFrequency)}
									</span>
									{repeatFrequency === "WEEKLY" && (
										<span className="text-indigo-600">
											{" "}
											(
											{repeatDays.length > 0
												? repeatDays.map(getDayFullLabel).join(", ")
												: "No days selected"}
											)
										</span>
									)}
									{repeatFrequency === "CUSTOM" && customDates.length > 0 && (
										<span className="text-indigo-600">
											{" "}
											• {customDates.length} dates selected
										</span>
									)}
									{repeatFrequency !== "CUSTOM" && repeatStartDate && (
										<span className="text-indigo-600">
											{" "}
											• from{" "}
											{format(repeatStartDate, "MMM d", { locale: enUS })}
										</span>
									)}
									{repeatFrequency !== "CUSTOM" && (
										<span className="text-indigo-600">
											{" "}
											• {getEndSummary()}
										</span>
									)}
								</div>
							</div>
						)}

						{/* Apply button for repeat mode */}
						<div className="mt-auto pt-3 flex justify-end flex-shrink-0">
							<Button
								size="sm"
								onClick={handleSubmit((data) => {
									onSubmit(data);
								})}
							>
								Apply
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
