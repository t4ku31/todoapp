package com.todoapp.resource.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.todoapp.resource.model.FocusSession;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {

        /**
         * Get total actual duration for a user on a specific date (filtered by FOCUS
         * type)
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) / 60 FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :startOfDay AND :endOfDay AND fs.sessionType = 'FOCUS'")
        Integer getTotalFocusMinutesByUserIdAndDateRange(@Param("userId") String userId,
                        @Param("startOfDay") LocalDateTime startOfDay,
                        @Param("endOfDay") LocalDateTime endOfDay);

        /**
         * Get total actual duration for a user (all time, filtered by FOCUS type)
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.userId = :userId AND fs.sessionType = 'FOCUS'")
        Integer getTotalFocusDurationByUserId(@Param("userId") String userId);

        /**
         * Get total actual duration for a user between two dates (inclusive, filtered
         * by FOCUS type)
         * Used for weekly summaries
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end AND fs.sessionType = 'FOCUS'")
        Integer getTotalFocusDurationByUserIdAndDateRangeBetween(
                        @Param("userId") String userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // --- Efficiency Score Queries ---

        /**
         * Count completed sessions in range (FOCUS type only)
         */
        @Query("SELECT COUNT(fs) FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end AND fs.status = 'COMPLETED' AND fs.sessionType = 'FOCUS'")
        Long countCompletedSessions(@Param("userId") String userId, @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Count total sessions in range (completed + interrupted, FOCUS type only)
         */
        @Query("SELECT COUNT(fs) FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end AND fs.sessionType = 'FOCUS'")
        Long countTotalSessions(@Param("userId") String userId, @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Sum actual duration for a list of task IDs.
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.task.id IN :taskIds AND fs.sessionType = 'FOCUS'")
        Integer sumActualDurationByTaskIds(@Param("taskIds") List<Long> taskIds);

        /**
         * Sum actual duration for a single task ID (all time).
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.task.id = :taskId AND fs.sessionType = 'FOCUS'")
        Integer getTotalDurationByTaskId(@Param("taskId") Long taskId);

        /**
         * Find all focus sessions for a user in a date range with task eagerly loaded.
         */
        @Query("SELECT fs FROM FocusSession fs LEFT JOIN FETCH fs.task t LEFT JOIN FETCH t.category WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end AND fs.sessionType = 'FOCUS'")
        List<FocusSession> findByUserIdAndStartedAtBetweenWithTask(
                        @Param("userId") String userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Sum total actual duration for completed tasks with estimation in a range.
         * Join with Task to filter by status and estimation.
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs " +
                        "JOIN fs.task t " +
                        "WHERE fs.userId = :userId " +
                        "AND fs.sessionType = 'FOCUS' " +
                        "AND t.status = TaskStatus.COMPLETED " +
                        "AND t.estimatedPomodoros IS NOT NULL " +
                        "AND t.scheduledStartAt >= :start AND t.scheduledStartAt < :end")
        Integer sumActualDurationForCompletedTasksWithEstimation(
                        @Param("userId") String userId,
                        @Param("start") OffsetDateTime start,
                        @Param("end") OffsetDateTime end);

        /**
         * Projection for category focus time.
         */
        public interface CategoryFocusTimeProjection {
                Long getCategoryId();

                String getCategoryName();

                String getCategoryColor();

                Integer getMinutes();
        }

        /**
         * Projection for daily focus time.
         */
        public interface DailyFocusProjection {
                LocalDate getDate();

                Long getMinutes();
        }

        /**
         * Projection for daily category focus time.
         */
        public interface DailyCategoryFocusProjection {
                LocalDate getDate();

                Long getCategoryId();

                String getCategoryName();

                String getCategoryColor();

                Integer getMinutes();
        }

        /**
         * Aggregate focus time by category for a user in a range.
         */
        @Query("SELECT t.category.id as categoryId, " +
                        "COALESCE(cat.name, 'Uncategorized') as categoryName, " +
                        "COALESCE(cat.color, '#94a3b8') as categoryColor, " +
                        "CAST(SUM(fs.actualDuration) / 60 AS int) as minutes " +
                        "FROM FocusSession fs " +
                        "LEFT JOIN fs.task t " +
                        "LEFT JOIN t.category cat " +
                        "WHERE fs.userId = :userId " +
                        "AND fs.sessionType = 'FOCUS' " +
                        "AND fs.startedAt >= :start AND fs.startedAt < :end " +
                        "GROUP BY t.category.id, cat.name, cat.color")
        List<CategoryFocusTimeProjection> aggregateCategoryFocusTime(
                        @Param("userId") String userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Count unique days with focus sessions in range.
         */
        @Query("SELECT COUNT(DISTINCT CAST(fs.startedAt AS date)) FROM FocusSession fs " +
                        "WHERE fs.userId = :userId " +
                        "AND fs.sessionType = 'FOCUS' " +
                        "AND fs.startedAt >= :start AND fs.startedAt < :end")
        int countFocusDaysByUserIdAndDateRange(
                        @Param("userId") String userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Get daily focus minutes for a date range in one trip.
         */
        @Query("SELECT CAST(fs.startedAt AS date) as date, " +
                        "CAST(SUM(fs.actualDuration) / 60 AS long) as minutes " +
                        "FROM FocusSession fs " +
                        "WHERE fs.userId = :userId " +
                        "AND fs.sessionType = 'FOCUS' " +
                        "AND fs.startedAt >= :start AND fs.startedAt < :end " +
                        "GROUP BY CAST(fs.startedAt AS date)")
        List<DailyFocusProjection> aggregateDailyFocusMinutes(
                        @Param("userId") String userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Get daily focus time by category for a range in one trip.
         */
        @Query("SELECT CAST(fs.startedAt AS date) as date, " +
                        "t.category.id as categoryId, " +
                        "COALESCE(cat.name, 'Uncategorized') as categoryName, " +
                        "COALESCE(cat.color, '#94a3b8') as categoryColor, " +
                        "CAST(SUM(fs.actualDuration) / 60 AS int) as minutes " +
                        "FROM FocusSession fs " +
                        "LEFT JOIN fs.task t " +
                        "LEFT JOIN t.category cat " +
                        "WHERE fs.userId = :userId " +
                        "AND fs.sessionType = 'FOCUS' " +
                        "AND fs.startedAt >= :start AND fs.startedAt < :end " +
                        "GROUP BY CAST(fs.startedAt AS date), t.category.id, cat.name, cat.color")
        List<DailyCategoryFocusProjection> aggregateDailyCategoryFocusTime(
                        @Param("userId") String userId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);
}