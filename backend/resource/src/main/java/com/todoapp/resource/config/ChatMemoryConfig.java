package com.todoapp.resource.config;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * ChatMemory の設定クラス
 * JDBCを使用して会話履歴を永続化します
 */
@Configuration
public class ChatMemoryConfig {

    @Bean
    JdbcChatMemoryRepository jdbcChatMemoryRepository(JdbcTemplate jdbcTemplate,
            PlatformTransactionManager transactionManager, LowercaseChatMemoryDialect dialect) {
        
        return JdbcChatMemoryRepository.builder()
                .jdbcTemplate(jdbcTemplate)
                .transactionManager(transactionManager)
                .dialect(dialect)
                .build();
    }

    @Bean
    ChatMemory chatMemory(JdbcChatMemoryRepository jdbcChatMemoryRepository) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcChatMemoryRepository)
                .maxMessages(20)
                .build();
    }
}
