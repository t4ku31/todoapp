import { createContext, useContext } from "react";

// Context to share state with DayButton components
interface CalendarContextType {
	selectedDate: Date | undefined;
	setSelectedDate: (date: Date | undefined) => void;
}

export const CalendarContext = createContext<CalendarContextType | null>(null);

export function useCalendarContext() {
	const context = useContext(CalendarContext);
	if (!context) {
		throw new Error("useCalendarContext must be used within a CalendarProvider");
	}
	return context;
}
