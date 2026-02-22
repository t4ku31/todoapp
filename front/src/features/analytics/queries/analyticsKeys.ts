export const analyticsKeys = {
	all: ["analytics"] as const,
	daily: (date: string) => [...analyticsKeys.all, "daily", date] as const,
	weekly: (startDate: string, endDate: string) =>
		[...analyticsKeys.all, "weekly", startDate, endDate] as const,
	monthly: (month: string) => [...analyticsKeys.all, "monthly", month] as const,
};
