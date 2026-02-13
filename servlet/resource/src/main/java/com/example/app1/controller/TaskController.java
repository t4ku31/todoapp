package com.example.app1.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.dto.CategoryDto;
import com.example.app1.dto.RecurrenceRuleDto;
import com.example.app1.dto.SubtaskDto;
import com.example.app1.dto.TaskDto;
import com.example.app1.model.Task;
import com.example.app1.service.domain.TaskService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Task operations.
 * All endpoints require authentication via OAuth2 JWT.
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * Get all tasks for a specific task list.
     * 
     * @param taskListId ID of the task list
     * @param jwt        JWT token containing user information
     * @return List of tasks
     */
    @GetMapping("/tasklists/{taskListId}/tasks")
    public ResponseEntity<List<TaskDto.Summary>> getTasksByTaskListId(
            @PathVariable Long taskListId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to fetch tasks for list {} for user: {}", taskListId, userId);

        try {
            List<Task> tasks = taskService.getTasksByTaskListId(taskListId, userId);
            List<TaskDto.Summary> taskSummaries = tasks.stream()
                    .map(this::toSummary)
                    .toList();
            log.info("Returning {} tasks for list {} for user: {}", taskSummaries.size(), taskListId, userId);
            return ResponseEntity.ok(taskSummaries);
        } catch (IllegalArgumentException e) {
            log.warn("Task list {} not found for user: {}", taskListId, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all tasks for the authenticated user.
     * 
     * @param jwt JWT token containing user information
     * @return List of all user's tasks
     */
    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto.Summary>> getUserTasks(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to fetch all tasks for user: {}", userId);

        List<Task> tasks = taskService.getUserTasks(userId);
        List<TaskDto.Summary> taskSummaries = tasks.stream()
                .map(this::toSummary)
                .toList();
        log.info("Returning {} tasks for user: {}", taskSummaries.size(), userId);
        return ResponseEntity.ok(taskSummaries);
    }

    /**
     * Get a specific task by ID.
     * 
     * @param id  Task ID
     * @param jwt JWT token containing user information
     * @return The task
     */
    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskDto.Summary> getTask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to fetch task {} for user: {}", id, userId);

        try {
            Task task = taskService.getTask(id, userId);
            log.info("Successfully fetched task {} for user: {}", id, userId);
            return ResponseEntity.ok(toSummary(task));
        } catch (IllegalArgumentException e) {
            log.warn("Task {} not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new task.
     * 
     * @param task Task to create
     * @param jwt  JWT token containing user information
     * @return The created task
     */
    @PostMapping("/tasks")
    public ResponseEntity<Object> createTask(
            @RequestBody TaskDto.Create taskCreateRequest,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to create task for user: {}", userId);

        try {
            Task created = taskService.createTask(taskCreateRequest, userId);
            log.info("Successfully created task {} for user: {}", created.getId(), userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(toSummary(created));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new com.example.app1.dto.ErrorResponseDto("Invalid request", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating task for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new com.example.app1.dto.ErrorResponseDto("Internal server error", e.getMessage()));
        }
    }

    /**
     * Bulk create multiple tasks at once.
     * Uses transaction to ensure all tasks are created atomically.
     * 
     * @param request List of tasks to create
     * @param jwt     JWT token containing user information
     * @return Result with created task IDs
     */
    @PostMapping("/tasks/batch")
    public ResponseEntity<TaskDto.BulkCreateResult> bulkCreateTasks(
            @RequestBody TaskDto.BulkCreate request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received bulk create request for {} tasks for user: {}",
                request.tasks() != null ? request.tasks().size() : 0, userId);

        if (request.tasks() == null || request.tasks().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    TaskDto.BulkCreateResult.error("No tasks provided"));
        }

        try {
            java.util.List<Long> createdIds = new java.util.ArrayList<>();
            for (TaskDto.Create taskCreate : request.tasks()) {
                Task created = taskService.createTask(taskCreate, userId);
                createdIds.add(created.getId());
            }
            log.info("Successfully created {} tasks for user: {}", createdIds.size(), userId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(TaskDto.BulkCreateResult.success(createdIds));
        } catch (Exception e) {
            log.error("Error bulk creating tasks for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(TaskDto.BulkCreateResult.error("タスクの作成に失敗しました: " + e.getMessage()));
        }
    }

    /**
     * Patch an existing task.
     * 
     * @param id      Task ID
     * @param request Patch request with fields to update
     * @param jwt     JWT token containing user information
     * @return No content
     */

    @PatchMapping("/tasks/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long id,
            @RequestBody(required = false) TaskDto.Update request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to update task {} for user: {}. Payload: {}", id, userId, request);

        try {
            taskService.updateTask(id, request, userId);
            log.info("Successfully updated task {} for user: {}", id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Task {} not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a task.
     * 
     * @param id  Task ID
     * @param jwt JWT token containing user information
     * @return No content
     */
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to delete task {} for user: {}", id, userId);

        try {
            taskService.deleteTask(id, userId);
            log.info("Successfully deleted task {} for user: {}", id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Task {} not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get soft-deleted tasks (trash).
     */
    @GetMapping("/tasks/trash")
    public ResponseEntity<List<TaskDto.Summary>> getTrashTasks(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<Task> tasks = taskService.getTrashTasks(userId);
        return ResponseEntity.ok(tasks.stream().map(this::toSummary).toList());
    }

    /**
     * Restore a deleted task.
     */
    @PostMapping("/tasks/{id}/restore")
    public ResponseEntity<Void> restoreTask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        try {
            taskService.restoreTask(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Permanently delete a task.
     */
    @DeleteMapping("/tasks/{id}/permanent")
    public ResponseEntity<Void> deleteTaskPermanently(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        try {
            taskService.deleteTaskPermanently(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get task statistics for a range.
     */
    @GetMapping("/tasks/stats")
    public ResponseEntity<com.example.app1.dto.TaskDto.Stats> getTaskStats(
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request for task stats for user: {} from {} to {}", userId, startDate, endDate);

        com.example.app1.dto.TaskDto.Stats stats = taskService.getTaskStatsInRange(userId, startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    /**
     * Bulk update multiple tasks at once.
     * Supports updating status, categoryId, taskListId, and startDate.
     * Returns 200 OK with full success, 207 Multi-Status for partial success.
     */
    @PatchMapping("/tasks/bulk")
    public ResponseEntity<TaskDto.BulkOperationResult> bulkUpdateTasks(
            @RequestBody TaskDto.BulkUpdate request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received bulk update request for {} tasks for user: {}",
                request.taskIds() != null ? request.taskIds().size() : 0, userId);

        if (request.taskIds() == null || request.taskIds().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    TaskDto.BulkOperationResult.builder()
                            .successCount(0)
                            .failedCount(0)
                            .allSucceeded(false)
                            .failedTasks(java.util.Collections.emptyList())
                            .build());
        }

        TaskDto.BulkOperationResult result = taskService.bulkUpdateTasks(request, userId);

        if (result.isAllSucceeded()) {
            return ResponseEntity.ok(result);
        } else if (result.getSuccessCount() > 0) {
            // Partial success - use 207 Multi-Status
            return ResponseEntity.status(org.springframework.http.HttpStatus.MULTI_STATUS).body(result);
        } else {
            // All failed
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY).body(result);
        }
    }

    /**
     * Bulk delete (soft delete) multiple tasks at once.
     * Returns 200 OK with full success, 207 Multi-Status for partial success.
     */
    @DeleteMapping("/tasks/bulk")
    public ResponseEntity<TaskDto.BulkOperationResult> bulkDeleteTasks(
            @RequestBody TaskDto.BulkDelete request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received bulk delete request for {} tasks for user: {}",
                request.taskIds() != null ? request.taskIds().size() : 0, userId);

        if (request.taskIds() == null || request.taskIds().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    TaskDto.BulkOperationResult.builder()
                            .successCount(0)
                            .failedCount(0)
                            .allSucceeded(false)
                            .failedTasks(java.util.Collections.emptyList())
                            .build());
        }

        TaskDto.BulkOperationResult result = taskService.bulkDeleteTasks(request.taskIds(), userId);

        if (result.isAllSucceeded()) {
            return ResponseEntity.ok(result);
        } else if (result.getSuccessCount() > 0) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.MULTI_STATUS).body(result);
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY).body(result);
        }
    }

    /**
     * Sync tasks (Create, Update, Delete) in a single transaction.
     * Uses SyncTaskDto which is a unified model.
     * 
     * @param tasks List of tasks to sync
     * @param jwt   Authenticated user's JWT
     * @return Sync result
     */
    @PostMapping("/tasks/sync")
    public ResponseEntity<TaskDto.SyncResult> syncTasks(
            @RequestBody List<TaskDto.SyncTaskDto> tasks,
            @AuthenticationPrincipal Jwt jwt) {
        log.info("[TaskController] POST /api/tasks/sync - user: {}, tasks: {}",
                jwt.getSubject(), tasks != null ? tasks.size() : 0);
        String userId = jwt.getSubject();

        TaskDto.SyncResult result = taskService.syncTasks(tasks, userId);
        return ResponseEntity.ok(result);
    }

    private TaskDto.Summary toSummary(Task task) {
        RecurrenceRuleDto rrule = null;
        if (Boolean.TRUE.equals(task.getIsRecurring()) && task.getRecurrenceRule() != null) {
            try {
                rrule = RecurrenceRuleDto.fromRRuleString(task.getRecurrenceRule());
            } catch (Exception e) {
                log.warn("Failed to parse RRULE for task {}: {}", task.getId(), task.getRecurrenceRule());
            }
        }

        CategoryDto.Response category = null;
        if (task.getCategory() != null) {
            category = new CategoryDto.Response(
                    task.getCategory().getId(),
                    task.getCategory().getName(),
                    task.getCategory().getColor());
        }

        List<SubtaskDto.Summary> subtasks = task.getSubtasks().stream()
                .map(s -> new SubtaskDto.Summary(
                        s.getId(),
                        s.getTask().getId(),
                        s.getTitle(),
                        s.getDescription(),
                        s.getIsCompleted(),
                        s.getOrderIndex()))
                .toList();

        return new TaskDto.Summary(
                task.getId(),
                task.getTitle(),
                task.getStatus(),
                task.getStartDate(),
                task.getTaskList() != null ? task.getTaskList().getId() : null,
                category,
                subtasks,
                task.getEstimatedPomodoros(),
                task.getCompletedAt(),
                task.getIsRecurring(),
                rrule,
                task.getRecurrenceParentId(),
                task.getIsDeleted(),
                task.getDescription(),
                task.getScheduledStartAt(),
                task.getScheduledEndAt(),
                task.getIsAllDay());
    }
}
