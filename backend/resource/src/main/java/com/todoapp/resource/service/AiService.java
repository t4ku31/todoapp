package com.todoapp.resource.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.todoapp.resource.dto.TaskDto;
import com.todoapp.resource.repository.CategoryRepository;
import com.todoapp.resource.repository.ChatMemoryEntityRepository;
import com.todoapp.resource.repository.ConversationRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * AI機能を提供するサービス
 * 会話型タスク管理に統一
 */
@Slf4j
@Service
public class AiService {

    private final ChatClient chatClient;
    private final ChatClient conversationalChatClient;

    private final AiConversationService conversationService;
    private final ConversationRepository conversationRepository;

    private final ChatMemoryEntityRepository chatMemoryRepository;
    private final CategoryRepository categoryRepository;

    // ==============================================================================================
    // System Prompts
    // ==============================================================================================

    private static final String SYSTEM_PROMPT = """
            あなたは「タスク管理システムのインテリジェント・エージェント」です。
            ユーザーの自然言語による指示を受け取り、現在のタスクリスト（JSON）に対する【差分（変更点）のみ】を提案してください。

            ## 重要な変更点
            **変更のないタスクはレスポンスに含めないでください。**
            以下のルールに従って、変更・追加・削除があったタスクのみを配列で返してください。

            ## 操作ごとのルール

            1. **【変更・更新 (Update)】**
               - 既存タスクの値を変更する場合。
               - アクション: 変更後の値を持つタスクオブジェクトを作成し、**originalIdは必ず維持**して返してください。
               - `isDeleted`: false (または省略)

            2. **【新規追加 (Create)】**
               - 新しいタスクを追加する場合。
               - アクション: 新規タスクオブジェクトを作成し、`originalId` は `null` にしてください。
               - `isDeleted`: false (または省略)

            3. **【削除 (Delete)】**
               - 既存タスクを削除する場合。
               - アクション: 対象タスクのオブジェクトを作成し、**originalIdを維持**した上で、`isDeleted`: `true` に設定してください。
               - 他のフィールド（タイトルなど）は元のままで構いません。

            4. **【変更なし (No Change)】**
               - **出力配列に含めないでください。**

            5. **【副作用の禁止 (Strict Modification)】**
               - **ユーザーが明示したフィールド以外は絶対に変更しないでください。**
               - 例: 「日付を変更して」と言われた場合、タイトルや詳細を変更してはいけません。
               - 例: 「カテゴリをAにして」と言われた場合、それ以外の属性（日付など）は元の値を維持してください。

            ## デフォルト日付ルール
            ユーザーが実行日・期日を明示しない場合、`scheduledStartAt` に今日の日付を
            "YYYY-MM-DDT09:00:00" 形式で設定し、`isAllDay` を `true` にしてください。
            ユーザーが具体的な時刻を指定した場合は `isAllDay` を `false` にしてください。

            ## カテゴリ自動付与ルール
            以下はユーザーが登録済みのカテゴリ一覧です。
            タスクの内容にふさわしいカテゴリがあれば `categoryName` に設定してください。
            どれにも該当しない場合は `categoryName` を省略してください。
            新しいカテゴリを勝手に作成しないでください。
            %s

            ## タスク分解のガイドライン
            ユーザーが複数のアイテムを列挙した場合、以下の基準で判断してください：

            **1タスク＋サブタスクとして作成すべきケース（親子構造を優先）:**
            - コロン（：）、ダッシュ（ー）、改行、矢印（→）などを用いて、ある項目の下に要素が並んでいる場合。
            - 最初の項目が「まとめ」や「プロジェクト名」のような役割を果たしている場合（例：「旅行の準備：A、B、C」）。
            - 項目間に構成要素・手順としての関係がある場合（例：「資料作成：分析、執筆」）。
            - 「〜のサブタスクは〜」と明示されている場合。

            **個別タスクとして作成すべきケース:**
            - 各項目が完全に独立しており、共通の親テーマがない場合（例：「牛乳を買う。あとメール送る」）。
            - 単純に並列なアイテムを列挙している場合。

            迷った場合は**親タスク＋サブタスク**の構造を優先的に検討してください。

            ## 思考プロセス例
            ユーザー: 「実行日を明日にして」
            コンテキスト: [A(id:1, date:今日), B(id:2, date:今日)]
            思考: AとB両方とも日付が変わる。
            出力: [A(id:1, date:明日), B(id:2, date:明日)]

            ユーザー: 「Cを追加して」
            コンテキスト: [A(id:1), B(id:2)]
            思考: AとBは変更なし。Cは新規。
            出力: [C(id:null, title:C)] (AとBは含めない)

            ユーザー: 「Aを削除して」
            コンテキスト: [A(id:1), B(id:2)]
            思考: Aは削除。Bは変更なし。
            出力: [A(id:1, isDeleted:true)]

            ユーザー: 「旅行の準備：パッキング、チケット予約、保険加入」
            思考: 「旅行の準備」という親テーマに対し、具体的な項目がコロンで続いているため、1タスク＋3サブタスクにする。
            出力: [{title:"旅行の準備", subtasks:[{title:"パッキング"}, {title:"チケット予約"}, {title:"保険加入"}]}]

            ユーザー: 「買い物：牛乳、卵、パン」
            思考: 「買い物」という親タスクの下に、各アイテムをサブタスクとして配置する。
            出力: [{title:"買い物", subtasks:[{title:"牛乳"}, {title:"卵"}, {title:"パン"}]}]

            ## タスクプロパティの定義
            各タスクオブジェクトは以下のプロパティを持ちます。適切に設定してください。

            - `id` (Long): 既存タスクの更新・削除時は【最重要】。現在のリストのIDを必ず一字一句違わずに維持してください。新規作成時は `null`。
            - `title` (String): タスクのタイトル（必須）。
            - `description` (String): タスクの詳細。
            - `scheduledStartAt` (String): 開始日時 ("YYYY-MM-DDTHH:mm:ss")。
            - `scheduledEndAt` (String): 終了日時 ("YYYY-MM-DDTHH:mm:ss")。
            - `isAllDay` (Boolean): 終日タスク。
            - `estimatedPomodoros` (Integer): 推定ポモドーロ。
            - `categoryName` (String): カテゴリ名。
            - `suggestedTaskList` (String): タスクリスト名。
            - `isRecurring` (Boolean): 繰り返しフラグ。期間指定や回数指定がある場合も必ず true にしてください。
            - `recurrenceRule` (Object): 繰り返しルール。**以下のJSONオブジェクト**を設定してください。
              - **JSONキーはDTO定義に準拠します (小文字)**:
                - `frequency`: 頻度 ("DAILY", "WEEKLY", "MONTHLY", "YEARLY")
                - `interval`: 間隔 (整数, デフォルト: 1)。例: "2週間ごと"なら 2
                - `byDay`: 曜日リスト (例: ["MONDAY", "WEDNESDAY", "FRIDAY"])。JavaのDayOfWeek形式(全大文字の英単語)。
                - `count`: 回数 (整数)
                - `until`: 終了日 ("YYYY-MM-DD")
              - **フォーマット例**:
                - 毎日: `{"frequency": "DAILY"}`
                - 2週間ごと(水・金): `{"frequency": "WEEKLY", "interval": 2, "byDay": ["WEDNESDAY", "FRIDAY"]}`
                - 毎月: `{"frequency": "MONTHLY"}`
                - 週末(土日): `{"frequency": "WEEKLY", "byDay": ["SATURDAY", "SUNDAY"]}`
                - 回数指定(5回): `{"frequency": "WEEKLY", "byDay": ["SATURDAY"], "count": 5}`
                - 期限指定(日付): `{"frequency": "DAILY", "until": "2023-12-31"}`

            - `subtasks` (List<Object>): サブタスクのリスト（各要素は { "title": "...", "isCompleted": false }）。
            - `isDeleted` (Boolean): 削除時は `true` に設定し、`id` を維持してください。
            - `status` (String): タスクのステータス ("PENDING", "COMPLETED")。

            ## 応答形式
            必ず以下のJSON形式で応答してください:
            - projectTitle: プロジェクト名（あれば）
            - tasks: タスクの配列（**変更・追加・削除があったもののみ**）
            - advice: 実行した操作の簡潔な説明

            ## 今日の日付
            %s

            ## CurrentContextTask
            ここにあるタスクのみを操作対象としてください:
            %s

            ユーザーの発言を解釈し、差分更新データを生成してください。
            """;

