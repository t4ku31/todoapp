package com.example.app1.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.TaskListCreateRequest;
import com.example.app1.dto.TaskListUpdateRequest;
import com.example.app1.exception.TaskListValidationException;
import com.example.app1.model.Task;
import com.example.app1.model.TaskList;
import com.example.app1.model.TaskStatus;
import com.example.app1.repository.TaskListRepository;
import com.example.app1.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing task lists.
 * Handles business logic and data access for task list operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskListService {

    private final TaskListRepository taskListRepository;
    private final TaskRepository taskRepository;

    /**
     * Get all task lists for a specific user.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of task lists owned by the user
     */
    @Transactional(readOnly = true)
    public List<TaskList> getUserTaskLists(String userId) {
        log.info("Getting task lists for user: {}", userId);
        List<TaskList> taskLists = taskListRepository.findByUserId(userId);
        log.info("Found {} task lists for user: {}", taskLists.size(), userId);
        return taskLists;
    }

    /**
     * Get a specific task list by ID.
     * Ensures the task list belongs to the user.
     * 
     * @param id     Task list ID
     * @param userId Auth0 sub claim identifying the user
     * @return The task list
     * @throws IllegalArgumentException if task list not found or doesn't belong to
     *                                  user
     */
    @Transactional(readOnly = true)
    public TaskList getTaskList(Long id, String userId) {
        log.info("Getting task list {} for user: {}", id, userId);
        return taskListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> {
                    log.warn("Task list {} not found for user: {}", id, userId);
                    return new IllegalArgumentException("Task list not found or access denied");
                });
    }

    /**
     * Create a new task list.
     * 
     * @param taskList Task list to create (userId will be set)
     * @param userId   Auth0 sub claim identifying the user
     * @return The created task list
     */
    @Transactional
    public TaskList createTaskList(TaskListCreateRequest request, String userId) {
        log.info("Creating task list for user: {}", userId);

        // Ensure userId is set correctly
        TaskList taskList = TaskList.builder()
                .title(request.getTitle())
                .dueDate(request.getDueDate())
                .userId(userId)
                .build();

        List<Task> tasks = request.getTasks().stream()
                .map(req -> Task.builder()
                        .title(req.getTitle())
                        .status(TaskStatus.PENDING)
                        .userId(userId)
                        .taskList(taskList)
                        .build())
                .toList();

        taskList.setTasks(tasks);

        try {
            TaskList saved = taskListRepository.save(taskList);
            log.info("Created task list {} for user: {}", saved, userId);

            return saved;

        } catch (DataAccessException e) {
            log.error("DB save failed. entity={}", taskList, e);
            throw e;
        }
    }

    /**
     * Update an existing task list.
     * Ensures the task list belongs to the user.
     * 
     * @param id      Task list ID
     * @param updates Task list with updated fieldsapi
     * @param userId  Auth0 sub claim identifying the user
     * @return The updated task list
     * @throws IllegalArgumentException if task list not found or doesn't belong to
     *                                  user
     */
    @Transactional
    public void updateTaskList(Long id, TaskListUpdateRequest request, String userId) {
        log.info("Updating task list {} for user: {}", id, userId);

        TaskList existing = getTaskList(id, userId);

        // Update fields
        if (request.getTitle() != null) {
            existing.setTitle(request.getTitle());
        }
        if (request.getDueDate() != null) {
            existing.setDueDate(request.getDueDate());
        }
        if (request.getIsCompleted() != null) {
            // Validation: All tasks must be COMPLETED before marking list as completed
            if (request.getIsCompleted() && existing.getTasks() != null && !existing.getTasks().isEmpty()) {
                boolean allTasksCompleted = existing.getTasks().stream()
                        .allMatch(task -> task.getStatus() == TaskStatus.COMPLETED);

                if (!allTasksCompleted) {
                    throw new TaskListValidationException("すべてのタスクを完了してから、タスクリストを完了してください");
                }
            }

            existing.setIsCompleted(request.getIsCompleted());
            if (request.getIsCompleted()) {
                existing.setCompletedAt(LocalDateTime.now());
            } else {
                existing.setCompletedAt(null);
            }
        }

        TaskList updated = taskListRepository.save(existing);
        log.info("Updated task list {} for user: {}", updated, userId);
    }

    /**
     * Delete a task list.
     * Ensures the task list belongs to the user.
     * Cascades to delete all tasks in the list.
     * 
     * @param id     Task list ID
     * @param userId Auth0 sub claim identifying the user
     * @throws IllegalArgumentException if task list not found or doesn't belong to
     *                                  user
     */
    @Transactional
    public void deleteTaskList(Long id, String userId) {
        log.info("Deleting task list {} for user: {}", id, userId);

        // Verify ownership and get entity before deleting
        TaskList taskList = taskListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> {
                    log.warn("Task list {} not found for user: {}", id, userId);
                    return new IllegalArgumentException("Task list not found or access denied");
                });

        // Use delete(entity) to trigger JPA cascades (deleting children tasks)
        // Direct JPQL delete (deleteByIdAndUserId) bypasses cascades and causes FK
        // constraint violations
        // Explicitly delete tasks first to avoid FK violations
        taskRepository.deleteByTaskListId(id);

        taskListRepository.delete(taskList);
        log.info("Deleted task list {} for user: {}", id, userId);
    }
}
