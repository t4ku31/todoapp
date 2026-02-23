package com.todoapp.resource.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMemoryId implements Serializable {
    private String conversationId;
    private LocalDateTime timestamp;
}
