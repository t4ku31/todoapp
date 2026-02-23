package com.example.app1.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.app1.model.Subtask;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    List<Subtask> findByTaskId(Long taskId);

    @Query("SELECT s FROM Subtask s JOIN s.task t WHERE s.id = :id AND t.userId = :userId")
    Optional<Subtask> findByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);
}
