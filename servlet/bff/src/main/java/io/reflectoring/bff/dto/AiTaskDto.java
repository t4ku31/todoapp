package io.reflectoring.bff.dto;

import java.util.List;

/**
 * AI機能関連のDTO（BFF用）
 * 会話型タスク管理に統一
 */
public class AiTaskDto {

        /**
         * AIチャットと同期APIで共通使用するタスクモデル
         */
        public record SyncTaskDto(
                        Long id,
                        String title,
                        String description,
                        String executionDate,
                        String scheduledStartAt,
                        String scheduledEndAt,
                        Boolean isAllDay,
                        Integer estimatedPomodoros,
                        String categoryName,
                        String taskListTitle,
                        Boolean isRecurring,
                        String recurrencePattern,
                        Boolean isDeleted,
                        List<SubtaskDto.Summary> subtasks,
                        String status)

        {
        }

        /**
         * AIが生成したSyncTaskDtoのリスト
         */
        public record SyncTaskList(
                        List<SyncTaskDto> tasks,
                        String advice,
                        String projectTitle) {
        }

        /**
         * 同期処理の結果
         */
        public record SyncResult(
                        boolean success,
                        String message,
                        int createdCount,
                        int updatedCount,
                        int deletedCount) {
        }

        /**
         * 会話型タスク管理リクエスト (分析・提案用)
         */
        public record ChatAnalysisRequest(
                        String conversationId,
                        String prompt,
                        List<SyncTaskDto> currentTasks,
                        String projectTitle) {
        }

        // Deprecated or removed? Kept for compatibility if needed, but SyncTaskDto
        // usage preferred.
        // ChatToolRequest using ParsedTask might be broken if ParsedTask is not
        // aligned.
        // Assuming we don't use chatWithTools anymore.

        /**
         * 会話型タスク管理レスポンス
         */
        public record ChatResponse(
                        String message,
                        SyncTaskList result,
                        boolean success,
                        String suggestedTitle) {
        }
}
