/**
 * Shared type definitions for Analytics feature.
 * Mirrors backend DTOs for type safety.
 */

// ============================================
// Focus Session Types
// ============================================

/**
 * Focus session response from API.
 * Used in DailyView for timeline display.
 */
export interface FocusSessionApiResponse {
	id: number;
	taskId: number | null;
	taskTitle: string | null;
	categoryName: string | null;
	categoryColor: string | null;
	sessionType: string;
	status: string;
	scheduledDuration: number;
	actualDuration: number;
	startedAt: string;
	endedAt: string | null;
}

/**
 * Timeline session for DailyTimeline component.
 */
export interface TimelineSession {
	id: number;
	title: string;
	start: string;
	duration: number;
	actual: number;
	planned: number;
	category: string;
	categoryColor: string | null;
	status: "COMPLETED" | "INTERRUPTED";
}

// ============================================
// Efficiency & Stats Types
// ============================================

/**
 * Efficiency statistics from API.
 * Used in both Daily and Weekly views.
 */
export interface EfficiencyStats {
	date: string | null;
	efficiencyScore: number;
	rhythmQuality: number;
	volumeBalance: number;
	focusRatio: number;
	restRatio: number;
	paceRatio: number;
}

/**
 * Task statistics for estimation accuracy.
 */
export interface TaskStats {
	startDate: string;
	endDate: string;
	completedCount: number;
	totalCount: number;
	totalEstimatedMinutes?: number;
	totalActualMinutes?: number;
}

/**
 * Weekly summary for total focus time card.
 */
export interface WeeklySummary {
	totalMinutes: number;
	dailyAverage: number;
	comparison: number;
}

/**
 * Weekly task statistics for tasks completed card.
 */
export interface WeeklyTaskStats {
	completedCount: number;
	totalCount: number;
	comparisonPercentage: number;
}

// ============================================
// Category & Focus Types
// ============================================

/**
 * Focus time per category.
 * Used in charts and aggregations.
 */
export interface CategoryFocusTime {
	categoryId: number;
	categoryName: string;
	categoryColor: string;
	minutes: number;
}

/**
 * Daily focus breakdown by category.
 * Used in ProductivityChart (stacked bar).
 */
export interface DailyFocusByCategory {
	date: string;
	dayOfWeek: string;
	goalMinutes: number;
	categories: CategoryFocusTime[];
}

/**
 * Weekly category aggregation for pie chart.
 */
export interface WeeklyCategoryAggregation {
	startDate: string;
	endDate: string;
	totalMinutes: number;
	categories: CategoryFocusTime[];
}

// ============================================
// Task Summary Types
// ============================================

/**
 * Task summary for analytics views.
 * Used in both Daily and Weekly task lists.
 */
export interface TaskSummary {
	taskId: number;
	taskTitle: string;
	categoryName: string;
	categoryColor: string;
	status: string;
	isCompleted: boolean;
	focusMinutes: number;
	estimatedMinutes?: number | null;
	progressPercentage: number;
}

// ============================================
// Monthly Analytics Types
// ============================================

/**
 * Day activity for heatmap display.
 */
export interface DayActivity {
	date: string;
	minutes: number;
}

/**
 * Category time for monthly distribution.
 */
export interface CategoryTime {
	name: string;
	color: string;
	minutes: number;
}

/**
 * Monthly analytics data from API.
 */
export interface MonthlyAnalyticsData {
	totalFocusMinutes: number;
	totalTasksCompleted: number;
	focusDays: number;
	averageDailyFocusMinutes: number;
	averageEfficiencyScore: number;
	dailyActivity: DayActivity[];
	categoryDistribution: Record<string, CategoryTime[]>;
}

// ============================================
// Consolidated Analytics Types
// ============================================

/**
 * Weekly consolidated analytics data.
 */
export interface WeeklyAnalyticsData {
	startDate: string;
	endDate: string;

	// KPIs
	totalFocusMinutes: number;
	dailyAverageFocusMinutes: number;
	focusComparisonPercentage: number;
	efficiencyScore: number;
	rhythmQuality: number;
	volumeBalance: number;
	tasksCompletedCount: number;
	tasksTotalCount: number;
	taskComparisonPercentage: number;
	totalEstimatedMinutes: number;
	totalActualMinutes: number;
	estimationDifferenceMinutes: number;

	// Charts
	dailyFocusData: DailyFocusByCategory[];
	categoryAggregation: CategoryFocusTime[]; // Note: Backend returns list of CategoryData, which matches CategoryFocusTime structure

	// Tasks
	taskSummaries: TaskSummary[];
}

/**
 * Daily consolidated analytics data.
 */
export interface DailyAnalyticsData {
	date: string;

	// Efficiency
	efficiencyScore: number;
	rhythmQuality: number;
	volumeBalance: number;
	focusRatio: number;
	restRatio: number;
	paceRatio: number;

	// Estimation
	totalEstimatedMinutes: number;
	totalActualMinutes: number;
	estimationDifferenceMinutes: number;
	tasksCompletedCount: number;
	tasksTotalCount: number;

	// Tasks
	taskSummaries: TaskSummary[];

	// Timeline
	focusSessions: FocusSessionApiResponse[];
}
