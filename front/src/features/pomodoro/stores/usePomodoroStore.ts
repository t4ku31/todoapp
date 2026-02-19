import { apiClient } from "@/config/env";
import { format } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
	DailyGoalWithActual,
	DailySummary,
	EfficiencyStats,
	FocusSessionResponse,
	PomodoroSettings,
	PomodoroState,
	RecordRequest,
	TotalSummary,
} from "../types";
import { PomodoroPhase } from "../types";

// Helper: Format date as local time string for Java LocalDateTime
const toLocalDateTime = (date: Date): string => {
	// console.log("Date: ", format(date, "yyyy-MM-dd'T'HH:mm:ss"));
	return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

const DEFAULT_SETTINGS: PomodoroSettings = {
	focusDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	isLongBreakEnabled: true,
	dailyGoal: 120, // 2 hours default
	whiteNoise: "none",
	volume: 0.5,
};

// simple debounce helper
let saveTimeout: ReturnType<typeof setTimeout>;

// Helper: Get duration for a phase based on settings
const getDuration = (
	settings: PomodoroSettings,
	phase: PomodoroPhase,
): number => {
	let duration = settings.focusDuration;
	if (phase === PomodoroPhase.SHORT_BREAK)
		duration = settings.shortBreakDuration;
	if (phase === PomodoroPhase.LONG_BREAK) duration = settings.longBreakDuration;
	return duration * 60;
};

export const usePomodoroStore = create<PomodoroState>()(
	persist(
		(set, get) => ({
			isActive: false,
			isOvertime: false,
			phase: PomodoroPhase.FOCUS,
			currentTaskId: null,
			focusSessionCount: 0,
			startedAt: null,

			endTime: null,
			duration: DEFAULT_SETTINGS.focusDuration * 60,
			timeLeft: DEFAULT_SETTINGS.focusDuration * 60,
			overtime: 0,

			dailyFocusTime: 0,
			totalFocusTimeServer: 0,
			dailyGoalData: null,
			efficiencyStats: null,
			activeSessionId: null,
			settings: DEFAULT_SETTINGS,

			setPhase: (phase) => {
				const { settings } = get();
				const durationSeconds = getDuration(settings, phase);

				set({
					phase,
					isActive: false,
					isOvertime: false,
					endTime: null,
					duration: durationSeconds,
					timeLeft: durationSeconds,
					overtime: 0,
					startedAt: null,
					activeSessionId: null,
				});
			},

			//1.startTimer
			startTimer: () => {
				const { timeLeft, isActive, startedAt } = get();
				if (isActive) return;

				const now = Date.now();
				set({
					isActive: true,
					endTime: now + timeLeft * 1000,
					startedAt: startedAt || toLocalDateTime(new Date()),
				});
			},
			//2.pauseTimer
			pauseTimer: async () => {
				const {
					phase,
					currentTaskId,
					duration,
					timeLeft,
					startedAt,
					activeSessionId,
					isActive,
					endTime,
				} = get();

				if (!isActive) return;

				// Calculate precise remaining time on pause
				let remaining = timeLeft;
				if (endTime) {
					remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
				}

				const actualDuration = duration - remaining;

				if (actualDuration > 0) {
					// Record Interrupted Session
					await get().recordSession({
						id: activeSessionId ?? undefined,
						taskId: currentTaskId,
						sessionType: phase,
						status: "INTERRUPTED",
						scheduledDuration: duration,
						actualDuration: actualDuration,
						startedAt:
							startedAt ||
							toLocalDateTime(new Date(Date.now() - actualDuration * 1000)),
						endedAt: toLocalDateTime(new Date()),
					});
				}

				set({
					isActive: false,
					endTime: null,
					timeLeft: remaining,
				});
			},

			//3.resetTimer
			resetTimer: async () => {
				const {
					phase,
					settings,
					startedAt,
					duration,
					timeLeft,
					currentTaskId,
					activeSessionId,
				} = get();

				const actualDuration = duration - timeLeft;

				// Record Interrupted if started
				if (startedAt && actualDuration > 0) {
					await get().recordSession({
						id: activeSessionId ?? undefined,
						taskId: currentTaskId,
						sessionType: phase,
						status: "INTERRUPTED",
						scheduledDuration: duration,
						actualDuration: actualDuration,
						startedAt: startedAt,
						endedAt: toLocalDateTime(new Date()),
					});
				}

				const durationSeconds = getDuration(settings, phase);

				set({
					isActive: false,
					endTime: null,
					duration: durationSeconds,
					timeLeft: durationSeconds,
					overtime: 0,
					startedAt: null,
					activeSessionId: null,
				});
			},

			//4.completeSession
			completeSession: async () => {
				const {
					phase,
					currentTaskId,
					focusSessionCount,
					settings,
					duration,
					startedAt,
					activeSessionId,
				} = get();

				console.log("[DEBUG] completeSession called. Phase:", phase);

				// Record Completed
				if (startedAt) {
					console.log("[DEBUG] Recording session");

					const recordSessionData: RecordRequest = {
						id: activeSessionId ?? undefined,
						taskId: currentTaskId,
						sessionType: phase,
						status: "COMPLETED",
						scheduledDuration: duration,
						actualDuration: duration, // Completed full duration
						startedAt: startedAt,
						endedAt: toLocalDateTime(new Date()),
					};
					console.log("[DEBUG] Record session data:", recordSessionData);
					await get().recordSession(recordSessionData);
				}

				set({ activeSessionId: null });

				switch (phase) {
					case PomodoroPhase.FOCUS: {
						const newCount = focusSessionCount + 1;
						console.log("[DEBUG] Incrementing session count to:", newCount);
						set({ focusSessionCount: newCount });

						// Auto Switch Phase
						let nextPhase: PomodoroPhase = PomodoroPhase.SHORT_BREAK;
						if (
							settings.isLongBreakEnabled &&
							newCount % settings.longBreakInterval === 0
						) {
							nextPhase = PomodoroPhase.LONG_BREAK;
						}

						get().setPhase(nextPhase);
						get().startTimer();
						break;
					}
					case PomodoroPhase.SHORT_BREAK:
					case PomodoroPhase.LONG_BREAK:
						// Break -> Focus
						get().setPhase(PomodoroPhase.FOCUS);
						get().startTimer();
						break;
				}
			},

			tick: () => {
				const { isActive, endTime } = get();
				if (!isActive || !endTime) return;

				const now = Date.now();
				const remaining = Math.ceil((endTime - now) / 1000);

				if (remaining > 0) {
					set({
						timeLeft: remaining,
						overtime: 0,
						isOvertime: false,
					});
				} else {
					set({
						timeLeft: 0,
						overtime: Math.abs(remaining),
						isOvertime: true,
					});
				}
			},

			skipPhase: async () => {
				const { phase } = get();
				if (phase === PomodoroPhase.FOCUS) {
					await get().resetTimer(); // Record interruption
				}

				const { settings, focusSessionCount } = get();
				if (phase === PomodoroPhase.FOCUS) {
					let nextPhase: PomodoroPhase = PomodoroPhase.SHORT_BREAK;
					if (
						settings.isLongBreakEnabled &&
						(focusSessionCount + 1) % settings.longBreakInterval === 0
					) {
						nextPhase = PomodoroPhase.LONG_BREAK;
					}
					get().setPhase(nextPhase);
				} else {
					get().setPhase(PomodoroPhase.FOCUS);
				}
			},

			updateSettings: (newSettings) => {
				set((state) => {
					// Removed autoAdvance from settings interface but checking partial just in case
					const { ...validSettings } = newSettings;
					// Filter out autoAdvance if it exists in legacy partial?
					// TS will handle it.

					const updated = { ...state.settings, ...validSettings };
					get().saveSettings(updated);

					// Update duration if timer idle
					if (!state.isActive && state.startedAt === null) {
						const durationSeconds = getDuration(updated, state.phase);
						return {
							settings: updated,
							duration: durationSeconds,
							timeLeft: durationSeconds,
						};
					}
					return { settings: updated };
				});
			},

			setFocusTask: (taskId) => {
				const { currentTaskId } = get();
				if (currentTaskId !== taskId) {
					set({ currentTaskId: taskId });
				}
			},

			resetTotalFocusTime: () => {
				// No-op or implementation if needed for UI, but removed from state
			},

			adjustTime: (seconds) => {
				const { isActive, endTime, timeLeft, duration } = get();
				const newDuration = Math.max(60, duration + seconds);
				const actualChange = newDuration - duration;

				if (isActive && endTime) {
					set({
						endTime: endTime + actualChange * 1000,
						duration: newDuration,
					});
				} else {
					set({
						timeLeft: timeLeft + actualChange,
						duration: newDuration,
					});
				}
			},

			setOvertime: (overtime) => {
				set({ overtime, isOvertime: overtime > 0 });
			},

			// API Actions
			recordSession: async (request: RecordRequest) => {
				try {
					console.log("Recording/Updating session:", request);
					const response = await apiClient.post<FocusSessionResponse>(
						"/api/focus-sessions/record",
						request,
					);
					console.log("[DEBUG] Server response for session:", response.data);

					if (request.status === "INTERRUPTED") {
						set({ activeSessionId: response.data.id });
					}
					await get().fetchDailySummary();
					await get().fetchEfficiencyStats();
				} catch (error) {
					console.error("Failed to record session:", error);
				}
			},

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
							if (!state.isActive && state.startedAt === null) {
								const durationSeconds = getDuration(response.data, state.phase);
								return {
									settings: response.data,
									timeLeft: durationSeconds,
									duration: durationSeconds,
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
				dailyFocusTime: state.dailyFocusTime,
				totalFocusTimeServer: state.totalFocusTimeServer,
				dailyGoalData: state.dailyGoalData,
				// Persist Timer State
				endTime: state.endTime,
				duration: state.duration,
				timeLeft: state.timeLeft,
				isActive: state.isActive,
				isOvertime: state.isOvertime,
				overtime: state.overtime,
				phase: state.phase,
				startedAt: state.startedAt,
				currentTaskId: state.currentTaskId,
				activeSessionId: state.activeSessionId,
				focusSessionCount: state.focusSessionCount,
			}),
		},
	),
);
