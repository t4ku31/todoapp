import { apiClient } from "@/config/env";
import { create } from "zustand";
import type {
	DailyAnalyticsData,
	MonthlyAnalyticsData,
	WeeklyAnalyticsData,
} from "../types";

interface AnalyticsState {
	dailyData: DailyAnalyticsData | null;
	weeklyData: WeeklyAnalyticsData | null;
	monthlyData: MonthlyAnalyticsData | null;
	isLoading: boolean;
	error: string | null;

	fetchDailyAnalytics: (date: string) => Promise<void>;
	fetchWeeklyAnalytics: (startDate: string, endDate: string) => Promise<void>;
	fetchMonthlyAnalytics: (month: string) => Promise<void>;
	updateDailyTaskStatus: (taskId: number, completed: boolean) => void;
	updateWeeklyTaskStatus: (taskId: number, completed: boolean) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
	dailyData: null,
	weeklyData: null,
	monthlyData: null,
	isLoading: false,
	error: null,

	fetchDailyAnalytics: async (date) => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.get<DailyAnalyticsData>(
				"/api/analytics/daily",
				{ params: { date } },
			);
			set({ dailyData: response.data, isLoading: false });
		} catch (error) {
			console.error("Failed to fetch daily analytics:", error);
			set({ error: "Failed to fetch daily analytics", isLoading: false });
		}
	},

	fetchWeeklyAnalytics: async (startDate, endDate) => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.get<WeeklyAnalyticsData>(
				"/api/analytics/weekly",
				{ params: { startDate, endDate } },
			);
			set({ weeklyData: response.data, isLoading: false });
		} catch (error) {
			console.error("Failed to fetch weekly analytics:", error);
			set({ error: "Failed to fetch weekly analytics", isLoading: false });
		}
	},

	fetchMonthlyAnalytics: async (month) => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.get<MonthlyAnalyticsData>(
				"/api/analytics/monthly",
				{ params: { month } },
			);
			set({ monthlyData: response.data, isLoading: false });
			console.log("monthlyData", response.data);
		} catch (error) {
			console.error("Failed to fetch monthly analytics:", error);
			set({ error: "Failed to fetch monthly analytics", isLoading: false });
		}
	},

	updateDailyTaskStatus: (taskId, completed) => {
		const { dailyData } = get();
		if (!dailyData) return;

		// Find the task and check if status changed
		let statusChanged = false;
		const updatedTaskSummaries = dailyData.taskSummaries.map((task) => {
			if (task.taskId === taskId && task.completed !== completed) {
				statusChanged = true;
				return {
					...task,
					completed,
					status: completed ? "COMPLETED" : "PENDING",
				};
			}
			return task;
		});

		if (statusChanged) {
			// Update tasksCompletedCount based on the change
			const delta = completed ? 1 : -1;
			set({
				dailyData: {
					...dailyData,
					tasksCompletedCount: dailyData.tasksCompletedCount + delta,
					taskSummaries: updatedTaskSummaries,
				},
			});
		}
	},

	updateWeeklyTaskStatus: (taskId, completed) => {
		const { weeklyData } = get();
		if (!weeklyData) return;

		// Find the task in taskSummaries and check if status changed
		let statusChanged = false;
		const updatedTaskSummaries = weeklyData.taskSummaries.map((group) => {
			const updatedChildren = group.children.map((child) => {
				if (child.taskId === taskId && child.completed !== completed) {
					statusChanged = true;
					return {
						...child,
						completed,
						status: completed ? "COMPLETED" : "PENDING",
					};
				}
				return child;
			});
			const completedCount = updatedChildren.filter((c) => c.completed).length;
			return { ...group, children: updatedChildren, completedCount };
		});

		if (statusChanged) {
			// Update tasksCompletedCount based on the change
			const delta = completed ? 1 : -1;
			set({
				weeklyData: {
					...weeklyData,
					tasksCompletedCount: weeklyData.tasksCompletedCount + delta,
					taskSummaries: updatedTaskSummaries,
				},
			});
		}
	},
}));
