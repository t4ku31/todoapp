package com.example.app1.dto;

import com.example.app1.model.TaskStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCreateRequest {
    private String title;
    private TaskStatus status;
    private String userId;
    private Long taskListId;
}
