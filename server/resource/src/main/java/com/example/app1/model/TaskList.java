package com.example.app1.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskList entity representing a collection of tasks.
 * Each task list belongs to a user (identified by Auth0 sub claim).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tasklists", uniqueConstraints = {
        @jakarta.persistence.UniqueConstraint(columnNames = { "user_id", "title" })
})
public class TaskList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User identifier from Auth0 sub claim (e.g., "auth0|123456789")
     */
    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    /**
     * Title of the task list
     */
    @Column(nullable = false)
    private String title;

    /**
     * Optional due date for the task list
     */
    @Column(name = "due_date")
    private LocalDate dueDate;

    /**
     * Whether the task list is completed
     */
    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    /**
     * Timestamp when the task list was completed
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * Timestamp when the task list was created
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the task list was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Tasks belonging to this task list
     */
    @OneToMany(mappedBy = "taskList", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    @Builder.Default
    private List<Task> tasks = new ArrayList<>();
}
