import { addHours, format, getDay, parse, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Calendar,
	dateFnsLocalizer,
	type SlotInfo,
	type View,
} from "react-big-calendar";
import withDragAndDrop, {
	type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { Calendar as MiniCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Task } from "@/features/todo/types";
import { useTodoStore } from "@/store/useTodoStore";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

import { TaskDetailPanel } from "@/features/todo/components/detail-panel/TaskDetailPanel";
import ScheduleView from "./ScheduleView";

// Configure date-fns localizer for react-big-calendar
const locales = {
	ja: ja,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday start
	getDay,
	locales,
});

// Calendar event type
interface CalendarEvent {
	id: number;
	title: string;
	start: Date;
	end: Date;
	allDay: boolean;
	resource: Task;
	isNew?: boolean; // Flag for new event being created
}

// Temporary new event type (before saving)
interface NewEventDraft {
	start: Date;
	end: Date;
	allDay: boolean;
}

const normalizeDate = (d: Date | string) => {
	const dateObj = d instanceof Date ? new Date(d) : new Date(d);
	dateObj.setSeconds(0);
	dateObj.setMilliseconds(0);
	return dateObj;
};

const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

export default function CalendarView() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<View>("week");
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
	const [newEventDraft, setNewEventDraft] = useState<NewEventDraft | null>(
		null,
	);
	const newEventInputRef = useRef<HTMLInputElement>(null);

	const allTasks = useTodoStore((state) => state.allTasks);
	const taskLists = useTodoStore((state) => state.taskLists);
	const fetchTaskLists = useTodoStore((state) => state.fetchTaskLists);
	const updateTask = useTodoStore((state) => state.updateTask);
	const createTask = useTodoStore((state) => state.createTask);
	const loading = useTodoStore((state) => state.loading);

	// Get Inbox list for new tasks
	const inboxList = useMemo(
		() => taskLists.find((list) => list.title === "Inbox"),
		[taskLists],
	);

	// Define available views including custom ScheduleView
	const calendarViews = useMemo(
		() => ({
			month: true,
			week: true,
			day: true,
			schedule: ScheduleView,
		}),
		[],
	);

	// Fetch tasks on mount
	useEffect(() => {
		if (allTasks.length === 0) {
			fetchTaskLists();
		}
	}, [fetchTaskLists, allTasks.length]);

	// Focus input when new event is created
	useEffect(() => {
		if (newEventDraft && newEventInputRef.current) {
			newEventInputRef.current.focus();
		}
	}, [newEventDraft]);

	// Convert tasks to calendar events
	const existingEvents = useMemo<CalendarEvent[]>(() => {
		return allTasks
			.filter((task) => !task.isDeleted)
			.map((task) => {
				// If task has scheduled times, use them
				if (task.scheduledStartAt && task.scheduledEndAt) {
					return {
						id: task.id,
						title: task.title,
						start: new Date(task.scheduledStartAt),
						end: new Date(task.scheduledEndAt),
						allDay: task.isAllDay ?? false,
						resource: task,
					};
				}

				// Fall back to scheduledStartAt as all-day event
				if (task.scheduledStartAt) {
					const date = new Date(task.scheduledStartAt);
					return {
						id: task.id,
						title: task.title,
						start: date,
						end: addHours(date, 1),
						allDay: true,
						resource: task,
					};
				}

				// No date - skip (or place in "unscheduled" section)
				return null;
			})
			.filter((event): event is CalendarEvent => event !== null);
	}, [allTasks]);

	// Combine existing events with new event draft for display
	const events = useMemo<CalendarEvent[]>(() => {
		if (!newEventDraft) return existingEvents;

		const draftEvent: CalendarEvent = {
			id: -1, // Temporary ID
			title: "新しいタスク",
			start: newEventDraft.start,
			end: newEventDraft.end,
			allDay: newEventDraft.allDay,
			resource: {} as Task, // Placeholder
			isNew: true,
		};

		return [...existingEvents, draftEvent];
	}, [existingEvents, newEventDraft]);

	// Handle navigation
	const handleNavigate = useCallback((date: Date) => {
		setCurrentDate(date);
	}, []);

	// Handle view change
	const handleViewChange = useCallback((newView: View) => {
		setView(newView);
	}, []);

	// Handle mini calendar date select
	const handleMiniCalendarSelect = useCallback((date: Date | undefined) => {
		if (date) {
			setCurrentDate(date);
		}
	}, []);

	// Handle event click - show detail panel
	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		// Don't select the new event draft
		if (event.isNew) return;
		setSelectedTaskId(event.id);
	}, []);

	// Handle close detail panel
	const handleCloseDetail = useCallback(() => {
		setSelectedTaskId(null);
	}, []);

	// Handle slot selection - create new event draft
	const handleSelectSlot = useCallback(
		(slotInfo: SlotInfo) => {
			// Close any open detail panel
			setSelectedTaskId(null);

			const start =
				slotInfo.start instanceof Date
					? slotInfo.start
					: new Date(slotInfo.start);
			let end =
				slotInfo.end instanceof Date ? slotInfo.end : new Date(slotInfo.end);

			// For click (not drag selection), default to 1 hour duration (unless all-day)
			// Detect all-day slot: month view, or week/day view with midnight start time
			const isAllDaySlot =
				view === "month" ||
				(start.getHours() === 0 &&
					start.getMinutes() === 0 &&
					end.getHours() === 0 &&
					end.getMinutes() === 0);
			// start & end = 00:00:00 = 終日セクションのクリック
			const isAllDay = slotInfo.action === "click" && isAllDaySlot;

			// For click (not drag selection) on time slots, default to 1 hour duration
			if (slotInfo.action === "click" && !isAllDay) {
				end = addHours(start, 1);
			}

			setNewEventDraft({
				start,
				end,
				allDay: isAllDay,
			});
		},
		[view],
	);

	// Handle new event submit (Enter or blur)
	const handleNewEventSubmit = useCallback(async () => {
		const title = newEventInputRef.current?.value?.trim();
		if (!newEventDraft || !title) {
			setNewEventDraft(null);
			return;
		}

		const taskListId = inboxList?.id;
		if (!taskListId) {
			setNewEventDraft(null);
			return;
		}

		try {
			// Create task with all schedule info in a single call
			await createTask({
				taskListId,
				title,
				scheduledStartAt: newEventDraft.start,
				scheduledEndAt: newEventDraft.end,
				isAllDay: newEventDraft.allDay,
			});
		} catch {
			// Error is handled in createTask
		}

		setNewEventDraft(null);
	}, [newEventDraft, inboxList, createTask]);

	// Handle keyboard events for new event input
	const handleNewEventKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleNewEventSubmit();
			} else if (e.key === "Escape") {
				setNewEventDraft(null);
			}
		},
		[handleNewEventSubmit],
	);

	// Handle event drop (move)
	const moveEvent = useCallback(
		({
			event,
			start,
			isAllDay: droppedOnAllDaySlot = false,
		}: EventInteractionArgs<CalendarEvent>) => {
			// Don't move the new event draft
			if (event.isNew) return;

			const { allDay } = event;
			let isAllDay = allDay;

			if (!allDay && droppedOnAllDaySlot) {
				isAllDay = true;
			}
			if (allDay && !droppedOnAllDaySlot) {
				isAllDay = false;
			}

			const newStart = normalizeDate(start);
			const newEnd = addHours(newStart, 1);
			const newDate = new Date(newStart);
			const newDate2 = new Date(newEnd);

			const updates = {
				scheduledStartAt: newDate,
				scheduledEndAt: newDate2,
				isAllDay,
				startDate: newStart,
			};

			updateTask(event.id, updates);
		},
		[updateTask],
	);

	// Handle event resize
	const resizeEvent = useCallback(
		({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
			// Don't resize the new event draft
			if (event.isNew) return;

			// Normalize to ensure 00 seconds and 000 ms
			const newStart = normalizeDate(start);
			const newEnd = normalizeDate(end);

			const updates = {
				scheduledStartAt: newStart,
				scheduledEndAt: newEnd,
			};

			updateTask(event.id, updates);
		},
		[updateTask],
	);

	// Event style based on category color
	const eventStyleGetter = useCallback((event: CalendarEvent) => {
		if (event.isNew) {
			return {
				style: {
					backgroundColor: "#6366f1",
					opacity: 0.8,
					border: "2px dashed #4f46e5",
				},
			};
		}

		const categoryColor = event.resource.category?.color || "#6366f1";
		return {
			style: {
				backgroundColor: categoryColor,
				opacity: event.resource.status === "COMPLETED" ? 0.6 : 1,
			},
		};
	}, []);

	// Custom event component to render inline input for new events
	const eventComponent = useCallback(
		({ event }: { event: CalendarEvent }) => {
			if (event.isNew && newEventDraft) {
				return (
					<div className="flex items-center h-full">
						<Input
							ref={newEventInputRef}
							type="text"
							defaultValue=""
							onBlur={handleNewEventSubmit}
							onKeyDown={handleNewEventKeyDown}
							placeholder="タスク名を入力..."
							className="flex-1 bg-white/20 rounded px-2 py-1 border-none text-white placeholder:text-white/80 text-sm font-medium focus-visible:ring-2 focus-visible:ring-white/50"
							autoFocus
						/>
					</div>
				);
			}
			return <span>{event.title}</span>;
		},
		[newEventDraft, handleNewEventSubmit, handleNewEventKeyDown],
	);

	// Calendar time range
	const calendarMinTime = useMemo(() => new Date(0, 0, 0, 6, 0, 0), []);
	const calendarMaxTime = useMemo(() => new Date(0, 0, 0, 23, 0, 0), []);

	// Calendar messages
	const messages = useMemo(
		() => ({
			week: "週",
			month: "月",
			day: "日",
			today: "今日",
			previous: "前",
			next: "次",
			schedule: "スケジュール",
		}),
		[],
	);

	// Calendar components
	const components = useMemo(
		() => ({
			event: eventComponent,
		}),
		[eventComponent],
	);

	return (
		<div className="flex h-full bg-gray-50/50">
			{/* Sidebar */}
			<div className="w-64 bg-white border-r border-gray-200 p-4 hidden lg:flex lg:flex-col gap-4">
				{/* Mini Calendar */}
				<div className="border rounded-lg p-2">
					<MiniCalendar
						mode="single"
						selected={currentDate}
						onSelect={handleMiniCalendarSelect}
						className="w-full"
					/>
				</div>
			</div>

			{/* Main Calendar Area */}
			<div className="flex-1 p-4 overflow-auto">
				{loading ? (
					<LoadingSpinner size="lg" />
				) : (
					<DragAndDropCalendar
						localizer={localizer}
						events={events}
						startAccessor="start"
						endAccessor="end"
						date={currentDate}
						view={view}
						onNavigate={handleNavigate}
						onView={handleViewChange}
						eventPropGetter={eventStyleGetter}
						style={{ height: "100%" }}
						views={calendarViews}
						defaultView="week"
						step={30}
						timeslots={2}
						min={calendarMinTime}
						max={calendarMaxTime}
						messages={messages}
						components={components}
						onEventDrop={moveEvent}
						onEventResize={resizeEvent}
						onSelectEvent={handleSelectEvent}
						onSelectSlot={handleSelectSlot}
						selectable
						resizable
						popup
					/>
				)}
			</div>

			{/* Task Detail Panel */}
			{selectedTaskId && (
				<TaskDetailPanel taskId={selectedTaskId} onClose={handleCloseDetail} />
			)}
		</div>
	);
}
