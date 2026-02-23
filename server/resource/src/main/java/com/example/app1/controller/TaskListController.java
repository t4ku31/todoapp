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

import com.example.app1.dto.TaskListDto;
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
    public ResponseEntity<List<TaskList>> getUserTaskLists(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject(); // Auth0 sub claim
        log.info("Received request to fetch all task lists for user: {}", userId);

        List<TaskList> taskLists = taskListService.getUserTaskLists(userId);
        log.info("Returning {} task lists for user: {}", taskLists.size(), userId);
        return ResponseEntity.ok(taskLists);
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
            @RequestBody TaskListDto.Create taskListCreateRequest,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to create task list for user: {}", userId);

        TaskList created = taskListService.createTaskList(taskListCreateRequest, userId);
        log.info("Successfully created task list {} for user: {}", created.getId(), userId);
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
    public ResponseEntity<Void> updateTaskList(
            @PathVariable Long id,
            @RequestBody TaskListDto.Update taskListUpdateRequest,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to update task list {} for user: {}", id, userId);

        try {
            taskListService.updateTaskList(id, taskListUpdateRequest, userId);
            log.info("Successfully updated task list {} for user: {}", id, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("Task list {} not found for user: {}", id, userId);
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
        log.info("Received request to delete task list {} for user: {}", id, userId);

        try {
            taskListService.deleteTaskList(id, userId);
            log.info("Successfully deleted task list {} for user: {}", id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Task list {} not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }
}
