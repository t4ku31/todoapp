package com.todoapp.resource.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "SPRING_AI_CHAT_MEMORY")
@IdClass(ChatMemoryId.class)
public class ChatMemoryEntity {

    @Id
    @Column(name = "conversation_id")
    private String conversationId;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private MessageType type;

    @Id
    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    public enum MessageType {
        USER,
        ASSISTANT,
        SYSTEM,
        TOOL
    }
}
