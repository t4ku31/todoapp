package com.example.app1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.app1.model.FocusSession;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {

        /**
         * Get total actual duration for a user on a specific date (filtered by FOCUS
         * type)
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :startOfDay AND :endOfDay AND fs.sessionType = 'FOCUS'")
        Integer getTotalFocusDurationByUserIdAndDateRange(@Param("userId") String userId,
                        @Param("startOfDay") java.time.LocalDateTime startOfDay,
                        @Param("endOfDay") java.time.LocalDateTime endOfDay);

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
                        @Param("start") java.time.LocalDateTime start,
                        @Param("end") java.time.LocalDateTime end);

        // --- Efficiency Score Queries ---

        /**
         * Count completed sessions in range
         */
        @Query("SELECT COUNT(fs) FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end AND fs.status = 'COMPLETED'")
        Long countCompletedSessions(@Param("userId") String userId, @Param("start") java.time.LocalDateTime start,
                        @Param("end") java.time.LocalDateTime end);

        /**
         * Count total sessions in range (completed + interrupted)
         */
        @Query("SELECT COUNT(fs) FROM FocusSession fs WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end")
        Long countTotalSessions(@Param("userId") String userId, @Param("start") java.time.LocalDateTime start,
                        @Param("end") java.time.LocalDateTime end);

        /**
         * Sum actual duration for a list of task IDs.
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.task.id IN :taskIds AND fs.sessionType = 'FOCUS'")
        Integer sumActualDurationByTaskIds(@Param("taskIds") java.util.List<Long> taskIds);

        /**
         * Sum actual duration for a single task ID (all time).
         */
        @Query("SELECT COALESCE(SUM(fs.actualDuration), 0) FROM FocusSession fs WHERE fs.task.id = :taskId AND fs.sessionType = 'FOCUS'")
        Integer getTotalDurationByTaskId(@Param("taskId") Long taskId);

        /**
         * Find all focus sessions for a user in a date range with task eagerly loaded.
         */
        @Query("SELECT fs FROM FocusSession fs LEFT JOIN FETCH fs.task t LEFT JOIN FETCH t.category WHERE fs.userId = :userId AND fs.startedAt BETWEEN :start AND :end AND fs.sessionType = 'FOCUS'")
        java.util.List<FocusSession> findByUserIdAndStartedAtBetweenWithTask(
                        @Param("userId") String userId,
                        @Param("start") java.time.LocalDateTime start,
                        @Param("end") java.time.LocalDateTime end);
}