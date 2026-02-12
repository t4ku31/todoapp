// biome-ignore assist/source/organizeImports: <explanation>
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { RecurrenceConfig } from "@/features/todo/types";
import { cn } from "@/lib/utils";
import { format, isBefore, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import {
	CalendarDays,
	CalendarIcon,
	CalendarRange,
	Flag,
	Repeat,
} from "lucide-react";
import { useState } from "react";
import type { DayOfWeek, Frequency } from "../forms/schema";
import { IconBadge } from "./IconBadge";

type DateMode = "single" | "range" | "repeat";
type RepeatEndType = "never" | "on_date" | "after_count";

export interface RecurrenceData {
	isRecurring: boolean;
	recurrenceRule?: RecurrenceConfig;
}

interface EditableDateProps {
	id: number;
	type: "dueDate" | "startDate";
	date: Date | null;
	onDateChange: (id: number, newDate: Date | null) => Promise<void>;
	onRecurrenceChange?: (
		id: number,
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
	// Parse initial recurrence rule
	const parseInitialRecurrence = () => {
		if (!initialIsRecurring || !initialRecurrenceRule) {
			return {
				frequency: undefined,
				days: [],
				endType: "never" as RepeatEndType,
				endDate: undefined,
				occurrences: 10,
			};
		}

		const config = initialRecurrenceRule;
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
			frequency: config.frequency as Frequency | undefined,
			days: config.byDay ? config.byDay.map((d) => dayMap[d] || "MONDAY") : [],
			endType: config.until
				? ("on_date" as RepeatEndType)
				: config.count
					? ("after_count" as RepeatEndType)
					: ("never" as RepeatEndType),
			endDate: config.until,
			occurrences: config.count || 10,
		};
	};

	const initialRecurrence = parseInitialRecurrence();

	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<DateMode>(
		initialIsRecurring ? "repeat" : "single",
	);

	// Single date mode
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		date ? new Date(date) : undefined,
	);

	// Range mode
	const [startDate, setStartDate] = useState<Date | undefined>();
	const [endDate, setEndDate] = useState<Date | undefined>();

	// Repeat mode - initialized from props
	const [repeatFrequency, setRepeatFrequency] = useState<Frequency | undefined>(
		initialRecurrence.frequency,
	);
	const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(
		initialRecurrence.days,
	);
	const [customDates, setCustomDates] = useState<Date[]>([]);
	const [repeatStartDate, setRepeatStartDate] = useState<Date | undefined>(
		date ? new Date(date) : undefined,
	);
	const [repeatEndType, setRepeatEndType] = useState<RepeatEndType>(
		initialRecurrence.endType,
	);
	const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>(
		initialRecurrence.endDate,
	);
	const [repeatEndCount, setRepeatEndCount] = useState(
		initialRecurrence.occurrences,
	);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		onOpenChange?.(open);

		if (open && date) {
			setSelectedDate(new Date(date));
		}
	};

	const handleSingleSelect = async (newDate: Date | undefined) => {
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
	};

	const handleRangeSelect = async (
		range: { from?: Date; to?: Date } | undefined,
	) => {
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
	};

	// Custom dates multi-select
	const handleCustomDateSelect = (dates: Date[] | undefined) => {
		setCustomDates(dates || []);
		// Use the first custom date if available
		if (dates && dates.length > 0) {
			const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
			onDateChange(id, sortedDates[0]);
		}
	};

	const getRepeatLabel = (freq: Frequency) => {
		switch (freq) {
			case "DAILY":
				return "Daily";
			case "WEEKLY":
				return "Weekly";
			case "MONTHLY":
				return "Monthly";
			case "YEARLY":
				return "Yearly";
			case "CUSTOM":
				return "Custom";
			default:
				return freq;
		}
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

	// Get end summary text
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

	// Get display text based on mode
	const getDisplayText = () => {
		switch (activeTab) {
			case "single":
				return selectedDate ? format(selectedDate, "M/d") : null;
			case "range":
				if (startDate && endDate) {
					return `${format(startDate, "M/d")}-${format(endDate, "M/d")}`;
				}
				if (startDate) {
					return `${format(startDate, "M/d")}~`;
				}
				return null;
			case "repeat":
				if (repeatFrequency === "CUSTOM" && customDates.length > 0) {
					return `${customDates.length} days`;
				}
				return repeatFrequency ? getRepeatLabel(repeatFrequency) : null;
			default:
				return null;
		}
	};

	const displayText = getDisplayText();

	// Day options for weekly repeat
	const dayOptions: { value: DayOfWeek; label: string }[] = [
		{ value: "SUNDAY", label: "S" },
		{ value: "MONDAY", label: "M" },
		{ value: "TUESDAY", label: "T" },
		{ value: "WEDNESDAY", label: "W" },
		{ value: "THURSDAY", label: "T" },
		{ value: "FRIDAY", label: "F" },
		{ value: "SATURDAY", label: "S" },
	];

	const getIconComponent = () => {
		switch (activeTab) {
			case "range":
				return CalendarRange;
			case "repeat":
				return Repeat;
			default:
				return type === "dueDate" ? Flag : CalendarIcon;
		}
	};

	const getColorScheme = (): "indigo" | "amber" | "rose" => {
		if (type === "dueDate") {
			return date && isBefore(new Date(date), startOfDay(new Date()))
				? "rose"
				: "amber";
		}
		return "indigo";
	};

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<IconBadge
					icon={getIconComponent()}
					variant="soft"
					colorScheme={getColorScheme()}
					onPointerDown={(e) => e.stopPropagation()}
				>
					{displayText || (type === "dueDate" ? "期限" : "実行日")}
				</IconBadge>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0"
				align="start"
				onPointerDown={(e) => e.stopPropagation()}
			>
				{/* Tab Selector */}
				<div className="flex border-b">
					<button
						type="button"
						onClick={() => setActiveTab("single")}
						className={cn(
							"flex-1 px-4 py-2 text-sm font-medium transition-colors",
							activeTab === "single"
								? "border-b-2 border-indigo-500 text-indigo-600"
								: "text-gray-500 hover:text-gray-700",
						)}
					>
						<CalendarDays className="w-4 h-4 inline-block mr-1" />
						Date
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("range")}
						className={cn(
							"flex-1 px-4 py-2 text-sm font-medium transition-colors",
							activeTab === "range"
								? "border-b-2 border-indigo-500 text-indigo-600"
								: "text-gray-500 hover:text-gray-700",
						)}
					>
						<CalendarRange className="w-4 h-4 inline-block mr-1" />
						Range
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("repeat")}
						className={cn(
							"flex-1 px-4 py-2 text-sm font-medium transition-colors",
							activeTab === "repeat"
								? "border-b-2 border-indigo-500 text-indigo-600"
								: "text-gray-500 hover:text-gray-700",
						)}
					>
						<Repeat className="w-4 h-4 inline-block mr-1" />
						Repeat
					</button>
				</div>

				{/* Content based on active tab */}
				<div className="p-2">
					{activeTab === "single" && (
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={handleSingleSelect}
							locale={enUS}
							initialFocus
							className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
						/>
					)}

					{activeTab === "range" && (
						<div className="space-y-3">
							<div className="text-xs font-medium text-gray-500 px-2">
								Start - End
							</div>
							<Calendar
								mode="range"
								selected={
									startDate || endDate
										? { from: startDate, to: endDate }
										: undefined
								}
								onSelect={(range) => {
									// Ensure from <= to by swapping if needed
									if (range?.from && range?.to && range.to < range.from) {
										setStartDate(range.to);
										setEndDate(range.from);
										handleRangeSelect({ from: range.to, to: range.from });
									} else {
										handleRangeSelect(range);
									}
								}}
								locale={enUS}
								numberOfMonths={1}
								initialFocus
								className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
							/>
						</div>
					)}

					{activeTab === "repeat" && (
						<div className="p-4 min-w-[320px] max-w-[360px]">
							{/* Frequency Selection */}
							<div className="space-y-3">
								<div className="text-sm font-medium text-gray-700">Repeat</div>
								<div className="flex flex-wrap gap-2">
									{[
										{ value: "DAILY" as const, label: "Daily" },
										{ value: "WEEKLY" as const, label: "Weekly" },
										{ value: "MONTHLY" as const, label: "Monthly" },
										{ value: "YEARLY" as const, label: "Yearly" },
										{ value: "CUSTOM" as const, label: "Custom" },
									].map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												if (repeatFrequency === option.value) {
													setRepeatFrequency(undefined);
													setRepeatEndType("never");
												} else {
													setRepeatFrequency(option.value);
													if (repeatEndType === "never") {
														setRepeatEndType("never");
													}
												}
											}}
											className={cn(
												"px-3 py-2 text-sm rounded-lg border-2 transition-all font-medium",
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
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="text-sm font-medium text-gray-700 mb-2">
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
															setRepeatDays(
																repeatDays.filter((d) => d !== day.value),
															);
														} else {
															setRepeatDays([...repeatDays, day.value]);
														}
													}}
													className={cn(
														"w-9 h-9 rounded-full text-sm font-medium transition-all",
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
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="text-sm font-medium text-gray-700 mb-2">
										Select dates
									</div>
									<Calendar
										mode="multiple"
										selected={customDates}
										onSelect={handleCustomDateSelect}
										locale={enUS}
										className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
									/>
									{customDates.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											{customDates
												.sort((a, b) => a.getTime() - b.getTime())
												.slice(0, 5)
												.map((d) => (
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
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-700">
											Start
										</span>
										<Popover>
											<PopoverTrigger asChild>
												<button
													type="button"
													className={cn(
														"px-3 py-1.5 text-sm rounded-lg border transition-all",
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
														setRepeatStartDate(date);
														if (date) {
															onDateChange(id, date);
														}
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
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="text-sm font-medium text-gray-700 mb-3">
										Ends
									</div>
									<div className="space-y-2">
										{/* Never */}
										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="radio"
												name="repeatEndType"
												checked={repeatEndType === "never"}
												onChange={() => setRepeatEndType("never")}
												className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="text-sm text-gray-700">Never</span>
										</label>

										{/* On Date */}
										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="radio"
												name="repeatEndType"
												checked={repeatEndType === "on_date"}
												onChange={() => setRepeatEndType("on_date")}
												className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="text-sm text-gray-700">On</span>
											{repeatEndType === "on_date" && (
												<Popover>
													<PopoverTrigger asChild>
														<button
															type="button"
															className={cn(
																"px-2 py-1 text-sm rounded border transition-all",
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
															onSelect={(date) => setRepeatEndDate(date)}
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
													setRepeatEndType("after_count");
													if (!repeatEndCount) {
														setRepeatEndCount(10);
													}
												}}
												className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="text-sm text-gray-700">After</span>
											{repeatEndType === "after_count" && (
												<>
													<input
														type="number"
														min={1}
														max={999}
														value={repeatEndCount}
														onChange={(e) =>
															setRepeatEndCount(
																Number.parseInt(e.target.value, 10) || 1,
															)
														}
														className="w-16 px-2 py-1 text-sm border rounded text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
													/>
													<span className="text-sm text-gray-700">times</span>
												</>
											)}
										</label>
									</div>
								</div>
							)}

							{/* Summary */}
							{repeatFrequency && (
								<div className="mt-4 p-3 bg-indigo-50 rounded-lg">
									<div className="text-sm text-indigo-700">
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
							<div className="mt-4 flex justify-end">
								<Button
									size="sm"
									onClick={async () => {
										// Build recurrence rule JSON - directly use RecurrenceConfig
										if (repeatFrequency) {
											const config: RecurrenceConfig = {
												frequency: repeatFrequency,
											};

											if (
												repeatFrequency === "WEEKLY" &&
												repeatDays.length > 0
											) {
												config.byDay = repeatDays;
											}

											if (repeatEndType === "on_date" && repeatEndDate) {
												config.until = repeatEndDate;
											} else if (repeatEndType === "after_count") {
												config.count = repeatEndCount;
											}

											// Notify parent of recurrence change
											if (onRecurrenceChange) {
												await onRecurrenceChange(id, {
													isRecurring: true,
													recurrenceRule: config,
												});
											}

											// Set start date if provided
											if (repeatStartDate) {
												await onDateChange(id, repeatStartDate);
											}
										} else if (
											repeatFrequency === undefined &&
											customDates.length > 0
										) {
											// Custom dates mode - send first date
											const sortedDates = [...customDates].sort(
												(a, b) => a.getTime() - b.getTime(),
											);
											await onDateChange(id, sortedDates[0]);

											// Clear recurring flag for custom dates
											if (onRecurrenceChange) {
												await onRecurrenceChange(id, {
													isRecurring: false,
													recurrenceRule: undefined,
												});
											}
										}

										setIsOpen(false);
										onOpenChange?.(false);
									}}
								>
									Apply
								</Button>
							</div>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
