package com.todoapp.resource.service.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoapp.resource.dto.RecurrenceRuleDto;
import com.todoapp.resource.dto.SubtaskDto;
import com.todoapp.resource.dto.TaskDto;
import com.todoapp.resource.dto.TaskDto.SyncResult;
import com.todoapp.resource.dto.TaskDto.SyncTaskDto;
import com.todoapp.resource.model.Category;
import com.todoapp.resource.model.Subtask;
import com.todoapp.resource.model.Task;
import com.todoapp.resource.model.TaskList;
import com.todoapp.resource.model.TaskStatus;
import com.todoapp.resource.repository.CategoryRepository;
import com.todoapp.resource.repository.FocusSessionRepository;
import com.todoapp.resource.repository.PomodoroSettingRepository;
import com.todoapp.resource.repository.TaskListRepository;
import com.todoapp.resource.repository.TaskRepository;
import com.todoapp.resource.service.TaskListService;

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
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService; // Injected
    private final PomodoroSettingRepository pomodoroSettingRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final TaskListService taskListService;

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

        // Resolve taskListId - if null or 0, use user's Inbox
        // Resolve taskListId - if null or 0, use user's Inbox
        Long taskListId = taskCreateRequest.taskListId();

        // If taskListTitle is provided, use it to resolve/create TaskList
        if (taskCreateRequest.taskListTitle() != null && !taskCreateRequest.taskListTitle().isBlank()) {
            TaskList targetList = taskListService
                    .getOrCreateTaskList(taskCreateRequest.taskListTitle(), userId);
            taskListId = targetList.getId();
            log.info("Resolved task list by title '{}' to id: {}", taskCreateRequest.taskListTitle(), taskListId);
        } else if (taskListId == null || taskListId == 0) {
            log.info("TaskListId is {} - resolving to user's Inbox", taskListId);
            TaskList inbox = taskListService.getOrCreateInbox(userId);
            taskListId = inbox.getId();
            log.info("Resolved to Inbox with id: {}", taskListId);
        }

        // Verify user owns the task list
        final Long finalTaskListId = taskListId;
        if (!taskListRepository.existsByIdAndUserId(finalTaskListId, userId)) {
            log.warn("Task list {} not found for user: {}", finalTaskListId, userId);
            throw new IllegalArgumentException("Task list not found or access denied");
        }

        // If customDates are provided, create a task for each date
        if (taskCreateRequest.customDates() != null && !taskCreateRequest.customDates().isEmpty()) {
            log.info("Creating {} tasks with custom dates for user: {}",
                    taskCreateRequest.customDates().size(), userId);

            Task firstTask = null;
            for (LocalDate date : taskCreateRequest.customDates()) {
                OffsetDateTime scheduledStartAt = date.atStartOfDay().atOffset(ZoneOffset.UTC);
                Task task = createSimpleTask(taskCreateRequest, userId, scheduledStartAt,
                        taskCreateRequest.scheduledEndAt(), finalTaskListId);
                if (firstTask == null) {
                    firstTask = task;
                }
            }
            return firstTask;
        }

        // Handle recurring task setup
        Boolean isRecurring = taskCreateRequest.isRecurring();
        RecurrenceRuleDto recurrenceRule = taskCreateRequest.recurrenceRule();

        if (Boolean.TRUE.equals(isRecurring) && recurrenceRule != null) {
            String rruleString = recurrenceRule.toRRuleString();
            return createRecurringTasks(taskCreateRequest, userId, rruleString, finalTaskListId);
        }

        // Use scheduledStartAt if provided, otherwise use today at midnight UTC
        OffsetDateTime startAt = taskCreateRequest.scheduledStartAt() != null
                ? taskCreateRequest.scheduledStartAt()
                : LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);

        OffsetDateTime endAt = taskCreateRequest.scheduledEndAt() != null
                ? taskCreateRequest.scheduledEndAt()
                : LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);

        return createSimpleTask(taskCreateRequest, userId, startAt, endAt, finalTaskListId);
    }

    /**
     * Bulk create tasks.
     * 
     * @param tasks  List of task creation requests
     * @param userId Auth0 sub claim identifying the user
     * @return List of created tasks
     */
    @Transactional
    public List<Task> bulkCreateTasks(List<TaskDto.Create> tasks, String userId) {
        log.info("Bulk creating {} tasks for user: {}", tasks.size(), userId);
        return tasks.stream()
                .map(request -> createTask(request, userId))
                .toList();
    }

    /**
     * Create recurring task instances based on recurrence rule.
     * Generates all instances immediately based on the rule's end condition.
     */
    private Task createRecurringTasks(TaskDto.Create taskCreateRequest, String userId, String recurrenceRule,
            Long resolvedTaskListId) {
        log.info("Creating recurring tasks for user: {} with rule: {}", userId, recurrenceRule);

        // Calculate occurrences using ical4j
        // Start from the task's execution date, or today if not set
        // Use scheduledStartAt if provided, otherwise use today
        OffsetDateTime startAt = taskCreateRequest.scheduledStartAt() != null
                ? taskCreateRequest.scheduledStartAt()
                : LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);
        LocalDate startDate = startAt.toLocalDate();

        // Default limit: 1 year from start if no end condition
        LocalDate rangeEnd = startDate.plusYears(1);

        // Generate dates using pure Java implementation
        List<LocalDate> dates = generateRecurringDates(recurrenceRule, startDate, rangeEnd);

        // If empty (shouldn't happen if start matches rule), add start at least?
        // Actually Recur.getDates includes start if it matches the rule.
        if (dates.isEmpty()) {
            dates.add(startDate);
        }

        log.info("Generated {} dates for recurring task", dates.size());

        // Create parent task first
        Task parentTask = createRecurringParent(taskCreateRequest, userId, dates.get(0),
                taskCreateRequest.scheduledEndAt(), recurrenceRule, resolvedTaskListId);

        // Create child tasks for remaining dates
        for (int i = 1; i < dates.size(); i++) {
            createRecurringChild(taskCreateRequest, userId, dates.get(i),
                    taskCreateRequest.scheduledEndAt(), parentTask.getId(), resolvedTaskListId);
        }

        return parentTask;
    }

    /**
     * Internal method to create a simple standalone task.
     */
    private Task createSimpleTask(TaskDto.Create request, String userId, OffsetDateTime scheduledStartAt,
            OffsetDateTime scheduledEndAt, Long taskListId) {
        return createSingleTask(request, userId, scheduledStartAt, scheduledEndAt, false, null, null, taskListId);
    }

    /**
     * Internal method to create the parent instance of a recurring task.
     */
    private Task createRecurringParent(TaskDto.Create request, String userId, LocalDate startDate,
            OffsetDateTime scheduledEndAt,
            String rule, Long taskListId) {
        OffsetDateTime scheduledStartAt = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        return createSingleTask(request, userId, scheduledStartAt, scheduledEndAt, true, rule, null, taskListId);
    }

    /**
     * Internal method to create a linked child instance of a recurring task.
     */
    private Task createRecurringChild(TaskDto.Create request, String userId, LocalDate startDate,
            OffsetDateTime scheduledEndAt,
            Long parentId, Long taskListId) {
        OffsetDateTime scheduledStartAt = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        return createSingleTask(request, userId, scheduledStartAt, scheduledEndAt, false, null, parentId, taskListId);
    }

    /**
     * Internal method to create a single task.
     */
    private Task createSingleTask(TaskDto.Create taskCreateRequest, String userId,
            OffsetDateTime scheduledStartAt, OffsetDateTime scheduledEndAt, boolean isRecurring, String recurrenceRule,
            Long recurrenceParentId,
            Long resolvedTaskListId) {

        // Set default status
        TaskStatus status = taskCreateRequest.status() != null ? taskCreateRequest.status() : TaskStatus.PENDING;

        // Fetch TaskList reference
        TaskList taskList = taskListRepository.getReferenceById(resolvedTaskListId);

        // Determine isAllDay - default to true if not specified
        Boolean isAllDay = taskCreateRequest.isAllDay() != null ? taskCreateRequest.isAllDay() : true;

        Task.TaskBuilder taskBuilder = Task.builder()
                .title(taskCreateRequest.title())
                .status(status)
                .scheduledStartAt(scheduledStartAt)
                .userId(userId)
                .taskList(taskList)
                .scheduledEndAt(taskCreateRequest.scheduledEndAt())
                .isAllDay(isAllDay)
                .description(taskCreateRequest.description());

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

        taskBuilder.category(resolveCategory(taskCreateRequest, userId));

        if (taskCreateRequest.estimatedPomodoros() != null) {
            taskBuilder.estimatedPomodoros(taskCreateRequest.estimatedPomodoros());
        }

        Task task = taskBuilder.build();

        // Handle subtasks creation (only for parent/standalone tasks, not for recurring
        // instances)
        if (recurrenceParentId == null && taskCreateRequest.subtasks() != null
                && !taskCreateRequest.subtasks().isEmpty()) {
            createSubtasks(task, taskCreateRequest.subtasks());
        }

        Task saved = taskRepository.save(task);
        log.info("Created task {} for user: {}", saved.getId(), saved.getUserId());
        return saved;
    }

    private Category resolveCategory(TaskDto.Create request, String userId) {
        if (request.categoryId() != null) {
            return categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        } else if (request.categoryName() != null && !request.categoryName().isBlank()) {
            return categoryRepository.findByUserIdAndName(userId, request.categoryName())
                    .orElseGet(() -> categoryService.getOrCreateCategory(userId, "その他", "#94a3b8"));
        } else {
            return categoryService.getOrCreateCategory(userId, "その他", "#94a3b8");
        }
    }

    private void createSubtasks(Task task, List<SubtaskDto.Create> subtasks) {
        List<Subtask> entities = subtasks.stream()
                .map(dto -> Subtask.builder()
                        .title(dto.title())
                        .description(dto.description())
                        .task(task)
                        .isCompleted(dto.isCompleted() != null ? dto.isCompleted() : false)
                        .orderIndex(dto.orderIndex() != null ? dto.orderIndex() : 0)
                        .build())
                .toList();
        task.getSubtasks().addAll(entities);
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

        // startDate is removed, scheduledStartAt is handled below }
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            existing.setCategory(category);
        } else if (request.categoryName() != null && !request.categoryName().isBlank()) {
            Category category = categoryRepository.findByUserIdAndName(userId, request.categoryName())
                    .orElseGet(() -> categoryService.getOrCreateCategory(userId, "その他", "#94a3b8"));
            existing.setCategory(category);
        }
        if (request.taskListTitle() != null && !request.taskListTitle().isBlank()) {
            TaskList targetList = taskListService.getOrCreateTaskList(request.taskListTitle(), userId);
            existing.setTaskList(targetList);
            log.info("Moving task {} to task list '{}' (id: {})", id, request.taskListTitle(), targetList.getId());
        } else if (request.taskListId() != null) {
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

        // Handle schedule update
        if (request.scheduledStartAt() != null) {
            existing.setScheduledStartAt(request.scheduledStartAt());
        }
        if (request.scheduledEndAt() != null) {
            existing.setScheduledEndAt(request.scheduledEndAt());
        }
        if (request.isAllDay() != null) {
            existing.setIsAllDay(request.isAllDay());
        }

        // Handle isRecurring and recurrenceRule update
        Boolean wasRecurring = existing.getIsRecurring();
        Boolean isNowRecurring = request.isRecurring();
        RecurrenceRuleDto newRecurrenceRuleDto = request.recurrenceRule();
        String newRecurrenceRule = newRecurrenceRuleDto != null ? newRecurrenceRuleDto.toRRuleString() : null;

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
     * Not propagated: startDate, status, subtasks
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

            // Propagate description
            if (request.description() != null) {
                child.setDescription(request.description());
                updated = true;
            }

            // Propagate scheduling (keep the child's date, but update the time)
            if (request.scheduledStartAt() != null && child.getScheduledStartAt() != null) {
                // Keep the date from child, update time from request
                LocalDate childDate = child.getScheduledStartAt().toLocalDate();
                child.setScheduledStartAt(request.scheduledStartAt().with(childDate.atStartOfDay().toLocalDate()));
                updated = true;
            }
            if (request.scheduledEndAt() != null && child.getScheduledStartAt() != null) {
                LocalDate childDate = child.getScheduledStartAt().toLocalDate();
                child.setScheduledEndAt(request.scheduledEndAt().with(childDate.atStartOfDay().toLocalDate()));
                updated = true;
            }
            if (request.isAllDay() != null) {
                child.setIsAllDay(request.isAllDay());
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
        // Generate dates using ical4j
        // Start from the parent task's execution date, or today if not set
        LocalDate startDate = parentTask.getScheduledStartAt() != null
                ? parentTask.getScheduledStartAt().toLocalDate()
                : LocalDate.now();

        LocalDate rangeEnd = startDate.plusYears(1);

        // Generate dates using pure Java implementation
        List<LocalDate> dates = generateRecurringDates(recurrenceRule, startDate, rangeEnd).stream()
                .filter(ld -> ld.isAfter(startDate)) // exclude parent's date if present
                .collect(Collectors.toList());

        log.info("Generating {} recurring instances for task {}", dates.size(), parentTask.getId());

        // Create child tasks for each date
        for (LocalDate date : dates) {
            Task childTask = Task.builder()
                    .title(parentTask.getTitle())
                    .status(TaskStatus.PENDING)
                    .scheduledStartAt(date.atStartOfDay().atOffset(ZoneOffset.UTC))
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

    /**
     * Get task statistics for a specific range.
     */
    @Transactional(readOnly = true)
    public TaskDto.Stats getTaskStatsInRange(String userId, LocalDate startDate,
            LocalDate endDate) {
        Long completedCount = taskRepository.countCompletedByUserIdAndScheduledStartAtDateBetween(
                userId, startDate, endDate);
        Long totalCount = taskRepository.countByUserIdAndScheduledStartAtDateBetween(
                userId, startDate, endDate);

        // Logic for Estimation Accuracy
        List<Task> completedTasks = taskRepository.findCompletedByUserIdAndScheduledStartAtDateBetween(userId,
                startDate,
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

        return TaskDto.Stats.builder()
                .startDate(startDate)
                .endDate(endDate)
                .completedCount(completedCount != null ? completedCount : 0L)
                .totalCount(totalCount != null ? totalCount : 0L)
                .totalEstimatedMinutes(totalEstimatedMinutes)
                .totalActualMinutes(totalActualMinutes)
                .build();
    }

    /**
     * Generate recurring dates based on an RRULE string using pure Java.
     * Supports FREQ (DAILY, WEEKLY, MONTHLY, YEARLY), INTERVAL, BYDAY, UNTIL, and
     * COUNT.
     */
    private List<LocalDate> generateRecurringDates(String rrule, LocalDate startDate, LocalDate rangeEnd) {
        List<LocalDate> dates = new java.util.ArrayList<>();

        if (rrule == null || rrule.isBlank()) {
            dates.add(startDate);
            return dates;
        }

        String cleanRule = rrule.startsWith("RRULE:") ? rrule.substring(6) : rrule;
        // Normalize separators
        cleanRule = cleanRule.replaceAll(",(?=[A-Z]+=[^=])", ";");

        // Parse FREQ
        String freq = "DAILY";
        java.util.regex.Matcher freqMatcher = java.util.regex.Pattern.compile("FREQ=([A-Z]+)").matcher(cleanRule);
        if (freqMatcher.find()) {
            freq = freqMatcher.group(1);
        }

        // Parse INTERVAL
        int interval = 1;
        java.util.regex.Matcher intervalMatcher = java.util.regex.Pattern.compile("INTERVAL=(\\d+)").matcher(cleanRule);
        if (intervalMatcher.find()) {
            interval = Integer.parseInt(intervalMatcher.group(1));
            if (interval < 1)
                interval = 1;
        }

        // Parse COUNT
        Integer count = null;
        java.util.regex.Matcher countMatcher = java.util.regex.Pattern.compile("COUNT=(\\d+)").matcher(cleanRule);
        if (countMatcher.find()) {
            count = Integer.parseInt(countMatcher.group(1));
        }

        // Parse UNTIL
        LocalDate until = rangeEnd;
        java.util.regex.Matcher untilMatcher = java.util.regex.Pattern.compile("UNTIL=(\\d{8})").matcher(cleanRule);
        if (untilMatcher.find()) {
            until = LocalDate.parse(untilMatcher.group(1), java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            if (until.isAfter(rangeEnd)) {
                until = rangeEnd;
            }
        }

        // Parse BYDAY for WEEKLY
        java.util.Set<java.time.DayOfWeek> byDay = new java.util.HashSet<>();
        java.util.regex.Matcher byDayMatcher = java.util.regex.Pattern.compile("BYDAY=([A-Z,]+)").matcher(cleanRule);
        if (byDayMatcher.find()) {
            String[] days = byDayMatcher.group(1).split(",");
            for (String day : days) {
                java.time.DayOfWeek dow = parseDay(day.trim());
                if (dow != null)
                    byDay.add(dow);
            }
        }

        // Generate dates
        LocalDate current = startDate;
        int generatedCount = 0;
        int maxIterations = 1000; // Safety limit
        int iterations = 0;

        while (!current.isAfter(until) && iterations < maxIterations) {
            iterations++;

            if (count != null && generatedCount >= count) {
                break;
            }

            boolean shouldAdd = false;

            switch (freq) {
                case "DAILY":
                    shouldAdd = true;
                    break;
                case "WEEKLY":
                    if (byDay.isEmpty()) {
                        shouldAdd = true; // If no BYDAY, use start day of week
                    } else {
                        shouldAdd = byDay.contains(current.getDayOfWeek());
                    }
                    break;
                case "MONTHLY":
                    shouldAdd = (current.getDayOfMonth() == startDate.getDayOfMonth() ||
                            current.equals(startDate));
                    break;
                case "YEARLY":
                    shouldAdd = (current.getMonth() == startDate.getMonth() &&
                            current.getDayOfMonth() == startDate.getDayOfMonth()) ||
                            current.equals(startDate);
                    break;
            }

            if (shouldAdd) {
                dates.add(current);
                generatedCount++;
            }

            // Advance current date
            switch (freq) {
                case "DAILY":
                    current = current.plusDays(interval);
                    break;
                case "WEEKLY":
                    if (byDay.isEmpty()) {
                        current = current.plusWeeks(interval);
                    } else {
                        // For WEEKLY with BYDAY, advance day by day within the week
                        current = current.plusDays(1);
                        // Check if we've completed a week cycle
                        if (current.getDayOfWeek() == startDate.getDayOfWeek() && interval > 1) {
                            current = current.plusWeeks(interval - 1);
                        }
                    }
                    break;
                case "MONTHLY":
                    current = current.plusMonths(interval);
                    break;
                case "YEARLY":
                    current = current.plusYears(interval);
                    break;
            }
        }

        return dates;
    }

    private java.time.DayOfWeek parseDay(String day) {
        return switch (day) {
            case "MO" -> java.time.DayOfWeek.MONDAY;
            case "TU" -> java.time.DayOfWeek.TUESDAY;
            case "WE" -> java.time.DayOfWeek.WEDNESDAY;
            case "TH" -> java.time.DayOfWeek.THURSDAY;
            case "FR" -> java.time.DayOfWeek.FRIDAY;
            case "SA" -> java.time.DayOfWeek.SATURDAY;
            case "SU" -> java.time.DayOfWeek.SUNDAY;
            default -> null;
        };
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
     * Supports updating status, categoryId, taskListId, and startDate.
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
            } else if (request.categoryName() != null && !request.categoryName().isBlank()) {
                // Try to find by name, otherwise fallback to "Others"
                category = categoryRepository.findByUserIdAndName(userId, request.categoryName())
                        .orElseGet(() -> categoryService.getOrCreateCategory(userId, "その他", "#94a3b8"));
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
            LocalDateTime now = LocalDateTime.now();
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
                if (request.scheduledStartAt() != null) {
                    task.setScheduledStartAt(request.scheduledStartAt());
                }
                if (request.estimatedPomodoros() != null) {
                    task.setEstimatedPomodoros(request.estimatedPomodoros());
                }
                if (request.description() != null) {
                    task.setDescription(request.description());
                }
                if (request.scheduledStartAt() != null) {
                    task.setScheduledStartAt(request.scheduledStartAt());
                }
                if (request.scheduledEndAt() != null) {
                    task.setScheduledEndAt(request.scheduledEndAt());
                }
                if (request.isAllDay() != null) {
                    task.setIsAllDay(request.isAllDay());
                }
                if (request.isRecurring() != null) {
                    task.setIsRecurring(request.isRecurring());
                }
                if (request.recurrenceRule() != null) {
                    task.setRecurrenceRule(request.recurrenceRule().toRRuleString());
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

    /**
     * Sync tasks (Create, Update, Delete) in a single transaction.
     * Uses SyncTaskDto which is a unified model for AI and Sync.
     */
    /**
     * Sync tasks (Create, Update, Delete) in a single transaction.
     * Uses SyncTaskDto which is a unified model for AI and Sync.
     */
    @Transactional
    public SyncResult syncTasks(List<SyncTaskDto> tasks,
            String userId) {
        log.info("Syncing {} tasks for user: {}", tasks != null ? tasks.size() : 0, userId);
        if (tasks != null) {
            tasks.forEach(t -> log.info("Task to sync: id={}, title={}, startAt={}, endAt={}", t.id(), t.title(),
                    t.scheduledStartAt(), t.scheduledEndAt()));
        }

        if (tasks == null || tasks.isEmpty()) {
            return new SyncResult(true, "No tasks to sync", 0, 0, 0);
        }

        int createdCount = 0;
        int updatedCount = 0;
        int deletedCount = 0;

        for (SyncTaskDto req : tasks) {
            try {
                Long taskId = req.id();

                if (Boolean.TRUE.equals(req.isDeleted()) && taskId != null && taskId > 0) {
                    // Delete
                    deleteTask(taskId, userId);
                    deletedCount++;
                } else if (taskId == null || taskId <= 0) {
                    // Create
                    TaskDto.Create create = convertToCreate(req);
                    createTask(create, userId);
                    createdCount++;
                } else {
                    // Update
                    TaskDto.Update update = convertToUpdate(req);
                    updateTask(taskId, update, userId);
                    updatedCount++;
                }
            } catch (Exception e) {
                log.error("Failed to sync task: {}", req, e);
                // Continue with other tasks or throw?
                // For batch sync, it might be better to fail all or continue?
                // Given the transactional nature if we throw, everything rolls back.
                // The prompt/plan implied full success or fail.
                throw e;
            }
        }

        String message = String.format("Sync completed: Created %d, Updated %d, Deleted %d",
                createdCount, updatedCount, deletedCount);
        return new SyncResult(true, message, createdCount, updatedCount, deletedCount);
    }

    private TaskDto.Create convertToCreate(TaskDto.SyncTaskDto req) {
        // Parse scheduledStartAt from string
        java.time.OffsetDateTime startAt = null;
        if (req.scheduledStartAt() != null) {
            try {
                startAt = java.time.OffsetDateTime.parse(req.scheduledStartAt());
            } catch (Exception e) {
                log.warn("Invalid scheduledStartAt format: {}", req.scheduledStartAt());
            }
        }

        // Parse scheduledEndAt from string
        java.time.OffsetDateTime endAt = null;
        if (req.scheduledEndAt() != null) {
            try {
                endAt = java.time.OffsetDateTime.parse(req.scheduledEndAt());
            } catch (Exception e) {
                log.warn("Invalid scheduledEndAt format: {}", req.scheduledEndAt());
            }
        }

        // Convert subtasks
        List<SubtaskDto.Create> subtasks = req.subtasks() != null
                ? req.subtasks().stream()
                        .map(s -> new SubtaskDto.Create(null, s.title(), s.description(), s.isCompleted(),
                                s.orderIndex()))
                        .toList()
                : null;

        // Parse status
        TaskStatus status = null;
        if (req.status() != null) {
            try {
                status = TaskStatus.valueOf(req.status().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status: {}", req.status());
            }
        }

        return new TaskDto.Create(
                req.title(),
                null, // taskListId
                req.taskListTitle(),
                null, // categoryId
                req.categoryName(),
                subtasks,
                req.estimatedPomodoros(),
                req.isRecurring(),
                req.recurrenceRule(),
                null, // customDates
                startAt,
                endAt,
                req.isAllDay(),
                req.description(),
                status);
    }

    private TaskDto.Update convertToUpdate(TaskDto.SyncTaskDto req) {
        OffsetDateTime startAt = null;
        if (req.scheduledStartAt() != null) {
            try {
                startAt = OffsetDateTime.parse(req.scheduledStartAt());
            } catch (Exception e) {
                log.warn("Invalid scheduledStartAt format: {}", req.scheduledStartAt());
            }
        }

        OffsetDateTime endAt = null;
        if (req.scheduledEndAt() != null) {
            try {
                endAt = OffsetDateTime.parse(req.scheduledEndAt());
            } catch (Exception e) {
                log.warn("Invalid scheduledEndAt format: {}", req.scheduledEndAt());
            }
        }

        TaskStatus status = null;
        if (req.status() != null) {
            try {
                status = TaskStatus.valueOf(req.status().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status: {}", req.status());
            }
        }
        TaskDto.Update update = new TaskDto.Update(
                req.title(),
                status,
                null, // categoryId
                req.categoryName(),
                null, // taskListId
                req.taskListTitle(),
                null, // completedAt
                req.estimatedPomodoros(),
                req.isRecurring(),
                req.recurrenceRule(),
                req.description(),
                startAt,
                endAt,
                req.isAllDay());
        log.info("Update task: {}", update);
        return update;
    }
}
