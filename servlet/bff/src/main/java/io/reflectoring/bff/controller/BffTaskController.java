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
import org.springframework.web.client.RestClientResponseException;

import io.reflectoring.bff.dto.TaskResponse;
import io.reflectoring.bff.dto.TaskUpdateRequest;
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
    public ResponseEntity<List<TaskResponse>> getUserTasks(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks] Request by user: {}", client.getPrincipalName());
        List<TaskResponse> tasks = taskService.getUserTasks(client.getAccessToken().getTokenValue());
        log.info("[GET /api/tasks] Returning {} tasks", tasks.size());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks/{id}] Request by user: {}", client.getPrincipalName());
        log.info("[GET /api/tasks/{id}] Fetching task {}", id);
        try {
            TaskResponse task = taskService.getTask(id, client.getAccessToken().getTokenValue());
            log.info("[GET /api/tasks/{id}] Successfully fetched task {}", id);
            return ResponseEntity.ok(task);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/tasks/{id}] Error fetching task {}: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/tasks/{id}] Error fetching task {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @RequestBody Task task,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasks] Request by user: {}", client.getPrincipalName());
        log.info("[POST /api/tasks] Creating task: {}", task);
        TaskResponse created = taskService.createTask(task, client.getAccessToken().getTokenValue());
        log.info("[POST /api/tasks] Successfully created task with id: {}", created.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // done to test
    @PatchMapping("/tasks/{id}")
    public ResponseEntity<Void> updateTask(
            @PathVariable Long id,
            @RequestBody TaskUpdateRequest request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[PATCH /api/tasks/{id}] Request by user: {}", client.getPrincipalName());
        log.info("[PATCH /api/tasks/{id}] Updating task {} with request: {}", id, request);
        try {
            taskService.updateTask(id, request, client.getAccessToken().getTokenValue());
            log.info("[PATCH /api/tasks/{id}] Successfully updated task {}", id);
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            log.error("[PATCH /api/tasks/{id}] Error updating task {}: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[PATCH /api/tasks/{id}] Error updating task {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // done to test
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[DELETE /api/tasks/{id}] Request by user: {}", client.getPrincipalName());
        log.info("[DELETE /api/tasks/{id}] Deleting task {}", id);
        try {
            taskService.deleteTask(id, client.getAccessToken().getTokenValue());
            log.info("[DELETE /api/tasks/{id}] Successfully deleted task {}", id);
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            log.error("[DELETE /api/tasks/{id}] Error deleting task {}: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("[DELETE /api/tasks/{id}] Error deleting task {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // not yet implemented
    @GetMapping("/tasklists/{taskListId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByTaskListId(
            @PathVariable Long taskListId,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasklists/{taskListId}/tasks] Request by user: {}", client.getPrincipalName());
        log.info("[GET /api/tasklists/{taskListId}/tasks] Fetching tasks for task list {} from Resource Server",
                taskListId);
        try {
            List<TaskResponse> tasks = taskService.getTasksByTaskListId(taskListId,
                    client.getAccessToken().getTokenValue());
            log.info("[GET /api/tasklists/{taskListId}/tasks] Returning {} tasks for task list {}", tasks.size(),
                    taskListId);
            return ResponseEntity.ok(tasks);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/tasklists/{taskListId}/tasks] Error fetching tasks for list {}: {}", taskListId,
                    e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/tasklists/{taskListId}/tasks] Error fetching tasks for list {}: {}", taskListId,
                    e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
