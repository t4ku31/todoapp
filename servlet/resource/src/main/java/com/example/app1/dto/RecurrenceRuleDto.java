package com.example.app1.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RecurrenceRuleDto(
        String frequency,
        List<String> daysOfWeek,
        String endDate,
        Integer occurrences) {
}
