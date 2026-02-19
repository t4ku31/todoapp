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
 * Represents a single task instance (child of grouped summary).
 */
export interface TaskSummary {
	taskId: number;
	taskTitle: string;
	categoryName: string;
	categoryColor: string;
	status: string;
	completed: boolean;
	focusMinutes: number;
	estimatedMinutes?: number | null;
	progressPercentage: number;
	parentTaskId?: number | null;
	startDate?: Date | null;
}

/**
 * Child task instance for grouped summary expansion.
 */
export interface TaskSummaryChild {
	taskId: number;
	taskTitle: string;
	status: string;
	completed: boolean;
	focusMinutes: number;
	estimatedMinutes?: number | null;
	progressPercentage: number;
	startDate?: Date | null;
}

/**
 * Grouped task summary for recurring tasks.
 * Aggregates multiple child task instances into a single group.
 */
export interface GroupedTaskSummary {
	parentTaskId: number;
	title: string;
	categoryName: string;
	categoryColor: string;
	totalFocusMinutes: number;
	completedCount: number;
	totalCount: number;
	recurring: boolean;
	children: TaskSummaryChild[];
}

/**
 * Common KPI data structure used across all analytics views.
 */
export interface KpiData {
	totalFocusMinutes: number;
	tasksCompletedCount: number;
	tasksTotalCount: number;
	efficiencyScore: number;
	rhythmQuality: number;
	volumeBalance: number;
	focusComparisonDiffMinutes: number;
	taskCompletionRateGrowth: number;
	totalEstimatedMinutes: number;
	totalActualMinutes: number;
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
 * Monthly analytics data from API.
 */
export interface MonthlyAnalyticsData {
	kpi: KpiData;
	focusDays: number;
	dailyAverageFocusMinutes: number;
	dailyActivity: DayActivity[];
	categoryAggregation: Record<string, CategoryFocusTime[]>;
}

// ============================================
// Consolidated Analytics Types
// ============================================

/**
 * Weekly consolidated analytics data.
 */
export interface WeeklyAnalyticsData {
	// KPIs (Nested)
	kpi: KpiData;

	dailyAverageFocusMinutes: number;

	// Charts
	dailyFocusData: DailyFocusByCategory[];
	categoryAggregation: CategoryFocusTime[]; // Note: Backend returns list of CategoryData, which matches CategoryFocusTime structure

	// Tasks (Grouped - recurring tasks aggregated)
	taskSummaries: GroupedTaskSummary[];
}

/**
 * Daily consolidated analytics data.
 */
export interface DailyAnalyticsData {
	// KPIs (Nested)
	kpi: KpiData;

	// Efficiency/Other stats
	focusRatio?: number;
	restRatio?: number;
	paceRatio?: number;
	estimationDifferenceMinutes?: number;

	// Tasks (flat list for daily - no grouping needed)
	taskSummaries: TaskSummary[];

	// Timeline
	focusSessions: FocusSessionApiResponse[];
}
