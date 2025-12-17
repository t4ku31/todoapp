package com.example.app1.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app1.dto.CategoryDto;
import com.example.app1.service.CategoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryDto.Response> getAllCategories() {
        log.info("[GET /api/categories] Fetching all categories");
        List<CategoryDto.Response> categories = categoryService.getAllCategories().stream()
                .map(c -> new CategoryDto.Response(c.getId(), c.getName(), c.getColor()))
                .toList();
        log.info("[GET /api/categories] Returning {} categories", categories.size());
        return categories;
    }
}
