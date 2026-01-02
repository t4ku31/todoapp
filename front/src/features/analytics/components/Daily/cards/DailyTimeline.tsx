import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TimelineSession } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

interface DailyTimelineProps {
	sessions: TimelineSession[];
}

interface SessionWithLayout extends TimelineSession {
	column: number;
	totalColumns: number;
}

export function DailyTimeline({ sessions }: DailyTimelineProps) {
	const PIXELS_PER_MIN = 1.5;
	const START_HOUR = 6; // Start earlier to cover morning work
	const END_HOUR = 24;

	// Parse time string to minutes from START_HOUR
	const parseTimeToMinutes = (timeString: string): number => {
		const dateDate = new Date(timeString);
		let hours = dateDate.getHours();
		let mins = dateDate.getMinutes();

		if (Number.isNaN(hours)) {
			const parts = timeString.split(":");
			if (parts.length >= 2) {
				hours = parseInt(parts[0]);
				mins = parseInt(parts[1]);
			}
		}

		return (hours - START_HOUR) * 60 + mins;
	};

	// Calculate layout with collision detection (Google Calendar style)
	const getSessionsWithLayout = (): SessionWithLayout[] => {
		if (sessions.length === 0) return [];

		// Sort sessions by start time
		const sortedSessions = [...sessions].sort(
			(a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start),
		);

		// Calculate visual height in minutes for a session (min 10 minutes)
		const getVisualHeightMins = (session: TimelineSession) => {
			return Math.max(session.actual, 10);
		};

		// Group overlapping sessions
		const groups: TimelineSession[][] = [];
		let currentGroup: TimelineSession[] = [];

		for (const session of sortedSessions) {
			const sessionStart = parseTimeToMinutes(session.start);

			if (currentGroup.length === 0) {
				currentGroup.push(session);
			} else {
				// Check if this session overlaps with any in current group
				const groupEnd = Math.max(
					...currentGroup.map(
						(s) => parseTimeToMinutes(s.start) + getVisualHeightMins(s),
					),
				);

				if (sessionStart < groupEnd) {
					// Overlaps, add to current group
					currentGroup.push(session);
				} else {
					// No overlap, start new group
					groups.push(currentGroup);
					currentGroup = [session];
				}
			}
		}
		if (currentGroup.length > 0) {
			groups.push(currentGroup);
		}

		// Assign columns within each group
		const result: SessionWithLayout[] = [];

		for (const group of groups) {
			const totalColumns = group.length;

			// Assign column index to each session in the group
			group.forEach((session, index) => {
				result.push({
					...session,
					column: index,
					totalColumns,
				});
			});
		}

		return result;
	};

	const sessionsWithLayout = getSessionsWithLayout();

	const getPosition = (timeString: string, durationMins: number) => {
		const startMins = parseTimeToMinutes(timeString);
		return {
			top: startMins * PIXELS_PER_MIN,
			height: Math.max(durationMins, 15) * PIXELS_PER_MIN, // Minimum height for visibility
		};
	};

	// Generate lighter background color from hex
	const getSessionStyles = (color: string | null) => {
		if (!color) return {};
		return {
			borderLeftColor: color,
			backgroundColor: `${color}20`, // 20 = 12.5% opacity in hex
		};
	};

	const hoursBetween6and24 = Array.from(
		{ length: END_HOUR - START_HOUR + 1 },
		(_, i) => START_HOUR + i,
	);

	// Calculate current time line position
	const now = new Date();
	const currentHour = now.getHours();
	const currentMin = now.getMinutes();
	const currentTop =
		currentHour >= START_HOUR && currentHour <= END_HOUR
			? ((currentHour - START_HOUR) * 60 + currentMin) * PIXELS_PER_MIN
			: -1;

	console.log("currentTop", sessions);

	return (
		<Card className="overflow-hidden flex flex-col h-full bg-white shadow-sm border-gray-100">
			<div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
				<h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
					<Clock size={16} className="text-purple-500" /> Daily Timeline
				</h3>
				<Badge
					variant="secondary"
					className="text-xs bg-white border shadow-sm"
				>
					{sessions.length} Sessions
				</Badge>
			</div>
			<div className="flex-1 overflow-y-auto relative p-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
				<div className="flex gap-4">
					{/* Time labels */}
					<div
						className="w-12 flex-shrink-0 relative text-xs text-gray-400 font-mono select-none"
						style={{
							minHeight: `${(END_HOUR - START_HOUR) * 60 * PIXELS_PER_MIN}px`,
						}}
					>
						{hoursBetween6and24.map((hour) => (
							<div
								key={hour}
								className="absolute right-0 pr-2 -translate-y-1/2"
								style={{
									top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px`,
								}}
							>
								{hour}:00
							</div>
						))}
					</div>

					{/* Tasks area */}
					<div
						className="flex-1 relative border-l border-gray-100"
						style={{
							minHeight: `${(END_HOUR - START_HOUR) * 60 * PIXELS_PER_MIN}px`,
						}}
					>
						{/* Grid lines */}
						{hoursBetween6and24.map((hour) => (
							<div
								key={hour}
								className="absolute left-0 right-0 border-t border-dashed border-gray-400"
								style={{
									top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MIN}px`,
								}}
							/>
						))}

						{/* Current time indicator */}
						{currentTop >= 0 && (
							<div
								className="absolute left-0 right-0 border-t-2 border-red-400 z-30 flex items-center pointer-events-none"
								style={{
									top: `${currentTop}px`,
								}}
							>
								<div className="absolute w-2 h-2 bg-red-400 rounded-full -ml-1 ring-2 ring-white" />
							</div>
						)}

						{/* Task blocks */}
						{sessionsWithLayout.map((session) => {
							const pos = getPosition(session.start, session.actual);
							const columnWidth = 100 / session.totalColumns;
							const leftOffset = session.column * columnWidth;
							let columnHeight = 10 * PIXELS_PER_MIN;
							if (session.actual > 10) {
								columnHeight = session.actual * PIXELS_PER_MIN;
							}
							return (
								<div
									key={session.id}
									className={cn(
										"absolute rounded-lg border-l-4 transition-all hover:shadow-md hover:z-20 cursor-pointer",
									)}
									style={{
										top: `${pos.top}px`,
										height: `${columnHeight}px`,
										left: `${leftOffset}%`,
										width: `${columnWidth}%`,
										...getSessionStyles(session.categoryColor),
									}}
									title={`${session.title} (${session.actual}m)`}
								>
									<div className="flex justify-between items-center h-full px-2 overflow-hidden">
										<div className="text-[11px] text-gray-600 font-medium truncate flex-1">
											{session.title}
										</div>

										<Badge
											variant="secondary"
											className={cn(
												"text-[9px] px-1 h-4 bg-white/80 backdrop-blur-sm border-0 flex-shrink-0 ml-1",
												session.status === "INTERRUPTED" && "text-red-500",
											)}
										>
											{session.actual}m
										</Badge>
									</div>
								</div>
							);
						})}

						{/* Empty State Hint if no sessions */}
						{sessions.length === 0 && (
							<div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none">
								No focus sessions recorded for this day
							</div>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}
