package com.todoapp.resource.service.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoapp.resource.dto.DailyGoalDto;
import com.todoapp.resource.model.DailyGoal;
import com.todoapp.resource.repository.DailyGoalRepository;

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
                            userDefaultGoal);
                });
    }

    private DailyGoalDto.Response mapToResponse(DailyGoal goal) {
        return new DailyGoalDto.Response(
                goal.getId(),
                goal.getDate(),
                goal.getGoalMinutes());
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
     * Optimized to use batch fetch.
     */
    public List<DailyGoalDto.Response> getGoalsInRange(String userId, LocalDate startDate, LocalDate endDate) {
        log.info("Getting goals for user {} from {} to {}", userId, startDate, endDate);

        // Batch fetch existing goals
        List<DailyGoal> existingGoals = dailyGoalRepository.findByUserIdAndDateBetweenOrderByDateAsc(userId, startDate,
                endDate);

        // Map to date for O(1) lookup
        var goalMap = existingGoals.stream()
                .collect(Collectors.toMap(DailyGoal::getDate, goal -> goal));

        // Fetch user default settings once
        Integer userDefaultGoal = pomodoroSettingService.getSettings(userId).getDailyGoal();
        int defaultGoal = (userDefaultGoal != null) ? userDefaultGoal : DEFAULT_GOAL_MINUTES;

        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    if (goalMap.containsKey(date)) {
                        return mapToResponse(goalMap.get(date));
                    }

                    // If no goal exists for the date, use the default
                    int targetGoal = defaultGoal;

                    // If requesting for today and no goal exists, create and save snapshot
                    if (date.equals(LocalDate.now())) {
                        DailyGoal newGoal = DailyGoal.builder()
                                .userId(userId)
                                .date(date)
                                .goalMinutes(targetGoal)
                                .build();
                        DailyGoal savedGoal = dailyGoalRepository.save(newGoal);
                        log.info("Created new daily goal snapshot for user {} on date {}: {} mins", userId, date,
                                targetGoal);
                        // Return response without timestamps
                        return new DailyGoalDto.Response(
                                savedGoal.getId(),
                                savedGoal.getDate(),
                                savedGoal.getGoalMinutes());
                    }

                    // For other dates (future/past), return transient default response
                    return new DailyGoalDto.Response(
                            null,
                            date,
                            targetGoal);
                })
                .toList();
    }
}
