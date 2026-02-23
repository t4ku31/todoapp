package com.todoapp.resource.service.usecase;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.todoapp.resource.dto.AnalyticsDto;
import com.todoapp.resource.model.Category;
import com.todoapp.resource.model.FocusSession;
import com.todoapp.resource.model.Task;
import com.todoapp.resource.model.TaskStatus;

import lombok.RequiredArgsConstructor;

/**
 * Aggregator for Analytics data.
 * Responsible for aggregating raw data (FocusSessions, Tasks) into DTOs for
 * analytics views.
 */
@Component
@RequiredArgsConstructor
public class AnalyticsAggregator {

    private static final String DEFAULT_CATEGORY_NAME = "Uncategorized";
    private static final String DEFAULT_CATEGORY_COLOR = "#94a3b8"; // Slate-400
    private static final String DEFAULT_TASK_TITLE = "Unknown Task";
    private static final String OTHERS_CATEGORY_NAME = "Others";

    /**
     * Aggregates focus time by category from a list of sessions.
     * Use default values for sessions with missing category information.
     *
     * @param sessions List of FocusSession entities
     * @return List of CategoryFocusTime DTOs with aggregated duration
     */
    public List<AnalyticsDto.CategoryFocusTime> aggregateCategories(List<FocusSession> sessions) {
        Map<Long, Integer> categoryMinutes = new HashMap<>();
        Map<Long, Category> categoryMap = new HashMap<>();

        for (FocusSession session : sessions) {
            Task task = session.getTask();
            Category category = (task != null) ? task.getCategory() : null;
            Long catId = (category != null) ? category.getId() : null;

            int minutes = (session.getActualDuration() != null) ? session.getActualDuration() / 60 : 0;
            categoryMinutes.merge(catId, minutes, Integer::sum);

            if (category != null) {
                categoryMap.putIfAbsent(catId, category);
            }
        }

        return categoryMinutes.entrySet().stream()
                .map(entry -> {
                    Long catId = entry.getKey();
                    Category cat = categoryMap.get(catId);
                    String name = (cat != null) ? cat.getName() : DEFAULT_CATEGORY_NAME;
                    String color = (cat != null) ? cat.getColor() : DEFAULT_CATEGORY_COLOR;

                    return new AnalyticsDto.CategoryFocusTime(catId, name, color, entry.getValue());
                })
                .collect(Collectors.toList());
    }

    /**
     * Builds a list of TaskSummary objects from sessions and tasks within a
     * specific range.
     * Merges tasks found in session history with actively scheduled tasks.
     *
     * @param sessions      List of focus sessions in the range
     * @param tasks         List of scheduled tasks in the range
     * @param focusDuration User's configured focus duration in minutes
     * @return List of TaskSummary DTOs sorted by date (newest first)
     */
    public List<AnalyticsDto.TaskSummary> buildTaskSummaryList(List<FocusSession> sessions, List<Task> tasks,
            int focusDuration) {

        Map<Long, Task> uniqueTasks = new HashMap<>();

        if (tasks != null) {
            tasks.forEach(t -> uniqueTasks.put(t.getId(), t));
        }

        if (sessions != null) {
            sessions.stream()
                    .map(FocusSession::getTask)
                    .filter(t -> t != null)
                    .forEach(t -> uniqueTasks.putIfAbsent(t.getId(), t));
        }

        Map<Long, Integer> sessionsByTask = (sessions != null) ? sessions.stream()
                .filter(s -> s.getTask() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getTask().getId(),
                        Collectors.summingInt(s -> (s.getActualDuration() != null ? s.getActualDuration() : 0) / 60)))
                : new HashMap<>();

        List<AnalyticsDto.TaskSummary> summaryList = uniqueTasks.values().stream()
                .map(task -> buildTaskSummary(task, sessionsByTask.getOrDefault(task.getId(), 0), focusDuration))
                .collect(Collectors.toList());

        // Sort by scheduled date descending (newest first), then ID
        summaryList.sort((a, b) -> {
            if (a.startDate() == null && b.startDate() == null)
                return 0;
            if (a.startDate() == null)
                return 1;
            if (b.startDate() == null)
                return -1;
            int dateCmp = b.startDate().compareTo(a.startDate());
            return (dateCmp != 0) ? dateCmp : b.taskId().compareTo(a.taskId());
        });

