package io.reflectoring.bff.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.TaskDto;

@Service
public class BffTaskService {

    private static final Logger log = LoggerFactory.getLogger(BffTaskService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffTaskService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
    }

    public List<TaskDto.Summary> getUserTasks(String token) {
        log.info("Fetching user tasks from Resource Server");
        List<TaskDto.Summary> tasks = restClient.get()
                .uri(resourceUrl + "/tasks")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<TaskDto.Summary>>() {
                });

        if (tasks == null) {
            return List.of();
        }

        log.info("Successfully fetched {} tasks", tasks.size());
        return tasks;
    }

    public TaskDto.Summary getTask(Long id, String token) {
        log.info("Fetching task {} from Resource Server", id);
        TaskDto.Summary task = restClient.get()
                .uri(resourceUrl + "/tasks/{id}", id)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(TaskDto.Summary.class);
        return task;
    }

    public TaskDto.Summary createTask(TaskDto.Create request, String token) {
        log.info("Creating task: {} via Resource Server", request);
        TaskDto.Summary created = restClient.post()
                .uri(resourceUrl + "/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(request)
                .retrieve()
                .body(TaskDto.Summary.class);
        log.info("Successfully created task: {}", created);
        return created;
    }

    public void updateTask(Long id, TaskDto.Update request, String token) {
        log.info("Updating task {} with request: {}", id, request);
        restClient.patch()
                .uri(resourceUrl + "/tasks/{id}", id)
                .header("Authorization", "Bearer " + token)
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
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully deleted task {}", id);
    }

    public List<TaskDto.Summary> getTasksByTaskListId(Long taskListId, String token) {
        log.info("Fetching tasks for list {} from Resource Server", taskListId);
        List<TaskDto.Summary> tasks = restClient.get()
                .uri(resourceUrl + "/tasklists/{id}/tasks", taskListId)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<TaskDto.Summary>>() {
                });

        if (tasks == null) {
            return List.of();
        }

        log.info("Successfully fetched {} tasks for list {}", tasks.size(), taskListId);
        return tasks;
    }

}
