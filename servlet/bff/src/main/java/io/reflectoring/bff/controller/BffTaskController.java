package io.reflectoring.bff.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.reflectoring.bff.model.Task;
import io.reflectoring.bff.service.BffTaskService;

@RestController
@RequestMapping("/api")
public class BffTaskController {

    private static final Logger log = LoggerFactory.getLogger(BffTaskController.class);
    private final BffTaskService taskService;

    public BffTaskController(BffTaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<Task>> getUserTasks(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks] Proxying request to Resource Server");
        List<Task> tasks = taskService.getUserTasks(client.getAccessToken().getTokenValue());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<Task> getTask(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks/{}] Proxying request to Resource Server", id);
        try {
            Task task = taskService.getTask(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            log.warn("Error fetching task {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/tasks")
    public ResponseEntity<Task> createTask(
            @RequestBody Task task,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasks] Proxying request to Resource Server");
        Task created = taskService.createTask(task, client.getAccessToken().getTokenValue());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/tasks/{id}")
    public ResponseEntity<Void> updateTask(
            @PathVariable Long id,
            @RequestBody io.reflectoring.bff.dto.TaskPatchRequest request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[PATCH /api/tasks/{}] Proxying request to Resource Server", id);
        try {
            taskService.patchTask(id, request, client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.warn("Error updating task {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[DELETE /api/tasks/{}] Proxying request to Resource Server", id);
        try {
            taskService.deleteTask(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.warn("Error deleting task {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/tasklists/{taskListId}/tasks")
    public ResponseEntity<List<Task>> getTasksByTaskListId(
            @PathVariable Long taskListId,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasklists/{}/tasks] Proxying request to Resource Server", taskListId);
        try {
            List<Task> tasks = taskService.getTasksByTaskListId(taskListId, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.warn("Error fetching tasks for list {}: {}", taskListId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
