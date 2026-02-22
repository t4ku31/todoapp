import { apiClient } from "@/config/env";
import type {
	DailyAnalyticsData,
	MonthlyAnalyticsData,
	WeeklyAnalyticsData,
} from "../types";

export const analyticsApi = {
	fetchDailyAnalytics: async (date: string): Promise<DailyAnalyticsData> => {
		const response = await apiClient.get<DailyAnalyticsData>(
			"/api/analytics/daily",
			{ params: { date } },
		);
		return response.data;
	},

	fetchWeeklyAnalytics: async (
		startDate: string,
		endDate: string,
	): Promise<WeeklyAnalyticsData> => {
		const response = await apiClient.get<WeeklyAnalyticsData>(
			"/api/analytics/weekly",
			{ params: { startDate, endDate } },
		);
		return response.data;
	},

	fetchMonthlyAnalytics: async (
		month: string,
	): Promise<MonthlyAnalyticsData> => {
		const response = await apiClient.get<MonthlyAnalyticsData>(
			"/api/analytics/monthly",
			{ params: { month } },
		);
		return response.data;
	},
};
