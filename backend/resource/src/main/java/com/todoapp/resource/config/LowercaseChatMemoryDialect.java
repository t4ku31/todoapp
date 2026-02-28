package com.todoapp.resource.config;

import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepositoryDialect;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class LowercaseChatMemoryDialect implements JdbcChatMemoryRepositoryDialect {

    @Override
    public String getSelectMessagesSql() {
        log.info("[CustomDialect] getSelectMessagesSql is called!");
        return "SELECT content, type FROM spring_ai_chat_memory WHERE conversation_id = ? ORDER BY timestamp";
    }

    @Override
    public String getInsertMessageSql() {
        log.info("[CustomDialect] getInsertMessageSql is called!");
        return "INSERT INTO spring_ai_chat_memory (conversation_id, content, type, timestamp) VALUES (?, ?, ?, ?)";
    }

    @Override
    public String getSelectConversationIdsSql() {
        log.info("[CustomDialect] getSelectConversationIdsSql is called!");
        return "SELECT DISTINCT conversation_id FROM spring_ai_chat_memory";
    }

    @Override
    public String getDeleteMessagesSql() {
        log.info("[CustomDialect] getDeleteMessagesSql is called!");
        return "DELETE FROM spring_ai_chat_memory WHERE conversation_id = ?";
    }
}
