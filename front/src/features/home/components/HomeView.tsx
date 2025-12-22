import { addDays, format, parse, subDays } from "date-fns";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FocusCircle } from "@/features/home/components/FocusCircle";
import { DailyTaskList } from "@/features/todo/components/DailyTaskList";
import { useTodoStore } from "@/store/useTodoStore";

export default function HomeView() {
	const userName = "User";

	const taskLists = useTodoStore((state) => state.taskLists);
	const allTasks = useTodoStore((state) => state.allTasks);
	const fetchTaskLists = useTodoStore((state) => state.fetchTaskLists);
	const createTask = useTodoStore((state) => state.createTask);
	const updateTask = useTodoStore((state) => state.updateTask);
	const deleteTask = useTodoStore((state) => state.deleteTask);

	useEffect(() => {
		fetchTaskLists();
	}, [fetchTaskLists]);

	const [selectedDate, setSelectedDate] = useState(
		format(new Date(), "yyyy-MM-dd"),
	);

	const inboxList = taskLists.find((list) => list.title === "Inbox");

	const handlePrevDay = () => {
		const currentDate = parse(selectedDate, "yyyy-MM-dd", new Date());
		setSelectedDate(format(subDays(currentDate, 1), "yyyy-MM-dd"));
	};

	const handleNextDay = () => {
		const currentDate = parse(selectedDate, "yyyy-MM-dd", new Date());
		setSelectedDate(format(addDays(currentDate, 1), "yyyy-MM-dd"));
	};

	const onCreateTask = async (
		taskListId: number,
		title: string,
		dueDate?: string | null,
		executionDate?: string | null,
		categoryId?: number,
	) => {
		await createTask(taskListId, title, dueDate, executionDate, categoryId);
	};

	const focusTime = { current: "2h 15m", goal: "4h" };

	return (
		<div className="h-full flex flex-col p-6 md:p-6 gap-6">
			{/* Hero Section */}
			<Card className="p-6 md:p-8 bg-gradient-to-r from-indigo-100 to-purple-100 border-none shadow-lg">
				<div className="flex flex-col md:flex-row items-center justify-between gap-6">
					<div className="space-y-4">
						<h1 className="text-2xl md:text-3xl font-bold text-gray-800">
							Good morning, {userName}! 🚀
							<br />
							Ready to crush your goals?
						</h1>
						<Button className=" w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg">
							<Play className="w-4 h-4 mr-2" />
							Start Focus Session (25m)
						</Button>
					</div>
					<FocusCircle current={focusTime.current} goal={focusTime.goal} />
				</div>
			</Card>

			{/* Today's Plan Section */}
			<div className="flex-1 min-h-0 space-y-4">
				<Card className="p-4 h-full flex flex-col">
					<div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-32">
						<DailyTaskList
							date={selectedDate}
							tasks={allTasks}
							onUpdateTask={updateTask}
							onDeleteTask={deleteTask}
							onCreateTask={onCreateTask}
							onPrevDay={handlePrevDay}
							onNextDay={handleNextDay}
							taskListId={inboxList?.id ?? 0}
							emptyMessage={
								selectedDate === format(new Date(), "yyyy-MM-dd")
									? "No tasks scheduled for today"
									: "No tasks scheduled for this date"
							}
						/>
					</div>
				</Card>
			</div>
		</div>
	);
}
