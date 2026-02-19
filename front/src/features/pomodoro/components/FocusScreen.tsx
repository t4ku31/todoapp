import { usePomodoroStore } from "@/features/pomodoro/stores/usePomodoroStore";
import { useWhiteNoise } from "@/features/pomodoro/stores/useWhiteNoise";
import { PomodoroPhase } from "@/features/pomodoro/types";
import { useTodoStore } from "@/store/useTodoStore";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

const NOTIFICATION_SOUND_PATH = "/sounds/NotificationSound.mp3";

import { ControlButtons } from "./ControlButtons";
import { TaskSelector } from "./TaskSelector";
import { TimerRing } from "./TimerRing";

export default function FocusScreen() {
	const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);

	// White noise audio hook
	useWhiteNoise();

	const {
		timeLeft,
		isActive,
		isOvertime,
		phase,
		resetTimer,
		tick,
		settings,
		currentTaskId,
		setFocusTask,
		fetchDailySummary,
		duration, // Add duration
	} = usePomodoroStore();

	// Derived state for UI
	const totalFocusTime = duration - timeLeft;

	const allTasks = useTodoStore((state) => state.allTasks);
	const updateTask = useTodoStore((state) => state.updateTask);

	// Get today's date
	const today = format(new Date(), "yyyy-MM-dd");

	// Filter tasks
	const todaysTasks = allTasks.filter(
		(t) =>
			t.scheduledStartAt &&
			format(t.scheduledStartAt, "yyyy-MM-dd") === today &&
			t.status !== "COMPLETED",
	);
	const allTodayTasks = allTasks.filter(
		(t) =>
			t.scheduledStartAt && format(t.scheduledStartAt, "yyyy-MM-dd") === today,
	);
	const currentTask = currentTaskId
		? allTasks.find((t) => t.id === currentTaskId)
		: null;

	// Handle task completion
	const handleCompleteTask = async (taskId: number) => {
		await updateTask(taskId, { status: "COMPLETED" });
		if (currentTaskId === taskId) {
			setFocusTask(null);
		}
	};

	// White noise state

	// Fetch daily summary on mount
	useEffect(() => {
		fetchDailySummary();
	}, [fetchDailySummary]);

	// Save focus time on page leave - Best effort
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (phase === PomodoroPhase.FOCUS && totalFocusTime > 0) {
				resetTimer(); // Record as interrupted
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [phase, totalFocusTime, resetTimer]);

	// Timer tick effect
	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | null = null;
		if (isActive) {
			interval = setInterval(() => tick(), 1000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isActive, tick]);

	// Request notification permission on mount
	useEffect(() => {
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission();
		}
	}, []);

	const sendSystemNotification = useCallback((title: string, body: string) => {
		if ("Notification" in window && Notification.permission === "granted") {
			new Notification(title, {
				body,
				icon: "/favicon.ico", // Ensure this exists or use appropriate icon
			});
		}
	}, []);

	// Preload notification sound (useRef pattern, consistent with useWhiteNoise)
	const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
	useEffect(() => {
		const audio = new Audio(NOTIFICATION_SOUND_PATH);
		notificationAudioRef.current = audio;
	}, []);

	const playNotificationSound = useCallback(() => {
		const audio = notificationAudioRef.current;
		if (audio) {
			audio.volume = settings.volume;
			audio.currentTime = 0;
			audio.play().catch((e) => {
				console.error("Failed to play notification sound", e);
			});
		}
	}, [settings.volume]);

	// Audio & System Notification when time is up (isOvertime transitions to true)
	const prevOvertimeRef = useRef(false);
	useEffect(() => {
		if (isOvertime && !prevOvertimeRef.current) {
			const phaseLabel =
				phase === PomodoroPhase.FOCUS ? "フォーカス" : "リラックス";
			const title = "時間になりました！";
			const body = `${phaseLabel}セッションが終了しました。`;

			playNotificationSound();
			sendSystemNotification(title, body);
		}
		prevOvertimeRef.current = isOvertime;
	}, [isOvertime, phase, playNotificationSound, sendSystemNotification]);

	// Calculate progress

	// Handlers

	return (
		<div className="min-h-screen flex flex-col items-center justify-between p-6 relative bg-gradient-to-r from-blue-200 via-purple-200 to-purple-300">
			{/* Task Selector */}
			<TaskSelector
				isOpen={taskDropdownOpen}
				onToggle={() => setTaskDropdownOpen(!taskDropdownOpen)}
				currentTask={currentTask ?? null}
				todaysTasks={todaysTasks}
				allTodayTasks={allTodayTasks}
				currentTaskId={currentTaskId}
				onSelectTask={setFocusTask}
				onCompleteTask={handleCompleteTask}
				onUpdateTask={updateTask}
			/>

			{/* Timer Section */}
			<div className="flex-1 flex flex-col items-center justify-center">
				<TimerRing />

				<ControlButtons />
			</div>
		</div>
	);
}
