package io.reflectoring.bff.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String status;
    private Long taskListId;
}
