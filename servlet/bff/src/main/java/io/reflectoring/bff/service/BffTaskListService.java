package io.reflectoring.bff.service;

import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.BffTaskListResponse;
import io.reflectoring.bff.dto.TaskListPatchRequest;
import io.reflectoring.bff.model.TaskList;
import io.reflectoring.bff.model.TaskListCreateRequest;

@Service
public class BffTaskListService {

    private static final Logger log = LoggerFactory.getLogger(BffTaskListService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffTaskListService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.build();
        this.resourceUrl = appProperties.getResourceServer().getUrl() + "/api";
    }

    public List<BffTaskListResponse> getUserTaskLists(String token) {
        log.info("Fetching user task lists from Resource Server");
        List<TaskList> taskLists = restClient.get()
                .uri(resourceUrl + "/tasklists")
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<List<TaskList>>() {
                });

        if (taskLists == null) {
            return List.of();
        }

        return taskLists.stream()
                .map(this::toBffTaskListResponse)
                .toList();
    }

    private BffTaskListResponse toBffTaskListResponse(TaskList taskList) {
        List<BffTaskListResponse.TaskSummary> taskSummaries = taskList.tasks() == null ? List.of()
                : taskList.tasks().stream()
                        .map(task -> BffTaskListResponse.TaskSummary.builder()
                                .id(task.id())
                                .title(task.title())
                                .status(task.status() != null ? task.status().toString() : null)
                                .build())
                        .toList();

        return BffTaskListResponse.builder()
                .id(taskList.id())
                .title(taskList.title())
                .dueDate(taskList.dueDate())
                .isCompleted(taskList.isCompleted())
                .tasks(taskSummaries)
                .build();
    }

    public TaskList getTaskList(Long id, String token) {
        return restClient.get()
                .uri(resourceUrl + "/tasklists/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(TaskList.class);
    }

    public TaskList createTaskList(TaskListCreateRequest taskListCreateRequest, String token) {
        Objects.requireNonNull(taskListCreateRequest);
        Objects.requireNonNull(token);
        return restClient.post()
                .uri(resourceUrl + "/tasklists")
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(taskListCreateRequest)
                .retrieve()
                .body(TaskList.class);
    }

    public void patchTaskList(Long id, TaskListPatchRequest taskListPatchRequest, String token) {
        restClient.patch()
                .uri(resourceUrl + "/tasklists/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(taskListPatchRequest)
                .retrieve()
                .toBodilessEntity();
    }

    public void deleteTaskList(Long id, String token) {
        restClient.delete()
                .uri(resourceUrl + "/tasklists/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .toBodilessEntity();
    }
}
