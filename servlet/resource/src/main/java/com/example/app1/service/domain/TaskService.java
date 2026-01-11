package com.example.app1.service.domain;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.RecurrenceRuleDto;
import com.example.app1.dto.TaskDto;
import com.example.app1.model.Category;
import com.example.app1.model.Subtask;
import com.example.app1.model.Task;
import com.example.app1.model.TaskList;
import com.example.app1.model.TaskStatus;
import com.example.app1.repository.TaskListRepository;
import com.example.app1.repository.TaskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing tasks.
 * Handles business logic and data access for task operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskListRepository taskListRepository;
    private final com.example.app1.repository.CategoryRepository categoryRepository;
    private final CategoryService categoryService; // Injected
    private final com.example.app1.repository.PomodoroSettingRepository pomodoroSettingRepository;
    private final com.example.app1.repository.FocusSessionRepository focusSessionRepository;

    /**
     * Get all tasks for a specific task list.
     * Ensures the task list belongs to the user.
     * 
     * @param taskListId ID of the task list
     * @param userId     Auth0 sub claim identifying the user
     * @return List of tasks in the task list
     * @throws IllegalArgumentException if task list doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<Task> getTasksByTaskListId(Long taskListId, String userId) {
        log.info("Getting tasks for task list {} and user: {}", taskListId, userId);

        // Verify user owns the task list
        if (!taskListRepository.existsByIdAndUserId(taskListId, userId)) {
            log.warn("Task list {} not found for user: {}", taskListId, userId);
            throw new IllegalArgumentException("Task list not found or access denied");
        }

        List<Task> tasks = taskRepository.findByTaskList_IdAndUserId(taskListId, userId);
        log.info("Found {} tasks for task list {} and user: {}", tasks.size(), taskListId, userId);
        return tasks;
    }

    /**
     * Get all tasks for a specific user.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of all tasks owned by the user
     */
    @Transactional(readOnly = true)
    public List<Task> getUserTasks(String userId) {
        log.info("Getting all tasks for user: {}", userId);
        List<Task> tasks = taskRepository.findByUserId(userId);
        log.info("Found {} tasks for user: {}", tasks.size(), userId);
        return tasks;
    }

    /**
     * Get a specific task by ID.
     * Ensures the task belongs to the user.
     * 
     * @param id     Task ID
     * @param userId Auth0 sub claim identifying the user
     * @return The task
     * @throws IllegalArgumentException if task not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public Task getTask(Long id, String userId) {
        log.info("Getting task {} for user: {}", id, userId);
        return taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> {
                    log.warn("Task {} not found for user: {}", id, userId);
                    return new IllegalArgumentException("Task not found or access denied");
                });
    }

    /**
     * Create a new task.
     * Ensures the task list belongs to the user.
     * If customDates are provided, creates a task for each date.
     * 
     * @param task   Task to create (userId will be set)
     * @param userId Auth0 sub claim identifying the user
     * @return The created task(s) - returns first task for backward compatibility
     * @throws IllegalArgumentException if task list doesn't belong to user
     */
    @Transactional
    public Task createTask(TaskDto.Create taskCreateRequest, String userId) {
        log.info("Creating task for user: {}", userId);

        // Verify user owns the task list
        if (!taskListRepository.existsByIdAndUserId(taskCreateRequest.taskListId(), userId)) {
            log.warn("Task list {} not found for user: {}", taskCreateRequest.taskListId(),
                    userId);
            throw new IllegalArgumentException("Task list not found or access denied");
        }

        // If customDates are provided, create a task for each date
        if (taskCreateRequest.customDates() != null && !taskCreateRequest.customDates().isEmpty()) {
            log.info("Creating {} tasks with custom dates for user: {}",
                    taskCreateRequest.customDates().size(), userId);

            Task firstTask = null;
            for (java.time.LocalDate date : taskCreateRequest.customDates()) {
                Task task = createSingleTask(taskCreateRequest, userId, date, false, null, null);
                if (firstTask == null) {
                    firstTask = task;
                }
            }
            return firstTask;
        }

        // Handle recurring task setup
        Boolean isRecurring = taskCreateRequest.isRecurring();
        String recurrenceRule = taskCreateRequest.recurrenceRule();

        if (isRecurring != null && isRecurring && recurrenceRule != null) {
            return createRecurringTasks(taskCreateRequest, userId, recurrenceRule);
        }

        return createSingleTask(taskCreateRequest, userId, taskCreateRequest.executionDate(),
                false, null, null);
    }

    /**
     * Create recurring task instances based on recurrence rule.
     * Generates all instances immediately based on the rule's end condition.
     */
    private Task createRecurringTasks(TaskDto.Create taskCreateRequest, String userId, String recurrenceRule) {
        log.info("Creating recurring tasks for user: {} with rule: {}", userId, recurrenceRule);

        // Parse recurrence rule JSON
        ObjectMapper mapper = new ObjectMapper();
        RecurrenceRuleDto rule;
        try {
            rule = mapper.readValue(recurrenceRule, RecurrenceRuleDto.class);
        } catch (Exception e) {
            log.error("Failed to parse recurrence rule: {}", recurrenceRule, e);
            throw new IllegalArgumentException("Invalid recurrence rule format: " + e.getMessage());
        }

        String frequency = rule.frequency();
        if (frequency == null) {
            throw new IllegalArgumentException("Frequency is required in recurrence rule");
        }

        String endDateStr = rule.endDate();
        Integer occurrences = rule.occurrences();
        java.util.List<String> daysOfWeek = rule.daysOfWeek();

        log.debug("Parsed rule - Freq: {}, EndDate: {}, Occurrences: {}, Days: {}",
                frequency, endDateStr, occurrences, daysOfWeek);

        // case of specifying execution date
        java.time.LocalDate startDate = taskCreateRequest.executionDate() != null
                ? taskCreateRequest.executionDate()
                : java.time.LocalDate.now();
        // case of specifying end date
        java.time.LocalDate endDate = null;
        if (endDateStr != null) {
            endDate = java.time.LocalDate.parse(endDateStr);
        }

        // Default: generate 30 instances if no end condition specified
        int maxInstances = occurrences != null ? occurrences : 30;
        if (endDate == null && occurrences == null) {
            // If no end condition, limit to 90 days from start
            endDate = startDate.plusDays(90);
        }

        // Generate dates based on frequency
        java.util.List<java.time.LocalDate> dates = new java.util.ArrayList<>();
        java.time.LocalDate currentDate = startDate;
        int count = 0;

        while (count < maxInstances) {
            if (endDate != null && currentDate.isAfter(endDate)) {
                break;
            }

            boolean shouldAdd = true;

            // For weekly frequency with specific days
            if ("weekly".equals(frequency) && daysOfWeek != null && !daysOfWeek.isEmpty()) {
                String dayOfWeek = currentDate.getDayOfWeek().toString().toLowerCase().substring(0, 3);
                shouldAdd = daysOfWeek.contains(dayOfWeek);
            }

            if (shouldAdd) {
                dates.add(currentDate);
                count++;
            }

            // Advance date based on frequency
            currentDate = switch (frequency) {
                case "daily" -> currentDate.plusDays(1);
                case "weekly" -> {
                    if (daysOfWeek != null && !daysOfWeek.isEmpty()) {
                        yield currentDate.plusDays(1); // Check each day for weekly with specific days
                    }
                    yield currentDate.plusWeeks(1);
                }
                case "monthly" -> currentDate.plusMonths(1);
                case "yearly" -> currentDate.plusYears(1);
                default -> currentDate.plusDays(1);
            };
        }

        log.info("Generated {} dates for recurring task", dates.size());

        // Create parent task first
        Task parentTask = createSingleTask(taskCreateRequest, userId, dates.get(0), true, recurrenceRule, null);

        // Create child tasks for remaining dates
        for (int i = 1; i < dates.size(); i++) {
            createSingleTask(taskCreateRequest, userId, dates.get(i), false, null, parentTask.getId());
        }

        return parentTask;
    }

    /**
     * Internal method to create a single task.
     */
    private Task createSingleTask(TaskDto.Create taskCreateRequest, String userId,
            java.time.LocalDate executionDate, boolean isRecurring, String recurrenceRule, Long recurrenceParentId) {

        // Set default status
        TaskStatus status = TaskStatus.PENDING;

        // Fetch TaskList reference
        TaskList taskList = taskListRepository.getReferenceById(taskCreateRequest.taskListId());

        Task.TaskBuilder taskBuilder = Task.builder()
                .title(taskCreateRequest.title())
                .status(status)
                .executionDate(executionDate)
                .userId(userId)
                .taskList(taskList);

        // Set recurring fields
        if (isRecurring) {
            taskBuilder.isRecurring(true);
            if (recurrenceRule != null) {
                taskBuilder.recurrenceRule(recurrenceRule);
            }
        }

        // Set parent reference for child tasks
        if (recurrenceParentId != null) {
            taskBuilder.recurrenceParentId(recurrenceParentId);
        }

        if (taskCreateRequest.categoryId() != null) {
            Category category = categoryRepository.findById(taskCreateRequest.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            taskBuilder.category(category);
        } else {
            // Default to "Others" category
            Category others = categoryService.getOrCreateCategory(userId, "その他", "#94a3b8");
            taskBuilder.category(others);
        }

        if (taskCreateRequest.estimatedPomodoros() != null) {
            taskBuilder.estimatedPomodoros(taskCreateRequest.estimatedPomodoros());
        }

        Task task = taskBuilder.build();

        // Handle subtasks creation (only for parent/standalone tasks, not for recurring
        // instances)
        if (recurrenceParentId == null && taskCreateRequest.subtasks() != null
                && !taskCreateRequest.subtasks().isEmpty()) {
            List<Subtask> subtasks = taskCreateRequest.subtasks().stream()
                    .map(subtaskDto -> Subtask.builder()
                            .title(subtaskDto.title())
                            .description(subtaskDto.description())
                            .task(task)
                            .isCompleted(false)
                            .build())
                    .toList();
            task.getSubtasks().addAll(subtasks);
        }

        Task saved = taskRepository.save(task);
        log.info("Created task {} for user: {}", saved.getId(), saved.getUserId());
        return saved;
    }

    /**
     * Delete a task.
     * Ensures the task belongs to the user.
     * 
     * @param id     Task ID
     * @param userId Auth0 sub claim identifying the user
     * @throws IllegalArgumentException if task not found or doesn't belong to user
     */
    @Transactional
    public void deleteTask(Long id, String userId) {
        log.info("Soft deleting task {} for user: {}", id, userId);

        Task task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied"));

        // If this is a recurring parent task, also delete pending children
        if (Boolean.TRUE.equals(task.getIsRecurring())) {
            List<Task> pendingChildren = taskRepository.findByRecurrenceParentIdAndStatusNot(id, TaskStatus.COMPLETED);
            if (!pendingChildren.isEmpty()) {
                log.info("Propagating delete to {} pending child tasks of parent {}", pendingChildren.size(), id);
                for (Task child : pendingChildren) {
                    child.setIsDeleted(true);
                    taskRepository.save(child);
                }
            }
        }

        task.setIsDeleted(true);
        taskRepository.save(task);
        log.info("Soft deleted task {} for user: {}", id, userId);
    }

    /**
     * Restore a soft-deleted task.
     */
    @Transactional
    public void restoreTask(Long id, String userId) {
        log.info("Restoring task {} for user: {}", id, userId);

        // We use findByIdAndUserId (without filter) to find the deleted task
        // Note: Repository method might need @Query to include deleted tasks or native
        // query
        // But currently findByIdAndUserId defined in Repository uses "WHERE ...", let's
        // check repo
        // Actually, the repo findByIdAndUserId likely filters out deleted tasks if we
        // follow the pattern.
        // Let's use findByUserIdAndIsDeletedTrue to verify ownership or custom query.
        Task task = taskRepository.findByUserIdAndIsDeletedTrue(userId).stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Task not found in trash"));

        task.setIsDeleted(false);
        taskRepository.save(task);
        log.info("Restored task {} for user: {}", id, userId);
    }

    /**
     * Permanently delete a task.
     */
    @Transactional
    public void deleteTaskPermanently(Long id, String userId) {
        log.info("Permanently deleting task {} for user: {}", id, userId);

        if (!taskRepository.existsByIdAndUserId(id, userId)) {
            // Check if it's in trash (soft deleted)
            boolean inTrash = taskRepository.findByUserIdAndIsDeletedTrue(userId).stream()
                    .anyMatch(t -> t.getId().equals(id));
            if (!inTrash) {
                // Check if it's an active task
                if (!taskRepository.existsByIdAndUserId(id, userId)) {
                    throw new IllegalArgumentException("Task not found or access denied");
                }
            }
        }

        // If this is a recurring parent (even if in trash), delete all its children
        // (active or trash)
        // We need to fetch the task to check isRecurring. Since it might be deleted or
        // active, we try both.
        // Or simpler: find children by recurrenceParentId first.

        List<Task> children = taskRepository.findByRecurrenceParentId(id);
        if (!children.isEmpty()) {
            log.info("Cascading permanent delete to {} child tasks of parent {}", children.size(), id);
            for (Task child : children) {
                taskRepository.deleteByIdAndUserId(child.getId(), userId);
            }
        }

        taskRepository.deleteByIdAndUserId(id, userId);
        log.info("Permanently deleted task {} for user: {}", id, userId);
    }

    /**
     * Get all soft-deleted tasks (trash) for a user.
     */
    @Transactional(readOnly = true)
    public List<Task> getTrashTasks(String userId) {
        log.info("Getting trash tasks for user: {}", userId);
        return taskRepository.findByUserIdAndIsDeletedTrue(userId);
    }

    /**
     * Get inbox tasks for a user.
     */
    @Transactional(readOnly = true)
    public List<Task> getInboxTasks(String userId) {
        return taskRepository.findByUserId(userId).stream()
                .filter(task -> task.getTaskList() != null && "Inbox".equals(task.getTaskList().getTitle()))
                .collect(Collectors.toList());
    }

    /**
     * Patch an existing task.
     * Only updates fields that are non-null in the request.
     * 
     * @param id      Task ID
     * @param request Patch request with fields to update
     * @param userId  Auth0 sub claim identifying the user
     * @return The updated task
     * @throws IllegalArgumentException if task not found or doesn't belong to user
     */
    @Transactional
    public Task updateTask(Long id, TaskDto.Update request, String userId) {
        log.info("Updating task {} for user: {}", id, userId);
        if (request == null) {
            throw new IllegalArgumentException("Update request cannot be null");
        }
        Task existing = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (request.title() != null) {
            existing.setTitle(request.title());
        }
        if (request.status() != null) {
            if (request.status() == TaskStatus.COMPLETED && existing.getStatus() != TaskStatus.COMPLETED) {
                existing.setCompletedAt(java.time.LocalDateTime.now());
            } else if (request.status() != TaskStatus.COMPLETED && existing.getStatus() == TaskStatus.COMPLETED) {
                existing.setCompletedAt(null);
            }
            existing.setStatus(request.status());
        }

        if (request.executionDate() != null) {
            existing.setExecutionDate(request.executionDate());
        }
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            existing.setCategory(category);
        }
        if (request.taskListId() != null) {
            // Verify user owns the target task list
            TaskList targetList = taskListRepository.findByIdAndUserId(request.taskListId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Target task list not found or access denied"));
            existing.setTaskList(targetList);
            log.info("Moving task {} to task list {}", id, request.taskListId());
        }

        if (request.completedAt() != null) {
            existing.setCompletedAt(request.completedAt());
        }

        // Handle estimatedPomodoros update
        if (request.estimatedPomodoros() != null) {
            existing.setEstimatedPomodoros(request.estimatedPomodoros());
            log.debug("Updated estimatedPomodoros to {} for task {}", request.estimatedPomodoros(), id);
        }

        // Handle description update
        if (request.description() != null) {
            existing.setDescription(request.description());
            log.debug("Updated description for task {}", id);
        }

        // Handle isRecurring and recurrenceRule update
        Boolean wasRecurring = existing.getIsRecurring();
        Boolean isNowRecurring = request.isRecurring();
        String newRecurrenceRule = request.recurrenceRule();

        // Determine effective new state
        boolean effectiveIsRecurring = isNowRecurring != null ? isNowRecurring
                : (wasRecurring != null ? wasRecurring : false);
        String effectiveRule = newRecurrenceRule != null ? newRecurrenceRule : existing.getRecurrenceRule();

        // Check if recurrence settings changed implies cleanup/regeneration
        // If explicitly set to false, force cleanup regardless of previous state to
        // ensure consistency
        boolean turnedOff = Boolean.FALSE.equals(isNowRecurring);
        boolean turnedOn = (wasRecurring == null || !wasRecurring) && effectiveIsRecurring;
        boolean ruleChanged = Boolean.TRUE.equals(effectiveIsRecurring) && newRecurrenceRule != null
                && !newRecurrenceRule.equals(existing.getRecurrenceRule());

        if (turnedOff) {
            // Case 1: Explicitly turning OFF
            // Just delete pending children
            log.info("Turning off recurrence for task {} (requested isRecurring=false)", id);
            existing.setIsRecurring(false);
            deletePendingChildren(id);

        } else if (turnedOn || ruleChanged) {
            // Case 2: OFF -> ON or ON -> ON (Rule Changed)
            // Delete old pending children (if any) and generate new ones
            log.info("Recurrence changed for task {} (TurnedOn={}, RuleChanged={}). Regenerating instances.", id,
                    turnedOn, ruleChanged);

            existing.setIsRecurring(true);
            existing.setRecurrenceRule(effectiveRule);

            // Save parent first to persist new rule
            Task parentTask = taskRepository.save(existing);

            // Cleanup old instances before generating new ones
            deletePendingChildren(id);

            // Generate recurring instances
            generateRecurringInstances(parentTask, effectiveRule, userId);

            log.info("Regenerated recurring instances for task {}", id);
            return parentTask;
        } else {
            // No structural change to recurrence, just update fields if present
            if (isNowRecurring != null) {
                existing.setIsRecurring(isNowRecurring);
            }
            if (newRecurrenceRule != null) {
                existing.setRecurrenceRule(newRecurrenceRule);
            }
        }

        Task saved = taskRepository.save(existing);
        log.info("Updated task {} for user: {}", saved, userId);

        // If this is a parent recurring task, propagate certain changes to pending
        // children
        if (Boolean.TRUE.equals(saved.getIsRecurring())) {
            propagateChangesToChildren(saved, request);
        }

        return saved;
    }

    /**
     * Propagate changes from parent task to pending (incomplete) child tasks.
     * Only propagates certain fields to maintain instance individuality.
     * 
     * Propagated fields: title, category, estimatedPomodoros
     * Not propagated: executionDate, status, subtasks
     */
    private void propagateChangesToChildren(Task parentTask, TaskDto.Update request) {
        List<Task> pendingChildren = taskRepository.findByRecurrenceParentIdAndStatusNot(parentTask.getId(),
                TaskStatus.COMPLETED);

        if (pendingChildren.isEmpty()) {
            return;
        }

        log.info("Propagating changes from parent task {} to {} pending children",
                parentTask.getId(), pendingChildren.size());

        for (Task child : pendingChildren) {
            boolean updated = false;

            // Propagate title
            if (request.title() != null) {
                child.setTitle(request.title());
                updated = true;
            }

            // Propagate category
            if (request.categoryId() != null) {
                child.setCategory(parentTask.getCategory());
                updated = true;
            }

            // Propagate estimatedPomodoros
            if (request.estimatedPomodoros() != null) {
                child.setEstimatedPomodoros(request.estimatedPomodoros());
                updated = true;
            }

            if (updated) {
                taskRepository.save(child);
            }
        }

        log.info("Propagated changes to {} child tasks", pendingChildren.size());
    }

    /**
     * Generate recurring task instances from an existing parent task.
     * This is called when an existing task is converted to recurring.
     */
    private void generateRecurringInstances(Task parentTask, String recurrenceRule, String userId) {
        ObjectMapper mapper = new ObjectMapper();
        RecurrenceRuleDto rule;
        try {
            rule = mapper.readValue(recurrenceRule, RecurrenceRuleDto.class);
        } catch (Exception e) {
            log.error("Failed to parse recurrence rule: {}", recurrenceRule, e);
            throw new IllegalArgumentException("Invalid recurrence rule format: " + e.getMessage());
        }

        String frequency = rule.frequency();
        if (frequency == null) {
            throw new IllegalArgumentException("Frequency is required in recurrence rule");
        }

        String endDateStr = rule.endDate();
        Integer occurrences = rule.occurrences();
        java.util.List<String> daysOfWeek = rule.daysOfWeek();

        // Start from the parent task's execution date, or today if not set
        java.time.LocalDate startDate = parentTask.getExecutionDate() != null
                ? parentTask.getExecutionDate()
                : java.time.LocalDate.now();

        java.time.LocalDate endDate = null;
        if (endDateStr != null) {
            endDate = java.time.LocalDate.parse(endDateStr);
        }

        // Default: generate 365 instances if no end condition specified
        int maxInstances = occurrences != null ? occurrences : 365;
        if (endDate == null && occurrences == null) {
            endDate = startDate.plusDays(365);
        }

        // Generate dates based on frequency (starting from the day AFTER the parent
        // task)
        java.util.List<java.time.LocalDate> dates = new java.util.ArrayList<>();
        java.time.LocalDate currentDate = advanceDate(startDate, frequency, daysOfWeek);
        int count = 0;

        while (count < maxInstances - 1) { // -1 because parent is already the first instance
            if (endDate != null && currentDate.isAfter(endDate)) {
                break;
            }

            boolean shouldAdd = true;
            if ("weekly".equals(frequency) && daysOfWeek != null && !daysOfWeek.isEmpty()) {
                String dayName = currentDate.getDayOfWeek().toString(); // "MONDAY"
                String dayNameShort = dayName.toLowerCase().substring(0, 3); // "mon"

                // Allow matches against full name (MONDAY) or short name (mon),
                // case-insensitive
                shouldAdd = daysOfWeek.stream()
                        .anyMatch(d -> d.equalsIgnoreCase(dayName) ||
                                d.toLowerCase().startsWith(dayNameShort));
            }

            if (shouldAdd) {
                dates.add(currentDate);
                count++;
            }

            currentDate = advanceDate(currentDate, frequency, daysOfWeek);
        }

        log.info("Generating {} recurring instances for task {}", dates.size(), parentTask.getId());

        // Create child tasks for each date
        for (java.time.LocalDate date : dates) {
            Task childTask = Task.builder()
                    .title(parentTask.getTitle())
                    .status(TaskStatus.PENDING)
                    .executionDate(date)
                    .userId(userId)
                    .taskList(parentTask.getTaskList())
                    .category(parentTask.getCategory())
                    .estimatedPomodoros(parentTask.getEstimatedPomodoros())
                    .isRecurring(false)
                    .recurrenceParentId(parentTask.getId())
                    .build();

            taskRepository.save(childTask);
        }
    }

    /**
     * Advance the date based on frequency.
     */
    private java.time.LocalDate advanceDate(java.time.LocalDate date, String frequency,
            java.util.List<String> daysOfWeek) {
        return switch (frequency) {
            case "daily" -> date.plusDays(1);
            case "weekly" -> {
                if (daysOfWeek != null && !daysOfWeek.isEmpty()) {
                    yield date.plusDays(1); // Check each day for weekly with specific days
                }
                yield date.plusWeeks(1);
            }
            case "monthly" -> date.plusMonths(1);
            case "yearly" -> date.plusYears(1);
            default -> date.plusDays(1);
        };
    }

    /**
     * Get task statistics for a specific range.
     */
    @Transactional(readOnly = true)
    public com.example.app1.dto.TaskDto.Stats getTaskStatsInRange(String userId, java.time.LocalDate startDate,
            java.time.LocalDate endDate) {
        Long completedCount = taskRepository.countCompletedByUserIdAndExecutionDateBetween(
                userId, startDate, endDate);
        Long totalCount = taskRepository.countByUserIdAndExecutionDateBetween(
                userId, startDate, endDate);

        // Logic for Estimation Accuracy
        List<Task> completedTasks = taskRepository.findCompletedByUserIdAndExecutionDateBetween(userId, startDate,
                endDate);
        log.info("Completed tasks: {}", completedTasks);

        // Calculate total estimated minutes based on pomodoros
        Integer focusDuration = pomodoroSettingRepository.findByUserId(userId)
                .map(setting -> setting.getFocusDuration())
                .orElse(25); // Default to 25 minutes if no settings found

        int totalEstimatedMinutes = completedTasks.stream()
                .filter(t -> t.getEstimatedPomodoros() != null)
                .mapToInt(t -> t.getEstimatedPomodoros() * focusDuration)
                .sum();
        log.info("Total estimated minutes: {}", totalEstimatedMinutes);
        List<Long> completedTaskIds = completedTasks.stream().map(Task::getId).toList();

        int totalActualMinutes = 0;
        if (!completedTaskIds.isEmpty()) {
            Integer totalSeconds = focusSessionRepository.sumActualDurationByTaskIds(completedTaskIds);
            if (totalSeconds != null)
                totalActualMinutes = totalSeconds / 60;
        }

        log.info("Task stats for user {} from {} to {}: {} / {} completed. Est: {}m, Act: {}m",
                userId, startDate, endDate, completedCount, totalCount, totalEstimatedMinutes, totalActualMinutes);

        return com.example.app1.dto.TaskDto.Stats.builder()
                .startDate(startDate)
                .endDate(endDate)
                .completedCount(completedCount != null ? completedCount : 0L)
                .totalCount(totalCount != null ? totalCount : 0L)
                .totalEstimatedMinutes(totalEstimatedMinutes)
                .totalActualMinutes(totalActualMinutes)
                .build();
    }

    /**
     * Helper to soft-delete pending child tasks for a recurring parent.
     */
    private void deletePendingChildren(Long parentId) {
        // Debug logging removed for cleaner implementation

        List<Task> pendingChildren = taskRepository.findByRecurrenceParentIdAndStatusNot(parentId,
                TaskStatus.COMPLETED);

        if (!pendingChildren.isEmpty()) {
            log.info("Permanently deleting {} pending child tasks of parent {}", pendingChildren.size(), parentId);
            // Use deleteAll for batch deletion if possible, or loop
            taskRepository.deleteAll(pendingChildren);
            taskRepository.flush();
        } else {
            log.debug("No pending child tasks found for parent {}", parentId);
        }
    }

    /**
     * Helper: Create a FailedTask with displayMessage
     */
    private TaskDto.BulkOperationResult.FailedTask createFailedTask(Long taskId, String reason, String errorCode) {
        String displayMessage = "ID:" + taskId + " - " + reason;
        return TaskDto.BulkOperationResult.FailedTask.builder()
                .taskId(taskId)
                .reason(reason)
                .errorCode(errorCode)
                .displayMessage(displayMessage)
                .build();
    }

    /**
     * Helper: Build BulkOperationResult with displayMessages
     */
    private TaskDto.BulkOperationResult buildBulkResult(
            int successCount,
            List<TaskDto.BulkOperationResult.FailedTask> failedTasks) {
        List<String> displayMessages = failedTasks.stream()
                .map(TaskDto.BulkOperationResult.FailedTask::getDisplayMessage)
                .toList();
        return TaskDto.BulkOperationResult.builder()
                .successCount(successCount)
                .failedCount(failedTasks.size())
                .failedTasks(failedTasks)
                .allSucceeded(failedTasks.isEmpty())
                .displayMessages(displayMessages)
                .build();
    }

    /**
     * Bulk update multiple tasks at once.
     * Supports updating status, categoryId, taskListId, and executionDate.
     * 
     * @param request The bulk update request
     * @param userId  The user ID
     */
    @Transactional
    public TaskDto.BulkOperationResult bulkUpdateTasks(TaskDto.BulkUpdate request, String userId) {
        log.info("Bulk updating {} tasks for user: {}", request.taskIds().size(), userId);

        try {
            List<TaskDto.BulkOperationResult.FailedTask> failedTasks = new java.util.ArrayList<>();
            List<Task> tasksToUpdate = new java.util.ArrayList<>();

            // Resolve category if provided
            Category category = null;
            if (request.categoryId() != null) {
                var categoryOpt = categoryRepository.findByIdAndUserId(request.categoryId(), userId);
                if (categoryOpt.isEmpty()) {
                    // Category not found or doesn't belong to user - fail all
                    List<TaskDto.BulkOperationResult.FailedTask> allFailed = request.taskIds().stream()
                            .map(id -> createFailedTask(id, "Category not found or access denied", "INVALID_REQUEST"))
                            .toList();
                    return buildBulkResult(0, allFailed);
                }
                category = categoryOpt.get();
            }

            // Resolve task list if provided
            TaskList taskList = null;
            if (request.taskListId() != null) {
                var taskListOpt = taskListRepository.findByIdAndUserId(request.taskListId(), userId);
                if (taskListOpt.isEmpty()) {
                    List<TaskDto.BulkOperationResult.FailedTask> allFailed = request.taskIds().stream()
                            .map(id -> createFailedTask(id, "Task list not found or access denied", "INVALID_REQUEST"))
                            .toList();
                    return buildBulkResult(0, allFailed);
                }
                taskList = taskListOpt.get();
            }

            // Process each task individually
            for (Long taskId : request.taskIds()) {
                try {
                    var taskOpt = taskRepository.findById(taskId);
                    if (taskOpt.isEmpty()) {
                        failedTasks.add(createFailedTask(taskId, "Task not found", "NOT_FOUND"));
                        continue;
                    }

                    Task task = taskOpt.get();
                    if (!task.getUserId().equals(userId)) {
                        failedTasks.add(createFailedTask(taskId, "Access denied - task belongs to another user",
                                "UNAUTHORIZED"));
                        continue;
                    }

                    tasksToUpdate.add(task);
                } catch (Exception e) {
                    log.error("Error processing task {}: {}", taskId, e.getMessage());
                    failedTasks.add(
                            createFailedTask(taskId, "Error processing task: " + e.getMessage(), "INTERNAL_ERROR"));
                }
            }

            // Apply updates to valid tasks
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            for (Task task : tasksToUpdate) {
                if (request.status() != null) {
                    task.setStatus(request.status());
                    if (request.status() == TaskStatus.COMPLETED) {
                        task.setCompletedAt(now);
                    } else {
                        task.setCompletedAt(null);
                    }
                }
                if (category != null) {
                    task.setCategory(category);
                }
                if (taskList != null) {
                    task.setTaskList(taskList);
                }
                if (request.executionDate() != null) {
                    task.setExecutionDate(request.executionDate());
                }
            }

            if (!tasksToUpdate.isEmpty()) {
                taskRepository.saveAll(tasksToUpdate);
            }

            int successCount = tasksToUpdate.size();
            log.info("Bulk updated {} tasks for user: {} ({} failed)", successCount, userId, failedTasks.size());

            return buildBulkResult(successCount, failedTasks);

        } catch (Exception e) {
            log.error("Bulk update failed with unexpected error: {}", e.getMessage(), e);
            List<TaskDto.BulkOperationResult.FailedTask> allFailed = request.taskIds().stream()
                    .map(id -> createFailedTask(id, "Database error: " + e.getMessage(), "DATABASE_ERROR"))
                    .toList();
            return buildBulkResult(0, allFailed);
        }
    }

    /**
     * Bulk delete (soft delete) multiple tasks at once.
     * 
     * @param taskIds List of task IDs to delete
     * @param userId  The user ID
     * @return BulkOperationResult with success/failure details
     */
    @Transactional
    public TaskDto.BulkOperationResult bulkDeleteTasks(List<Long> taskIds, String userId) {
        log.info("Bulk deleting {} tasks for user: {}", taskIds.size(), userId);

        try {
            List<TaskDto.BulkOperationResult.FailedTask> failedTasks = new java.util.ArrayList<>();
            List<Task> tasksToDelete = new java.util.ArrayList<>();

            for (Long taskId : taskIds) {
                try {
                    var taskOpt = taskRepository.findById(taskId);
                    if (taskOpt.isEmpty()) {
                        failedTasks.add(createFailedTask(taskId, "Task not found", "NOT_FOUND"));
                        continue;
                    }

                    Task task = taskOpt.get();
                    if (!task.getUserId().equals(userId)) {
                        failedTasks.add(createFailedTask(taskId, "Access denied - task belongs to another user",
                                "UNAUTHORIZED"));
                        continue;
                    }

                    tasksToDelete.add(task);
                } catch (Exception e) {
                    log.error("Error processing task {}: {}", taskId, e.getMessage());
                    failedTasks.add(
                            createFailedTask(taskId, "Error processing task: " + e.getMessage(), "INTERNAL_ERROR"));
                }
            }

            for (Task task : tasksToDelete) {
                task.setIsDeleted(true);
            }

            if (!tasksToDelete.isEmpty()) {
                taskRepository.saveAll(tasksToDelete);
            }

            int successCount = tasksToDelete.size();
            log.info("Bulk soft-deleted {} tasks for user: {} ({} failed)", successCount, userId, failedTasks.size());

            return buildBulkResult(successCount, failedTasks);

        } catch (Exception e) {
            log.error("Bulk delete failed with unexpected error: {}", e.getMessage(), e);
            List<TaskDto.BulkOperationResult.FailedTask> allFailed = taskIds.stream()
                    .map(id -> createFailedTask(id, "Database error: " + e.getMessage(), "DATABASE_ERROR"))
                    .toList();
            return buildBulkResult(0, allFailed);
        }
    }
}
