package com.example.app1.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.model.Conversation;
import com.example.app1.service.AiConversationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
public class AiConversationController {

    private static final Logger log = LoggerFactory.getLogger(AiConversationController.class);
    private final AiConversationService conversationService;

    @GetMapping
    public ResponseEntity<List<Conversation>> getConversations(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[ConversationController] GET /api/ai/conversations - userId: {}", userId);
        List<Conversation> result = conversationService.getConversations(userId);
        log.info("[ConversationController] GET /api/ai/conversations - returning {} conversations", result.size());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Conversation> createConversation(@AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> body) {
        String userId = jwt.getSubject();
        String title = body.get("title");
        log.info("[ConversationController] POST /api/ai/conversations - userId: {}, title: {}", userId, title);
        Conversation result = conversationService.createConversation(userId, title);
        log.info("[ConversationController] POST /api/ai/conversations - created: id={}", result.getId());
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/title")
    public ResponseEntity<Void> updateTitle(@PathVariable String id, @RequestBody Map<String, String> body) {
        String title = body.get("title");
        log.info("[ConversationController] PATCH /api/ai/conversations/{}/title - newTitle: {}", id, title);
        conversationService.updateTitle(id, title);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String id) {
        log.info("[ConversationController] DELETE /api/ai/conversations/{}", id);
        conversationService.deleteConversation(id);
        return ResponseEntity.ok().build();
    }
}
