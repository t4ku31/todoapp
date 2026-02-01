package com.example.app1.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
         * Find all tasks belonging to a specific user (excluding deleted).
         * 
         * @param userId Auth0 sub claim identifying the user
         * @return List of all tasks owned by the user
         */
        @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.isDeleted = false")
        List<Task> findByUserId(@Param("userId") String userId);

        /**
         * Find tasks for a specific task list and user (excluding deleted and recurring
         * children).
         * This ensures users can only access tasks in their own task lists.
         * Recurring child tasks (recurrenceParentId != null) are excluded from task
         * list view.
         * 
         * @param taskListId ID of the task list
         * @param userId     Auth0 sub claim identifying the user
         * @return List of tasks in the task list owned by the user (excluding recurring
         *         children)
         */
        @Query("SELECT t FROM Task t WHERE t.taskList.id = :taskListId AND t.userId = :userId " +
                        "AND t.isDeleted = false AND t.recurrenceParentId IS NULL")
        List<Task> findByTaskList_IdAndUserId(@Param("taskListId") Long taskListId, @Param("userId") String userId);

        /**
         * Find all soft-deleted tasks (trash) for a user.
         * Only returns items without a recurrenceParentId (i.e. parent tasks or
         * non-recurring tasks)
         * to avoid cluttering the trash view with all generated instances.
         */
        @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.isDeleted = true AND t.recurrenceParentId IS NULL")
        List<Task> findByUserIdAndIsDeletedTrue(@Param("userId") String userId);

        /**
         * Find a specific task by ID and user ID.
         * This ensures users can only access their own tasks.
         *
         * @param id     Task ID
         * @param userId Auth0 sub claim identifying the user
         * @return Optional containing the task if found and owned by user
         */
        @Query("SELECT t FROM Task t WHERE t.id = :id AND t.userId = :userId")
        Optional<Task> findByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);

        /**
         * Delete all tasks belonging to a specific task list.
         * 
         * @param taskListId Task list ID
         */
        @Modifying
        @Query("DELETE FROM Task t WHERE t.taskList.id = :taskListId")
        void deleteByTaskListId(@Param("taskListId") Long taskListId);

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

        /**
         * Count completed tasks for a user within an execution date range.
         */
        @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId " +
                        "AND t.status = com.example.app1.model.TaskStatus.COMPLETED " +
                        "AND t.executionDate BETWEEN :startDate AND :endDate")
        Long countCompletedByUserIdAndExecutionDateBetween(
                        @Param("userId") String userId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDate") java.time.LocalDate endDate);

        /**
         * Count total tasks for a user within an execution date range.
         */
        @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId " +
                        "AND t.executionDate BETWEEN :startDate AND :endDate")
        Long countByUserIdAndExecutionDateBetween(
                        @Param("userId") String userId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDate") java.time.LocalDate endDate);

        /**
         * Find all tasks for a user within an execution date range.
         */
        @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.userId = :userId " +
                        "AND t.executionDate BETWEEN :startDate AND :endDate")
        List<Task> findByUserIdAndExecutionDateBetween(
                        @Param("userId") String userId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDate") java.time.LocalDate endDate);

        /**
         * Find completed tasks for a user within an execution date range.
         */
        @Query("SELECT t FROM Task t WHERE t.userId = :userId " +
                        "AND t.status = com.example.app1.model.TaskStatus.COMPLETED " +
                        "AND t.executionDate BETWEEN :startDate AND :endDate")
        List<Task> findCompletedByUserIdAndExecutionDateBetween(
                        @Param("userId") String userId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDate") java.time.LocalDate endDate);

        /**
         * Find all tasks for a user on a specific execution date with category eagerly
         * loaded.
         */
        @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.userId = :userId " +
                        "AND t.executionDate = :executionDate")
        List<Task> findByUserIdAndExecutionDate(
                        @Param("userId") String userId,
                        @Param("executionDate") java.time.LocalDate executionDate);

        /**
         * Count total tasks for a user on a specific execution date.
         */
        @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.executionDate = :executionDate")
        Long countByUserIdAndExecutionDate(@Param("userId") String userId,
                        @Param("executionDate") java.time.LocalDate executionDate);

        /**
         * Count tasks by status for a user on a specific execution date.
         */
        @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.executionDate = :executionDate AND t.status = :status")
        Long countByUserIdAndExecutionDateAndStatus(@Param("userId") String userId,
                        @Param("executionDate") java.time.LocalDate executionDate,
                        @Param("status") com.example.app1.model.TaskStatus status);

        /**
         * Count tasks by status and updatedAt range - for monthly analytics.
         */
        @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.status = :status " +
                        "AND t.updatedAt BETWEEN :start AND :end")
        int countByUserIdAndStatusAndUpdatedAtBetween(
                        @Param("userId") String userId,
                        @Param("status") com.example.app1.model.TaskStatus status,
                        @Param("start") java.time.LocalDateTime start,
                        @Param("end") java.time.LocalDateTime end);

        /**
         * Find all child tasks (recurring instances) by parent task ID.
         * 
         * @param parentId ID of the parent recurring task
         * @return List of child tasks
         */
        List<Task> findByRecurrenceParentId(Long parentId);

        /**
         * Find pending (incomplete) child tasks by parent task ID.
         * Used for propagating changes to future instances.
         * 
         * @param parentId ID of the parent recurring task
         * @return List of pending child tasks
         */
        /**
         * Find pending (incomplete) child tasks by parent task ID.
         * Used for propagating changes to future instances.
         * 
         * @param recurrenceParentId ID of the parent recurring task
         * @param status             Status to exclude (e.g. COMPLETED)
         * @return List of pending child tasks
         */
        List<Task> findByRecurrenceParentIdAndStatusNot(Long recurrenceParentId,
                        com.example.app1.model.TaskStatus status);
}
