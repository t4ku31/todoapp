package com.todoapp.resource.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.todoapp.resource.model.ChatMemoryEntity;
import com.todoapp.resource.model.ChatMemoryId;

@Repository
public interface ChatMemoryRepository extends JpaRepository<ChatMemoryEntity, ChatMemoryId> {
    List<ChatMemoryEntity> findByConversationIdOrderByTimestampAsc(String conversationId);
}
