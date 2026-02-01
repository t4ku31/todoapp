package com.example.app1.service.domain;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.DailyGoalDto;
import com.example.app1.model.DailyGoal;
import com.example.app1.repository.DailyGoalRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing daily focus time goals.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyGoalService {

    private final DailyGoalRepository dailyGoalRepository;
    private final PomodoroSettingService pomodoroSettingService;

    // Default goal in minutes if none is set
    private static final int DEFAULT_GOAL_MINUTES = 360; // 6 hours

    /**
     * Get the goal for a specific date, or return default if not set.
     */
    public DailyGoalDto.Response getGoal(String userId, LocalDate date) {
        log.info("Getting goal for user {} on date {}", userId, date);

        return dailyGoalRepository.findByUserIdAndDate(userId, date)
                .map(this::mapToResponse)
                .orElseGet(() -> {
                    // Fetch user settings
                    Integer userDefaultGoal = pomodoroSettingService.getSettings(userId).getDailyGoal();
                    if (userDefaultGoal == null) {
                        userDefaultGoal = DEFAULT_GOAL_MINUTES;
                    }

                    // If requesting for today, create and save the goal to snapshot it
                    if (date.equals(LocalDate.now())) {
                        DailyGoal newGoal = DailyGoal.builder()
                                .userId(userId)
                                .date(date)
                                .goalMinutes(userDefaultGoal)
                                .build();
                        DailyGoal savedGoal = dailyGoalRepository.save(newGoal);
                        log.info("Created new daily goal snapshot for user {} on date {}: {} mins", userId, date,
                                userDefaultGoal);
                        return mapToResponse(savedGoal);
                    }

                    // For other dates (future/past), just return the value without saving
                    return new DailyGoalDto.Response(
                            null,
                            date,
                            userDefaultGoal,
                            null,
                            null);
                });
    }

    private DailyGoalDto.Response mapToResponse(DailyGoal goal) {
        return new DailyGoalDto.Response(
                goal.getId(),
                goal.getDate(),
                goal.getGoalMinutes(),
                goal.getCreatedAt(),
                goal.getUpdatedAt());
    }

    /**
     * Set the goal for a specific date.
     */
    @Transactional
    public DailyGoal setGoal(String userId, LocalDate date, DailyGoalDto.Request request) {
        log.info("Setting goal for user {} on date {} to {} minutes", userId, date, request.goalMinutes());

        DailyGoal goal = dailyGoalRepository.findByUserIdAndDate(userId, date)
                .orElseGet(() -> DailyGoal.builder()
                        .userId(userId)
                        .date(date)
                        .build());

        goal.setGoalMinutes(request.goalMinutes());
        DailyGoal saved = dailyGoalRepository.save(goal);

        log.info("Saved goal {} for user {} on date {}", saved);

        return saved;
    }

    /**
     * Get goals for a date range.
     */
    public List<DailyGoalDto.Response> getGoalsInRange(String userId, LocalDate startDate, LocalDate endDate) {
        log.info("Getting goals for user {} from {} to {}", userId, startDate, endDate);

        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> getGoal(userId, date))
                .toList();
    }
}
