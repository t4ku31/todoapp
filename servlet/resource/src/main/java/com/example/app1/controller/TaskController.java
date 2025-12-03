package com.example.app1.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.model.Task;
import com.example.app1.service.TaskService;

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
        log.info("[GET /api/tasklists/{}/tasks] Request from user: {}", taskListId, userId);

        try {
            List<Task> tasks = taskService.getTasksByTaskListId(taskListId, userId);
            return ResponseEntity.ok(tasks);
        } catch (IllegalArgumentException e) {
            log.warn("[GET /api/tasklists/{}/tasks] Task list not found for user: {}", taskListId, userId);
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
        log.info("[GET /api/tasks] Request from user: {}", userId);

        List<Task> tasks = taskService.getUserTasks(userId);
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
        log.info("[GET /api/tasks/{}] Request from user: {}", id, userId);

        try {
            Task task = taskService.getTask(id, userId);
            return ResponseEntity.ok(task);
        } catch (IllegalArgumentException e) {
            log.warn("[GET /api/tasks/{}] Not found for user: {}", id, userId);
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
    public ResponseEntity<Task> createTask(
            @RequestBody Task task,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[POST /api/tasks] Request from user: {}", userId);

        try {
            Task created = taskService.createTask(task, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.warn("[POST /api/tasks] Task list not found for user: {}", userId);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing task.
     * 
     * @param id   Task ID
     * @param task Task with updated fields
     * @param jwt  JWT token containing user information
     * @return The updated task
     */
    // @PutMapping("/tasks/{id}")
    // public ResponseEntity<Task> updateTask(
    // @PathVariable Long id,
    // @RequestBody Task task,
    // @AuthenticationPrincipal Jwt jwt) {
    // String userId = jwt.getSubject();
    // log.info("[PUT /api/tasks/{}] Request from user: {}", id, userId);

    // try {
    // Task updated = taskService.updateTask(id, task, userId);
    // return ResponseEntity.ok(updated);
    // } catch (IllegalArgumentException e) {
    // log.warn("[PUT /api/tasks/{}] Not found for user: {}", id, userId);
    // return ResponseEntity.notFound().build();
    // }
    // }

    /**
     * Patch an existing task.
     * 
     * @param id      Task ID
     * @param request Patch request with fields to update
     * @param jwt     JWT token containing user information
     * @return No content
     */

    @org.springframework.web.bind.annotation.PatchMapping("/tasks/{id}")
    public ResponseEntity<Void> patchTask(
            @PathVariable Long id,
            @RequestBody com.example.app1.dto.TaskPatchRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[patch /api/tasks/{}] Request from user: {}", id, userId);

        try {
            taskService.patchTask(id, request, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("[PATCH /api/tasks/{}] Not found for user: {}", id, userId);
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
        log.info("[DELETE /api/tasks/{}] Request from user: {}", id, userId);

        try {
            taskService.deleteTask(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("[DELETE /api/tasks/{}] Not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }
}
