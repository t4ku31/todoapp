package com.example.app1.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.example.app1.model.TaskStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class TaskDto {

        @Schema(name = "TaskCreate", description = "タスク作成リクエスト")
        public record Create(
                        @Schema(description = "タスクのタイトル（必須）") String title,
                        @Schema(description = "タスクリストID（任意）") Long taskListId,
                        @Schema(description = "タスクリスト名（任意、指定しない場合はInboxに追加）") String taskListTitle,
                        @Schema(description = "カテゴリID（任意）") Long categoryId,
                        @Schema(description = "カテゴリ名（任意）") String categoryName,
                        @Schema(description = "サブタスクリスト（任意）") List<SubtaskDto.Create> subtasks,
                        @Schema(description = "推定ポモドーロ数（任意）") Integer estimatedPomodoros,
                        @Schema(description = "繰り返しタスクかどうか（任意）") Boolean isRecurring,
                        @Schema(description = "繰り返しルール（厳密なオブジェクト指定）") RecurrenceRuleDto recurrenceRule,
                        @Schema(description = "カスタム日付リスト（任意）") List<LocalDate> customDates,
                        @Schema(description = "開始日時（YYYY-MM-DDTHH:mm形式、任意）") java.time.OffsetDateTime scheduledStartAt,
                        @Schema(description = "終了日時（YYYY-MM-DDTHH:mm形式、任意）") java.time.OffsetDateTime scheduledEndAt,
                        @Schema(description = "終日イベントかどうか（任意）") Boolean isAllDay,
                        @Schema(description = "説明文（任意）") String description,
                        @Schema(description = "ステータス（任意）") TaskStatus status) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "TaskUpdate", description = "タスク更新リクエスト")
        public record Update(
                        @Schema(description = "新しいタイトル（変更する場合のみ）") String title,
                        @Schema(description = "新しいステータス（変更する場合のみ）") TaskStatus status,
                        @Schema(description = "新しいカテゴリID（変更する場合のみ）") Long categoryId,
                        @Schema(description = "新しいカテゴリ名（変更する場合のみ）") String categoryName,
                        @Schema(description = "移動先のタスクリストID（変更する場合のみ）") Long taskListId,
                        @Schema(description = "移動先のタスクリスト名（変更する場合のみ）") String taskListTitle,
                        @Schema(description = "完了日時（変更する場合のみ）") LocalDateTime completedAt,
                        @Schema(description = "新しい推定ポモドーロ数（変更する場合のみ）") Integer estimatedPomodoros,
                        @Schema(description = "繰り返しタスクかどうか（変更する場合のみ）") Boolean isRecurring,
                        @Schema(description = "繰り返しルール（厳密なオブジェクト指定、変更する場合のみ）") RecurrenceRuleDto recurrenceRule,
                        @Schema(description = "説明文（変更する場合のみ）") String description,
                        @Schema(description = "開始日時（YYYY-MM-DDTHH:mm形式、変更する場合のみ）") java.time.OffsetDateTime scheduledStartAt,
                        @Schema(description = "終了日時（YYYY-MM-DDTHH:mm形式、変更する場合のみ）") java.time.OffsetDateTime scheduledEndAt,
                        @Schema(description = "終日イベントかどうか（変更する場合のみ）") Boolean isAllDay) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "TaskSummary")
        public record Summary(
                        @Schema(description = "Task ID", example = "1") Long id,
                        @Schema(description = "Task title", example = "Buy milk") String title,
                        @Schema(description = "Task status", example = "COMPLETED") TaskStatus status,
                        @Schema(description = "Task list ID", example = "1") Long taskListId,
                        @Schema(description = "Category details") CategoryDto.Response category,
                        @Schema(description = "Subtasks list") List<SubtaskDto.Summary> subtasks,
                        @Schema(description = "Estimated number of pomodoros", example = "2") Integer estimatedPomodoros,
                        @Schema(description = "Completed at timestamp") LocalDateTime completedAt,
                        @Schema(description = "Whether this is a recurring task") Boolean isRecurring,
                        @Schema(description = "Recurrence rule") RecurrenceRuleDto recurrenceRule,
                        @Schema(description = "Parent task ID for recurring instances") Long recurrenceParentId,
                        @Schema(description = "Whether the task is in the trash") Boolean isDeleted,
                        @Schema(description = "Task description/notes") String description,
                        @Schema(description = "Scheduled start time") java.time.OffsetDateTime scheduledStartAt,
                        @Schema(description = "Scheduled end time") java.time.OffsetDateTime scheduledEndAt,
                        @Schema(description = "Whether this is an all-day event") Boolean isAllDay) {
        }

        /**
         * Task statistics response
         */
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        @Schema(name = "TaskStats")
        public static class Stats {
                private LocalDate startDate;
                private LocalDate endDate;
                private Long completedCount;
                private Long totalCount;
                private Integer totalEstimatedMinutes;
                private Integer totalActualMinutes;
        }

        /**
         * Bulk update request - update multiple tasks at once
         */
        @Schema(name = "TaskBulkUpdate")
        public record BulkUpdate(
                        List<Long> taskIds,
                        TaskStatus status,
                        Long categoryId,
                        String categoryName,
                        Long taskListId,
                        Integer estimatedPomodoros,
                        String description,
                        Boolean isRecurring,
                        RecurrenceRuleDto recurrenceRule,
                        java.time.OffsetDateTime scheduledStartAt,
                        java.time.OffsetDateTime scheduledEndAt,
                        Boolean isAllDay) {
        }

        /**
         * Bulk delete request - delete multiple tasks at once
         */
        @Schema(name = "TaskBulkDelete")
        public record BulkDelete(List<Long> taskIds) {
        }

        /**
         * Bulk create request - create multiple tasks at once
         */
        @Schema(name = "TaskBulkCreate")
        public record BulkCreate(
                        @Schema(description = "List of tasks to create") List<Create> tasks) {
        }

        /**
         * Bulk create response - returns created tasks
         */
        @Schema(name = "TaskBulkCreateResult")
        public record BulkCreateResult(
                        @Schema(description = "Number of successfully created tasks") int successCount,
                        @Schema(description = "List of created task IDs") List<Long> createdTaskIds,
                        @Schema(description = "Whether all tasks were created successfully") boolean allSucceeded,
                        @Schema(description = "Error message if any") String errorMessage) {
                public static BulkCreateResult success(List<Long> taskIds) {
                        return new BulkCreateResult(taskIds.size(), taskIds, true, null);
                }

                public static BulkCreateResult error(String message) {
                        return new BulkCreateResult(0, List.of(), false, message);
                }
        }

        /**
         * Result of a bulk operation with partial success support
         */
        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        @Schema(name = "TaskBulkOperationResult")
        public static class BulkOperationResult {
                @Schema(description = "Number of successfully processed tasks")
                private int successCount;

                @Schema(description = "Number of failed tasks")
                private int failedCount;

                @Schema(description = "List of failed task details")
                private List<FailedTask> failedTasks;

                @Schema(description = "Whether the entire operation was successful")
                private boolean allSucceeded;

                @Schema(description = "Pre-formatted display messages for UI")
                private List<String> displayMessages;

                @Data
                @Builder
                @NoArgsConstructor
                @AllArgsConstructor
                public static class FailedTask {
                        @Schema(description = "Task ID that failed")
                        private Long taskId;

                        @Schema(description = "Reason for failure")
                        private String reason;

                        @Schema(description = "Error code: UNAUTHORIZED, NOT_FOUND, INVALID_REQUEST, DATABASE_ERROR")
                        private String errorCode;

                        @Schema(description = "Pre-formatted display message for UI")
                        private String displayMessage;
                }
        }

        /**
         * Unified task model for sync/batch operations.
         */
        @Schema(name = "SyncTaskDto", description = "AI生成と同期保存で共通化されたタスクモデル")
        public record SyncTaskDto(
                        @JsonPropertyDescription("既存タスクのID（更新・削除時は必須）") Long id,
                        @JsonPropertyDescription("タスクのタイトル") String title,
                        @JsonPropertyDescription("タスクの詳細") String description,
                        @JsonPropertyDescription("予定開始日時（YYYY-MM-DDTHH:mm:ss）") String scheduledStartAt,
                        @JsonPropertyDescription("予定終了日時（YYYY-MM-DDTHH:mm:ss）") String scheduledEndAt,
                        @JsonPropertyDescription("終日フラグ") Boolean isAllDay,
                        @JsonPropertyDescription("推定ポモドーロ数") Integer estimatedPomodoros,
                        @JsonPropertyDescription("カテゴリ名") String categoryName,
                        @JsonPropertyDescription("タスクリスト名") String taskListTitle,
                        @JsonPropertyDescription("繰り返しフラグ") Boolean isRecurring,
                        @JsonPropertyDescription("繰り返しルール") RecurrenceRuleDto recurrenceRule,
                        @JsonPropertyDescription("削除フラグ") Boolean isDeleted,
                        @JsonPropertyDescription("サブタスク（オブジェクト）のリスト") List<SubtaskDto.Summary> subtasks,
                        @JsonPropertyDescription("ステータス（PENDING, COMPLETED）") String status,
                        @com.fasterxml.jackson.annotation.JsonProperty("suggestedTaskList") @JsonPropertyDescription("提案されたタスクリスト名") String suggestedTaskListTitle) {
        }

        /**
         * AIが生成したSyncTaskDtoのリスト
         */
        @Schema(name = "SyncTaskList", description = "AIが生成したSyncTaskDtoのリスト")
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
        public record SyncTaskList(
                        @com.fasterxml.jackson.annotation.JsonProperty("tasks") List<SyncTaskDto> tasks,
                        @com.fasterxml.jackson.annotation.JsonProperty("advice") String advice,
                        @com.fasterxml.jackson.annotation.JsonProperty("projectTitle") String projectTitle) {
        }

        /**
         * Result of sync operation.
         */
        public record SyncResult(
                        boolean success,
                        String message,
                        int createdCount,
                        int updatedCount,
                        int deletedCount) {
        }
}
