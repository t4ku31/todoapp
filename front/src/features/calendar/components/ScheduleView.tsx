import {
	addMonths,
	endOfMonth,
	format,
	isSameDay,
	parseISO,
	startOfMonth,
} from "date-fns";
import { ja } from "date-fns/locale";
import type { DateLocalizer } from "react-big-calendar";
import type { Task } from "@/types/types";

// Navigation action type
type NavigateAction = "PREV" | "NEXT" | "TODAY" | "DATE";

// Props from react-big-calendar custom view
interface ScheduleViewProps {
	date: Date;
	localizer: DateLocalizer;
	events: Array<{
		id: number;
		title: string;
		start: Date;
		end: Date;
		allDay: boolean;
		resource: Task;
	}>;
}

// Group events by date and return sorted entries
function groupEventsByDate(
	events: ScheduleViewProps["events"],
): [string, ScheduleViewProps["events"]][] {
	const groups = new Map<string, ScheduleViewProps["events"]>();

	for (const event of events) {
		const dateKey = format(event.start, "yyyy-MM-dd");

		if (!groups.has(dateKey)) {
			groups.set(dateKey, []);
		}
		groups.get(dateKey)?.push(event);
	}

	// Return sorted entries
	return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

// Format time display
function formatTime(event: ScheduleViewProps["events"][0]): string {
	if (!event.allDay) {
		const start = format(event.start, "H:mm");
		const end = format(event.end, "H:mm");
		return `${start}〜${end}`;
	}
	return "終日";
}

// Custom Schedule View Component
function ScheduleView({ date, events }: ScheduleViewProps) {
	// Filter events for the current month
	const monthStart = startOfMonth(date);
	const monthEnd = endOfMonth(date);

	const monthEvents = events.filter(
		(event) => event.start >= monthStart && event.start <= monthEnd,
	);

	const groupedEvents = groupEventsByDate(monthEvents);

	if (groupedEvents.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-400">
				予定はありません
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl h-full overflow-auto p-4">
			{groupedEvents.map(([dateKey, dateEvents]) => {
				const eventDate = parseISO(dateKey);
				const isToday = isSameDay(eventDate, new Date());

				return (
					<div
						key={dateKey}
						className="flex py-4 border-b-2 border-gray-200 last:border-b-0"
					>
						{/* Date Column - Google Style */}
						<div className="w-20 flex-shrink-0 text-center">
							<div
								className={`text-2xl font-light ${
									isToday ? "text-blue-600" : "text-gray-800"
								}`}
							>
								{format(eventDate, "d")}
							</div>
							<div className="text-xs text-gray-500 uppercase tracking-wide">
								{format(eventDate, "M月, E", { locale: ja })}
							</div>
						</div>

						{/* Events Column */}
						<div className="flex-1 pl-4 border-l border-gray-100">
							{dateEvents.map((event) => {
								const task = event.resource;
								return (
									<div
										key={event.id}
										className="w-full flex items-center gap-3 py-2.5 px-3 -ml-3 rounded-lg hover:bg-gray-50 transition-colors text-left group cursor-pointer"
									>
										{/* Color Dot */}
										<span
											className="w-2 h-2 rounded-full flex-shrink-0"
											style={{
												backgroundColor: task.category?.color || "#4285f4",
											}}
										/>

										{/* Time */}
										<span className="text-sm text-gray-600 w-28 flex-shrink-0 font-medium">
											{formatTime(event)}
										</span>

										{/* Title */}
										<span
											className={`text-sm flex-1 ${
												task.status === "COMPLETED"
													? "text-gray-400 line-through"
													: "text-gray-900"
											}`}
										>
											{event.title}
										</span>

										{/* Category Badge - shows on hover */}
										{task.category && (
											<span
												className="text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
												style={{
													backgroundColor: `${task.category.color}15`,
													color: task.category.color,
												}}
											>
												{task.category.name}
											</span>
										)}
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// Static method: Define the date range for the view
ScheduleView.range = (date: Date) => {
	const start = startOfMonth(date);
	const end = endOfMonth(date);
	const range: Date[] = [];

	let current = start;
	while (current <= end) {
		range.push(current);
		current = new Date(current);
		current.setDate(current.getDate() + 1);
	}

	return range;
};

// Static method: Handle navigation (Back/Next buttons)
ScheduleView.navigate = (date: Date, action: NavigateAction) => {
	switch (action) {
		case "PREV":
			return addMonths(date, -1);
		case "NEXT":
			return addMonths(date, 1);
		case "TODAY":
			return new Date();
		default:
			return date;
	}
};

// Static method: Title shown in toolbar
ScheduleView.title = (date: Date) => {
	return format(date, "yyyy年 M月", { locale: ja });
};

export default ScheduleView;
