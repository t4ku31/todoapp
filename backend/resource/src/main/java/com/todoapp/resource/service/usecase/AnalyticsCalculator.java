package com.todoapp.resource.service.usecase;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Component responsible for Analytics calculations.
 * Handles pure logic for efficiency scores, ratios, and balances.
 */
@Component
@RequiredArgsConstructor
public class AnalyticsCalculator {

    private static final double MAX_VOLUME_BALANCE_SCORE = 200.0;

    /**
     * Calculate Rhythm Quality based on completed vs total sessions.
     */
    public double calculateRhythmQuality(long completedCount, long totalCount) {
        if (totalCount > 0) {
            return (double) completedCount / totalCount * 100.0;
        }
        return 0.0;
    }

    /**
     * Calculate Volume Balance based on actual vs goal minutes.
     */
    public double calculateVolumeBalance(int actualMinutes, int goalMinutes) {
        if (goalMinutes > 0) {
            double achievement = (double) actualMinutes / goalMinutes * 100.0;
            if (achievement <= 100.0) {
                return achievement;
            } else {
                // Penalize overwork
                return Math.max(0, MAX_VOLUME_BALANCE_SCORE - achievement);
            }
        }
        return 0.0;
    }

    /**
     * Calculate final Efficiency Score.
     */
    public double calculateEfficiencyScore(double rhythmQuality, double volumeBalance) {
        return (rhythmQuality + volumeBalance) / 2.0;
    }

    /**
     * Calculate progress percentage.
     */
    public int calculateProgress(int focusMinutes, Integer estimatedMinutes, boolean isCompleted) {
        if (estimatedMinutes != null && estimatedMinutes > 0) {
            return (int) ((focusMinutes * 100.0) / estimatedMinutes);
        } else if (isCompleted) {
            return 100;
        }
        return 0;
    }

    /**
     * Calculate task completion rate.
     */
    public double calculateCompletionRate(int completed, int total) {
        return total > 0 ? (double) completed / total * 100 : 0;
    }

}
