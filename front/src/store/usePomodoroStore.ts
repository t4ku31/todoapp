import { apiClient } from "@/config/env";
import { format } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

interface PomodoroSettings {
	focusDuration: number; // minutes
	shortBreakDuration: number; // minutes
	longBreakDuration: number; // minutes
	dailyGoal: number; // daily goal in minutes
	autoAdvance: boolean; // auto advance to next phase
	whiteNoise: string; // 'none' | 'rain' | 'cafe' | 'white_noise'
	volume: number; // 0-1
}

interface FocusSessionResponse {
	id: number;
	taskId: number | null;
	date: string;
	durationSeconds: number;
}

interface DailySummary {
	date: string;
	totalSeconds: number;
}

interface TotalSummary {
	totalSeconds: number;
}

interface PomodoroState {
	// Timer State
	timeLeft: number; // seconds
	isActive: boolean;
	phase: PomodoroPhase;
	currentTaskId: number | null; // ID of task being focused on
	totalFocusTime: number; // Total focus time in seconds (current session, not saved yet)
	focusSessionCount: number; // Number of completed focus sessions (for longBreak after 4)

	// Server-synced State
	dailyFocusTime: number; // Total focus time from server for today
	totalFocusTimeServer: number; // Total all-time focus time from server

	// Settings
	settings: PomodoroSettings;

	// Actions
	setPhase: (phase: PomodoroPhase) => void;
	startTimer: () => void;
	pauseTimer: () => void;
	resetTimer: () => void;
	tick: () => void;
	skipPhase: () => void;
	updateSettings: (settings: Partial<PomodoroSettings>) => void;
	setFocusTask: (taskId: number | null) => void;
	resetTotalFocusTime: () => void;
	adjustTime: (seconds: number) => void;

	// API Actions
	saveFocusTime: (
		durationSeconds: number,
		taskId?: number | null,
	) => Promise<void>;
	fetchDailySummary: () => Promise<void>;
	fetchTotalSummary: () => Promise<void>;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
	focusDuration: 5,
	shortBreakDuration: 1,
	longBreakDuration: 5,
	dailyGoal: 120, // 2 hours default
	autoAdvance: false,
	whiteNoise: "none",
	volume: 0.5,
};

export const usePomodoroStore = create<PomodoroState>()(
	persist(
		(set, get) => ({
			timeLeft: DEFAULT_SETTINGS.focusDuration * 60,
			isActive: false,
			phase: "focus",
			currentTaskId: null,
			totalFocusTime: 0,
			focusSessionCount: 0,
			dailyFocusTime: 0,
			totalFocusTimeServer: 0,
			settings: DEFAULT_SETTINGS,

			setPhase: (phase) => {
				const {
					settings,
					totalFocusTime,
					currentTaskId,
					phase: prevPhase,
				} = get();

				// Save focus time when leaving focus phase
				if (prevPhase === "focus" && totalFocusTime > 0) {
					get().saveFocusTime(totalFocusTime, currentTaskId);
					console.log("Focus time saved by setPhase");
				}

				let duration = settings.focusDuration;
				if (phase === "shortBreak") duration = settings.shortBreakDuration;
				if (phase === "longBreak") duration = settings.longBreakDuration;

				set({
					phase,
					timeLeft: duration * 60,
					isActive: false,
					totalFocusTime: 0,
				});
			},

			startTimer: () => {
				set({ isActive: true });
				console.log("Timer started");
			},
			pauseTimer: () => set({ isActive: false }),

			resetTimer: () => {
				const { phase, settings } = get();
				let duration = settings.focusDuration;
				if (phase === "shortBreak") duration = settings.shortBreakDuration;
				if (phase === "longBreak") duration = settings.longBreakDuration;
				set({ timeLeft: duration * 60, isActive: false });
			},

			tick: () => {
				const {
					timeLeft,
					isActive,
					settings,
					phase,
					totalFocusTime,
					focusSessionCount,
				} = get();
				if (!isActive) return;

				if (timeLeft > 0) {
					// Increment total focus time only during focus phase
					if (phase === "focus") {
						set({ timeLeft: timeLeft - 1, totalFocusTime: totalFocusTime + 1 });
					} else {
						set({ timeLeft: timeLeft - 1 });
					}
				} else {
					// Timer finished
					console.log("Timer finished, phase:", phase);

					if (phase === "focus") {
						// Save focus time
						if (totalFocusTime > 0) {
							get().saveFocusTime(totalFocusTime, get().currentTaskId);
							set({ totalFocusTime: 0 });
						}

						// Increment focus session count
						const newCount = focusSessionCount + 1;
						set({ focusSessionCount: newCount });
						console.log("Focus session count:", newCount);

						// Determine next break: longBreak after 4 focus sessions
						const nextPhase = newCount % 4 === 0 ? "longBreak" : "shortBreak";
						console.log("Switching to:", nextPhase);
						get().setPhase(nextPhase);
					} else {
						// Break finished -> back to focus
						console.log("Break finished, switching to focus");
						get().setPhase("focus");
					}

					// Auto-start if autoAdvance is enabled
					if (settings.autoAdvance) {
						set({ isActive: true });
					}
				}
			},

			skipPhase: () => {
				const { phase, totalFocusTime, currentTaskId } = get();

				// Save focus time when skipping from focus phase
				if (phase === "focus" && totalFocusTime > 0) {
					get().saveFocusTime(totalFocusTime, currentTaskId);
					set({ totalFocusTime: 0 });
				}

				// Simple toggle for now: Focus -> Short Break -> Focus
				const nextPhase = phase === "focus" ? "shortBreak" : "focus";
				get().setPhase(nextPhase);
			},

			updateSettings: (newSettings) =>
				set((state) => ({ settings: { ...state.settings, ...newSettings } })),

			setFocusTask: (taskId) => {
				const { currentTaskId, totalFocusTime, phase } = get();

				// Save focus time when switching tasks
				if (
					phase === "focus" &&
					totalFocusTime > 0 &&
					currentTaskId !== taskId
				) {
					get().saveFocusTime(totalFocusTime, currentTaskId);
					set({ totalFocusTime: 0 });
				}
				console.log("Switching to task:", taskId);
				set({ currentTaskId: taskId });
			},

			resetTotalFocusTime: () => set({ totalFocusTime: 0 }),

			adjustTime: (seconds) => {
				const { timeLeft } = get();
				const newTime = Math.max(0, timeLeft + seconds);
				set({ timeLeft: newTime });
			},

			// API Actions
			saveFocusTime: async (durationSeconds, taskId) => {
				if (durationSeconds <= 0) return;

				try {
					const today = format(new Date(), "yyyy-MM-dd");
					await apiClient.post<FocusSessionResponse>("/api/focus-sessions", {
						taskId: taskId ?? null,
						date: today,
						durationSeconds,
					});

					// Refresh daily summary after saving
					await get().fetchDailySummary();
				} catch (error) {
					console.error("Failed to save focus time:", error);
				}
			},

			fetchDailySummary: async () => {
				try {
					const today = format(new Date(), "yyyy-MM-dd");
					const response = await apiClient.get<DailySummary>(
						"/api/focus-sessions/daily",
						{
							params: { date: today },
						},
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
		}),
		{
			name: "pomodoro-storage",
			partialize: (state) => ({
				settings: state.settings,
				// Don't persist timer state to avoid stale data
			}),
		},
	),
);
