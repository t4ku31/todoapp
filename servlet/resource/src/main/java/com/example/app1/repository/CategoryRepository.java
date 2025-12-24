package com.example.app1.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.app1.model.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByUserId(String userId);

    boolean existsByUserIdAndNameAndColor(String userId, String name, String color);
}
