package com.example.app1.service;

import java.util.List;
import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.dto.CategoryDto;
import com.example.app1.model.Category;
import com.example.app1.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Get all available categories.
     * 
     * @return List of all categories
     */
    @Transactional(readOnly = true)
    public List<Category> getAllCategories(String userId) {
        return categoryRepository.findAllByUserId(userId);
    }

    @Transactional
    public @NonNull Category createCategory(CategoryDto.Request category, String userId) {
        log.info("Creating category: {} for user: {}", category.name(), userId);

        // 重複チェック
        if (categoryRepository.existsByUserIdAndNameAndColor(userId, category.name(), category.color())) {
            throw new IllegalArgumentException("同じ名前と色のカテゴリーが既に存在します");
        }

        Category createdCategory = categoryRepository.save(Objects.requireNonNull(Category.builder()
                .userId(userId)
                .name(category.name())
                .color(category.color())
                .build()));
        log.info("Created category with id: {}", createdCategory.getId());
        return createdCategory;
    }

    @Transactional
    public Category updateCategory(Long id, CategoryDto.Request updates, String userId) {
        log.info("Updating category id: {} for user: {}", id, userId);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if (!category.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Category not found with id: " + id);
        }

        if (updates.name() != null) {
            category.setName(updates.name());
        }
        if (updates.color() != null) {
            category.setColor(updates.color());
        }

        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id, String userId) {
        log.info("Deleting category id: {} for user: {}", id, userId);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if (!category.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Category not found with id: " + id);
        }

        categoryRepository.delete(category);
    }
}
