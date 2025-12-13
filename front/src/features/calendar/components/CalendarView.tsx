import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/config/env";
import type { TaskList } from "@/types/types";
import { addMonths, format, isSameDay, parseISO, subMonths } from "date-fns";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CalendarView() {
	const [date, setDate] = useState<Date | undefined>(new Date());
	const [taskLists, setTaskLists] = useState<TaskList[]>([]);
	const [loading, setLoading] = useState(true);
	const [month, setMonth] = useState<Date>(new Date());

	useEffect(() => {
		const fetchTaskLists = async () => {
			try {
				setLoading(true);
				const response = await apiClient.get<TaskList[]>("/api/tasklists");
				setTaskLists(response.data);
			} catch (err) {
				console.error("Failed to fetch tasklists:", err);
				toast.error("タスクの取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		fetchTaskLists();
	}, []);

	const getTaskListsForDate = (day: Date) => {
		const dateStr = format(day, "yyyy-MM-dd");
		return taskLists.filter((list) => list.dueDate === dateStr);
	};

	// Calculate dates that have tasks for indicators
	const daysWithTasks = taskLists
		.filter((list) => list.dueDate)
		.map((list) => parseISO(list.dueDate));

	const isDayWithTask = (day: Date) => {
		return daysWithTasks.some((d) => isSameDay(d, day));
	};

	const handlePreviousMonth = () => {
		setMonth((prev) => subMonths(prev, 1));
	};

	const handleNextMonth = () => {
		setMonth((prev) => addMonths(prev, 1));
	};

	if (loading) {
		return (
			<div className="h-full flex items-center justify-center">Loading...</div>
		);
	}

	return (
		<div className="h-full flex flex-col p-6 gap-6 bg-gradient-to-r from-blue-200 to-indigo-200">
			<h1 className="text-2xl font-bold">Task List & Calendar View</h1>

			<div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
				{/* Left Column: My Tasks */}
				<Card className="flex-1 h-full overflow-hidden flex flex-col border-none shadow-xl bg-white">
					<div className="p-6 pb-2 shrink-0 flex items-center justify-between">
						<div>
							<h2 className="text-xl font-bold">My Tasks</h2>
							<div className="flex items-center gap-2 text-muted-foreground mt-1">
								<span className="font-semibold text-primary">Priority</span>
							</div>
						</div>
						<Button
							size="sm"
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							<Plus className="h-4 w-4 mr-1" /> Add Task
						</Button>
					</div>

					<ScrollArea className="flex-1 p-6 pt-0">
						<div className="space-y-4">
							{taskLists.map((list) => (
								<div
									key={list.id}
									className="group flex items-start gap-3 p-3 rounded-xl border bg-white hover:shadow-md transition-shadow"
								>
									<div
										className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center ${list.isCompleted ? "bg-primary border-primary" : "border-muted-foreground/30"}`}
									>
										{list.isCompleted && (
											<Check className="h-3 w-3 text-primary-foreground" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<h3
												className={`font-medium truncate ${list.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}
											>
												{list.title}
											</h3>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
											</Button>
										</div>
										<div className="mt-2 flex items-center gap-2">
											<Badge
												variant="secondary"
												className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-normal"
											>
												Work
											</Badge>
											{list.dueDate && (
												<Badge
													variant="outline"
													className={`ml-auto border-none bg-orange-100 text-orange-700 font-normal ${isSameDay(parseISO(list.dueDate), new Date()) ? "bg-red-100 text-red-700" : ""}`}
												>
													Due {format(parseISO(list.dueDate), "d")}
												</Badge>
											)}
										</div>
									</div>
								</div>
							))}
							{taskLists.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									No tasks found.
								</div>
							)}
						</div>
					</ScrollArea>
				</Card>

				{/* Right Column: Calendar */}
				<Card className="flex-1 h-full overflow-hidden flex flex-col border-none shadow-xl bg-white">
					<div className="p-6 shrink-0 flex items-center justify-between">
						<h2 className="text-xl font-bold">Calendar</h2>
						<div className="flex items-center gap-2">
							<div className="flex items-center border rounded-md bg-white">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-none rounded-l-md"
									onClick={handlePreviousMonth}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<div className="w-[1px] h-4 bg-border" />
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-none rounded-r-md"
									onClick={handleNextMonth}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
							<Button variant="outline" size="sm">
								Month
							</Button>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</div>
					</div>
					<CardContent className="flex-1 p-0 flex justify-center overflow-auto">
						<Calendar
							mode="single"
							selected={date}
							onSelect={setDate}
							month={month}
							onMonthChange={setMonth}
							className="w-full max-w-none p-4"
							classNames={{
								nav: "hidden",
								root: "w-full h-full",
								months: "w-full h-full flex flex-col md:flex-row",
								month: "w-full h-full space-y-4 flex flex-col",
								table: "w-full h-full border-collapse flex-1",
								head_row: "flex w-full mb-2",
								head_cell:
									"text-muted-foreground w-full font-normal text-[0.8rem] h-10 flex items-center justify-center border-b border-gray-100",
								row: "flex w-full mt-2 h-20 lg:h-32 xl:h-40",
								cell: "h-full w-full relative p-0 text-center text-sm focus-within:relative focus-within:z-20 border-r border-b border-gray-100 first:border-l [&:has([aria-selected])]:bg-accent",
								day: "h-full w-full bg-transparent hover:bg-slate-50 transition-all flex flex-col items-center gap-1 rounded-none lg:h-20 lg:w-full",
								day_selected:
									"bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary focus:bg-primary/5 focus:text-primary border-2 border-primary",
								day_today: "bg-accent text-accent-foreground font-bold",
								day_outside: "text-muted-foreground opacity-50",
								day_disabled: "text-muted-foreground opacity-50",
								day_range_middle:
									"aria-selected:bg-accent aria-selected:text-accent-foreground",
								day_hidden: "invisible",
							}}
							modifiers={{
								hasTask: (day) => isDayWithTask(day),
							}}
							components={{
								DayButton: (props) => {
									const { day, ...rest } = props;
									return (
										<div className="h-full w-full relative flex flex-col items-center">
											<Button
												variant="ghost"
												{...rest}
												className="h-full w-full p-2 font-normal hover:bg-transparent data-[selected=true]:bg-transparent aspect-auto"
											>
												<div className="flex flex-col items-center justify-start h-full w-full">
													<span className="text-sm font-medium">
														{format(day.date, "d")}
													</span>
													{isDayWithTask(day.date) && (
														<div className="flex gap-1 mt-auto pb-1">
															{getTaskListsForDate(day.date)
																.slice(0, 3)
																.map((_, i) => (
																	<div
																		// biome-ignore lint/suspicious/noArrayIndexKey: visual indicator only, no stable id needed
																		key={i}
																		className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-orange-400" : i === 1 ? "bg-blue-400" : "bg-green-400"}`}
																	/>
																))}
														</div>
													)}
												</div>
											</Button>
										</div>
									);
								},
							}}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
