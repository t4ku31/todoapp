package com.todoapp.resource.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import com.todoapp.resource.model.Conversation;
import com.todoapp.resource.repository.ChatMemoryEntityRepository;
import com.todoapp.resource.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiConversationService {

    private static final Logger log = LoggerFactory.getLogger(AiConversationService.class);
    private final ConversationRepository conversationRepository;
    private final ChatMemoryEntityRepository chatMemoryRepository;

    private void verifyOwnership(Conversation conversation, String userId) {
        if (!conversation.getUserId().equals(userId)) {
            log.warn("[Security] Unauthorized access attempt: user {} tried to access conversation {} owned by {}", 
                     userId, conversation.getId(), conversation.getUserId());
            throw new AccessDeniedException("この会話に対するアクセス権限がありません。");
        }
    }

    public List<Conversation> getConversations(String userId) {
        log.debug("[ConversationService] getConversations - userId: {}", userId);
        List<Conversation> conversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        log.debug("[ConversationService] getConversations - found {} conversations", conversations.size());
        return conversations;
    }

    /**
     * Create a new conversation, or return the most recent one if it has no
     * messages.
     * This prevents accumulating empty conversation records.
     */
    @Transactional
    public Conversation createConversation(String userId, String title) {
        log.debug("[ConversationService] createConversation - checking for reusable empty conversation");

        // Get the most recent conversation for this user
        List<Conversation> existingConversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        if (!existingConversations.isEmpty()) {
            Conversation mostRecent = existingConversations.get(0);
            
            boolean isEmptyChat = conversationRepository.countChatMessages(mostRecent.getId()) == 0;
            boolean hasDefaultTitle = "New Chat".equals(mostRecent.getTitle());

            // 再利用する条件: メッセージ数が0件、かつタイトルが初期状態("New Chat")のままであること
            // (ユーザーが手動でタイトルを変更済みの場合は再利用せず、そのまま新しい会話を作成する)
            if (isEmptyChat && hasDefaultTitle) {
                log.debug("[ConversationService] createConversation - reusing empty conversation: id={}", mostRecent.getId());
                
                // 新しく指定されたタイトルが "New Chat" 以外なら更新する
                if (title != null && !title.equals(mostRecent.getTitle())) {
                    mostRecent.setTitle(title);
                }
                
                mostRecent.setUpdatedAt(LocalDateTime.now());
                return conversationRepository.save(mostRecent);
            }
        }

        // Create new conversation
        String id = UUID.randomUUID().toString();
        log.debug("[ConversationService] createConversation - generating new UUID: {}", id);

        Conversation conversation = Conversation.builder()
                .id(id)
                .userId(userId)
                .title(title != null ? title : "New Chat")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Conversation saved = conversationRepository.save(conversation);
        log.debug("[ConversationService] createConversation - saved to DB: id={}, title={}", saved.getId(),
                saved.getTitle());
        return saved;
    }

    @Transactional
    public void updateTitle(String id, String title, String userId) {
        log.debug("[ConversationService] updateTitle - id={}, newTitle={}, userId={}", id, title, userId);
        Optional<Conversation> opt = conversationRepository.findById(id);
        if (opt.isPresent()) {
            Conversation conversation = opt.get();
            verifyOwnership(conversation, userId);
            
            conversation.setTitle(title);
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
            log.debug("[ConversationService] updateTitle - updated successfully");
        } else {
            log.warn("[ConversationService] updateTitle - conversation not found: {}", id);
        }
    }

    @Transactional
    public void deleteConversation(String id, String userId) {
        log.debug("[ConversationService] deleteConversation - id={}, userId={}", id, userId);
        conversationRepository.findById(id).ifPresent(conversation -> {
            verifyOwnership(conversation, userId);
            
            // カスケード削除：関連する全メッセージ履歴を削除
            chatMemoryRepository.deleteByConversationId(id);
            log.debug("[ConversationService] deleted chat memory for conversation {}", id);
            
            conversationRepository.deleteById(id);
        });
    }

    @Transactional
    public void touchConversation(String id, String userId) {
        log.debug("[ConversationService] touchConversation - id={}, userId={}", id, userId);
        Optional<Conversation> opt = conversationRepository.findById(id);
        if (opt.isPresent()) {
            Conversation conversation = opt.get();
            verifyOwnership(conversation, userId);
            
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
        }
    }
}
