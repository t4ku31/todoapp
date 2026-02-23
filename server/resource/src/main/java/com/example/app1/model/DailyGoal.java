package com.example.app1.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DailyGoal entity representing a user's focus time goal for a specific date.
 * Allows users to set different focus targets for each day.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamicUpdate
@Entity
@Table(name = "daily_goals", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "date" })
})
public class DailyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User identifier from Auth0 sub claim
     */
    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    /**
     * The date for this goal
     */
    @Column(nullable = false)
    private LocalDate date;

    /**
     * Focus time goal in minutes
     */
    @Column(name = "goal_minutes", nullable = false)
    private Integer goalMinutes;

    /**
     * Timestamp when the record was created
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the record was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
