package com.todoapp.resource.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.todoapp.resource.dto.AiTaskDto;
import com.todoapp.resource.dto.MessageDto;
import com.todoapp.resource.service.AiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI機能を提供するResource Serverコントローラー
 * 会話型タスク管理エンドポイントに統一
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

        private final AiService aiService;

        /**
         * シンプルなテキスト生成（デバッグ用）
         */
        @GetMapping("/generate")
        public String generation(@RequestParam String userInput) {
                return aiService.generate(userInput);
        }

        /**
         * 会話型タスク管理（統一エンドポイント）
         * 
         * ユーザーとの対話を通じてタスクの作成・編集・削除・サブタスク追加を行う。
         * 会話履歴がDBに保存され、文脈を考慮した応答が可能。
         * 初回メッセージ時は自動でタイトルを生成してDBを更新。
         * 
         * @param request 会話リクエスト（conversationId + prompt + currentTasks）
         * @param jwt     認証済みJWTトークン
         * @return 更新後のタスクリスト（プレビュー用モデル）
         */
        @PostMapping("/tasks/chat")
        public ResponseEntity<AiTaskDto.ChatResponse> chatForTasks(
                        @RequestBody AiTaskDto.ChatAnalysisRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                String userId = jwt.getSubject();

                // conversationIdが指定されていない場合はuserIdを使用
                String conversationId = request.conversationId() != null
                                ? request.conversationId()
                                : userId;

                log.info("[POST /api/ai/tasks/chat] Request by user: {}, conversationId: {}", userId, conversationId);
                log.info("[POST /api/ai/tasks/chat] Prompt: {}", request.prompt());
                log.info("[POST /api/ai/tasks/chat] Context tasks count: {}",
                                request.currentTasks() != null ? request.currentTasks().size() : 0);

                try {
                        // AiService.chat() 内で初回メッセージ判定 + タイトル自動生成を行う
                        AiService.ChatResult chatResult = aiService.chat(
                                        conversationId,
                                        request.prompt(),
                                        request.currentTasks(),
                                        request.projectTitle());

                        log.info("[POST /api/ai/tasks/chat] generatedTitle: {}", chatResult.generatedTitle());
                        return ResponseEntity.ok(AiTaskDto.ChatResponse.success(
                                        chatResult.result(),
                                        chatResult.generatedTitle()));
                } catch (Exception e) {
                        log.error("Failed to chat for tasks", e);
                        return ResponseEntity.badRequest()
                                        .body(AiTaskDto.ChatResponse.error("タスク管理の処理に失敗しました: " + e.getMessage()));
                }
        }

        @GetMapping("/messages")
        public ResponseEntity<List<MessageDto>> getMessages(@AuthenticationPrincipal Jwt jwt,
                        @RequestParam String conversationId) {
                String userId = jwt.getSubject();
                List<MessageDto> messages = aiService.getMessages(userId, conversationId);
                return ResponseEntity.ok(messages);
        }
}
