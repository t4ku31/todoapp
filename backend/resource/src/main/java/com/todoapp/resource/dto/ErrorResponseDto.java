package com.todoapp.resource.dto;

public record ErrorResponseDto(
        String message,
        String details) {
}
