package com.example.app1.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.TaskDto;
import com.example.app1.dto.TaskListDto;
import com.example.app1.exception.TaskListValidationException;
import com.example.app1.model.Category;
import com.example.app1.model.Task;
import com.example.app1.model.TaskList;
import com.example.app1.model.TaskStatus;
import com.example.app1.repository.CategoryRepository;
import com.example.app1.repository.TaskListRepository;

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
    private final CategoryRepository categoryRepository;

    /**
     * Get all task lists for a specific user.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of task lists owned by the user
     */
    @Transactional
    public List<TaskList> getUserTaskLists(String userId) {
        log.info("Getting task lists for user: {}", userId);
        List<TaskList> taskLists = taskListRepository.findByUserId(userId);

        if (taskLists.isEmpty()) {
            log.info("No task lists found for user: {}. Creating default Inbox.", userId);
            TaskList inbox = createInbox(userId);
            return List.of(inbox);
        }

        log.info("Found {} task lists for user: {}", taskLists.size(), userId);
        return taskLists;
    }

    private TaskList createInbox(String userId) {
        TaskList inbox = TaskList.builder()
                .title("Inbox")
                .userId(userId)
                .build();

        try {
            TaskList saved = taskListRepository.save(inbox);
            log.info("Created Inbox task list {} for user: {}", saved.getId(), userId);
            return saved;
        } catch (DataAccessException e) {
            log.error("Failed to create Inbox for user: {}", userId, e);
            throw e;
        }
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
     * @param request Task list creation request
     * @param userId  Auth0 sub claim identifying the user
     * @return The created task list
     */
    @Transactional
    public TaskList createTaskList(TaskListDto.Create request, String userId) {
        log.info("Creating task list for user: {}", userId);

        // Ensure userId is set correctly
        TaskList taskList = TaskList.builder()
                .title(request.title())
                .dueDate(request.dueDate())
                .userId(userId)
                .build();

        // Ensure categories exist
        Set<Long> categoryIds = request.tasks().stream()
                .map(TaskDto.Create::categoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Category> categoryMap;
        if (categoryIds.isEmpty()) {
            categoryMap = Collections.emptyMap();
        } else {
            categoryMap = categoryRepository.findAllById(categoryIds).stream()
                    .collect(Collectors.toMap(Category::getId, Function.identity()));
        }

        List<Task> tasks = request.tasks().stream()
                .map(req -> Task.builder()
                        .title(req.title())
                        .status(TaskStatus.PENDING)
                        .dueDate(req.dueDate())
                        .executionDate(req.executionDate())
                        .category(req.categoryId() != null ? categoryMap.get(req.categoryId()) : null)
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
     * Only updates fields that are non-null in the request.
     * 
     * @param id      Task list ID
     * @param request Task list update request
     * @param userId  Auth0 sub claim identifying the user
     * @throws IllegalArgumentException if task list not found or doesn't belong to
     *                                  user
     */
    @Transactional
    public void updateTaskList(Long id, TaskListDto.Update request, String userId) {
        log.info("Updating task list {} for user: {}", id, userId);

        TaskList existing = taskListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task list not found"));

        // Update fields
        if (request.title() != null) {
            existing.setTitle(request.title());
        }
        if (request.dueDate() != null) {
            existing.setDueDate(request.dueDate());
        }
        if (request.isCompleted() != null) {
            // Validation: All tasks must be COMPLETED before marking list as completed
            if (request.isCompleted() && existing.getTasks() != null && !existing.getTasks().isEmpty()) {
                boolean allTasksCompleted = existing.getTasks().stream()
                        .allMatch(task -> task.getStatus() == TaskStatus.COMPLETED);

                if (!allTasksCompleted) {
                    throw new TaskListValidationException("すべてのタスクを完了してから、タスクリストを完了してください");
                }
            }

            existing.setIsCompleted(request.isCompleted());
            if (request.isCompleted()) {
                existing.setCompletedAt(LocalDateTime.now());
            } else {
                existing.setCompletedAt(null);
            }
        }

        taskListRepository.save(existing);
        log.info("Updated task list {} for user: {}", id, userId);
    }

    /**
     * Delete a task list.
     * Ensures the task list belongs to the user.
     * 
     * @param id     Task list ID
     * @param userId Auth0 sub claim identifying the user
     * @throws IllegalArgumentException if task list not found or doesn't belong to
     *                                  user
     */
    @Transactional
    public void deleteTaskList(Long id, String userId) {
        log.info("Deleting task list {} for user: {}", id, userId);

        // Verify ownership
        TaskList taskList = getTaskList(id, userId);

        taskListRepository.delete(taskList);
        log.info("Deleted task list {} for user: {}", id, userId);
    }
}
