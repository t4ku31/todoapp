package com.example.app1.service.domain;

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

    // デフォルトカテゴリの定義
    private static final List<CategoryDto.Request> DEFAULT_CATEGORIES = List.of(
            new CategoryDto.Request("仕事", "#3B82F6"), // blue
            new CategoryDto.Request("学習", "#10B981"), // green
            new CategoryDto.Request("趣味", "#F59E0B"), // amber
            new CategoryDto.Request("その他", "#94a3b8") // gray
    );

    /**
     * Get all available categories.
     * If user has no categories, create default categories first.
     * 
     * @return List of all categories
     */
    @Transactional
    public List<Category> getAllCategories(String userId) {
        List<Category> categories = categoryRepository.findAllByUserId(userId);

        // ユーザーがカテゴリを持っていない場合、デフォルトを作成
        if (categories.isEmpty()) {
            log.info("No categories found for user {}. Creating default categories.", userId);
            categories = createDefaultCategories(userId);
        }

        return categories;
    }

    /**
     * Create default categories for a new user.
     */
    private List<Category> createDefaultCategories(String userId) {
        return DEFAULT_CATEGORIES.stream()
                .map(cat -> categoryRepository.save(Category.builder()
                        .userId(userId)
                        .name(cat.name())
                        .color(cat.color())
                        .build()))
                .toList();
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

    /**
     * Get a category by name, or create it if it doesn't exist.
     */
    @Transactional
    public Category getOrCreateCategory(String userId, String name, String defaultColor) {
        return categoryRepository.findByUserIdAndName(userId, name)
                .orElseGet(() -> createCategory(new CategoryDto.Request(name, defaultColor), userId));
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
