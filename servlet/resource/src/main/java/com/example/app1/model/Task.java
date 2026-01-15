package com.example.app1.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.micrometer.common.lang.NonNull;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
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
     * Optional execution date for the task
     */
    @Column(name = "execution_date")
    private LocalDate executionDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * Estimated number of pomodoros for this task
     */
    @Column(name = "estimated_pomodoros")
    @Builder.Default
    private Integer estimatedPomodoros = 0;

    /**
     * Start date for date range tasks
     */
    @Column(name = "start_date")
    private LocalDate startDate;

    /**
     * End date for date range tasks
     */
    @Column(name = "end_date")
    private LocalDate endDate;

    /**
     * Scheduled start datetime for calendar events
     */
    @Column(name = "scheduled_start_at")
    private LocalDateTime scheduledStartAt;

    /**
     * Scheduled end datetime for calendar events
     */
    @Column(name = "scheduled_end_at")
    private LocalDateTime scheduledEndAt;

    /**
     * Whether this is an all-day event (no specific time)
     */
    @Column(name = "is_all_day")
    @Builder.Default
    private Boolean isAllDay = true;

    /**
     * Task description (Markdown supported)
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Whether this is a recurring task
     */
    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    /**
     * Recurrence rule in JSON format: {frequency, interval, daysOfWeek, endDate}
     */
    @Column(name = "recurrence_rule", length = 500)
    private String recurrenceRule;

    /**
     * Reference to the parent recurring task
     */
    @Column(name = "recurrence_parent_id")
    private Long recurrenceParentId;

    /**
     * Display order index
     */
    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    /**
     * Current status of the task
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    /**
     * Whether the task is in the trash (soft deleted)
     */
    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    /**
     * Subtasks belonging to this task
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Subtask> subtasks = new ArrayList<>();

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
