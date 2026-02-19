import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePomodoroStore } from "@/features/pomodoro/stores/usePomodoroStore";
import { PomodoroPhase } from "@/features/pomodoro/types";
import { DailyTaskList } from "@/features/todo/components/DailyTaskList";
import { useTodoStore } from "@/store/useTodoStore";
import { addDays, format, parse, subDays } from "date-fns";
import { Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FocusCircle } from "./FocusCircle";

export default function HomeView() {
	const navigate = useNavigate();

	const taskLists = useTodoStore((state) => state.taskLists);
	const allTasks = useTodoStore((state) => state.allTasks);
	const fetchTaskLists = useTodoStore((state) => state.fetchTaskLists);
	const createTask = useTodoStore((state) => state.createTask);
	const updateTask = useTodoStore((state) => state.updateTask);
	const deleteTask = useTodoStore((state) => state.deleteTask);
	const loading = useTodoStore((state) => state.loading);
	const startTimer = usePomodoroStore((state) => state.startTimer);
	const currentTaskId = usePomodoroStore((state) => state.currentTaskId);
	const setFocusTask = usePomodoroStore((state) => state.setFocusTask);
	const setPhase = usePomodoroStore((state) => state.setPhase);
	const fetchSettings = usePomodoroStore((state) => state.fetchSettings);
	const settings = usePomodoroStore((state) => state.settings);

	// Get current selected task
	const currentTask = currentTaskId
		? allTasks.find((t) => t.id === currentTaskId)
		: null;

	useEffect(() => {
		fetchTaskLists();
		fetchSettings();
	}, [fetchTaskLists, fetchSettings]);

	const [selectedDate, setSelectedDate] = useState(
		format(new Date(), "yyyy-MM-dd"),
	);

	// Auto-select first task if none selected
	const todaysTasks = allTasks.filter(
		(t) =>
			t.scheduledStartAt &&
			format(t.scheduledStartAt, "yyyy-MM-dd") === selectedDate &&
			t.status !== "COMPLETED",
	);

	useEffect(() => {
		if (!currentTaskId && todaysTasks.length > 0) {
			setFocusTask(todaysTasks[0].id);
		}
	}, [currentTaskId, todaysTasks, setFocusTask]);

	const inboxList = taskLists.find((list) => list.title === "Inbox");

	const handlePrevDay = useCallback(() => {
		const currentDate = parse(selectedDate, "yyyy-MM-dd", new Date());
		setSelectedDate(format(subDays(currentDate, 1), "yyyy-MM-dd"));
	}, [selectedDate]);

	const handleNextDay = useCallback(() => {
		const currentDate = parse(selectedDate, "yyyy-MM-dd", new Date());
		setSelectedDate(format(addDays(currentDate, 1), "yyyy-MM-dd"));
	}, [selectedDate]);

	const startFocusSession = () => {
		setPhase(PomodoroPhase.FOCUS);
		startTimer();
		navigate("/focus");
	};

	return (
		<div className="h-full flex p-6 gap-6">
			{loading ? (
				<LoadingSpinner size="lg" />
			) : (
				<>
					{/* Right Column: Task List */}
					<Card className="p-4 flex-1 flex flex-col min-h-0">
						<div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-32">
							<DailyTaskList
								date={selectedDate}
								tasks={allTasks}
								onUpdateTask={updateTask}
								onDeleteTask={deleteTask}
								onCreateTask={createTask}
								onPrevDay={handlePrevDay}
								onNextDay={handleNextDay}
								taskListId={inboxList?.id ?? 0}
								taskItemVariant="focusSelector"
								emptyMessage={
									selectedDate === format(new Date(), "yyyy-MM-dd")
										? "No tasks scheduled for today"
										: "No tasks scheduled for this date"
								}
							/>
						</div>
					</Card>
					{/* Left Column: Hero + Focus Circle */}
					<div className="flex flex-col gap-6 w-80 flex-shrink-0">
						{/* Hero Section */}
						<Card className="flex-1 p-4 md:p-6 bg-gradient-to-r from-indigo-100 to-purple-100 border-none shadow-lg">
							<div className="flex flex-col justify-between w-full h-full space-y-4">
								<h1 className="text-xl pt-8 md:text-2xl font-bold text-gray-800 text-center">
									{currentTask ? (
										<div className="flex flex-col items-center gap-1">
											<span className="pr-20">Start working on</span>
											<span className="pl-20 text-purple-600">
												{currentTask.title}
											</span>
										</div>
									) : (
										<>Ready to crush your goals?</>
									)}
								</h1>
								<Button
									onClick={startFocusSession}
									className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg"
								>
									<Play className="w-4 h-4 mr-2" />
									Start Focus Session ({settings.focusDuration}m)
								</Button>
							</div>
						</Card>

						{/* Focus Circle */}
						<Card className="shadow-lg flex-1">
							<FocusCircle />
						</Card>
					</div>
				</>
			)}
		</div>
	);
}
