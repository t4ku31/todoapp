package com.example.app1.exception;

public class TaskListValidationException extends RuntimeException {
    public TaskListValidationException(String message) {
        super(message);
    }
}
