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

import com.example.app1.dto.TaskListCreateRequest;
import com.example.app1.dto.TaskListPatchRequest;
import com.example.app1.dto.TaskListSummary;
import com.example.app1.model.TaskList;
import com.example.app1.service.TaskListService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for TaskList operations.
 * All endpoints require authentication via OAuth2 JWT.
 */
@Slf4j
@RestController
@RequestMapping("/api/tasklists")
@RequiredArgsConstructor
public class TaskListController {

    private final TaskListService taskListService;

    /**
     * Get all task lists for the authenticated user.
     * 
     * @param jwt JWT token containing user information
     * @return List of task lists
     */
    /**
     * Get all task lists for the authenticated user.
     * 
     * @param jwt JWT token containing user information
     * @return List of task lists
     */
    @GetMapping
    public ResponseEntity<List<TaskListSummary>> getUserTaskLists(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject(); // Auth0 sub claim
        log.info("[GET /api/tasklists] Request from user: {}", userId);

        List<TaskListSummary> taskLists = taskListService.getUserTaskLists(userId);
        return ResponseEntity.ok(taskLists);
    }

    /**
     * Get a specific task list by ID.
     * 
     * @param id  Task list ID
     * @param jwt JWT token containing user information
     * @return The task list
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskList> getTaskList(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[GET /api/tasklists/{}] Request from user: {}", id, userId);

        try {
            TaskList taskList = taskListService.getTaskList(id, userId);
            return ResponseEntity.ok(taskList);
        } catch (IllegalArgumentException e) {
            log.warn("[GET /api/tasklists/{}] Not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new task list.
     * 
     * @param taskList Task list to create
     * @param jwt      JWT token containing user information
     * @return The created task list
     */
    @PostMapping
    public ResponseEntity<TaskList> createTaskList(
            @RequestBody TaskListCreateRequest taskListCreateRequest,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[POST /api/tasklists] Request from user: {}", userId);

        TaskList created = taskListService.createTaskList(taskListCreateRequest, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing task list.
     * 
     * @param id       Task list ID
     * @param taskList Task list with updated fields
     * @param jwt      JWT token containing user information
     * @return The updated task list
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Void> patchTaskList(
            @PathVariable Long id,
            @RequestBody TaskListPatchRequest taskListPatchRequest,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[PUT /api/tasklists/{}] Request from user: {}", id, userId);

        try {
            taskListService.updateTaskList(id, taskListPatchRequest, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("[PUT /api/tasklists/{}] Not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a task list.
     * 
     * @param id  Task list ID
     * @param jwt JWT token containing user information
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaskList(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[DELETE /api/tasklists/{}] Request from user: {}", id, userId);

        try {
            taskListService.deleteTaskList(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("[DELETE /api/tasklists/{}] Not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }
}
