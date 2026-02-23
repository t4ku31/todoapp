package com.todoapp.resource.dto;

public class CategoryDto {
    public record Response(Long id, String name, String color) {
    }

    public record Request(String name, String color) {
    }
}
