import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useWhiteNoise } from "@/hooks/useWhiteNoise";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useTodoStore } from "@/store/useTodoStore";

import { ControlButtons } from "./ControlButtons";
import { TaskSelector } from "./TaskSelector";
import { TimerRing } from "./TimerRing";

export default function FocusScreen() {
	const navigate = useNavigate();
	const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);

	// White noise audio hook
	useWhiteNoise();

	const {
		timeLeft,
		isActive,
		isOvertime,
		phase,
		startTimer,
		pauseTimer,
		resetTimer,
		completeSession,
		tick,
		skipPhase,
		settings,
		currentTaskId,
		setFocusTask,
		updateSettings,
		totalFocusTime,
		dailyFocusTime,
		fetchDailySummary,
		adjustTime,
	} = usePomodoroStore();

	const allTasks = useTodoStore((state) => state.allTasks);
	const updateTask = useTodoStore((state) => state.updateTask);

	// Get today's date
	const today = format(new Date(), "yyyy-MM-dd");

	// Filter tasks
	const todaysTasks = allTasks.filter(
		(t) => t.executionDate === today && t.status !== "COMPLETED",
	);
	const allTodayTasks = allTasks.filter((t) => t.executionDate === today);
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
	const isWhiteNoiseOn = settings.whiteNoise !== "none";

	// Fetch daily summary on mount
	useEffect(() => {
		fetchDailySummary();
		console.log("Daily summary fetched");
	}, [fetchDailySummary]);

	// Save focus time on page leave - Best effort
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (phase === "focus" && totalFocusTime > 0) {
				resetTimer(); // Record as interrupted
			}
		};
		// Visibility change?
		// We rely on store state persistence or resetTimer.

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

	// Calculate progress
	const totalDuration =
		phase === "focus"
			? settings.focusDuration * 60
			: phase === "shortBreak"
				? settings.shortBreakDuration * 60
				: settings.longBreakDuration * 60;
	// Progress:
	// If overtime (timeLeft < 0), progress > 100% or just 100%?
	// Let's cap at 100 or show spin?
	// Simple calc:
	const progress = Math.min(
		100,
		((totalDuration - timeLeft) / totalDuration) * 100,
	);

	// Handlers
	const handleEndSession = async () => {
		// Stop button -> Interrupted
		resetTimer();
		setFocusTask(null);
		navigate("/home");
	};

	const handleCompleteSession = async () => {
		// Finish/Break button (for Flow)
		completeSession();
		// Maybe navigate? Or stay?
		// Usually stay or move to break.
	};

	const handlePlayPause = () => {
		// New Requirement: If in Overtime (Flow) and Auto Advance is OFF,
		// the Play (or main) button should triggering "Complete Session".
		if (isOvertime && !settings.autoAdvance) {
			completeSession();
			return;
		}
		isActive ? pauseTimer() : startTimer();
	};

	const toggleWhiteNoise = () => {
		updateSettings({ whiteNoise: isWhiteNoiseOn ? "none" : "white-noise" });
	};

	const toggleAutoAdvance = () => {
		updateSettings({ autoAdvance: !settings.autoAdvance });
	};

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
				<TimerRing
					timeLeft={timeLeft}
					phase={phase}
					progress={progress}
					dailyFocusTime={dailyFocusTime}
					totalFocusTime={totalFocusTime}
					dailyGoal={settings.dailyGoal}
					onAdjustTime={adjustTime}
				/>

				{/* Show "Finish" button if in Overtime */}
				{/* Show "Finish" button if in Overtime */}
				{isOvertime && !settings.autoAdvance && (
					<button
						type="button"
						onClick={handleCompleteSession}
						className="mb-4 bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 transition"
					>
						Complete Session
					</button>
				)}

				<ControlButtons
					isActive={isActive}
					phase={phase}
					isWhiteNoiseOn={isWhiteNoiseOn}
					autoAdvance={settings.autoAdvance}
					onPlayPause={handlePlayPause}
					onReset={resetTimer}
					onSkip={skipPhase}
					onEndSession={handleEndSession}
					onToggleWhiteNoise={toggleWhiteNoise}
					onToggleAutoAdvance={toggleAutoAdvance}
					volume={settings.volume}
					onVolumeChange={(newVol) => updateSettings({ volume: newVol })}
				/>
			</div>
		</div>
	);
}
