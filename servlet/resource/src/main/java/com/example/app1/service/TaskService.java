package com.example.app1.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.TaskCreateRequest;
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

        List<Task> tasks = taskRepository.findByTaskListIdAndUserId(taskListId, userId);
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
        return taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> {
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
    public Task createTask(TaskCreateRequest taskCreateRequest) {

        // Verify user owns the task list
        if (!taskListRepository.existsByIdAndUserId(taskCreateRequest.getTaskListId(), taskCreateRequest.getUserId())) {
            log.warn("Task list {} not found for user: {}", taskCreateRequest.getTaskListId(),
                    taskCreateRequest.getUserId());
            throw new IllegalArgumentException("Task list not found or access denied");
        }

        // Set default status if not provided
        if (taskCreateRequest.getStatus() == null) {
            taskCreateRequest.setStatus(TaskStatus.PENDING);
        }

        // Fetch TaskList reference
        TaskList taskList = taskListRepository.getReferenceById(taskCreateRequest.getTaskListId());

        Task task = Task.builder()
                .title(taskCreateRequest.getTitle())
                .status(taskCreateRequest.getStatus())
                .userId(taskCreateRequest.getUserId())
                .taskList(taskList)
                .build();

        Task saved = taskRepository.save(task);
        return saved;
    }

    /**
     * Create a new task (Overload for Controller compatibility).
     * 
     * @param task   Task entity from controller
     * @param userId User ID
     * @return Created task
     */
    @Transactional
    public Task createTask(Task task, String userId) {
        TaskCreateRequest request = TaskCreateRequest.builder()
                .title(task.getTitle())
                .status(task.getStatus())
                .userId(userId)
                .taskListId(task.getTaskList().getId())
                .build();
        return createTask(request);
    }

    /**
     * Update an existing task.
     * Ensures the task belongs to the user.
     * 
     * @param id      Task ID
     * @param updates Task with updated fields
     * @param userId  Auth0 sub claim identifying the user
     * @return The updated task
     * @throws IllegalArgumentException if task not found or doesn't belong to user
     */
    @Transactional
    public Task updateTask(Long id, Task updates, String userId) {

        Task existing = getTask(id, userId);

        // Update fields
        if (updates.getTitle() != null) {
            existing.setTitle(updates.getTitle());
        }
        if (updates.getStatus() != null) {
            existing.setStatus(updates.getStatus());
        }
        // Note: taskListId and userId should not be updated

        Task saved = taskRepository.save(existing);
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
    public Task patchTask(Long id, com.example.app1.dto.TaskPatchRequest request, String userId) {
        if (request == null) {
            throw new IllegalArgumentException("Patch request cannot be null");
        }
        Task existing = getTask(id, userId);

        if (request.title() != null) {
            existing.setTitle(request.title());
        }
        if (request.status() != null) {
            existing.setStatus(request.status());
        }
        Task saved = taskRepository.save(existing);
        log.info("Patched task {} for user: {}", saved, userId);
        return saved;
    }
}
