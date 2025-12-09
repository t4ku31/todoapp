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
import io.reflectoring.bff.dto.TaskListCreateRequest;
import io.reflectoring.bff.dto.TaskListResponse;
import io.reflectoring.bff.dto.TaskListUpdateRequest;
import io.reflectoring.bff.dto.TaskResponse;
import io.reflectoring.bff.model.TaskList;

@Service
public class BffTaskListService {

        private static final Logger log = LoggerFactory.getLogger(BffTaskListService.class);
        private final RestClient restClient;
        private final String resourceUrl;

        public BffTaskListService(RestClient.Builder builder, AppProperties appProperties) {
                this.restClient = builder.baseUrl(appProperties.getResourceServerUrl() + "/api").build();
                this.resourceUrl = appProperties.getResourceServerUrl() + "/api"; // This line is kept for now, as the
                // instruction didn't explicitly remove the
                // field or all its usages.
        }

        public List<TaskListResponse> getUserTaskLists(String token) {
                log.info("Fetching user task lists from Resource Server");
                List<TaskList> taskLists = restClient.get()
                                .uri("/tasklists") // Changed to relative URI
                                .headers(h -> h.setBearerAuth(token))
                                .retrieve()
                                .body(new ParameterizedTypeReference<List<TaskList>>() {
                                });

                if (taskLists == null) {
                        return List.of();
                }

                return taskLists.stream()
                                .map(this::toTaskListResponse)
                                .toList();
        }

        public TaskListResponse createTaskList(TaskListCreateRequest taskListCreateRequest, String token) {
                log.info("Creating task list: {}", taskListCreateRequest);
                Objects.requireNonNull(taskListCreateRequest);
                Objects.requireNonNull(token);
                TaskList created = restClient.post()
                                .uri(resourceUrl + "/tasklists")
                                .headers(h -> h.setBearerAuth(token))
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(taskListCreateRequest)
                                .retrieve()
                                .body(TaskList.class);
                log.info("Created task list: {} from Resource Server", created);
                return toTaskListResponse(created);
        }

        private TaskListResponse toTaskListResponse(TaskList taskList) {
                if (taskList == null) {
                        return null;
                }
                return TaskListResponse.builder()
                                .id(taskList.id())
                                .title(taskList.title())
                                .dueDate(taskList.dueDate())
                                .isCompleted(taskList.isCompleted())
                                .tasks(taskList.tasks() != null ? taskList.tasks().stream()
                                                .map(task -> TaskResponse.builder()
                                                                .id(task.id())
                                                                .title(task.title())
                                                                .status(task.status() != null ? task.status().toString()
                                                                                : null)
                                                                .taskListId(task.taskListId())
                                                                .build())
                                                .toList() : null)
                                .build();
        }

        public void updateTaskList(Long id, TaskListUpdateRequest taskListUpdateRequest, String token) {
                log.info("Updating task list {} with request: {}", id, taskListUpdateRequest);
                restClient.patch()
                                .uri(resourceUrl + "/tasklists/{id}", id)
                                .headers(h -> h.setBearerAuth(token))
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(taskListUpdateRequest)
                                .retrieve()
                                .toBodilessEntity();
                log.info("Successfully updated task list {}", id);
        }

        public void deleteTaskList(Long id, String token) {
                log.info("Deleting task list {}", id);
                restClient.delete()
                                .uri(resourceUrl + "/tasklists/{id}", id)
                                .headers(h -> h.setBearerAuth(token))
                                .retrieve()
                                .toBodilessEntity();
                log.info("Successfully deleted task list {}", id);
        }
}