    public AiService(
            ChatClient.Builder chatClientBuilder,
            ChatMemory chatMemory,
            AiConversationService conversationService,
            ConversationRepository conversationRepository,
            ChatMemoryEntityRepository chatMemoryRepository,
            CategoryRepository categoryRepository) {
        // Build the basic chatClient first
        this.chatClient = chatClientBuilder.build();

        // Build the conversationalChatClient independently to avoid side effects on the
        // builder
        // Using chatClient.mutate() is a safe way to get a new builder based on the
        // current client configuration
        this.conversationalChatClient = this.chatClient.mutate()
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();

        this.conversationService = conversationService;
        this.conversationRepository = conversationRepository;
        this.chatMemoryRepository = chatMemoryRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * 会話型タスク管理のメイン処理
     *
     * @param conversationId 会話ID
     * @param userId         認証済みユーザーID
     * @param userInput      ユーザーの入力
     * @param currentTasks   現在のタスクリスト (DTO, with String/Long IDs)
     * @param projectTitle   プロジェクト名（あれば）
     * @return チャット結果（プレビュー用のタスクリスト + 生成タイトル）
     */
    public ChatResult chat(String conversationId, String userId, String userInput,
            List<TaskDto.SyncTaskDto> currentTasks,
            String projectTitle) {
            
        // 操作対象の会話が存在する場合、自身の所有物かチェック
        java.util.Optional<com.todoapp.resource.model.Conversation> convOpt = conversationRepository.findById(conversationId);
        if (convOpt.isPresent() && !convOpt.get().getUserId().equals(userId)) {
            log.warn("[Security] Unauthorized access attempt: user {} tried to chat in conversation {}", userId, conversationId);
            throw new org.springframework.security.access.AccessDeniedException("この会話に対するアクセス権限がありません。");
        }

        // 初回メッセージかどうかをチェック（AIリクエスト前にカウント）
        int messageCount = conversationRepository.countChatMessages(conversationId);
        boolean isFirstMessage = (messageCount == 0);
        log.debug("AI Chat - messageCount: {}, isFirstMessage: {}", messageCount, isFirstMessage);

        String todayDate = LocalDate.now().toString();
        String tasksContext = formatTasksContextAsJson(currentTasks, projectTitle);
        String categoriesContext = formatCategoriesContext(userId);
        
        String systemPrompt = String.format(SYSTEM_PROMPT, categoriesContext, todayDate, tasksContext);

        String generatedTitle = null;

        try {
            String responseContent = conversationalChatClient.prompt()
                    .system(systemPrompt)
                    .user(userInput)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();

            String cleanedResponse = cleanJsonResponse(responseContent);
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            TaskDto.SyncTaskList result = mapper.readValue(cleanedResponse, TaskDto.SyncTaskList.class);

            log.debug("AI Chat result - advice: {}", result.advice());
            log.debug("AI Chat result - tasks: {}", result.tasks());
            // 初回メッセージの場合、タイトルを自動生成
            if (isFirstMessage) {
                log.debug("First message detected, generating title...");
                generatedTitle = generateConversationTitle(userInput);
                conversationService.updateTitle(conversationId, generatedTitle, userId);
                log.debug("Generated and saved title: {}", generatedTitle);
            }
            return new ChatResult(result, generatedTitle);
        } catch (Exception e) {
            log.error("AI Chat failed: {}", e.getMessage(), e);
            throw new RuntimeException("タスク管理の処理に失敗しました: " + e.getMessage(), e);
        }
    }

    /**
     * チャット結果（タスクリスト + 生成タイトル）
     */
    public record ChatResult(
            TaskDto.SyncTaskList result,
            String generatedTitle) {
    }

    /**
     * シンプルなテキスト生成（デバッグ用）
     */
    public String generate(String userInput) {
        log.debug("Generating AI response for input: {}", userInput);
        return chatClient.prompt()
                .user(userInput)
                .call()
                .content();
    }

    /**
     * 会話の最初のメッセージからタイトルを自動生成
     * 
     * @param firstUserMessage ユーザーの最初のメッセージ
     * @return 生成されたタイトル（3〜8語程度）
     */
    public String generateConversationTitle(String firstUserMessage) {
        log.debug("Generating conversation title for: {}", firstUserMessage);
        try {
            String prompt = String.format("""
                    以下のユーザーメッセージから、この会話の内容を表す簡潔なタイトルを生成してください。

                    ルール：
                    - 3〜8語程度の短いタイトル
                    - 日本語で出力
                    - 絵文字は使用しない
                    - 「〜について」「〜の相談」などの接尾語は不要
                    - タイトルのみを出力（説明や引用符は不要）

                    ユーザーメッセージ：
                    %s

                    タイトル：
                    """, firstUserMessage);

            String title = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            // 改行や余分な空白を除去
            title = title != null ? title.trim().replaceAll("[\"']", "") : "New Chat";
            log.debug("Generated title: {}", title);
            return title.isEmpty() ? "New Chat" : title;
        } catch (Exception e) {
            log.error("Failed to generate title: {}", e.getMessage());
            return "New Chat";
        }
    }

    /**
     * 現在のタスクリストをコンテキスト用のJSON文字列に変換
     */
    /**
     * 現在のタスクリストをコンテキスト用のJSON文字列に変換
     */
    private String formatTasksContextAsJson(List<TaskDto.SyncTaskDto> tasks,
            String projectTitle) {
        if (tasks == null || tasks.isEmpty()) {
            return "[]";
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

            StringBuilder sb = new StringBuilder();
            if (projectTitle != null) {
                sb.append("プロジェクト: ").append(projectTitle).append("\n");
            }
            sb.append(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(tasks));
            return sb.toString();
        } catch (Exception e) {
            log.error("Failed to format tasks context as JSON", e);
            return "[]";
        }
    }

    /**
     * ユーザーの登録済みカテゴリをプロンプト用の文字列に変換
     */
    private String formatCategoriesContext(String userId) {
        try {
            List<com.todoapp.resource.model.Category> categories = categoryRepository.findAllByUserId(userId);
            if (categories.isEmpty()) {
                return "（カテゴリ未登録）";
            }
            StringBuilder sb = new StringBuilder();
            for (com.todoapp.resource.model.Category c : categories) {
                sb.append("- ").append(c.getName()).append("\n");
            }
            return sb.toString().trim();
        } catch (Exception e) {
            log.error("Failed to fetch categories for user: {}", userId, e);
            return "（カテゴリ取得失敗）";
        }
    }

    // toSyncTaskDto might not be needed for context generation anymore if we use
    // AiContextTask directly.
    // However, if we need to convert Task entity to AiContextTask elsewhere, we
    // might keep a converter.
    // For now, the chat context uses the incoming DTOs directly.

    public List<com.todoapp.resource.dto.MessageDto> getMessages(String userId, String conversationId) {
        // 対象の会話履歴が存在する場合、自身の所有物かチェック
        java.util.Optional<com.todoapp.resource.model.Conversation> convOpt = conversationRepository.findById(conversationId);
        if (convOpt.isPresent() && !convOpt.get().getUserId().equals(userId)) {
            log.warn("[Security] Unauthorized GET messages attempt: user {} for conversation {}", userId, conversationId);
            throw new org.springframework.security.access.AccessDeniedException("この会話に対するアクセス権限がありません。");
        }

        log.debug("[AiService] getMessages - fetching messages for conversationId: {}", conversationId);
        List<com.todoapp.resource.model.ChatMemoryEntity> entities = chatMemoryRepository
                .findByConversationIdOrderByTimestampAsc(conversationId);
        log.debug("[AiService] getMessages - fetched {} messages", entities.size());

        return entities.stream()
                .map(entity -> com.todoapp.resource.dto.MessageDto.builder()
                        .role(entity.getType().name().toLowerCase())
                        .content(entity.getContent())
                        .createdAt(entity.getTimestamp())
                        .build())
                .toList();
    }

    private String cleanJsonResponse(String response) {
        if (response == null) {
            return "{}";
        }
        String cleaned = response.trim();
        // Markdown code block removal
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
}
