import { format } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/config/env";

// Helper: Format date as local time string for Java LocalDateTime
const toLocalDateTime = (date: Date): string => {
	console.log("Date: ", format(date, "yyyy-MM-dd'T'HH:mm:ss"));
	return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

interface PomodoroSettings {
	focusDuration: number; // minutes
	shortBreakDuration: number; // minutes
	longBreakDuration: number; // minutes
	longBreakInterval: number; // number of focus sessions before long break
	isLongBreakEnabled: boolean; // enable long break
	dailyGoal: number; // daily goal in minutes
	autoAdvance: boolean; // auto advance to next phase
	whiteNoise: string; // 'none' | 'rain' | 'cafe' | 'white_noise'
	volume: number; // 0-1
}

interface RecordRequest {
	id?: number;
	taskId: number | null;
	sessionType: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
	status: "COMPLETED" | "INTERRUPTED";
	scheduledDuration: number;
	actualDuration: number;
	startedAt: string;
	endedAt: string;
}

interface FocusSessionResponse {
	id: number;
	taskId: number | null;
	sessionType: string;
	status: string;
	scheduledDuration: number;
	actualDuration: number;
	startedAt: string;
}

interface EfficiencyStats {
	efficiencyScore: number;
	rhythmQuality: number;
	volumeBalance: number;
	focusRatio: number;
	restRatio: number;
	paceRatio: number;
}

interface DailySummary {
	date: string;
	totalSeconds: number;
}

interface TotalSummary {
	totalSeconds: number;
}

interface DailyGoalWithActual {
	date: string;
	goalMinutes: number;
	actualMinutes: number;
	percentageComplete: number;
}

interface PomodoroState {
	// Timer State
	timeLeft: number; // seconds. Can be negative during overtime.
	isActive: boolean;
	isOvertime: boolean;
	phase: PomodoroPhase;
	currentTaskId: number | null; // ID of task being focused on
	totalFocusTime: number; // Total focus time in seconds (current session)
	focusSessionCount: number; // Number of completed focus sessions (for longBreak after 4)
	startedAt: string | null; // ISO string when timer started
	scheduledDuration: number; // seconds, duration when timer started

	// Server-synced State
	dailyFocusTime: number; // Total focus time from server for today
	totalFocusTimeServer: number; // Total all-time focus time from server
	dailyGoalData: DailyGoalWithActual | null; // Today's goal with actual progress
	efficiencyStats: EfficiencyStats | null;
	activeSessionId: number | null; // ID of current interrupted session to update

	// Settings
	settings: PomodoroSettings;

	// Actions
	setPhase: (phase: PomodoroPhase) => void;
	startTimer: () => void;
	pauseTimer: () => void;
	resetTimer: () => Promise<void>; // Interrupted
	completeSession: () => Promise<void>; // Completed (Finish/Break)
	tick: () => void;
	skipPhase: () => Promise<void>;
	updateSettings: (settings: Partial<PomodoroSettings>) => void;
	setFocusTask: (taskId: number | null) => void;
	resetTotalFocusTime: () => void;
	adjustTime: (seconds: number) => void;

	// API Actions
	recordSession: (request: RecordRequest) => Promise<void>;
	fetchDailySummary: () => Promise<void>;
	fetchTotalSummary: () => Promise<void>;
	fetchSettings: () => Promise<void>;
	saveSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
	fetchDailyGoal: (date?: string) => Promise<void>;
	setDailyGoal: (goalMinutes: number, date?: string) => Promise<void>;
	fetchEfficiencyStats: (date?: string) => Promise<void>;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
	focusDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	isLongBreakEnabled: true,
	dailyGoal: 120, // 2 hours default
	autoAdvance: false,
	whiteNoise: "none",
	volume: 0.5,
};

// simple debounce helper
let saveTimeout: ReturnType<typeof setTimeout>;

export const usePomodoroStore = create<PomodoroState>()(
	persist(
		(set, get) => ({
			timeLeft: DEFAULT_SETTINGS.focusDuration * 60,
			isActive: false,
			isOvertime: false,
			phase: "focus",
			currentTaskId: null,
			totalFocusTime: 0,
			focusSessionCount: 0,
			startedAt: null,
			scheduledDuration: DEFAULT_SETTINGS.focusDuration * 60,
			dailyFocusTime: 0,
			totalFocusTimeServer: 0,
			dailyGoalData: null,
			efficiencyStats: null,
			activeSessionId: null,
			settings: DEFAULT_SETTINGS,

			setPhase: (phase) => {
				const { settings } = get();
				let duration = settings.focusDuration;
				if (phase === "shortBreak") duration = settings.shortBreakDuration;

				if (phase === "longBreak") duration = settings.longBreakDuration;

				set({
					phase,
					timeLeft: duration * 60,
					scheduledDuration: duration * 60,
					isActive: false,
					isOvertime: false,
					totalFocusTime: 0,
					startedAt: null,
					activeSessionId: null,
				});
			},

			startTimer: () => {
				const { startedAt } = get();
				// Only set startedAt if not resuming or if it's null (fresh start)
				// Actually, if we pause and resume, startedAt implies the session block start?
				// For simple logic, let's keep original start time, or just set it if null.
				set({
					isActive: true,
					startedAt: startedAt || toLocalDateTime(new Date()),
				});
			},
			pauseTimer: async () => {
				const {
					phase,
					totalFocusTime,
					currentTaskId,
					scheduledDuration,
					startedAt,
					activeSessionId,
				} = get();
				console.log("Pause timer");
				if (totalFocusTime > 0) {
					console.log("Recording interrupted session on pause (Update/Create)");

					// Fallback if startedAt is missing
					let finalStartedAt = startedAt;
					if (!finalStartedAt) {
						console.warn(
							"startedAt missing in pauseTimer. Calculating from totalFocusTime.",
						);
						finalStartedAt = toLocalDateTime(
							new Date(Date.now() - totalFocusTime * 1000),
						);
					}

					const sessionType =
						phase === "focus"
							? "FOCUS"
							: phase === "shortBreak"
								? "SHORT_BREAK"
								: "LONG_BREAK";

					await get().recordSession({
						id: activeSessionId ?? undefined,
						taskId: currentTaskId,
						sessionType,
						status: "INTERRUPTED",
						scheduledDuration,
						actualDuration: totalFocusTime,
						startedAt: finalStartedAt,
						endedAt: toLocalDateTime(new Date()),
					});
				}

				set({
					isActive: false,
					// Do NOT reset totalFocusTime/startedAt since we want to resume same session
					// We only pause ticking.
				});
			},

			// User stops early -> Interrupted
			resetTimer: async () => {
				const {
					phase,
					settings,
					totalFocusTime,
					currentTaskId,
					scheduledDuration,
					startedAt,
				} = get();

				// Record as Interrupted
				if (totalFocusTime > 0 && startedAt) {
					console.log("1. Recording interrupted session (Final)");
					const { activeSessionId } = get();

					const sessionType =
						phase === "focus"
							? "FOCUS"
							: phase === "shortBreak"
								? "SHORT_BREAK"
								: "LONG_BREAK";

					await get().recordSession({
						id: activeSessionId ?? undefined,
						taskId: currentTaskId,
						sessionType,
						status: "INTERRUPTED",
						scheduledDuration,
						actualDuration: totalFocusTime,
						startedAt: startedAt,
						endedAt: toLocalDateTime(new Date()),
					});
				}

				let duration = settings.focusDuration;
				if (phase === "shortBreak") duration = settings.shortBreakDuration;
				if (phase === "longBreak") duration = settings.longBreakDuration;
				set({
					timeLeft: duration * 60,
					scheduledDuration: duration * 60,
					isActive: false,
					isOvertime: false,
					totalFocusTime: 0,
					startedAt: null,
					activeSessionId: null,
				});
			},

			// User finishes (Timer reached 0 and confirmed)
			completeSession: async () => {
				const {
					phase,
					totalFocusTime,
					currentTaskId,
					focusSessionCount,
					settings,
					scheduledDuration,
					startedAt,
				} = get();

				// Record as Completed
				if (startedAt) {
					const { activeSessionId } = get();
					const sessionType =
						phase === "focus"
							? "FOCUS"
							: phase === "shortBreak"
								? "SHORT_BREAK"
								: "LONG_BREAK";
					console.log(
						"2. Recording completed session (Final)",
						activeSessionId,
					);
					await get().recordSession({
						id: activeSessionId ?? undefined,
						taskId: currentTaskId,
						sessionType,
						status: "COMPLETED",
						scheduledDuration,
						actualDuration: totalFocusTime,
						startedAt: startedAt,
						endedAt: toLocalDateTime(new Date()),
					});
				}

				// Clear active session ID
				set({ activeSessionId: null });

				if (phase === "focus") {
					const newCount = focusSessionCount + 1;
					set({ focusSessionCount: newCount });

					// Determine next phase
					let nextPhase: PomodoroPhase = "shortBreak";
					if (
						settings.isLongBreakEnabled &&
						newCount % settings.longBreakInterval === 0
					) {
						nextPhase = "longBreak";
					}
					get().setPhase(nextPhase);

					// Auto-start next phase if enabled?
					if (settings.autoAdvance) {
						get().startTimer();
					}
				} else {
					// Break finished -> back to focus
					get().setPhase("focus");
					if (settings.autoAdvance) {
						get().startTimer();
					}
				}
			},

			tick: () => {
				const { timeLeft, isActive, totalFocusTime, settings } = get();
				if (!isActive) return;

				// Flow Logic:
				// If timeLeft > 0, decrement.
				// If timeLeft <= 0, we are in Overtime. Continue decrementing (negative values).
				// Do NOT auto-stop or auto-switch logic here for Focus.
				// For Breaks, do we auto-stop? User said "Flow Handling" implies manual.

				const newTimeLeft = timeLeft - 1;

				// Auto-advance logic
				if (newTimeLeft <= 0 && settings.autoAdvance) {
					console.log("Auto-advancing session...");
					get().completeSession();
					return;
				}

				const isOvertime = newTimeLeft < 0;

				set({
					timeLeft: newTimeLeft,
					totalFocusTime: totalFocusTime + 1,
					isOvertime,
				});

				// Play sound at 0?
				if (newTimeLeft === 0) {
					// Play alarm sound (TODO: Audio handling)
					console.log("Timer reached 0! Entering Flow/Overtime.");
				}
			},

			skipPhase: async () => {
				// Skipping effectively means interrupting current or just skipping break?
				// If focus, treat as interrupt if running?
				// Let's reuse resetTimer logic logic but move to next phase.
				// For simplicity, skipPhase just acts like "Done early" or "Skip break".
				// IF skipping Focus, it's interrupted.
				// IF skipping Break, it's completed? Or interrupted?
				// User wants "Flow". Skip is likely "I'm done early".
				// Let's treat as INTERRUPTED if timeLeft > 0.
				const { phase, activeSessionId } = get();
				console.log("Skipping phase", activeSessionId);
				if (phase === "focus") {
					console.log("Skipping Focus");
					await get().resetTimer(); // Saves as interrupted and resets
				}

				// Re-implement skip logic simply:
				// Note: resetTimer() invalidates state, so we must be careful with ordering.
				// Actually resetTimer() resets logic to start of *same* phase.
				// So we just need to advance phase now.

				const { settings, focusSessionCount } = get();
				// CAUTION: resetTimer reset focusSessionCount? No.
				if (phase === "focus") {
					// Move to break
					let nextPhase: PomodoroPhase = "shortBreak";
					if (
						settings.isLongBreakEnabled &&
						(focusSessionCount + 1) % settings.longBreakInterval === 0
					) {
						nextPhase = "longBreak";
					}
					get().setPhase(nextPhase);
				} else {
					get().setPhase("focus");
				}
			},

			updateSettings: (newSettings) => {
				set((state) => {
					const updated = { ...state.settings, ...newSettings };
					get().saveSettings(updated);
					// Update scheduledDuration if timer idle
					if (!state.isActive && state.totalFocusTime === 0) {
						let duration = updated.focusDuration;
						if (state.phase === "shortBreak")
							duration = updated.shortBreakDuration;
						if (state.phase === "longBreak")
							duration = updated.longBreakDuration;
						return {
							settings: updated,
							timeLeft: duration * 60,
							scheduledDuration: duration * 60,
						};
					}
					return { settings: updated };
				});
			},

			setFocusTask: (taskId) => {
				const { currentTaskId } = get();
				// If active, maybe prompt? For now just switch.
				if (currentTaskId !== taskId) {
					set({ currentTaskId: taskId });
				}
			},

			resetTotalFocusTime: () =>
				set({
					totalFocusTime: 0,
				}),

			adjustTime: (seconds) => {
				const { timeLeft } = get();
				const newTime = timeLeft + seconds;
				set({ timeLeft: newTime });
			},

			// API Actions
			recordSession: async (request: RecordRequest) => {
				try {
					console.log("2. Recording/Updating session:", request);
					const response = await apiClient.post<FocusSessionResponse>(
						"/api/focus-sessions/record",
						request,
					);
					// Update active session ID if not completed
					if (request.status === "INTERRUPTED") {
						set({ activeSessionId: response.data.id });
					}

					// Refresh stats
					await get().fetchDailySummary();
					await get().fetchEfficiencyStats();
				} catch (error) {
					console.error("Failed to record session:", error);
				}
			},

			saveFocusTime: async () => {}, // Deprecated, keeping implementation empty or removed

			fetchDailySummary: async () => {
				try {
					const today = format(new Date(), "yyyy-MM-dd");
					const response = await apiClient.get<DailySummary>(
						"/api/focus-sessions/daily",
						{ params: { date: today } },
					);
					set({ dailyFocusTime: response.data.totalSeconds });
				} catch (error) {
					console.error("Failed to fetch daily summary:", error);
				}
			},

			fetchTotalSummary: async () => {
				try {
					const response = await apiClient.get<TotalSummary>(
						"/api/focus-sessions/total",
					);
					set({ totalFocusTimeServer: response.data.totalSeconds });
				} catch (error) {
					console.error("Failed to fetch total summary:", error);
				}
			},

			fetchSettings: async () => {
				try {
					const response = await apiClient.get<PomodoroSettings>(
						"/api/settings/pomodoro",
					);
					if (response.data) {
						set((state) => {
							if (!state.isActive && state.totalFocusTime === 0) {
								// Only update if fresh
								const { phase } = state;
								let duration = response.data.focusDuration;
								if (phase === "shortBreak")
									duration = response.data.shortBreakDuration;
								if (phase === "longBreak")
									duration = response.data.longBreakDuration;
								return {
									settings: response.data,
									timeLeft: duration * 60,
									scheduledDuration: duration * 60,
								};
							}
							return { settings: response.data };
						});
					}
				} catch (error) {
					console.error("Failed to fetch settings:", error);
				}
			},

			saveSettings: async (settings) => {
				clearTimeout(saveTimeout);
				saveTimeout = setTimeout(async () => {
					try {
						await apiClient.patch("/api/settings/pomodoro", settings);
					} catch (error) {
						console.error("Failed to save settings:", error);
					}
				}, 1000);
			},

			fetchDailyGoal: async (date?: string) => {
				try {
					const targetDate = date || format(new Date(), "yyyy-MM-dd");
					const response = await apiClient.get<DailyGoalWithActual>(
						`/api/analytics/daily-goals/${targetDate}`,
					);
					set({ dailyGoalData: response.data });
				} catch (error) {
					console.error("Failed to fetch daily goal:", error);
				}
			},

			setDailyGoal: async (goalMinutes: number, date?: string) => {
				try {
					const targetDate = date || format(new Date(), "yyyy-MM-dd");
					await apiClient.put(`/api/daily-goals/${targetDate}`, {
						goalMinutes,
					});
					// Refresh the daily goal data to reflect changes
					await get().fetchDailyGoal(targetDate);
				} catch (error) {
					console.error("Failed to set daily goal:", error);
				}
			},

			fetchEfficiencyStats: async (date?: string) => {
				try {
					const targetDate = date || format(new Date(), "yyyy-MM-dd");
					const response = await apiClient.get<EfficiencyStats>(
						`/api/analytics/efficiency/range`,
						{ params: { startDate: targetDate, endDate: targetDate } },
					);
					set({ efficiencyStats: response.data });
				} catch (error) {
					console.error("Failed to fetch efficiency stats:", error);
				}
			},
		}),
		{
			name: "pomodoro-storage",
			partialize: (state) => ({
				settings: state.settings,
				// persist stats too?
				dailyFocusTime: state.dailyFocusTime,
				totalFocusTimeServer: state.totalFocusTimeServer,
				dailyGoalData: state.dailyGoalData,
			}),
		},
	),
);
