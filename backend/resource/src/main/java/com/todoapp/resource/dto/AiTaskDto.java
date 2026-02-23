package com.todoapp.resource.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * AI機能関連のDTO
 * 会話型タスク管理に統一
 */
public class AiTaskDto {

    // ============================================
    // AIがパースするタスク情報 (PreviewTask)
    // ============================================

    /**
     * ツール用の更新内容（日付は文字列）
     */
    @Schema(name = "AiUpdateContent", description = "タスク更新内容")
    public record UpdateContent(
            @JsonPropertyDescription("新しいタイトル") String title,
            @JsonPropertyDescription("新しいステータス（PENDING, IN_PROGRESS, COMPLETED, CANCELLED）") String status,
            @JsonPropertyDescription("新しい実行日（YYYY-MM-DD形式）") String startDate,
            @JsonPropertyDescription("新しいカテゴリID") Long categoryId,
            @JsonPropertyDescription("新しいカテゴリ名") String categoryName,
            @JsonPropertyDescription("移動先のタスクリストID") Long taskListId,
            @JsonPropertyDescription("移動先のタスクリスト名") String taskListTitle,
            @JsonPropertyDescription("新しい推定ポモドーロ数") Integer estimatedPomodoros,
            @JsonPropertyDescription("繰り返しタスクかどうか") Boolean isRecurring,
            @JsonPropertyDescription("繰り返しルール") String recurrenceRule,
            @JsonPropertyDescription("説明文") String description,
            @JsonPropertyDescription("開始日時（YYYY-MM-DDTHH:mm:ss形式）") String scheduledStartAt,
            @JsonPropertyDescription("終了日時（YYYY-MM-DDTHH:mm:ss形式）") String scheduledEndAt,
            @JsonPropertyDescription("終日イベントかどうか") Boolean isAllDay) {
    }
    // ============================================
    // 会話型タスク管理API
    // ============================================

    /**
     * 会話型タスク管理リクエスト (Chat)
     */
    @Schema(name = "ChatAnalysisRequest")
    public record ChatAnalysisRequest(
            @Schema(description = "会話ID（省略時はユーザーIDが使用される）") String conversationId,

            @Schema(description = "ユーザーの発言（自然言語）", example = "明日のミーティング準備を追加して") String prompt,

            @Schema(description = "現在のタスクリスト（ドメインモデル）") List<TaskDto.SyncTaskDto> currentTasks,

            @Schema(description = "プロジェクトタイトル（オプション）") String projectTitle) {
    }

    /**
     * 会話型タスク管理レスポンス
     */
    @Schema(name = "AiChatResponse")
    public record ChatResponse(
            @Schema(description = "処理結果メッセージ") String message,

            @Schema(description = "更新後のタスクリスト (Preview)") TaskDto.SyncTaskList result,

            @Schema(description = "処理成功フラグ") boolean success,

            @Schema(description = "自動生成されたタイトル（New Chatから変更された場合のみ）") String suggestedTitle) {

        public static ChatResponse success(TaskDto.SyncTaskList taskList) {
            return success(taskList, null);
        }

        public static ChatResponse success(TaskDto.SyncTaskList taskList, String suggestedTitle) {
            String advice = taskList.advice() != null ? taskList.advice() : "タスクを更新しました";
            return new ChatResponse(advice, taskList, true, suggestedTitle);
        }

        public static ChatResponse error(String message) {
            return new ChatResponse(message, null, false, null);
        }
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

}
