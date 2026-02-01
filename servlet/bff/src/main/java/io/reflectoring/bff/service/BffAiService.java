package io.reflectoring.bff.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.AiTaskDto;

/**
 * AI機能のBFFサービス
 * Resource Serverへのプロキシ処理を担当
 * 会話型タスク管理に統一
 */
@Service
public class BffAiService {

        private static final Logger log = LoggerFactory.getLogger(BffAiService.class);
        private final RestClient restClient;
        private final String resourceUrl;

        public BffAiService(RestClient.Builder builder, AppProperties appProperties) {
                this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
                this.resourceUrl = appProperties.getResourceServerUrl() + "/api/ai";
        }

        /**
         * 会話型タスク管理
         * Resource Serverの /api/ai/tasks/chat をプロキシする
         */
        public AiTaskDto.ChatResponse chat(AiTaskDto.ChatAnalysisRequest request, String token) {
                log.info("AI Chat - prompt: {}, currentTasksCount: {}",
                                request.prompt(),
                                request.currentTasks() != null ? request.currentTasks().size() : 0);

                AiTaskDto.ChatResponse response = restClient.post()
                                .uri(resourceUrl + "/tasks/chat")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .body(request)
                                .retrieve()
                                .body(AiTaskDto.ChatResponse.class);

                int taskCount = 0;
                String message = null;
                if (response != null && response.result() != null && response.result().tasks() != null) {
                        taskCount = response.result().tasks().size();
                        message = response.message();
                }
                log.info("AI Chat response - tasks: {}, message: {}", taskCount, message);
                return response;
        }

        public java.util.List<io.reflectoring.bff.dto.MessageDto> getMessages(String token, String conversationId) {
                log.info("[BffAiService] getMessages - calling Resource Server");
                java.util.List<io.reflectoring.bff.dto.MessageDto> result = restClient.get()
                                .uri(resourceUrl + "/messages?conversationId=" + conversationId)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(new org.springframework.core.ParameterizedTypeReference<java.util.List<io.reflectoring.bff.dto.MessageDto>>() {
                                });
                log.info("[BffAiService] getMessages - received {} messages", result != null ? result.size() : 0);
                return result;
        }

        public java.util.List<io.reflectoring.bff.dto.ConversationDto> getConversations(String token) {
                log.info("[BffAiService] getConversations - calling Resource Server");
                java.util.List<io.reflectoring.bff.dto.ConversationDto> result = restClient.get()
                                .uri(resourceUrl + "/conversations")
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .body(new org.springframework.core.ParameterizedTypeReference<java.util.List<io.reflectoring.bff.dto.ConversationDto>>() {
                                });
                log.info("[BffAiService] getConversations - received {} conversations",
                                result != null ? result.size() : 0);
                return result;
        }

        public io.reflectoring.bff.dto.ConversationDto createConversation(java.util.Map<String, String> body,
                        String token) {
                log.info("[BffAiService] createConversation - calling Resource Server with title: {}",
                                body.get("title"));
                io.reflectoring.bff.dto.ConversationDto result = restClient.post()
                                .uri(resourceUrl + "/conversations")
                                .header("Authorization", "Bearer " + token)
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .body(body)
                                .retrieve()
                                .body(io.reflectoring.bff.dto.ConversationDto.class);
                log.info("[BffAiService] createConversation - created: id={}",
                                result != null ? result.getId() : "null");
                return result;
        }

        public void updateConversationTitle(String id, java.util.Map<String, String> body, String token) {
                log.info("[BffAiService] updateConversationTitle - id: {}, newTitle: {}", id, body.get("title"));
                restClient.patch()
                                .uri(resourceUrl + "/conversations/" + id + "/title")
                                .header("Authorization", "Bearer " + token)
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .body(body)
                                .retrieve()
                                .toBodilessEntity();
                log.info("[BffAiService] updateConversationTitle - completed");
        }

        public void deleteConversation(String id, String token) {
                log.info("[BffAiService] deleteConversation - calling Resource Server for id: {}", id);
                restClient.delete()
                                .uri(resourceUrl + "/conversations/" + id)
                                .header("Authorization", "Bearer " + token)
                                .retrieve()
                                .toBodilessEntity();
                log.info("[BffAiService] deleteConversation - completed");
        }
}
