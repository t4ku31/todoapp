package io.reflectoring.bff.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

public class SubtaskDto {

        @JsonInclude(JsonInclude.Include.NON_NULL)
        public record Create(Long taskId, String title, String description, Boolean isCompleted, Integer orderIndex) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        public record Update(String title, String description, Boolean isCompleted, Integer orderIndex) {
        }

        public record Summary(
                        Long id,
                        Long taskId,
                        String title,
                        String description,
                        Boolean isCompleted,
                        Integer orderIndex) {
        }

        public record Entity(
                        Long id,
                        String title,
                        String description,
                        Boolean isCompleted,
                        Integer orderIndex,
                        java.time.LocalDateTime createdAt,
                        java.time.LocalDateTime updatedAt) {
        }
}
