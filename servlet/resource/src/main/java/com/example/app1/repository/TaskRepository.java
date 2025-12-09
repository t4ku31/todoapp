package com.example.app1.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.app1.model.Task;

/**
 * Repository for Task entity.
 * Provides data access methods with built-in security checks using userId.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Find all tasks belonging to a specific task list.
     * 
     * @param taskListId ID of the task list
     * @return List of tasks in the task list
     */
    List<Task> findByTaskListId(Long taskListId);

    /**
     * Find all tasks belonging to a specific user.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of all tasks owned by the user
     */
    List<Task> findByUserId(String userId);

    /**
     * Find tasks for a specific task list and user.
     * This ensures users can only access tasks in their own task lists.
     * 
     * @param taskListId ID of the task list
     * @param userId     Auth0 sub claim identifying the user
     * @return List of tasks in the task list owned by the user
     */
    List<Task> findByTaskList_IdAndUserId(Long taskListId, String userId);

    /**
     * Find a specific task by ID and user ID.
     * This ensures users can only access their own tasks.
     *
     * @param id     Task ID
     * @param userId Auth0 sub claim identifying the user
     * @return Optional containing the task if found and owned by user
     */
    java.util.Optional<Task> findByIdAndUserId(Long id, String userId);

    /**
     * Delete a task by ID and user ID.
     * This ensures users can only delete their own tasks.
     * 
     * @param id     Task ID
     * @param userId Auth0 sub claim identifying the user
     */
    void deleteByIdAndUserId(Long id, String userId);

    /**
     * Check if a task exists for a specific user.
     * 
     * @param id     Task ID
     * @param userId Auth0 sub claim identifying the user
     * @return true if the task exists and belongs to the user
     */
    boolean existsByIdAndUserId(Long id, String userId);
}
