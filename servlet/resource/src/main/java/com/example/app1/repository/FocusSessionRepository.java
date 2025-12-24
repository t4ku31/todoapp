package com.example.app1.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.app1.model.FocusSession;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {

    /**
     * Find a focus session by user, date, and task
     */
    Optional<FocusSession> findByUserIdAndDateAndTaskId(String userId, LocalDate date, Long taskId);

    /**
     * Find a focus session by user and date (for sessions without a task)
     */
    Optional<FocusSession> findByUserIdAndDateAndTaskIdIsNull(String userId, LocalDate date);

    /**
     * Get all focus sessions for a user on a specific date
     */
    List<FocusSession> findByUserIdAndDate(String userId, LocalDate date);

    /**
     * Get total focus time for a user on a specific date
     */
    @Query("SELECT COALESCE(SUM(fs.durationSeconds), 0) FROM FocusSession fs WHERE fs.userId = :userId AND fs.date = :date")
    Integer getTotalDurationByUserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);

    /**
     * Get total focus time for a user (all time)
     */
    @Query("SELECT COALESCE(SUM(fs.durationSeconds), 0) FROM FocusSession fs WHERE fs.userId = :userId")
    Integer getTotalDurationByUserId(@Param("userId") String userId);
}
