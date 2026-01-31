package com.example.app1.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.app1.model.ChatMemoryEntity;
import com.example.app1.model.ChatMemoryId;

@Repository
public interface ChatMemoryRepository extends JpaRepository<ChatMemoryEntity, ChatMemoryId> {
    List<ChatMemoryEntity> findByConversationIdOrderByTimestampAsc(String conversationId);
}
