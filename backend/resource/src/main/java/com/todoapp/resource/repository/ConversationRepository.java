package com.todoapp.resource.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.NativeQuery;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.todoapp.resource.model.Conversation;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(String userId);

    @NativeQuery(value = "SELECT COUNT(*) FROM SPRING_AI_CHAT_MEMORY WHERE conversation_id = :conversationId")
    int countChatMessages(@Param("conversationId") String conversationId);
}
