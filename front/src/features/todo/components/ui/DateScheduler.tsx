import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarDays, CalendarRange, Repeat } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateMode, DayOfWeek, TaskFormValues } from "../forms/schema";

interface DateSchedulerProps {
	className?: string;
	activeColor?: string;
	onOpenChange?: (open: boolean) => void;
}

export function DateScheduler({
	className,
	activeColor = "text-indigo-600",
	onOpenChange,
}: DateSchedulerProps) {
	const { control, setValue } = useFormContext<TaskFormValues>();

	// All useWatch calls at the top level
	const dateMode = useWatch({ control, name: "dateMode" }) || "single";
	const executionDate = useWatch({ control, name: "executionDate" });
	const startDate = useWatch({ control, name: "startDate" });
	const endDate = useWatch({ control, name: "endDate" });
	const repeatFrequency = useWatch({ control, name: "repeatFrequency" });
	const repeatDays = useWatch({ control, name: "repeatDays" }) || [];
	const customDates = useWatch({ control, name: "customDates" }) || [];
	const repeatEndType = useWatch({ control, name: "repeatEndType" }) || "never";
	const repeatEndDate = useWatch({ control, name: "repeatEndDate" });
	const repeatEndCount = useWatch({ control, name: "repeatEndCount" }) || 10;

	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<DateMode>(dateMode as DateMode);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		onOpenChange?.(open);
	};

	const setDateModeValue = (mode: DateMode) => {
		setActiveTab(mode);
		setValue("dateMode", mode);
	};

	// Format display text based on mode
	const getDisplayText = () => {
		switch (dateMode) {
			case "single":
				return executionDate
					? format(executionDate, "M/d", { locale: enUS })
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
				if (repeatFrequency === "custom" && customDates.length > 0) {
					return `${customDates.length} days`;
				}
				return repeatFrequency ? getRepeatLabel(repeatFrequency) : null;
			default:
				return null;
		}
	};

	const getRepeatLabel = (freq: string) => {
		switch (freq) {
			case "daily":
				return "Daily";
			case "weekly":
				return "Weekly";
			case "monthly":
				return "Monthly";
			case "yearly":
				return "Yearly";
			case "custom":
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
		executionDate ||
		startDate ||
		endDate ||
		repeatFrequency ||
		customDates.length > 0;

	const displayText = getDisplayText();

	const dayOptions: { value: DayOfWeek; label: string }[] = [
		{ value: "sun", label: "S" },
		{ value: "mon", label: "M" },
		{ value: "tue", label: "T" },
		{ value: "wed", label: "W" },
		{ value: "thu", label: "T" },
		{ value: "fri", label: "F" },
		{ value: "sat", label: "S" },
	];

	const getDayFullLabel = (day: DayOfWeek) => {
		const labels: Record<DayOfWeek, string> = {
			sun: "Sun",
			mon: "Mon",
			tue: "Tue",
			wed: "Wed",
			thu: "Thu",
			fri: "Fri",
			sat: "Sat",
		};
		return labels[day] || day;
	};

	// Handle multi-select for custom dates
	const handleCustomDateSelect = (dates: Date[] | undefined) => {
		setValue("customDates", dates || []);
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
					<button
						type="button"
						onClick={() => setDateModeValue("single")}
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
						onClick={() => setDateModeValue("range")}
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
						onClick={() => setDateModeValue("repeat")}
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
							selected={executionDate}
							onSelect={(date) => setValue("executionDate", date)}
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
										setValue("startDate", range.to);
										setValue("endDate", range.from);
									} else {
										setValue("startDate", range?.from);
										setValue("endDate", range?.to);
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
										{ value: "daily", label: "Daily" },
										{ value: "weekly", label: "Weekly" },
										{ value: "monthly", label: "Monthly" },
										{ value: "custom", label: "Custom" },
									].map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												if (repeatFrequency === option.value) {
													setValue("repeatFrequency", undefined);
													setValue("repeatEndType", undefined);
												} else {
													setValue(
														"repeatFrequency",
														option.value as TaskFormValues["repeatFrequency"],
													);
													// Set default end type
													if (!repeatEndType) {
														setValue("repeatEndType", "never");
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
							{repeatFrequency === "weekly" && (
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
															setValue(
																"repeatDays",
																repeatDays.filter((d) => d !== day.value),
															);
														} else {
															setValue("repeatDays", [
																...repeatDays,
																day.value,
															]);
														}
													}}
													className={cn(
														"w-9 h-9 rounded-full text-sm font-medium transition-all",
														isSelected
															? "bg-indigo-500 text-white"
															: "bg-gray-100 text-gray-600 hover:bg-indigo-100",
														day.value === "sun" &&
															!isSelected &&
															"text-red-500",
														day.value === "sat" &&
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
							{repeatFrequency === "custom" && (
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
												.map((date) => (
													<span
														key={date.toISOString()}
														className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
													>
														{format(date, "M/d", { locale: enUS })}
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
							{repeatFrequency && repeatFrequency !== "custom" && (
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
														executionDate
															? "border-indigo-300 bg-indigo-50 text-indigo-700"
															: "border-gray-200 text-gray-500 hover:border-indigo-300",
													)}
												>
													{executionDate
														? format(executionDate, "MMM d", { locale: enUS })
														: "Select date"}
												</button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="end">
												<Calendar
													mode="single"
													selected={executionDate}
													onSelect={(date) => setValue("executionDate", date)}
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
							{repeatFrequency && repeatFrequency !== "custom" && (
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
												onChange={() => setValue("repeatEndType", "never")}
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
												onChange={() => setValue("repeatEndType", "on_date")}
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
															onSelect={(date) =>
																setValue("repeatEndDate", date)
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
												checked={repeatEndType === "after_count"}
												onChange={() => {
													setValue("repeatEndType", "after_count");
													if (!repeatEndCount) {
														setValue("repeatEndCount", 10);
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
															setValue(
																"repeatEndCount",
																Number.parseInt(e.target.value) || 1,
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
										{repeatFrequency === "weekly" && (
											<span className="text-indigo-600">
												{" "}
												(
												{repeatDays.length > 0
													? repeatDays.map(getDayFullLabel).join(", ")
													: "No days selected"}
												)
											</span>
										)}
										{repeatFrequency === "custom" && customDates.length > 0 && (
											<span className="text-indigo-600">
												{" "}
												• {customDates.length} dates selected
											</span>
										)}
										{repeatFrequency !== "custom" && executionDate && (
											<span className="text-indigo-600">
												{" "}
												• from{" "}
												{format(executionDate, "MMM d", { locale: enUS })}
											</span>
										)}
										{repeatFrequency !== "custom" && (
											<span className="text-indigo-600">
												{" "}
												• {getEndSummary()}
											</span>
										)}
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
