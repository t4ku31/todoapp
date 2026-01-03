package com.example.app1.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Subtask entity representing a simple checklist item within a task.
 * Subtasks only have title and completion status (no dates, pomodoros, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subtasks")
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The parent task this subtask belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @ToString.Exclude
    @JsonIgnore
    private Task task;

    @Column(name = "task_id", insertable = false, updatable = false)
    private Long taskId;

    /**
     * Title of the subtask
     */
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Description of the subtask
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Whether the subtask is completed
     */
    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = false;

    /**
     * Display order index
     */
    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    /**
     * Timestamp when the subtask was created
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the subtask was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
