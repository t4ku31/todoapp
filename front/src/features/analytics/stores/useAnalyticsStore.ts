import { create } from "zustand";
import { apiClient } from "@/config/env";
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
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
	dailyData: null,
	weeklyData: null,
	monthlyData: null,
	isLoading: false,
	error: null,

	fetchDailyAnalytics: async (date) => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.get<DailyAnalyticsData>(
				`/api/analytics/daily?date=${date}`,
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
				`/api/analytics/weekly?startDate=${startDate}&endDate=${endDate}`,
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
				`/api/analytics/monthly?month=${month}`,
			);
			set({ monthlyData: response.data, isLoading: false });
		} catch (error) {
			console.error("Failed to fetch monthly analytics:", error);
			set({ error: "Failed to fetch monthly analytics", isLoading: false });
		}
	},
}));
