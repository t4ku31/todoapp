package io.reflectoring.bff.dto;

import lombok.Data;

@Data
public class TaskCreateRequest {
    private String title;
    private Long taskListId;

}
