package io.reflectoring.bff.controller;

import java.util.List;

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

import io.reflectoring.bff.dto.TaskDto;
import io.reflectoring.bff.service.BffTaskService;

@RestController
@RequestMapping("/api")
public class BffTaskController {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(BffTaskController.class);
    private final BffTaskService taskService;

    public BffTaskController(BffTaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto.Summary>> getUserTasks(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks] Request by user: {}", client.getPrincipalName());
        List<TaskDto.Summary> tasks = taskService.getUserTasks(client.getAccessToken().getTokenValue());
        log.info("[GET /api/tasks] Returning {} tasks", tasks.size());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskDto.Summary> getTask(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks/{id}] Request by user: {}", client.getPrincipalName());
        log.info("[GET /api/tasks/{id}] Fetching task {}", id);
        try {
            TaskDto.Summary task = taskService.getTask(id, client.getAccessToken().getTokenValue());
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

    //
    @PostMapping("/tasks")
    public ResponseEntity<TaskDto.Summary> createTask(
            @RequestBody TaskDto.Create request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasks] Request by user: {}", client.getPrincipalName());
        log.info("[POST /api/tasks] Creating task: {}", request);
        try {
            TaskDto.Summary created = taskService.createTask(request, client.getAccessToken().getTokenValue());
            log.info("[POST /api/tasks] Successfully created task with id: {}", created.id());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RestClientResponseException e) {
            log.error("[POST /api/tasks] Error creating task: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[POST /api/tasks] Error creating task: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // done to test
    @PatchMapping("/tasks/{id}")
    public ResponseEntity<Void> updateTask(
            @PathVariable Long id,
            @RequestBody TaskDto.Update request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[a /api/tasks/{id}] Request by user: {}", client.getPrincipalName());
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
    public ResponseEntity<List<TaskDto.Summary>> getTasksByTaskListId(
            @PathVariable Long taskListId,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasklists/{taskListId}/tasks] Request by user: {}", client.getPrincipalName());
        log.info("[GET /api/tasklists/{taskListId}/tasks] Fetching tasks for task list {} from Resource Server",
                taskListId);
        try {
            List<TaskDto.Summary> tasks = taskService.getTasksByTaskListId(taskListId,
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

    @GetMapping("/tasks/trash")
    public ResponseEntity<List<TaskDto.Summary>> getTrashTasks(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks/trash] Request by user: {}", client.getPrincipalName());
        try {
            List<TaskDto.Summary> tasks = taskService.getTrashTasks(client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(tasks);
        } catch (RestClientResponseException e) {
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/tasks/{id}/restore")
    public ResponseEntity<Void> restoreTask(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasks/{id}/restore] Request by user: {}", client.getPrincipalName());
        try {
            taskService.restoreTask(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/tasks/{id}/permanent")
    public ResponseEntity<Void> deleteTaskPermanently(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[DELETE /api/tasks/{id}/permanent] Request by user: {}", client.getPrincipalName());
        try {
            taskService.deleteTaskPermanently(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/tasks/stats")
    public ResponseEntity<io.reflectoring.bff.dto.TaskDto.Stats> getTaskStats(
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasks/stats] Request by user: {} from {} to {}", client.getPrincipalName(), startDate,
                endDate);
        try {
            io.reflectoring.bff.dto.TaskDto.Stats stats = taskService.getTaskStats(
                    startDate, endDate, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(stats);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/tasks/stats] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/tasks/stats] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/tasks/bulk")
    public ResponseEntity<TaskDto.BulkOperationResult> bulkUpdateTasks(
            @RequestBody TaskDto.BulkUpdate request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[PATCH /api/tasks/bulk] Request by user: {} for {} tasks",
                client.getPrincipalName(), request.taskIds() != null ? request.taskIds().size() : 0);

        if (request.taskIds() == null || request.taskIds().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new TaskDto.BulkOperationResult(0, 0, java.util.Collections.emptyList(), false,
                            java.util.Collections.emptyList()));
        }

        try {
            TaskDto.BulkOperationResult result = taskService.bulkUpdateTasks(request,
                    client.getAccessToken().getTokenValue());
            if (result == null) {
                return ResponseEntity.internalServerError().build();
            }
            if (result.allSucceeded()) {
                return ResponseEntity.ok(result);
            } else if (result.successCount() > 0) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.MULTI_STATUS).body(result);
            } else {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY).body(result);
            }
        } catch (RestClientResponseException e) {
            log.error("[PATCH /api/tasks/bulk] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("[PATCH /api/tasks/bulk] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/tasks/bulk")
    public ResponseEntity<TaskDto.BulkOperationResult> bulkDeleteTasks(
            @RequestBody TaskDto.BulkDelete request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[DELETE /api/tasks/bulk] Request by user: {} for {} tasks",
                client.getPrincipalName(), request.taskIds() != null ? request.taskIds().size() : 0);

        if (request.taskIds() == null || request.taskIds().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new TaskDto.BulkOperationResult(0, 0, java.util.Collections.emptyList(), false,
                            java.util.Collections.emptyList()));
        }

        try {
            TaskDto.BulkOperationResult result = taskService.bulkDeleteTasks(request,
                    client.getAccessToken().getTokenValue());
            if (result == null) {
                return ResponseEntity.internalServerError().build();
            }
            if (result.allSucceeded()) {
                return ResponseEntity.ok(result);
            } else if (result.successCount() > 0) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.MULTI_STATUS).body(result);
            } else {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY).body(result);
            }
        } catch (RestClientResponseException e) {
            log.error("[DELETE /api/tasks/bulk] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("[DELETE /api/tasks/bulk] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/tasks/batch")
    public ResponseEntity<TaskDto.BulkCreateResult> bulkCreateTasks(
            @RequestBody TaskDto.BulkCreate request,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasks/batch] Request by user: {} for {} tasks",
                client.getPrincipalName(), request.tasks() != null ? request.tasks().size() : 0);

        if (request.tasks() == null || request.tasks().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new TaskDto.BulkCreateResult(0, java.util.Collections.emptyList(), false, "No tasks provided"));
        }

        try {
            TaskDto.BulkCreateResult result = taskService.bulkCreateTasks(request,
                    client.getAccessToken().getTokenValue());
            if (result == null) {
                return ResponseEntity.internalServerError().body(
                        new TaskDto.BulkCreateResult(0, java.util.Collections.emptyList(), false, "Unknown error"));
            }
            if (result.allSucceeded()) {
                return ResponseEntity.status(HttpStatus.CREATED).body(result);
            } else {
                return ResponseEntity.internalServerError().body(result);
            }
        } catch (RestClientResponseException e) {
            log.error("[POST /api/tasks/batch] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(
                    new TaskDto.BulkCreateResult(0, java.util.Collections.emptyList(), false, e.getMessage()));
        } catch (Exception e) {
            log.error("[POST /api/tasks/batch] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(
                    new TaskDto.BulkCreateResult(0, java.util.Collections.emptyList(), false, e.getMessage()));
        }
    }

    @PostMapping("/tasks/sync")
    public ResponseEntity<TaskDto.SyncResult> syncTasks(
            @RequestBody List<TaskDto.SyncTaskDto> tasks,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasks/sync] Request by user: {} for {} tasks",
                client.getPrincipalName(), tasks != null ? tasks.size() : 0);
        try {
            TaskDto.SyncResult result = taskService.syncTasks(tasks,
                    client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(result);
        } catch (RestClientResponseException e) {
            log.error("[POST /api/tasks/sync] Error: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("[POST /api/tasks/sync] Error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
