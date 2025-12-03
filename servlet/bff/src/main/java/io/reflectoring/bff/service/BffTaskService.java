package io.reflectoring.bff.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.model.Task;

@Service
public class BffTaskService {

    private static final Logger log = LoggerFactory.getLogger(BffTaskService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffTaskService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.build();
        this.resourceUrl = appProperties.getResourceServer().getUrl() + "/api";
    }

    public List<Task> getUserTasks(String token) {
        log.info("Fetching user tasks from Resource Server");
        return restClient.get()
                .uri(resourceUrl + "/tasks")
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
    }

    public Task getTask(Long id, String token) {
        return restClient.get()
                .uri(resourceUrl + "/tasks/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(Task.class);
    }

    public Task createTask(Task task, String token) {
        return restClient.post()
                .uri(resourceUrl + "/tasks")
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(task)
                .retrieve()
                .body(Task.class);
    }

    // public Task updateTask(Long id, Task task, String token) {
    // return restClient.put()
    // .uri(resourceUrl + "/tasks/{id}", id)
    // .headers(h -> h.setBearerAuth(token))
    // .contentType(MediaType.APPLICATION_JSON)
    // .body(task)
    // .retrieve()
    // .body(Task.class);
    // }

    public void patchTask(Long id, io.reflectoring.bff.dto.TaskPatchRequest request, String token) {
        restClient.patch()
                .uri(resourceUrl + "/tasks/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }

    public void deleteTask(Long id, String token) {
        restClient.delete()
                .uri(resourceUrl + "/tasks/{id}", id)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .toBodilessEntity();
    }

    public List<Task> getTasksByTaskListId(Long taskListId, String token) {
        return restClient.get()
                .uri(resourceUrl + "/tasklists/{id}/tasks", taskListId)
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
    }
}
