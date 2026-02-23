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

import io.reflectoring.bff.dto.TaskListDto;
import io.reflectoring.bff.service.BffTaskListService;

@RestController
@RequestMapping("/api/tasklists")
public class BffTaskListController {

    private static final Logger log = LoggerFactory.getLogger(BffTaskListController.class);
    private final BffTaskListService taskListService;

    public BffTaskListController(BffTaskListService taskListService) {
        this.taskListService = taskListService;
    }

    // done to test
    @GetMapping
    public ResponseEntity<List<TaskListDto.Summary>> getUserTaskLists(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasklists] Request by user: {}", client.getPrincipalName());
        List<TaskListDto.Summary> taskLists = taskListService
                .getUserTaskLists(client.getAccessToken().getTokenValue());
        return ResponseEntity.ok(taskLists);
    }

    // done to test
    @PostMapping
    public ResponseEntity<TaskListDto.Summary> createTaskList(
            @RequestBody TaskListDto.Create taskListCreateRequest,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasklists] Request by user: {}", client.getPrincipalName());
        log.info("[POST /api/tasklists] Request new list: {}", taskListCreateRequest);
        TaskListDto.Summary created = taskListService.createTaskList(taskListCreateRequest,
                client.getAccessToken().getTokenValue());
        log.info("[POST /api/tasklists] Created TaskList: {}", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // done to test
    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateTaskList(
            @PathVariable Long id,
            @RequestBody TaskListDto.Update taskListUpdateRequest,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[PATCH /api/tasklists/{id}] Request by user: {}", client.getPrincipalName());
        log.info("[PATCH /api/tasklists/{id}] Updating task list {} with request: {}", id, taskListUpdateRequest);
        try {
            taskListService.updateTaskList(id, taskListUpdateRequest,
                    client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            log.warn("[PATCH /api/tasklists/{id}] Error updating task list {}: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.warn("[PATCH /api/tasklists/{id}] Unexpected error updating task list {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaskList(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("Deleting task list {}", id);
        try {
            taskListService.deleteTaskList(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            log.warn("[DELETE /api/tasklists/{id}] Error deleting task list {}: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.warn("Error deleting task list {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
