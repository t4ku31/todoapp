package com.todoapp.resource.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTOs for DailyGoal API.
 */
public class DailyGoalDto {

        /**
         * Request DTO for creating/updating a daily goal.
         */
        public record Request(
                        @NotNull(message = "Goal minutes is required") @Min(value = 1, message = "Goal must be at least 1 minute") Integer goalMinutes) {
        }

        /**
         * Response DTO for daily goal.
         */
        public record Response(
                        Long id,
                        LocalDate date,
                        Integer goalMinutes) {
        }

}
