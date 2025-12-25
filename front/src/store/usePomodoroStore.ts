import { format } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/config/env";

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
	fetchSettings: () => Promise<void>;
	saveSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;
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
						console.log(
							"Incrementing focus session count from",
							focusSessionCount,
							"to",
							newCount,
						);
						set({ focusSessionCount: newCount });
						console.log("Focus session count:", newCount);

						// Determine next break: longBreak after N focus sessions if enabled
						let nextPhase: PomodoroPhase = "shortBreak";
						if (
							settings.isLongBreakEnabled &&
							newCount % settings.longBreakInterval === 0
						) {
							nextPhase = "longBreak";
						}
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
				const {
					phase,
					totalFocusTime,
					currentTaskId,
					focusSessionCount,
					settings,
				} = get();

				// Skip from Focus
				if (phase === "focus") {
					// Save partial focus time
					if (totalFocusTime > 0) {
						get().saveFocusTime(totalFocusTime, currentTaskId);
						set({ totalFocusTime: 0 });
					}

					// Increment count
					const newCount = focusSessionCount + 1;
					console.log(
						"Incrementing focus session count from",
						focusSessionCount,
						"to",
						newCount,
					);
					set({ focusSessionCount: newCount });

					// Determine next phase (Short vs Long Break)
					let nextPhase: PomodoroPhase = "shortBreak";
					if (
						settings.isLongBreakEnabled &&
						newCount % settings.longBreakInterval === 0
					) {
						nextPhase = "longBreak";
					}
					get().setPhase(nextPhase);
				} else {
					// Skip from Break -> Back to Focus
					// Do NOT increment count
					get().setPhase("focus");
				}
			},

			updateSettings: (newSettings) => {
				set((state) => {
					const updated = { ...state.settings, ...newSettings };
					// Trigger save to server (debounced)
					get().saveSettings(updated);
					return { settings: updated };
				});
			},

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

			fetchSettings: async () => {
				try {
					const response = await apiClient.get<PomodoroSettings>(
						"/api/settings/pomodoro",
					);
					console.log("API Fetch Response:", response.data);
					if (response.data) {
						set((state) => {
							// If timer is not active, update timeLeft to match the new settings
							if (!state.isActive) {
								const { phase } = state;
								let duration = response.data.focusDuration;
								if (phase === "shortBreak")
									duration = response.data.shortBreakDuration;
								if (phase === "longBreak")
									duration = response.data.longBreakDuration;
								return {
									settings: response.data,
									timeLeft: duration * 60,
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
						console.log("Settings saved to server");
					} catch (error) {
						console.error("Failed to save settings:", error);
					}
				}, 1000); // Debounce 1s
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
