package com.todoapp.resource.service.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.todoapp.resource.dto.SubtaskDto;
import com.todoapp.resource.model.Subtask;
import com.todoapp.resource.model.Task;
import com.todoapp.resource.repository.SubtaskRepository;
import com.todoapp.resource.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing subtasks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;

    /**
     * Create a new subtask for a given task.
     */
    @Transactional
    public Subtask createSubtask(Long taskId, SubtaskDto.Create request, String userId) {
        log.info("Creating subtask for task {} and user: {}", taskId, userId);

        Task task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied"));

        Subtask subtask = Subtask.builder()
                .title(request.title())
                .description(request.description())
                .task(task)
                .build();

        return subtaskRepository.save(subtask);
    }

    /**
     * Update an existing subtask.
     */
    @Transactional
    public Subtask updateSubtask(Long subtaskId, SubtaskDto.Update request, String userId) {
        log.info("Updating subtask {} for user: {}", subtaskId, userId);

        Subtask subtask = subtaskRepository.findByIdAndUserId(subtaskId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Subtask not found or access denied"));

        if (request.title() != null) {
            subtask.setTitle(request.title());
        }
        if (request.description() != null) {
            subtask.setDescription(request.description());
        }
        if (request.isCompleted() != null) {
            subtask.setIsCompleted(request.isCompleted());
        }
        if (request.orderIndex() != null) {
            subtask.setOrderIndex(request.orderIndex());
        }

        return subtaskRepository.save(subtask);
    }

    /**
     * Delete a subtask.
     */
    @Transactional
    public void deleteSubtask(Long subtaskId, String userId) {
        log.info("Deleting subtask {} for user: {}", subtaskId, userId);

        Subtask subtask = subtaskRepository.findByIdAndUserId(subtaskId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Subtask not found or access denied"));

        subtaskRepository.delete(subtask);
    }
}
