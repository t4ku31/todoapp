package com.todoapp.resource.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FocusSession entity representing a focus time record for analytics.
 * Tracks the duration of focus sessions per user, task, and date.
 */

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamicUpdate
@Entity
@Table(name = "focus_sessions")
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(name = "task_id", insertable = false, updatable = false)
    private Long taskId;
    @Column(name = "session_type", nullable = false)
    @Enumerated(jakarta.persistence.EnumType.STRING)
    private SessionType sessionType;

    @Column(name = "status", nullable = false)
    @Enumerated(jakarta.persistence.EnumType.STRING)
    private SessionStatus status;

    @Column(name = "scheduled_duration", nullable = false)
    private Integer scheduledDuration;

    @Column(name = "actual_duration", nullable = false)
    private Integer actualDuration;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum SessionType {
        FOCUS, SHORT_BREAK, LONG_BREAK
    }

    public enum SessionStatus {
        COMPLETED, INTERRUPTED
    }
}
