import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analyticsApi";
import { analyticsKeys } from "./analyticsKeys";

export const useDailyAnalyticsQuery = (
	date: string,
	options?: { enabled?: boolean },
) => {
	return useQuery({
		queryKey: analyticsKeys.daily(date),
		queryFn: () => analyticsApi.fetchDailyAnalytics(date),
		enabled: options?.enabled ?? true,
	});
};

export const useWeeklyAnalyticsQuery = (
	startDate: string,
	endDate: string,
	options?: { enabled?: boolean },
) => {
	return useQuery({
		queryKey: analyticsKeys.weekly(startDate, endDate),
		queryFn: () => analyticsApi.fetchWeeklyAnalytics(startDate, endDate),
		enabled: options?.enabled ?? true,
	});
};

export const useMonthlyAnalyticsQuery = (
	month: string,
	options?: { enabled?: boolean },
) => {
	return useQuery({
		queryKey: analyticsKeys.monthly(month),
		queryFn: () => analyticsApi.fetchMonthlyAnalytics(month),
		enabled: options?.enabled ?? true,
	});
};
