package com.todoapp.resource.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.todoapp.resource.model.DailyGoal;

/**
 * Repository for DailyGoal entity.
 */
@Repository
public interface DailyGoalRepository extends JpaRepository<DailyGoal, Long> {

    /**
     * Find a daily goal by user ID and date.
     */
    Optional<DailyGoal> findByUserIdAndDate(String userId, LocalDate date);

    /**
     * Find all daily goals for a user within a date range.
     */
    List<DailyGoal> findByUserIdAndDateBetweenOrderByDateAsc(String userId, LocalDate startDate, LocalDate endDate);

    /**
     * Check if a goal exists for a user on a specific date.
     */
    boolean existsByUserIdAndDate(String userId, LocalDate date);
}
