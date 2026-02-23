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
import io.reflectoring.bff.dto.TaskListDto;

@Service
public class BffTaskListService {

        private static final Logger log = LoggerFactory.getLogger(BffTaskListService.class);
        private final RestClient restClient;

        public BffTaskListService(RestClient.Builder builder, AppProperties appProperties) {
                this.restClient = builder.baseUrl(appProperties.getResourceServerUrl() + "/api").build();
        }

        public List<TaskListDto.Summary> getUserTaskLists(String token) {
                log.info("Fetching user task lists from Resource Server");
                List<TaskListDto.Summary> taskLists = restClient.get()
                                .uri("/tasklists") // Changed to relative URI
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(new ParameterizedTypeReference<List<TaskListDto.Summary>>() {
                                });

                if (taskLists == null) {
                        return List.of();
                }

                return taskLists;
        }

        public TaskListDto.Summary createTaskList(TaskListDto.Create taskListCreateRequest, String token) {
                log.info("Creating task list: {}", taskListCreateRequest);
                Objects.requireNonNull(taskListCreateRequest);
                Objects.requireNonNull(token);
                TaskListDto.Summary created = restClient.post()
                                .uri("/tasklists")
                                .headers(h -> h.setBearerAuth(token))
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(taskListCreateRequest)
                                .retrieve()
                                .body(TaskListDto.Summary.class);
                log.info("Created task list: {} from Resource Server", created);
                return created;
        }

        public void updateTaskList(Long id, TaskListDto.Update taskListUpdateRequest, String token) {
                log.info("Updating task list {} with request: {}", id, taskListUpdateRequest);
                restClient.patch()
                                .uri("/tasklists/{id}", id)
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
                                .uri("/tasklists/{id}", id)
                                .headers(h -> h.setBearerAuth(token))
                                .retrieve()
                                .toBodilessEntity();
                log.info("Successfully deleted task list {}", id);
        }
}
