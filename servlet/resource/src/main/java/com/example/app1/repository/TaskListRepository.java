package com.example.app1.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.app1.model.TaskList;

/**
 * Repository for TaskList entity.
 * Provides data access methods with built-in security checks using userId.
 */
@Repository
public interface TaskListRepository extends JpaRepository<TaskList, Long> {

    /**
     * Find all task lists belonging to a specific user.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of task lists owned by the user
     */
    @Query("SELECT tl FROM TaskList tl WHERE tl.userId = :userId")
    List<TaskList> findByUserId(@Param("userId") String userId);

    /**
     * Find all task lists for a user, projecting only necessary columns.
     * 
     * @param userId Auth0 sub claim identifying the user
     * @return List of TaskListSummary projections
     */
    @Query("SELECT tl FROM TaskList tl WHERE tl.userId = :userId")
    List<com.example.app1.dto.TaskListSummary> findSummaryByUserId(@Param("userId") String userId);

    /**
     * Find all task lists belonging to a specific user with pagination.
     * 
     * @param userId   Auth0 sub claim identifying the user
     * @param pageable Pagination parameters
     * @return Page of task lists owned by the user
     */
    @Query("SELECT tl FROM TaskList tl WHERE tl.userId = :userId")
    Page<TaskList> findByUserId(@Param("userId") String userId, Pageable pageable);

    /**
     * Find a specific task list by ID and user ID.
     * This ensures users can only access their own task lists.
     * 
     * @param id     Task list ID
     * @param userId Auth0 sub claim identifying the user
     * @return Optional containing the task list if found and owned by user
     */
    @Query("SELECT tl FROM TaskList tl WHERE tl.id = :id AND tl.userId = :userId")
    Optional<TaskList> findByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);

    /**
     * Delete a task list by ID and user ID.
     * This ensures users can only delete their own task lists.
     * 
     * @param id     Task list ID
     * @param userId Auth0 sub claim identifying the user
     */
    @Modifying
    @Query("DELETE FROM TaskList tl WHERE tl.id = :id AND tl.userId = :userId")
    void deleteByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);

    /**
     * Check if a task list exists for a specific user.
     * 
     * @param id     Task list ID
     * @param userId Auth0 sub claim identifying the user
     * @return true if the task list exists and belongs to the user
     */
    @Query("SELECT CASE WHEN COUNT(tl) > 0 THEN true ELSE false END FROM TaskList tl WHERE tl.id = :id AND tl.userId = :userId")
    boolean existsByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);
}
