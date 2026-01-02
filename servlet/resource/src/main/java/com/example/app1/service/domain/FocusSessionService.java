package com.example.app1.service.domain;

import java.time.DayOfWeek;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.FocusSessionDto;
import com.example.app1.model.FocusSession;
import com.example.app1.model.Task;
import com.example.app1.repository.FocusSessionRepository;
import com.example.app1.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FocusSessionService {

        private final FocusSessionRepository focusSessionRepository;
        private final TaskRepository taskRepository;

        /**
         * Record a new focus session (completed or interrupted).
         */
        @Transactional
        public FocusSession recordSession(FocusSessionDto.RecordRequest request, String userId) {
                log.info("Recording session for user {}: type={}, status={}, duration={}",
                                userId, request.getSessionType(), request.getStatus(), request.getActualDuration());

                Task task = null;
                if (request.getTaskId() != null) {
                        task = taskRepository.findById(request.getTaskId()).orElse(null);
                }

                FocusSession session;
                if (request.getId() != null) {
                        // Update existing session
                        session = focusSessionRepository.findById(request.getId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Session not found: " + request.getId()));

                        // Validate user ownership? Ideally yes but userId is passed.
                        if (!session.getUserId().equals(userId)) {
                                throw new RuntimeException("Unauthorized update");
                        }

                        // Update fields
                        session.setStatus(FocusSession.SessionStatus.valueOf(request.getStatus()));
                        session.setActualDuration(request.getActualDuration());
                        session.setEndedAt(request.getEndedAt());
                        // Should we update taskId or sessionType? Usually fixed, but can allow if
                        // needed.
                } else {
                        // Create new session
                        session = FocusSession.builder()
                                        .userId(userId)
                                        .task(task)
                                        .sessionType(FocusSession.SessionType.valueOf(request.getSessionType()))
                                        .status(FocusSession.SessionStatus.valueOf(request.getStatus()))
                                        .scheduledDuration(request.getScheduledDuration())
                                        .actualDuration(request.getActualDuration())
                                        .startedAt(request.getStartedAt())
                                        .endedAt(request.getEndedAt())
                                        .build();
                }

                return focusSessionRepository.save(session);
        }

        /**
         * Get total focus time for a user on a specific date
         */
        public FocusSessionDto.DailySummary getDailySummary(String userId, LocalDate date) {
                Integer totalSeconds = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRange(
                                userId, date.atStartOfDay(), date.atTime(23, 59, 59));
                log.info("Daily summary for user {} on {}: {} seconds", userId, date, totalSeconds);

                return FocusSessionDto.DailySummary.builder()
                                .date(date)
                                .totalSeconds(totalSeconds)
                                .build();
        }

        /**
         * Get total focus time for a user (all time)
         */
        public FocusSessionDto.TotalSummary getTotalSummary(String userId) {
                Integer totalSeconds = focusSessionRepository.getTotalFocusDurationByUserId(userId);
                log.info("Total summary for user {}: {} seconds", userId, totalSeconds);

                return FocusSessionDto.TotalSummary.builder()
                                .totalSeconds(totalSeconds)
                                .build();
        }

        public FocusSessionDto.WeeklySummary getWeeklySummary(String userId, LocalDate date) {
                // This week's range
                LocalDate startOfWeek = date.with(DayOfWeek.MONDAY);
                LocalDate endOfWeek = date.with(DayOfWeek.SUNDAY);

                Integer thisWeekTotal = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRangeBetween(
                                userId, startOfWeek.atStartOfDay(), endOfWeek.atTime(23, 59, 59));

                log.info("Weekly summary for user {} between {} and {}: {} seconds", userId, startOfWeek, endOfWeek,
                                thisWeekTotal);

                // Last week's range
                LocalDate startOfLastWeek = startOfWeek.minusWeeks(1);
                LocalDate endOfLastWeek = endOfWeek.minusWeeks(1);

                // Get both weeks' totals
                Integer lastWeekTotal = focusSessionRepository.getTotalFocusDurationByUserIdAndDateRangeBetween(
                                userId, startOfLastWeek.atStartOfDay(), endOfLastWeek.atTime(23, 59, 59));

                log.info("Weekly summary for user {} between {} and {}: {} seconds", userId, startOfLastWeek,
                                endOfLastWeek, lastWeekTotal);
                int gapSeconds = (thisWeekTotal != null ? thisWeekTotal : 0)
                                - (lastWeekTotal != null ? lastWeekTotal : 0);

                log.info("gapSeconds: {}", gapSeconds);
                return FocusSessionDto.WeeklySummary.builder()
                                .date(date)
                                .totalSeconds(thisWeekTotal != null ? thisWeekTotal : 0)
                                .gapSeconds(gapSeconds)
                                .build();
        }

        /**
         * Get all focus sessions for a user on a specific date.
         */
        public java.util.List<FocusSession> getSessionsByDate(String userId, LocalDate date) {
                java.time.LocalDateTime startOfDay = date.atStartOfDay();
                java.time.LocalDateTime endOfDay = date.atTime(23, 59, 59);

                log.info("Fetching sessions for user {} on date {}", userId, date);
                return focusSessionRepository.findByUserIdAndStartedAtBetweenWithTask(userId, startOfDay, endOfDay);
        }
}
