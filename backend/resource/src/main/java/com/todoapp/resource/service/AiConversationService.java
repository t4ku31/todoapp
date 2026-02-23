package com.todoapp.resource.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoapp.resource.model.Conversation;
import com.todoapp.resource.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiConversationService {

    private static final Logger log = LoggerFactory.getLogger(AiConversationService.class);
    private final ConversationRepository conversationRepository;

    public List<Conversation> getConversations(String userId) {
        log.info("[ConversationService] getConversations - userId: {}", userId);
        List<Conversation> conversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        log.info("[ConversationService] getConversations - found {} conversations", conversations.size());
        return conversations;
    }

    /**
     * Create a new conversation, or return the most recent one if it has no
     * messages.
     * This prevents accumulating empty conversation records.
     */
    @Transactional
    public Conversation createConversation(String userId, String title) {
        log.info("[ConversationService] createConversation - checking for reusable empty conversation");

        // Get the most recent conversation for this user
        List<Conversation> existingConversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        if (!existingConversations.isEmpty()) {
            Conversation mostRecent = existingConversations.get(0);
            // Check if this conversation has any messages
            int messageCount = conversationRepository.countChatMessages(mostRecent.getId());

            if (messageCount == 0) {
                log.info("[ConversationService] createConversation - reusing empty conversation: id={}",
                        mostRecent.getId());
                // Update the title if provided and touch the timestamp
                if (title != null && !title.equals(mostRecent.getTitle())) {
                    mostRecent.setTitle(title);
                }
                mostRecent.setUpdatedAt(LocalDateTime.now());
                return conversationRepository.save(mostRecent);
            }
        }

        // Create new conversation
        String id = UUID.randomUUID().toString();
        log.info("[ConversationService] createConversation - generating new UUID: {}", id);

        Conversation conversation = Conversation.builder()
                .id(id)
                .userId(userId)
                .title(title != null ? title : "New Chat")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Conversation saved = conversationRepository.save(conversation);
        log.info("[ConversationService] createConversation - saved to DB: id={}, title={}", saved.getId(),
                saved.getTitle());
        return saved;
    }

    @Transactional
    public void updateTitle(String id, String title) {
        log.info("[ConversationService] updateTitle - id={}, newTitle={}", id, title);
        Optional<Conversation> opt = conversationRepository.findById(id);
        if (opt.isPresent()) {
            Conversation conversation = opt.get();
            conversation.setTitle(title);
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
            log.info("[ConversationService] updateTitle - updated successfully");
        } else {
            log.warn("[ConversationService] updateTitle - conversation not found: {}", id);
        }
    }

    @Transactional
    public void deleteConversation(String id) {
        log.info("[ConversationService] deleteConversation - id={}", id);
        conversationRepository.deleteById(id);
    }

    @Transactional
    public void touchConversation(String id) {
        log.info("[ConversationService] touchConversation - id={}", id);
        Optional<Conversation> opt = conversationRepository.findById(id);
        if (opt.isPresent()) {
            Conversation conversation = opt.get();
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
        }
    }
}
