package com.todoapp.resource.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.todoapp.resource.dto.CategoryDto;
import com.todoapp.resource.model.Category;
import com.todoapp.resource.service.domain.CategoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<Category> getAllCategories(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[GET /api/categories] Fetching all categories for user: {}", userId);
        return categoryService.getAllCategories(userId);
    }

    @PostMapping
    public Category createCategory(@RequestBody CategoryDto.Request category, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[POST /api/categories] Creating category: {} for user: {}", category.name(), userId);
        Category created = categoryService.createCategory(category, userId);
        log.info("[POST /api/categories] Created category with id: {}", created.getId());
        return created;
    }

    @PatchMapping("/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody CategoryDto.Request category,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[PATCH /api/categories/{}] Updating category for user: {}", id, userId);
        Category updated = categoryService.updateCategory(id, category, userId);
        log.info("[PATCH /api/categories/{}] Updated category", id);
        return updated;
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("[DELETE /api/categories/{}] Deleting category for user: {}", id, userId);
        categoryService.deleteCategory(id, userId);
        log.info("[DELETE /api/categories/{}] Deleted category", id);
    }
}
