package com.example.app1.service.domain;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.TaskDto;
import com.example.app1.model.Category;
import com.example.app1.model.Subtask;
import com.example.app1.model.Task;
import com.example.app1.model.TaskList;
import com.example.app1.model.TaskStatus;
import com.example.app1.repository.TaskListRepository;
import com.example.app1.repository.TaskRepository;

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
     * 
     * @param task   Task to create (userId will be set)
     * @param userId Auth0 sub claim identifying the user
     * @return The created task
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

        // Set default status
        TaskStatus status = TaskStatus.PENDING;

        // Fetch TaskList reference
        TaskList taskList = taskListRepository.getReferenceById(taskCreateRequest.taskListId());

        Task.TaskBuilder taskBuilder = Task.builder()
                .title(taskCreateRequest.title())
                .status(status)
                .executionDate(taskCreateRequest.executionDate())
                .userId(userId)
                .taskList(taskList);

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

        // Handle subtasks creation
        if (taskCreateRequest.subtasks() != null && !taskCreateRequest.subtasks().isEmpty()) {
            List<Subtask> subtasks = taskCreateRequest.subtasks().stream()
                    .map(subtaskDto -> Subtask.builder()
                            .title(subtaskDto.title())
                            .description(subtaskDto.description())
                            .task(task)
                            .isCompleted(false)
                            .build())
                    .toList();
            // Since we are using CascadeType.ALL on OneToMany, adding to the list is enough
            // IF we save the parent task. However, to be safe with bi-directional
            // relationship:
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
        log.info("Deleting task {} for user: {}", id, userId);

        // Verify ownership before deleting
        if (!taskRepository.existsByIdAndUserId(id, userId)) {
            log.warn("Task {} not found for user: {}", id, userId);
            throw new IllegalArgumentException("Task not found or access denied");
        }

        taskRepository.deleteByIdAndUserId(id, userId);
        log.info("Deleted task {} for user: {}", id, userId);
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

        Task saved = taskRepository.save(existing);
        log.info("Updated task {} for user: {}", saved, userId);
        return saved;
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
}
