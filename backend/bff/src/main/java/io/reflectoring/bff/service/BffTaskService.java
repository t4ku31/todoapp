package io.reflectoring.bff.service;

import java.util.List;

import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.TaskDto;

@Service
public class BffTaskService {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(BffTaskService.class);
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

    public void restoreTask(Long id, String token) {
        log.info("Restoring task {}", id);
        restClient.post()
                .uri(resourceUrl + "/tasks/{id}/restore", id)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully restored task {}", id);
    }

    public void deleteTaskPermanently(Long id, String token) {
        log.info("Permanently deleting task {}", id);
        restClient.delete()
                .uri(resourceUrl + "/tasks/{id}/permanent", id)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully permanently deleted task {}", id);
    }

    public List<TaskDto.Summary> getTrashTasks(String token) {
        log.info("Fetching trash tasks from Resource Server");
        List<TaskDto.Summary> tasks = restClient.get()
                .uri(resourceUrl + "/tasks/trash")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<TaskDto.Summary>>() {
                });
        if (tasks == null) {
            return List.of();
        }
        log.info("Successfully fetched {} trash tasks", tasks.size());
        return tasks;
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

    public io.reflectoring.bff.dto.TaskDto.Stats getTaskStats(java.time.LocalDate startDate,
            java.time.LocalDate endDate, String token) {
        log.info("Fetching task stats for range: {} to {}", startDate, endDate);
        io.reflectoring.bff.dto.TaskDto.Stats stats = restClient.get()
                .uri(resourceUrl + "/tasks/stats?startDate={startDate}&endDate={endDate}", startDate, endDate)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(io.reflectoring.bff.dto.TaskDto.Stats.class);
        log.info("Task stats: {} / {} completed",
                stats != null ? stats.completedCount() : 0,
                stats != null ? stats.totalCount() : 0);
        return stats;
    }

    public TaskDto.BulkOperationResult bulkUpdateTasks(TaskDto.BulkUpdate request, String token) {
        log.info("Bulk updating {} tasks", request.taskIds() != null ? request.taskIds().size() : 0);
        TaskDto.BulkOperationResult result = restClient.patch()
                .uri(resourceUrl + "/tasks/bulk")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange((req, res) -> {
                    log.info("Bulk update response status: {}", res.getStatusCode());
                    if (res.getStatusCode().is2xxSuccessful() ||
                            res.getStatusCode().value() == 207 ||
                            res.getStatusCode().value() == 422) {
                        return new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter()
                                .getObjectMapper()
                                .readValue(res.getBody(), TaskDto.BulkOperationResult.class);
                    }
                    throw new org.springframework.web.client.RestClientResponseException(
                            "Unexpected status: " + res.getStatusCode(),
                            res.getStatusCode().value(),
                            res.getStatusText(),
                            res.getHeaders(),
                            res.getBody().readAllBytes(),
                            null);
                });
        log.info("Bulk update result: {} succeeded, {} failed",
                result != null ? result.successCount() : 0,
                result != null ? result.failedCount() : 0);
        return result;
    }

    public TaskDto.BulkOperationResult bulkDeleteTasks(TaskDto.BulkDelete request, String token) {
        log.info("Bulk deleting {} tasks", request.taskIds() != null ? request.taskIds().size() : 0);
        TaskDto.BulkOperationResult result = restClient.method(org.springframework.http.HttpMethod.DELETE)
                .uri(resourceUrl + "/tasks/bulk")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange((req, res) -> {
                    log.info("Bulk delete response status: {}", res.getStatusCode());
                    if (res.getStatusCode().is2xxSuccessful() ||
                            res.getStatusCode().value() == 207 ||
                            res.getStatusCode().value() == 422) {
                        return new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter()
                                .getObjectMapper()
                                .readValue(res.getBody(), TaskDto.BulkOperationResult.class);
                    }
                    throw new org.springframework.web.client.RestClientResponseException(
                            "Unexpected status: " + res.getStatusCode(),
                            res.getStatusCode().value(),
                            res.getStatusText(),
                            res.getHeaders(),
                            res.getBody().readAllBytes(),
                            null);
                });
        log.info("Bulk delete result: {} succeeded, {} failed",
                result != null ? result.successCount() : 0,
                result != null ? result.failedCount() : 0);
        return result;
    }

    public TaskDto.BulkCreateResult bulkCreateTasks(TaskDto.BulkCreate request, String token) {
        log.info("Bulk creating {} tasks", request.tasks() != null ? request.tasks().size() : 0);
        TaskDto.BulkCreateResult result = restClient.post()
                .uri(resourceUrl + "/tasks/batch")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(TaskDto.BulkCreateResult.class);
        log.info("Bulk create result: {} tasks created", result != null ? result.successCount() : 0);
        return result;
    }

    public TaskDto.SyncResult syncTasks(
            List<TaskDto.SyncTaskDto> tasks, String token) {
        log.info("Syncing {} tasks via Resource Server", tasks != null ? tasks.size() : 0);
        TaskDto.SyncResult result = restClient.post()
                .uri(resourceUrl + "/tasks/sync")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(tasks)
                .retrieve()
                .body(io.reflectoring.bff.dto.TaskDto.SyncResult.class);
        log.info("Sync result: {}", result);
        return result;
    }
}
