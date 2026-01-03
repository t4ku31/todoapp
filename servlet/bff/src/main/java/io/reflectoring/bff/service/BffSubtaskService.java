package io.reflectoring.bff.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.SubtaskDto;

@Service
public class BffSubtaskService {

    private static final Logger log = LoggerFactory.getLogger(BffSubtaskService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffSubtaskService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
    }

    public SubtaskDto.Summary createSubtask(Long taskId, SubtaskDto.Create request, String token) {
        log.info("Creating subtask for task {} via Resource Server", taskId);
        // Re-construct the request with the taskId from the path
        SubtaskDto.Create requestWithTaskId = new SubtaskDto.Create(taskId, request.title(), request.description());

        SubtaskDto.Summary created = restClient.post()
                .uri(resourceUrl + "/tasks/{taskId}/subtasks", taskId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(requestWithTaskId)
                .retrieve()
                .body(SubtaskDto.Summary.class);
        log.info("Successfully created subtask: {}", created);
        return created;
    }

    public SubtaskDto.Summary updateSubtask(Long id, SubtaskDto.Update request, String token) {
        log.info("Updating subtask {} via Resource Server", id);
        SubtaskDto.Summary updated = restClient.patch()
                .uri(resourceUrl + "/subtasks/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(request)
                .retrieve()
                .body(SubtaskDto.Summary.class);
        log.info("Successfully updated subtask: {}", updated);
        return updated;
    }

    public void deleteSubtask(Long id, String token) {
        log.info("Deleting subtask {} via Resource Server", id);
        restClient.delete()
                .uri(resourceUrl + "/subtasks/{id}", id)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully deleted subtask {}", id);
    }
}
