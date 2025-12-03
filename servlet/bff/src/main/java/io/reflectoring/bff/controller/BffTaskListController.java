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

import io.reflectoring.bff.dto.BffTaskListResponse;
import io.reflectoring.bff.dto.TaskListPatchRequest;
import io.reflectoring.bff.model.TaskList;
import io.reflectoring.bff.model.TaskListCreateRequest;
import io.reflectoring.bff.service.BffTaskListService;

@RestController
@RequestMapping("/api/tasklists")
public class BffTaskListController {

    private static final Logger log = LoggerFactory.getLogger(BffTaskListController.class);
    private final BffTaskListService taskListService;

    public BffTaskListController(BffTaskListService taskListService) {
        this.taskListService = taskListService;
    }

    @GetMapping
    public ResponseEntity<List<BffTaskListResponse>> getUserTaskLists(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasklists] Proxying request to Resource Server");
        List<BffTaskListResponse> taskLists = taskListService.getUserTaskLists(client.getAccessToken().getTokenValue());
        return ResponseEntity.ok(taskLists);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskList> getTaskList(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/tasklists/{}] Proxying request to Resource Server", id);
        try {
            TaskList taskList = taskListService.getTaskList(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.ok(taskList);
        } catch (Exception e) {
            log.warn("Error fetching task list {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<TaskList> createTaskList(
            @RequestBody TaskListCreateRequest taskListCreateRequest,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[POST /api/tasklists] Proxying request to Resource Server");
        TaskList created = taskListService.createTaskList(taskListCreateRequest,
                client.getAccessToken().getTokenValue());

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateTaskList(
            @PathVariable Long id,
            @RequestBody TaskListPatchRequest taskListPatchRequest,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[Patch /api/tasklists/{}] Proxying request to Resource Server. body: {}, id: {}", id,
                taskListPatchRequest);
        try {
            taskListService.patchTaskList(id, taskListPatchRequest,
                    client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.warn("Error updating task list {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaskList(
            @PathVariable Long id,
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[DELETE /api/tasklists/{}] Proxying request to Resource Server", id);
        try {
            taskListService.deleteTaskList(id, client.getAccessToken().getTokenValue());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.warn("Error deleting task list {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
