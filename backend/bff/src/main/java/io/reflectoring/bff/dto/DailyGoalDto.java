package io.reflectoring.bff.dto;

import java.time.LocalDate;

/**
 * DTOs for DailyGoal API.
 */
public class DailyGoalDto {

        /**
         * Request DTO for creating/updating a daily goal.
         */
        public record Request(Integer goalMinutes) {
        }

        /**
         * Response DTO for daily goal.
         */
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
        public record Response(
                        Long id,
                        LocalDate date,
                        Integer goalMinutes) {
        }

        /**
         * Response DTO for daily goal with actual focus time.
         */
        public record WithActual(
                        LocalDate date,
                        Integer goalMinutes,
                        Integer actualMinutes,
                        Double percentageComplete) {
        }
}
