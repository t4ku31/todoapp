package com.example.app1.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.micrometer.common.lang.NonNull;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
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
import lombok.ToString;

/**
 * Task entity representing a single task within a task list.
 * Each task belongs to both a task list and a user (identified by Auth0 sub
 * claim).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamicUpdate
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User identifier from Auth0 sub claim (e.g., "auth0|123456789")
     */
    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    /**
     * Title/description of the task
     */
    @Column(nullable = false)
    private String title;

    /**
     * Current status of the task
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    /**
     * Timestamp when the task was created
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the task was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * The task list this task belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_list_id", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    @NonNull
    private TaskList taskList;

    @Column(name = "task_list_id", insertable = false, updatable = false)
    private Long taskListId;

    @JsonProperty("taskListId")
    public Long getTaskListId() {
        if (taskListId != null) {
            return taskListId;
        }
        return taskList != null ? taskList.getId() : null;
    }
}
