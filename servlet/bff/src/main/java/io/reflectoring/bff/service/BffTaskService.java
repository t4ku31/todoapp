package io.reflectoring.bff.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.TaskResponse;
import io.reflectoring.bff.dto.TaskUpdateRequest;
import io.reflectoring.bff.model.Task;

@Service
public class BffTaskService {

    private static final Logger log = LoggerFactory.getLogger(BffTaskService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffTaskService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
    }

    public List<TaskResponse> getUserTasks(String token) {
        log.info("Fetching user tasks from Resource Server");
        List<Task> tasks = restClient.get()
                .uri(resourceUrl + "/tasks")
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<List<Task>>() {
                });

        if (tasks == null) {
            return List.of();
        }

        log.info("Successfully fetched {} tasks", tasks.size());
        return tasks.stream().map(this::toTaskResponse).toList();
    }

    public TaskResponse getTask(Long id, String token) {
        log.info("Fetching task {} from Resource Server", id);
        Task task = restClient.get()
                .uri(resourceUrl + "/tasks/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(Task.class);
        return toTaskResponse(task);
    }

    public TaskResponse createTask(Task task, String token) {
        log.info("Creating task: {} via Resource Server", task);
        Task created = restClient.post()
                .uri(resourceUrl + "/tasks")
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(task)
                .retrieve()
                .body(Task.class);
        log.info("Successfully created task: {}", created);
        return toTaskResponse(created);
    }

    public void updateTask(Long id, TaskUpdateRequest request, String token) {
        log.info("Updating task {} with request: {}", id, request);
        restClient.patch()
                .uri(resourceUrl + "/tasks/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully updated task {}", id);
    }

    public void deleteTask(Long id, String token) {
        log.info("Deleting task {}", id);
        restClient.delete()
                .uri(resourceUrl + "/tasks/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully deleted task {}", id);
    }

    public List<TaskResponse> getTasksByTaskListId(Long taskListId, String token) {
        log.info("Fetching tasks for list {} from Resource Server", taskListId);
        List<Task> tasks = restClient.get()
                .uri(resourceUrl + "/tasklists/{id}/tasks", taskListId)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<List<Task>>() {
                });

        if (tasks == null) {
            return List.of();
        }

        log.info("Successfully fetched {} tasks for list {}", tasks.size(), taskListId);
        return tasks.stream().map(this::toTaskResponse).toList();
    }

    private TaskResponse toTaskResponse(Task task) {
        if (task == null) {
            return null;
        }
        return TaskResponse.builder()
                .id(task.id())
                .title(task.title())
                .status(task.status() != null ? task.status().toString() : null)
                .build();
    }
}
