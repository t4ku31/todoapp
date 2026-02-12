import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarDays, CalendarRange, Repeat } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type {
	DateMode,
	DayOfWeek,
	Frequency,
	TaskFormValues,
} from "../forms/schema";

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
	const { control, setValue, getValues } = useFormContext<TaskFormValues>();

	// Watch form values
	const dateMode = useWatch({ control, name: "dateMode" }) || "single";
	const startDateValue = useWatch({ control, name: "startDate" });
	const startDate = useWatch({ control, name: "startDate" });
	const endDate = useWatch({ control, name: "endDate" });
	const recurrenceRule = useWatch({ control, name: "recurrenceRule" });

	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<DateMode>(dateMode as DateMode);

	// Derived values from recurrenceRule
	const frequency = recurrenceRule?.frequency;
	const byDay = recurrenceRule?.byDay || [];
	const occurs = recurrenceRule?.occurs || [];
	const until = recurrenceRule?.until;
	const count = recurrenceRule?.count;

	// occurs is already Date[]
	const occursAsDates = occurs;

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		onOpenChange?.(open);
	};
	const setDateModeValue = (mode: DateMode) => {
		setActiveTab(mode);
		setValue("dateMode", mode);

		// Reset irrelevant fields when switching modes
		if (mode === "single") {
			// Single mode: clear range and repeat fields
			setValue("endDate", undefined);
			setValue("recurrenceRule", undefined);
		} else if (mode === "range") {
			// Range mode: clear repeat fields
			setValue("recurrenceRule", undefined);
		} else if (mode === "repeat") {
			// Repeat mode: initialize recurrenceRule if not set
			const currentRule = getValues("recurrenceRule");
			if (!currentRule) {
				setValue("recurrenceRule", {
					frequency: "DAILY" as Frequency,
				});
			}
		}
		console.log("recurrenceRule", getValues("recurrenceRule"));
		console.log("startDate", getValues("startDate"));
		console.log("endDate", getValues("endDate"));
	};

	// Helper to update recurrenceRule
	// Note: recurrenceRule is guaranteed to exist in repeat mode (initialized by setDateModeValue)
	const updateRecurrenceRule = (
		updates: Partial<TaskFormValues["recurrenceRule"]>,
	) => {
		const current = getValues("recurrenceRule");
		if (current) {
			setValue("recurrenceRule", { ...current, ...updates });
		}

		console.log("recurrenceRule", getValues("recurrenceRule"));
		console.log("startDate", getValues("startDate"));
		console.log("endDate", getValues("endDate"));
	};

	// Format display text based on mode
	const getDisplayText = () => {
		switch (dateMode) {
			case "single":
				return startDateValue
					? format(startDateValue, "M/d", { locale: enUS })
					: null;
			case "range":
				if (startDate && endDate) {
					return `${format(startDate, "M/d")}-${format(endDate, "M/d")}`;
				}
				if (startDate) {
					return `${format(startDate, "M/d")}~`;
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
		startDateValue || startDate || endDate || frequency || occurs.length > 0;

	const displayText = getDisplayText();

	const dayOptions: { value: DayOfWeek; label: string }[] = [
		{ value: "SUNDAY", label: "S" },
		{ value: "MONDAY", label: "M" },
		{ value: "TUESDAY", label: "T" },
		{ value: "WEDNESDAY", label: "W" },
		{ value: "THURSDAY", label: "T" },
		{ value: "FRIDAY", label: "F" },
		{ value: "SATURDAY", label: "S" },
	];

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

	// Handle multi-select for custom dates
	const handleCustomDateSelect = (dates: Date[] | undefined) => {
		updateRecurrenceRule({ occurs: dates || [] });
	};

	const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
		// Ensure from <= to by swapping if needed
		if (range?.from && range?.to && range.to < range.from) {
			setValue("startDate", range.to);
			setValue("endDate", range.from);
		} else {
			setValue("startDate", range?.from);
			setValue("endDate", range?.to);
		}
		console.log("startDate", getValues("startDate"));
		console.log("endDate", getValues("endDate"));
	};

	// Determine end type from recurrenceRule
	const getEndType = (): "never" | "on_date" | "after_count" => {
		if (until) return "on_date";
		if (count) return "after_count";
		return "never";
	};
	const endType = getEndType();

	// Get end summary text
	const getEndSummary = () => {
		switch (endType) {
			case "never":
				return "Forever";
			case "on_date":
				return until
					? `Until ${format(until, "MMM d", { locale: enUS })}`
					: "Until...";
			case "after_count":
				return `${count || 10} times`;
			default:
				return "";
		}
	};

	const renderRecurrenceSummary = () => {
		if (!frequency) return null;

		return (
			<>
				<span className="font-medium">{getRepeatLabel(frequency)}</span>
				{frequency === "WEEKLY" && (
					<span className="text-indigo-600">
						{" "}
						(
						{byDay.length > 0
							? byDay.map(getDayFullLabel).join(", ")
							: "No days selected"}
						)
					</span>
				)}
				{frequency === "CUSTOM" && occurs.length > 0 && (
					<span className="text-indigo-600">
						{" "}
						• {occurs.length} dates selected
					</span>
				)}
				{frequency !== "CUSTOM" && startDateValue && (
					<span className="text-indigo-600">
						{" "}
						• from {format(startDateValue, "MMM d", { locale: enUS })}
					</span>
				)}
				{frequency !== "CUSTOM" && (
					<span className="text-indigo-600"> • {getEndSummary()}</span>
				)}
			</>
		);
	};

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
				{/* Tab Selector */}
				<div className="flex border-b">
					{[
						{ mode: "single" as const, icon: CalendarDays, label: "Date" },
						{ mode: "range" as const, icon: CalendarRange, label: "Range" },
						{ mode: "repeat" as const, icon: Repeat, label: "Repeat" },
					].map(({ mode, icon: Icon, label }) => (
						<button
							key={mode}
							type="button"
							onClick={() => setDateModeValue(mode)}
							className={cn(
								"flex-1 px-4 py-2 text-sm font-medium transition-colors",
								activeTab === mode
									? "border-b-2 border-indigo-500 text-indigo-600"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<Icon className="w-4 h-4 inline-block mr-1" />
							{label}
						</button>
					))}
				</div>

				{/* Content based on active tab */}
				<div className="p-2">
					{activeTab === "single" && (
						<Calendar
							mode="single"
							selected={startDateValue}
							onSelect={(date) => setValue("startDate", date)}
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
								onSelect={handleRangeSelect}
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
									{REPEAT_FREQUENCIES.map((freq) => (
										<button
											key={freq.value}
											type="button"
											onClick={() => {
												if (frequency === freq.value) {
													setValue("recurrenceRule", undefined); // select same frequency -> cancel
												} else {
													setValue("recurrenceRule", {
														frequency: freq.value, // select different frequency -> set frequency
													});
												}
											}}
											className={cn(
												"px-3 py-2 text-sm rounded-lg border-2 transition-all font-medium",
												frequency === freq.value
													? "border-indigo-500 bg-indigo-50 text-indigo-700"
													: "border-gray-200 hover:border-indigo-300 text-gray-600",
											)}
										>
											{freq.label}
										</button>
									))}
								</div>
							</div>

							{/* Weekly: Day of week selection */}
							{frequency === "WEEKLY" && (
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="text-sm font-medium text-gray-700 mb-2">
										Days
									</div>
									<div className="flex gap-1">
										{dayOptions.map((day) => {
											const isSelected = byDay.includes(day.value);
											return (
												<button
													key={day.value}
													type="button"
													onClick={() => {
														const newByDay = isSelected
															? byDay.filter((d) => d !== day.value)
															: [...byDay, day.value];
														updateRecurrenceRule({ byDay: newByDay });
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
							{frequency === "CUSTOM" && (
								<div className="mt-4 pt-4 border-t border-gray-100">
									<div className="text-sm font-medium text-gray-700 mb-2">
										Select dates
									</div>
									<Calendar
										mode="multiple"
										selected={occursAsDates}
										onSelect={handleCustomDateSelect}
										locale={enUS}
										className="p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:w-9 [&_td]:h-9 [&_th]:w-9 [&_th]:h-9 [&_th]:text-center [&_th]:font-normal [&_th]:text-gray-500 [&_button]:w-9 [&_button]:h-9"
									/>
									{occurs.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											{occurs
												.sort()
												.slice(0, 5)
												.map((date) => (
													<span
														key={date.toISOString()}
														className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
													>
														{format(date, "M/d", { locale: enUS })}
													</span>
												))}
											{occurs.length > 5 && (
												<span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
													+{occurs.length - 5} more
												</span>
											)}
										</div>
									)}
								</div>
							)}

							{/* Start Date - for daily/weekly/monthly */}
							{frequency && frequency !== "CUSTOM" && (
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
														startDateValue
															? "border-indigo-300 bg-indigo-50 text-indigo-700"
															: "border-gray-200 text-gray-500 hover:border-indigo-300",
													)}
												>
													{startDateValue
														? format(startDateValue, "MMM d", { locale: enUS })
														: "Select date"}
												</button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="end">
												<Calendar
													mode="single"
													selected={startDateValue}
													onSelect={(date) => setValue("startDate", date)}
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
							{frequency && frequency !== "CUSTOM" && (
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
												checked={endType === "never"}
												onChange={() => {
													updateRecurrenceRule({
														until: undefined,
														count: undefined,
													});
												}}
												className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="text-sm text-gray-700">Never</span>
										</label>

										{/* On Date */}
										<label className="flex items-center gap-3 cursor-pointer">
											<input
												type="radio"
												name="repeatEndType"
												checked={endType === "on_date"}
												onChange={() => {
													updateRecurrenceRule({
														count: undefined,
														until: until || new Date(),
													});
												}}
												className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="text-sm text-gray-700">On</span>
											{endType === "on_date" && (
												<Popover>
													<PopoverTrigger asChild>
														<button
															type="button"
															className={cn(
																"px-2 py-1 text-sm rounded border transition-all",
																until
																	? "border-indigo-300 bg-indigo-50 text-indigo-700"
																	: "border-gray-200 text-gray-500 hover:border-indigo-300",
															)}
														>
															{until
																? format(until, "MMM d, yyyy", {
																		locale: enUS,
																	})
																: "Select date"}
														</button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={until}
															onSelect={(date) =>
																updateRecurrenceRule({
																	until: date,
																})
															}
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
												checked={endType === "after_count"}
												onChange={() => {
													updateRecurrenceRule({
														until: undefined,
														count: count || 10,
													});
												}}
												className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="text-sm text-gray-700">After</span>
											{endType === "after_count" && (
												<>
													<input
														type="number"
														min={1}
														max={999}
														value={count || 10}
														onChange={(e) =>
															updateRecurrenceRule({
																count: Number.parseInt(e.target.value, 10) || 1,
															})
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
							{frequency && (
								<div className="mt-4 p-3 bg-indigo-50 rounded-lg">
									<div className="text-sm text-indigo-700">
										{renderRecurrenceSummary()}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
