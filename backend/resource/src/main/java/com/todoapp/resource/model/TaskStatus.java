package com.todoapp.resource.model;

/**
 * Task status enumeration.
 * Represents the current state of a task.
 */
public enum TaskStatus {
    /**
     * Task has not been started yet
     */
    PENDING,

    /**
     * Task is currently being worked on
     */
    IN_PROGRESS,

    /**
     * Task has been completed
     */
    COMPLETED
}
