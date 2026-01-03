package io.reflectoring.bff.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import io.reflectoring.bff.dto.SubtaskDto;
import io.reflectoring.bff.service.BffSubtaskService;

@RestController
@RequestMapping("/api")
public class BffSubtaskController {

    private static final Logger log = LoggerFactory.getLogger(BffSubtaskController.class);
    private final BffSubtaskService subtaskService;

    public BffSubtaskController(BffSubtaskService subtaskService) {
        this.subtaskService = subtaskService;
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<SubtaskDto.Summary> createSubtask(
            @PathVariable Long taskId,
            @RequestBody SubtaskDto.Create request,
            @AuthenticationPrincipal Jwt jwt) {
        String token = jwt.getTokenValue();
        log.info("Received request to create subtask for task {}", taskId);
        SubtaskDto.Summary created = subtaskService.createSubtask(taskId, request, token);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/subtasks/{id}")
    public ResponseEntity<SubtaskDto.Summary> updateSubtask(
            @PathVariable Long id,
            @RequestBody SubtaskDto.Update request,
            @AuthenticationPrincipal Jwt jwt) {
        String token = jwt.getTokenValue();
        log.info("Received request to update subtask {}", id);
        SubtaskDto.Summary updated = subtaskService.updateSubtask(id, request, token);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String token = jwt.getTokenValue();
        log.info("Received request to delete subtask {}", id);
        subtaskService.deleteSubtask(id, token);
        return ResponseEntity.noContent().build();
    }
}
