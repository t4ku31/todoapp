package io.reflectoring.bff.dto;

import java.time.LocalDate;

public class FocusSessionDto {

    public record AddRequest(
            Long taskId,
            LocalDate date,
            Integer durationSeconds) {
    }

    public record Response(
            Long id,
            Long taskId,
            LocalDate date,
            Integer durationSeconds) {
    }

    public record DailySummary(
            LocalDate date,
            Integer totalSeconds) {
    }

    public record TotalSummary(
            Integer totalSeconds) {
    }
}
