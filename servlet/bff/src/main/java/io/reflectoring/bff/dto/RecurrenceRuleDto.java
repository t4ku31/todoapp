package io.reflectoring.bff.dto;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Strict recurrence rule definition (RFC 5545 compliant)")
public record RecurrenceRuleDto(
        @Schema(description = "Frequency", requiredMode = Schema.RequiredMode.REQUIRED) Frequency frequency,
        @Schema(description = "Interval (default: 1)") Integer interval,
        @Schema(description = "Days of week (for WEEKLY)") List<DayOfWeek> byDay,
        @Schema(description = "End date (exclusive with count)") LocalDate until,
        @Schema(description = "Count (exclusive with until)") Integer count,
        @Schema(description = "Occurrences (for CUSTOM)") List<LocalDate> occurs) {

    public enum Frequency {
        DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
    }
}