        return summaryList;
    }

    private AnalyticsDto.TaskSummary buildTaskSummary(Task task, int focusMinutes, int focusDuration) {
        // Estimate
        int estimatedMinutes = (task.getEstimatedPomodoros() != null)
                ? task.getEstimatedPomodoros() * focusDuration
                : 0;

        // Progress Percentage
        int progress = 0;
        if (estimatedMinutes > 0) {
            progress = (int) Math.round((double) focusMinutes / estimatedMinutes * 100);
        } else if (TaskStatus.COMPLETED.equals(task.getStatus())) {
            progress = 100;
        }

        Category cat = task.getCategory();
        String catName = (cat != null) ? cat.getName() : DEFAULT_CATEGORY_NAME;
        String catColor = (cat != null) ? cat.getColor() : DEFAULT_CATEGORY_COLOR;

        return new AnalyticsDto.TaskSummary(
                task.getId(),
                task.getTitle(),
                catName,
                catColor,
                task.getStatus().name(),
                TaskStatus.COMPLETED.equals(task.getStatus()),
                focusMinutes,
                estimatedMinutes,
                progress,
                task.getRecurrenceParentId(),
                task.getScheduledStartAt() != null ? task.getScheduledStartAt().toLocalDate() : null);
    }

    /**
     * Maps FocusSession entities to FocusSessionData DTOs for daily analytics view.
     *
     * @param sessions List of FocusSession entities
     * @return List of FocusSessionData DTOs
     */
    public List<AnalyticsDto.DailyAnalyticsDto.FocusSessionData> mapToFocusSessionData(List<FocusSession> sessions) {
        if (sessions == null) {
            return new ArrayList<>();
        }
        return sessions.stream()
                .map(this::mapSessionToDto)
                .collect(Collectors.toList());
    }

    private AnalyticsDto.DailyAnalyticsDto.FocusSessionData mapSessionToDto(FocusSession session) {
        Task task = session.getTask();
        Category category = (task != null) ? task.getCategory() : null;

        return AnalyticsDto.DailyAnalyticsDto.FocusSessionData.builder()
                .id(session.getId())
                .taskId(task != null ? task.getId() : null)
                .taskTitle(task != null ? task.getTitle() : DEFAULT_TASK_TITLE)
                .categoryName(category != null ? category.getName() : OTHERS_CATEGORY_NAME)
                .categoryColor(category != null ? category.getColor() : DEFAULT_CATEGORY_COLOR)
                .sessionType(session.getSessionType().name())
                .status(session.getStatus().name())
                .scheduledDuration(session.getScheduledDuration())
                .actualDuration(session.getActualDuration())
                .startedAt(session.getStartedAt().toString())
                .endedAt(session.getEndedAt() != null ? session.getEndedAt().toString() : null)
                .build();
    }

    /**
     * Groups task summaries by parent task ID (for recurring tasks).
     * Standalone tasks are treated as single-item groups.
     *
     * @param allTaskSummaries List of TaskSummary DTOs
     * @return List of GroupedTaskSummary DTOs sorted by total focus time
     *         (descending)
     */
    public List<AnalyticsDto.GroupedTaskSummary> groupTaskSummaries(List<AnalyticsDto.TaskSummary> allTaskSummaries) {
        Map<Long, List<AnalyticsDto.TaskSummary>> grouped = new HashMap<>();
        List<AnalyticsDto.TaskSummary> standalone = new ArrayList<>();

        for (AnalyticsDto.TaskSummary summary : allTaskSummaries) {
            if (summary.parentTaskId() != null) {
                grouped.computeIfAbsent(summary.parentTaskId(), k -> new ArrayList<>()).add(summary);
            } else {
                standalone.add(summary);
            }
        }

        List<AnalyticsDto.GroupedTaskSummary> result = new ArrayList<>();

        // Process groups
        for (Map.Entry<Long, List<AnalyticsDto.TaskSummary>> entry : grouped.entrySet()) {
            Long parentId = entry.getKey();
            List<AnalyticsDto.TaskSummary> children = entry.getValue();

            if (children.isEmpty())
                continue;

            // Use the first child to derive common info (title, category)
            AnalyticsDto.TaskSummary first = children.get(0);

            int totalFocus = children.stream().mapToInt(AnalyticsDto.TaskSummary::focusMinutes).sum();
            int completedCount = (int) children.stream().filter(AnalyticsDto.TaskSummary::completed).count();

            result.add(new AnalyticsDto.GroupedTaskSummary(
                    parentId,
                    first.taskTitle(),
                    first.categoryName(),
                    first.categoryColor(),
                    totalFocus,
                    completedCount,
                    children.size(),
                    true,
                    children));
        }

        // Process standalone
        for (AnalyticsDto.TaskSummary summary : standalone) {
            result.add(new AnalyticsDto.GroupedTaskSummary(
                    summary.taskId(),
                    summary.taskTitle(),
                    summary.categoryName(),
                    summary.categoryColor(),
                    summary.focusMinutes(),
                    summary.completed() ? 1 : 0,
                    1,
                    false,
                    List.of(summary)));
        }

        // Sort result by total focus time descending
        result.sort((a, b) -> Integer.compare(b.totalFocusMinutes(), a.totalFocusMinutes()));

        return result;
    }
}
