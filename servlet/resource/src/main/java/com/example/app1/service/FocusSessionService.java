package com.example.app1.service;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.FocusSessionDto;
import com.example.app1.model.FocusSession;
import com.example.app1.model.Task;
import com.example.app1.repository.FocusSessionRepository;
import com.example.app1.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;

    /**
     * Add focus time to an existing session or create a new one.
     * Sessions are grouped by user, date, and task.
     */
    @Transactional
    public FocusSession addFocusTime(FocusSessionDto.AddRequest request, String userId) {
        log.info("Adding {} seconds of focus time for user {} on date {} with task {}",
                request.getDurationSeconds(), userId, request.getDate(), request.getTaskId());

        Optional<FocusSession> existingSession;

        if (request.getTaskId() != null) {
            existingSession = focusSessionRepository.findByUserIdAndDateAndTaskId(
                    userId, request.getDate(), request.getTaskId());
        } else {
            existingSession = focusSessionRepository.findByUserIdAndDateAndTaskIdIsNull(
                    userId, request.getDate());
        }

        if (existingSession.isPresent()) {
            // Add to existing session
            FocusSession session = existingSession.get();
            session.setDurationSeconds(session.getDurationSeconds() + request.getDurationSeconds());
            log.info("Updated existing session {} with new total: {} seconds",
                    session.getId(), session.getDurationSeconds());
            return focusSessionRepository.save(session);
        } else {
            // Create new session
            Task task = null;
            if (request.getTaskId() != null) {
                task = taskRepository.findById(request.getTaskId()).orElse(null);
            }

            FocusSession newSession = FocusSession.builder()
                    .userId(userId)
                    .task(task)
                    .date(request.getDate())
                    .durationSeconds(request.getDurationSeconds())
                    .build();

            log.info("Created new focus session for user {} on date {}", userId, request.getDate());
            return focusSessionRepository.save(newSession);
        }
    }

    /**
     * Get total focus time for a user on a specific date
     */
    public FocusSessionDto.DailySummary getDailySummary(String userId, LocalDate date) {
        Integer totalSeconds = focusSessionRepository.getTotalDurationByUserIdAndDate(userId, date);
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
        Integer totalSeconds = focusSessionRepository.getTotalDurationByUserId(userId);
        log.info("Total summary for user {}: {} seconds", userId, totalSeconds);

        return FocusSessionDto.TotalSummary.builder()
                .totalSeconds(totalSeconds)
                .build();
    }
}
