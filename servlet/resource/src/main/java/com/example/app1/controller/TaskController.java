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
    public ResponseEntity<List<Task>> getTasksByTaskListId(
            @PathVariable Long taskListId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to fetch tasks for list {} for user: {}", taskListId, userId);

        try {
            List<Task> tasks = taskService.getTasksByTaskListId(taskListId, userId);
            log.info("Returning {} tasks for list {} for user: {}", tasks.size(), taskListId, userId);
            return ResponseEntity.ok(tasks);
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
    public ResponseEntity<List<Task>> getUserTasks(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to fetch all tasks for user: {}", userId);

        List<Task> tasks = taskService.getUserTasks(userId);
        log.info("Returning {} tasks for user: {}", tasks.size(), userId);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get a specific task by ID.
     * 
     * @param id  Task ID
     * @param jwt JWT token containing user information
     * @return The task
     */
    @GetMapping("/tasks/{id}")
    public ResponseEntity<Task> getTask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to fetch task {} for user: {}", id, userId);

        try {
            Task task = taskService.getTask(id, userId);
            log.info("Successfully fetched task {} for user: {}", id, userId);
            return ResponseEntity.ok(task);
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
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
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
     * Patch an existing task.
     * 
     * @param id      Task ID
     * @param request Patch request with fields to update
     * @param jwt     JWT token containing user information
     * @return No content
     */

    @PatchMapping("/tasks/{id}")
    public ResponseEntity<Void> updateTask(
            @PathVariable Long id,
            @RequestBody TaskDto.Update request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to update task {} for user: {}", id, userId);

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
}
