export const PomodoroPhase = {
	FOCUS: "FOCUS",
	SHORT_BREAK: "SHORT_BREAK",
	LONG_BREAK: "LONG_BREAK",
} as const;

export type PomodoroPhase = (typeof PomodoroPhase)[keyof typeof PomodoroPhase];

export interface PomodoroSettings {
	focusDuration: number; // minutes
	shortBreakDuration: number; // minutes
	longBreakDuration: number; // minutes
	longBreakInterval: number; // number of focus sessions before long break
	isLongBreakEnabled: boolean; // enable long break
	dailyGoal: number; // daily goal in minutes
	// autoAdvance: removed as forced true
	whiteNoise: string; // 'none' | 'rain' | 'cafe' | 'white_noise'
	volume: number; // 0-1
}

export interface RecordRequest {
	id?: number;
	taskId: number | null;
	sessionType: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
	status: "COMPLETED" | "INTERRUPTED";
	scheduledDuration: number;
	actualDuration: number;
	startedAt: string;
	endedAt: string;
}

export interface FocusSessionResponse {
	id: number;
	taskId: number | null;
	sessionType: string;
	status: string;
	scheduledDuration: number;
	actualDuration: number;
	startedAt: string;
}

export interface EfficiencyStats {
	efficiencyScore: number;
	rhythmQuality: number;
	volumeBalance: number;
	focusRatio: number;
	restRatio: number;
	paceRatio: number;
}

export interface DailySummary {
	date: string;
	totalSeconds: number;
}

export interface TotalSummary {
	totalSeconds: number;
}

export interface DailyGoalWithActual {
	date: string;
	goalMinutes: number;
	actualMinutes: number;
	percentageComplete: number;
}

export interface PomodoroState {
	// Timer State
	timeLeft: number; // seconds
	overtime: number; // seconds (elapsed since timeLeft reached 0)
	duration: number; // seconds
	isActive: boolean;
	isOvertime: boolean;
	phase: PomodoroPhase;
	startedAt: string | null; // ISO string when timer started (initial)
	endTime: number | null; // Timestamp when current timer ends (if active)

	// Session Info
	currentTaskId: number | null;
	focusSessionCount: number;
	activeSessionId: number | null;

	// Server-synced State
	dailyFocusTime: number;
	totalFocusTimeServer: number;
	dailyGoalData: DailyGoalWithActual | null;
	efficiencyStats: EfficiencyStats | null;

	// Settings
	settings: PomodoroSettings;

	// Actions
	setPhase: (phase: PomodoroPhase) => void;
	startTimer: () => void;
	pauseTimer: () => void;
	resetTimer: () => Promise<void>;
	completeSession: () => Promise<void>;
	tick: () => void;
	skipPhase: () => Promise<void>;
	updateSettings: (settings: Partial<PomodoroSettings>) => void;
	setFocusTask: (taskId: number | null) => void;
	resetTotalFocusTime: () => void; // Keeps the interface but might be no-op
	adjustTime: (seconds: number) => void;
	setOvertime: (overtime: number) => void;

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
