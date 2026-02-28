-- Rename the uppercase Chat Memory table created in V29 to lowercase
-- This ensures compatibility with Spring Boot's default physical naming strategy
-- and Spring AI's default table expectations, without causing case-sensitivity errors in production.

ALTER TABLE SPRING_AI_CHAT_MEMORY RENAME TO spring_ai_chat_memory;