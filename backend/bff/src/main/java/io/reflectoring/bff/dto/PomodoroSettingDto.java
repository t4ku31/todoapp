package io.reflectoring.bff.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class PomodoroSettingDto {

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Schema(name = "PomodoroSettingResponse")
    public record Response(
            @Schema(description = "Focus duration in minutes", example = "25") Integer focusDuration,
            @Schema(description = "Short break duration in minutes", example = "5") Integer shortBreakDuration,
            @Schema(description = "Long break duration in minutes", example = "15") Integer longBreakDuration,
            @Schema(description = "Long break interval", example = "4") Integer longBreakInterval,
            @Schema(description = "Is long break enabled", example = "true") Boolean isLongBreakEnabled,
            @Schema(description = "Daily goal in minutes", example = "120") Integer dailyGoal,
            @Schema(description = "Auto advance to next phase", example = "false") Boolean autoAdvance,
            @Schema(description = "White noise type", example = "none") String whiteNoise,
            @Schema(description = "Volume level (0.0 - 1.0)", example = "0.5") Double volume) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(name = "PomodoroSettingRequest")
    public record Request(
            @Schema(description = "Focus duration in minutes", example = "25") Integer focusDuration,
            @Schema(description = "Short break duration in minutes", example = "5") Integer shortBreakDuration,
            @Schema(description = "Long break duration in minutes", example = "15") Integer longBreakDuration,
            @Schema(description = "Long break interval", example = "4") Integer longBreakInterval,
            @Schema(description = "Is long break enabled", example = "true") Boolean isLongBreakEnabled,
            @Schema(description = "Daily goal in minutes", example = "120") Integer dailyGoal,
            @Schema(description = "Auto advance to next phase", example = "false") Boolean autoAdvance,
            @Schema(description = "White noise type", example = "none") String whiteNoise,
            @Schema(description = "Volume level (0.0 - 1.0)", example = "0.5") Double volume) {
    }
}
