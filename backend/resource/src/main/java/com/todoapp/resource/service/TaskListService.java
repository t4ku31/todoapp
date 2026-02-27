package com.todoapp.resource.service;

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

import com.todoapp.resource.dto.TaskDto;
import com.todoapp.resource.dto.TaskListDto;
import com.todoapp.resource.model.Task;
import com.todoapp.resource.model.TaskList;
import com.todoapp.resource.model.TaskStatus;
import com.todoapp.resource.repository.CategoryRepository;
import com.todoapp.resource.repository.TaskListRepository;

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
     * Ensures an Inbox task list always exists.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of task lists owned by the user
     */
    @Transactional
    public List<TaskList> getUserTaskLists(String userId) {
        log.info("Getting task lists for user: {}", userId);
        List<TaskList> taskLists = taskListRepository.findByUserId(userId);

        // Check if Inbox exists
        boolean hasInbox = taskLists.stream()
                .anyMatch(tl -> "Inbox".equals(tl.getTitle()));

        if (!hasInbox) {
            log.info("No Inbox found for user: {}. Creating default Inbox.", userId);
            createInbox(userId);
            // Re-fetch to get updated list with Inbox
            taskLists = taskListRepository.findByUserId(userId);
        }

        log.info("Found {}", taskLists);
        return taskLists;
    }

    /**
     * Get or create the Inbox task list for a user.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return The user's Inbox task list
     */
    @Transactional
    public TaskList getOrCreateInbox(String userId) {
        log.info("Getting or creating Inbox for user: {}", userId);

        // Try to find existing Inbox
        List<TaskList> taskLists = taskListRepository.findByUserId(userId);
        for (TaskList taskList : taskLists) {
            if ("Inbox".equals(taskList.getTitle())) {
                log.info("Found existing Inbox {} for user: {}", taskList.getId(), userId);
                return taskList;
            }
        }

        // Create new Inbox if not found
        return createInbox(userId);
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
     * Get or create a task list by title for a user.
     * 
     * @param title  Task list title
     * @param userId Auth0 sub claim identifying the user
     * @return The task list
     */
    @Transactional
    public TaskList getOrCreateTaskList(String title, String userId) {
        log.info("Getting or creating task list '{}' for user: {}", title, userId);

        return taskListRepository.findByTitleAndUserId(title, userId)
                .orElseGet(() -> {
                    log.info("Task list '{}' not found for user: {}. Creating new.", title, userId);
                    TaskList newTaskList = TaskList.builder()
                            .title(title)
                            .userId(userId)
                            .build();
                    return taskListRepository.save(newTaskList);
                });
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

        Map<Long, com.todoapp.resource.model.Category> categoryMap;
        if (categoryIds.isEmpty()) {
            categoryMap = Collections.emptyMap();
        } else {
            categoryMap = categoryRepository.findAllById(categoryIds).stream()
                    .collect(Collectors.toMap(com.todoapp.resource.model.Category::getId, Function.identity()));
        }

        List<Task> tasks = request.tasks().stream()
                .map(req -> {
                    com.todoapp.resource.model.Category cat = req.categoryId() != null
                            ? categoryMap.get(req.categoryId())
                            : null;
                    return Task.builder()
                            .title(req.title())
                            .status(TaskStatus.PENDING)
                            .scheduledStartAt(req.scheduledStartAt() != null
                                    ? req.scheduledStartAt()
                                    : java.time.LocalDate.now().atStartOfDay().atOffset(java.time.ZoneOffset.UTC))
                            .isAllDay(req.isAllDay() != null ? req.isAllDay() : true)
                            .category(cat)
                            .userId(userId)
                            .taskList(taskList)
                            .build();
                })
                .collect(Collectors.toList());

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
