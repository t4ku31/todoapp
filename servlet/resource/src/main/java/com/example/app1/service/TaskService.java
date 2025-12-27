package com.example.app1.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.TaskDto;
import com.example.app1.model.Category;
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
                .estimatedDuration(taskCreateRequest.estimatedDuration())
                .taskList(taskList);

        if (taskCreateRequest.categoryId() != null) {
            Category category = categoryRepository.findById(taskCreateRequest.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            taskBuilder.category(category);
        }

        Task task = taskBuilder.build();

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
        if (request.estimatedDuration() != null) {
            existing.setEstimatedDuration(request.estimatedDuration());
        }
        if (request.completedAt() != null) {
            // Allow manual override if needed, or ignore?
            // The requirement is "automatically set", but if the UI sends it (e.g. undo),
            // we might want to respect it.
            // However, for now, the requirement specifically asked for "when status
            // changes".
            // If I change status to COMPLETED, it sets now().
            // If I send completedAt explicitly, it should probably override or be ignored.
            // deeper analysis: The user said
            // "taskのstatusがcompletに変更されたときにcompletedAtに値を自動投入するように変更して"
            // (Change it so that a value is automatically input to completedAt when the
            // task status is changed to complete)
            // Prioritize status change logic.
            // If the DTO has completedAt, we should ideally allow it too, but let's stick
            // to the automation logic first.
            // Actually, I should probably check if `request.completedAt()` is provided and
            // allow it, but the automation is key.
            // Let's add the manual setter too just in case, but put it AFTER the auto-logic
            // so explicit wins?
            // Or maybe explicit wins if not null?
            // Let's stick to the simplest interpretation: Status change triggers
            // auto-update.

            existing.setCompletedAt(request.completedAt());
        }

        // Refined logic:
        // 1. If status changes to COMPLETED -> set now()
        // 2. If status changes from COMPLETED -> set null
        // 3. If request has explicit completedAt -> set it (override)

        // However, the `replace_file_content` below is what I will use.
        // I will implement the status check logic. I will also add the `completedAt`
        // setter from the request if it exists,
        // as I added that field to the DTO earlier.

        Task saved = taskRepository.save(existing);
        log.info("Updated task {} for user: {}", saved, userId);
        return saved;
    }
}
