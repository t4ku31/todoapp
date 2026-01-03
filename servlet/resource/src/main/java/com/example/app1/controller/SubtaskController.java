package com.example.app1.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.dto.SubtaskDto;
import com.example.app1.model.Subtask;
import com.example.app1.service.domain.SubtaskService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for Subtask operations.
 * All endpoints require authentication via OAuth2 JWT.
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;

    /**
     * Create a new subtask for a specific task.
     * 
     * @param taskId  Parent task ID
     * @param request Creation request
     * @param jwt     JWT token containing user information
     * @return The created subtask
     */
    @PostMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<Subtask> createSubtask(
            @PathVariable Long taskId,
            @RequestBody SubtaskDto.Create request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to create subtask for task {} by user: {}", taskId, userId);

        try {
            Subtask created = subtaskService.createSubtask(taskId, request, userId);
            log.info("Successfully created subtask {} for task {}", created.getId(), taskId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.warn("Task {} not found or access denied for user: {}", taskId, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Patch an existing subtask.
     * 
     * @param id      Subtask ID
     * @param request Patch request with fields to update
     * @param jwt     JWT token containing user information
     * @return The updated subtask (or No Content)
     */
    @PatchMapping("/subtasks/{id}")
    public ResponseEntity<Subtask> updateSubtask(
            @PathVariable Long id,
            @RequestBody SubtaskDto.Update request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to update subtask {} for user: {}", id, userId);

        try {
            Subtask updated = subtaskService.updateSubtask(id, request, userId);
            log.info("Successfully updated subtask {} for user: {}", id, userId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.warn("Subtask {} not found for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a subtask.
     * 
     * @param id  Subtask ID
     * @param jwt JWT token containing user information
     * @return No content
     */
    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Received request to delete subtask {} for user: {}", id, userId);

        try {
            subtaskService.deleteSubtask(id, userId);
            log.info("Successfully deleted subtask {} for user: {}", id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Subtask {} not found or access denied for user: {}", id, userId);
            return ResponseEntity.notFound().build();
        }
    }
}
