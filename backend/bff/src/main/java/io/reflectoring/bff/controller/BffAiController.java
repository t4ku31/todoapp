package io.reflectoring.bff.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;

import io.reflectoring.bff.dto.AiTaskDto;
import io.reflectoring.bff.service.BffAiService;

/**
 * AI機能を提供するBFFコントローラー
 * 会話型タスク管理エンドポイントに統一
 */
@RestController
@RequestMapping("/api/ai")
public class BffAiController {

        private static final Logger log = LoggerFactory.getLogger(BffAiController.class);
        private final BffAiService aiService;

        public BffAiController(BffAiService aiService) {
                this.aiService = aiService;
        }

        /**
         * 会話型タスク管理（統一エンドポイント）
         * 
         * ユーザーとの対話を通じてタスクの作成・編集・削除・サブタスク追加を行う。
         * Resource Serverの /api/ai/tasks/chat をプロキシする。
         * 
         * @param request 会話リクエスト（conversationId + prompt + currentTasks）
         * @param client  OAuth2認証クライアント
         * @return 更新後のタスクリスト
         */
        @PostMapping("/tasks/chat")
        public ResponseEntity<AiTaskDto.ChatResponse> chat(
                        @RequestBody AiTaskDto.ChatAnalysisRequest request,
                        @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
                log.info("[POST /api/ai/tasks/chat] Request by user: {}", client.getPrincipalName());
                log.info("[POST /api/ai/tasks/chat] Prompt: {}", request.prompt());
                log.info("[POST /api/ai/tasks/chat] Current tasks count: {}",
                                request.currentTasks() != null ? request.currentTasks().size() : 0);

                try {
                        AiTaskDto.ChatResponse response = aiService.chat(
                                        request,
                                        client.getAccessToken().getTokenValue());

                        log.info("[POST /api/ai/tasks/chat] Response: {}", response);
                        return ResponseEntity.ok(response);
                } catch (RestClientResponseException e) {
                        log.error("[POST /api/ai/tasks/chat] Error: {}", e.getMessage());
                        return ResponseEntity.status(e.getStatusCode())
                                        .body(new AiTaskDto.ChatResponse(
                                                        "タスク管理の処理に失敗しました: " + e.getMessage(),
                                                        null, false, null));
                } catch (Exception e) {
                        log.error("[POST /api/ai/tasks/chat] Error: {}", e.getMessage());
                        return ResponseEntity.internalServerError()
                                        .body(new AiTaskDto.ChatResponse(
                                                        "タスク管理の処理に失敗しました: " + e.getMessage(),
                                                        null, false, null));
                }
        }

        /**
         * ツール対応の会話型タスク管理
         * 
         * AIが自然言語を解釈し、直接タスクの作成・更新・削除を実行する。
         * 
         * @param request 会話リクエスト
         * @param client  OAuth2認証クライアント
         * @return AIの応答メッセージ（実行結果含む）
         */

        @org.springframework.web.bind.annotation.GetMapping("/messages")
        public ResponseEntity<java.util.List<io.reflectoring.bff.dto.MessageDto>> getMessages(
                        @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client,
                        @RequestParam String conversationId) {
                log.info("[BffAiController] GET /api/ai/messages - user: {}", client.getPrincipalName());
                String token = client.getAccessToken().getTokenValue();
                java.util.List<io.reflectoring.bff.dto.MessageDto> result = aiService.getMessages(token,
                                conversationId);
                log.info("[BffAiController] GET /api/ai/messages - returning {} messages",
                                result != null ? result.size() : 0);
                return ResponseEntity.ok(result);
        }

        @org.springframework.web.bind.annotation.GetMapping("/conversations")
        public ResponseEntity<java.util.List<io.reflectoring.bff.dto.ConversationDto>> getConversations(
                        @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
                log.info("[BffAiController] GET /api/ai/conversations - user: {}", client.getPrincipalName());
                String token = client.getAccessToken().getTokenValue();
                java.util.List<io.reflectoring.bff.dto.ConversationDto> result = aiService.getConversations(token);
                log.info("[BffAiController] GET /api/ai/conversations - returning {} conversations",
                                result != null ? result.size() : 0);
                return ResponseEntity.ok(result);
        }

        @org.springframework.web.bind.annotation.PostMapping("/conversations")
        public ResponseEntity<io.reflectoring.bff.dto.ConversationDto> createConversation(
                        @RequestBody java.util.Map<String, String> body,
                        @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
                log.info("[BffAiController] POST /api/ai/conversations - user: {}, title: {}",
                                client.getPrincipalName(), body.get("title"));
                String token = client.getAccessToken().getTokenValue();
                io.reflectoring.bff.dto.ConversationDto result = aiService.createConversation(body, token);
                log.info("[BffAiController] POST /api/ai/conversations - created: id={}",
                                result != null ? result.getId() : "null");
                return ResponseEntity.ok(result);
        }

        @org.springframework.web.bind.annotation.PatchMapping("/conversations/{id}/title")
        public ResponseEntity<Void> updateConversationTitle(
                        @org.springframework.web.bind.annotation.PathVariable String id,
                        @RequestBody java.util.Map<String, String> body,
                        @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
                log.info("[BffAiController] PATCH /api/ai/conversations/{}/title - user: {}, newTitle: {}",
                                id, client.getPrincipalName(), body.get("title"));
                String token = client.getAccessToken().getTokenValue();
                aiService.updateConversationTitle(id, body, token);
                return ResponseEntity.ok().build();
        }

        @org.springframework.web.bind.annotation.DeleteMapping("/conversations/{id}")
        public ResponseEntity<Void> deleteConversation(
                        @org.springframework.web.bind.annotation.PathVariable String id,
                        @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
                log.info("[BffAiController] DELETE /api/ai/conversations/{} - user: {}", id, client.getPrincipalName());
                String token = client.getAccessToken().getTokenValue();
                aiService.deleteConversation(id, token);
                return ResponseEntity.ok().build();
        }
}
