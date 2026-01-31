
# タスクページ リファクタリング実装計画書

## 概要
現在のカードグリッド型UIを、Todoist/TickTickライクな**サイドバー + リスト/カンバンビュー**に完全刷新する。
加えて、サブタスク、サブリスト、繰り返しタスク（習慣）機能を実装する。

---

## 要件サマリー

### 1. UI/UXリニューアル
- [ ] **既存アイコンナビ維持**: 左端のアイコンサイドバー（60px）は現状維持
- [ ] **プロジェクトサイドバー追加**: リストページでのみ表示（200px）
- [ ] **スマートリスト**: 今日 / 明日 / 次の7日間 / 受信トレイ / 習慣
- [ ] **リストヘッダー**: リストページでのみ表示（プロジェクト名 + 進捗）※控えめに
- [ ] **メインビュー**: リスト表示のみ（カンバンは不要）
- [ ] **詳細パネル（右側）**: タスククリック時に詳細編集パネルを表示

#### レイアウト構成
```
┌──────┬────────────┬───────────────────────────────────────┬──────────────┐
│      │            │  Work (3/4) ████░░░░                  │              │ ← 控えめインライン
│ Icon │  Project   ├───────────────────────────────────────┤    Detail    │
│ Nav  │  Sidebar   │  ┌ └＋ │ タスクを追加...   ⏱ 📅 ─┐  │    Panel     │ ← 統一フォーム
│      │ (リスト    │  └────────────────────────────────┘  │  (任意表示)   │
│ 60px │ ページのみ) ├───────────────────────────────────────┤    320px     │
│      │   200px    │  タスクリスト (スクロール領域)         │              │
└──────┴────────────┴───────────────────────────────────────┴──────────────┘
```

#### リストヘッダー仕様
- **スタイル**: 控えめなインライン表示（大きなヘッダーではない）
- **内容**: プロジェクト名 + 進捗バー
- **高さ**: 40-48px程度

#### タスクフォーム仕様
- **位置**: 常に上部に固定表示（スクロールしても見える）
- **デザイン**: 統一フォーム（1つのコンテナ内にインライン配置）

**通常時**
```
┌─────────────────────────────────────────────────────┐
│ └＋ │  タスクを追加...          ○○○○ ▲   📅     │
└─────────────────────────────────────────────────────┘
```

**展開時（サブタスクあり）**
```
┌─────────────────────────────────────────────────────┐
│ └▼ │  レポート作成         ●●●○ ▲  1/5       │
├─────┴──────────────────────────────────────────────┤
│     └ □ 調査する                          [×]     │
│     └ □ 執筆する                          [×]     │
│     └ □ [入力中...]                               │
└─────────────────────────────────────────────────────┘
```

**要素**
| アイコン | 機能 |
|----------|------|
| └＋ / └▼ | サブタスク入力欄の展開/折りたたみ |
| タイトル | タスク名入力 |
| 縦積みバー | 予想ポモドーロ数（ホイールで増減） |
| 📅 | 日付ピッカー |

**予想ポモドーロ入力**
- **アイコン**: 横長バーを縦に4つ積んだ形状
  ```
  3🍅の場合:   0🍅の場合:   4🍅の場合:
     ═══          ═══          ███
     ███          ═══          ███
     ███          ═══          ███
     ███          ═══          ███
  ```
- **操作**:
  - ホイール↑ → +1🍅（バーが下から上に埋まる）
  - ホイール↓ → -1🍅（バーが上から減る）
  - クリック → 展開ピッカー表示
- **展開（ピッカー）**: アイコンクリックで開く、シンプルな数字+矢印
  ```
  ┌─────────┐
  │    ▲    │
  │  6 🍅   │
  │ = 150分 │
  │    ▼    │
  └─────────┘
  ```
- **5🍅以上の表示**: `三+2`（4本バー + "+N"）
- **保存値**: ポモドーロ数（`estimatedPomodoros: 3`）

**サブタスク入力の挙動**
- `Enter`（入力あり）→ 保存 & 新しい空フォーム追加
- `Enter`（空）or `Escape` → 終了、空フォーム消える
- `[×]` → そのサブタスク削除

**日付入力**
- **未選択時**: `📅` アイコンのみ表示
- **選択後**: 値のみ表示（アイコン不要）

| モード | 表示例 | 説明 |
|--------|--------|------|
| 単一 | `1/5` | 期限日 |
| 期間 | `1/5-1/10` | 開始〜終了 |
| 繰り返し | `🔄毎日` | 習慣タスク |

**展開ピッカー（3タブ）**
```
┌─────────────────────────────────────┐
│ [単一] [期間] [繰り返し]             │
├─────────────────────────────────────┤
│ 【単一】                            │
│  今日  明日  来週  日付なし          │
│  ┌──── カレンダー ────┐            │
├─────────────────────────────────────┤
│ 【期間】                            │
│  開始: 1/5  →  終了: 1/10           │
├─────────────────────────────────────┤
│ 【繰り返し】                        │
│  頻度: [毎日▼] [毎週▼] [毎月▼]      │
│  開始: 1/5  終了: 1/31  □無期限     │
│  曜日: [月][火][水][木][金][ ][ ]   │
└─────────────────────────────────────┘
```

#### スマートリスト定義
| スマートリスト | フィルター条件 |
|---------------|----------------|
| 📅 今日 | `dueDate = today` |
| 📆 明日 | `dueDate = tomorrow` |
| 📥 受信トレイ | `taskListId = null` (未割当) |
| 🔄 習慣 | `isRecurring = true` |

> 💡 **次の7日間** は Calendarページ（週間/月間ビュー）で対応

### 2. 階層構造
- [ ] **サブタスク**: 親タスクを細分化するチェックリスト
  - タイトル + 完了/未完了のみ（日付・予想時間・カテゴリなし）
  - 親タスクの予想時間がサブタスク全体をカバー
- [ ] **サブリスト/フォルダ**: リストを階層化（フォルダ構造）

#### サブタスク入力方法
**1. タスクフォームでクイック作成**
```
┌─ ▼子 ─┬─ レポート作成 ─┬─ 📅 ─┬─ ⏱️ ─┐
├────────┴─────────────────┴──────┴──────┤
│  └ □ 調査する                   [×]    │
│  └ □ 執筆する                   [×]    │
│  └ ＋ サブタスクを追加...               │
└─────────────────────────────────────────┘
```
- 「＋子」クリックでサブタスク入力欄を展開
- 親タスクと一緒に一括作成

**2. 詳細パネルで後から編集**
- 既存タスクをクリック → 詳細パネルを開く
- サブタスクの追加/編集/削除/並び替え


### 4. 繰り返し/習慣タスク
- [ ] **繰り返し設定**: 毎日/毎週/毎月/カスタム（特定曜日など）
- [ ] **自動生成**: 完了時に次の発生日でタスクを再生成 or リセット
- [ ] **習慣リスト**: サイドバーに「習慣」スマートリストを追加
- [ ] **ストリーク表示**: 連続達成日数の表示（オプション）

---

## コンポーネント修正案

### 新規コンポーネント

#### `PomodoroIndicator` - ポモドーロ数表示
```tsx
interface PomodoroIndicatorProps {
  value: number;           // 0-99
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md';      // sm: タスク行, md: フォーム
}
```
- **表示**: 縦積みバー（4本）+ 5以上は`+N`
- **操作**: ホイールで増減、クリックで展開ピッカー

#### `DatePicker` - 3モード日付入力
```tsx
interface DatePickerProps {
  mode: 'single' | 'range' | 'recurring';
  value: DateValue;        // Date | DateRange | RecurrenceRule
  onChange: (value: DateValue) => void;
}
```
- **単一**: `1/5`
- **期間**: `1/28-2/5`
- **繰り返し**: `🔄`

#### `SubtaskToggle` - サブタスク展開ボタン
```tsx
interface SubtaskToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  hasSubtasks: boolean;
}
```
- **アイコン**: `└＋` (未展開) / `└▼` (展開中)

### 既存コンポーネント修正

#### `CreateTaskForm.tsx` → `UnifiedTaskForm.tsx`

**修正前**: 2段構成（入力 + コントロール）
**修正後**: 1行インラインフォーム

```tsx
// 現在の構造
<div>
  <Input placeholder="タスク追加..." />
  <div className="controls">
    <CategorySelect />
    <DurationPicker />
    <DatePicker />
    <TaskListSelector />
    <SubmitButton />
  </div>
</div>

// 新しい構造
<div className="inline-form">
  <SubtaskToggle />           {/* 左端 */}
  <Input placeholder="タスクを追加..." />
  <PomodoroIndicator />       {/* 縦積みバー */}
  <DatePicker />              {/* 📅 or 日付 */}
</div>
{isSubtaskExpanded && (
  <SubtaskInputList />        {/* 展開時のみ */}
)}
```

**変更点**:
1. カテゴリ選択 → 詳細パネルに移動
2. 時間入力 → `PomodoroIndicator`（ポモドーロ数）に変更
3. 日付 → `DatePicker`（3モード対応）
4. サブタスクトグル追加
5. リストセレクタ → 削除（サイドバーで選択済み）
6. 送信ボタン → Enter送信のみ（ボタン不要）

#### `TaskItem.tsx` → `TaskRow.tsx`

**修正前**: 展開式（ホバーで詳細表示）
**修正後**: コンパクト1行表示

```tsx
// 現在の構造
<div className="task-item">
  <Checkbox />
  <EditableTitle />
  <div className="expand-on-hover">
    <CategorySelect />
    <TaskListSelector />
    <EditableDate />
    <EditableDuration />
    <DeleteButton />
  </div>
</div>

// 新しい構造 (クリックで詳細パネル、ホバー展開削除)
<div className="task-row">
  <Checkbox />
  <span className="title">{task.title}</span>
  {task.subtasks?.length > 0 && (
    <SubtaskProgress count={completedSubtasks} total={totalSubtasks} />
  )}
  <PomodoroIndicator value={task.estimatedPomodoros} readOnly />
  <DateDisplay value={task.dueDate} />
  <button className="detail-button" onClick={openDetailPanel}>
    ⋮  {/* 3点ボタン */}
  </button>
</div>
{/* サブタスクはインデント表示 */}
{task.subtasks?.map(subtask => (
  <SubtaskRow key={subtask.id} subtask={subtask} />
))}
```

**変更点**:
1. ホバー展開削除 → クリックで詳細パネル表示
2. カテゴリ・リスト選択削除 → 詳細パネルで編集
3. `PomodoroIndicator` 表示（編集は詳細パネル）
4. サブタスク行を別コンポーネントで表示

#### `CustomTaskList.tsx` → `TaskListView.tsx`

**修正前**: カード型（タスクリスト単位）
**修正後**: フラットリスト（ヘッダー + フォーム + リスト）

```tsx
// 新しい構造
<div className="task-list-view">
  {/* 控えめインラインヘッダー */}
  <ListHeader
    title={taskList.title}
    progress={completedCount / totalCount}
  />
  
  {/* 統一タスクフォーム（常時表示） */}
  <UnifiedTaskForm
    taskListId={taskList.id}
    onCreateTask={onCreateTask}
  />
  
  {/* タスクリスト */}
  <div className="task-list">
    {activeTasks.map(task => (
      <TaskRow
        key={task.id}
        task={task}
        onSelect={() => setSelectedTask(task)}
      />
    ))}
    
    {/* 完了済みセクション */}
    <CompletedSection tasks={completedTasks} />
  </div>
</div>

{/* 詳細パネル（選択時のみ） */}
{selectedTask && (
  <TaskDetailPanel
    task={selectedTask}
    onClose={() => setSelectedTask(null)}
  />
)}
```

### 新規コンポーネント一覧

| コンポーネント | 役割 |
|--------------|------|
| `UnifiedTaskForm` | 統一タスク入力フォーム |
| `TaskRow` | タスク1行表示 |
| `SubtaskRow` | サブタスク1行表示 |
| `PomodoroIndicator` | ポモドーロ数（縦積みバー）|
| `DatePicker` | 日付入力（3モード） |
| `SubtaskToggle` | └＋ / └▼ ボタン |
| `SubtaskInputList` | サブタスク入力欄（展開時） |
| `ListHeader` | リストヘッダー（控えめ） |
| `TaskDetailPanel` | 詳細パネル（右サイド） |
| `ProjectSidebar` | プロジェクトサイドバー |

### `TaskDetailPanel` 詳細仕様

#### レイアウト（Notion風）
```
┌─────────────────────────────────┐
│                            ✕   │ ← 閉じるボタン
├─────────────────────────────────┤
│ □ レポート作成を完成させる        │ ← タイトル（クリックで編集）
│                                 │
│ 説明を追加...                    │ ← 説明（境界なし、直接入力）
│                                 │   Markdown対応
│                                 │
├─────────────────────────────────┤
│ 📅 1/5  🍅 ███░ 3🍅  🏷️ Work    │ ← 属性（横並び）
│ 📁 プロジェクトX                 │
├─────────────────────────────────┤
│ サブタスク (2/3)                │
│ ☑ 調査する              [×]    │ ← 完了済み
│ ☑ 執筆する              [×]    │
│ □ 校正する              [×]    │ ← 未完了
│ ＋ サブタスクを追加...          │ ← 新規追加
├─────────────────────────────────┤
│ 作成: 1/3 10:30                 │ ← メタ情報
├─────────────────────────────────┤
│ 🗑️ タスクを削除                 │ ← 削除ボタン
└─────────────────────────────────┘
```

**説明欄（Notion風）**
- 境界/カードなし、タイトル直下にシームレス配置
- クリックで直接入力可能
- Markdown対応: `**太字**` `_斜体_` `- リスト` `[ ] チェック`

#### 編集可能項目

| 項目 | 編集方法 |
|------|---------|
| タイトル | クリック → インライン編集 → Enter/外クリックで保存 |
| 説明文 | クリック → テキストエリア展開 → 外クリックで保存 |
| 日付 | クリック → DatePicker（3モード）展開 |
| ポモドーロ | ホイール or クリック → ピッカー展開 |
| カテゴリ | クリック → ドロップダウン選択 |
| リスト | クリック → ドロップダウン選択（タスク移動）|

#### サブタスク操作

| 操作 | 方法 |
|------|------|
| 追加 | 「＋サブタスクを追加」クリック → 入力欄表示 → Enter |
| 編集 | タイトルクリック → インライン編集 → Enter/外クリック |
| 削除 | [×] クリック → 即削除（確認なし）|
| 完了/未完了 | チェックボックスクリック |
| 並び替え | ドラッグ&ドロップ（オプション）|

#### ポモドーロ編集（詳細パネル内）

```
通常表示:
│ 🍅  ███░  3🍅 (75分)            │

編集時（クリック or ホイール）:
│ 🍅  ┌─────────┐                 │
│     │    ▲    │                 │
│     │  3 🍅   │                 │
│     │ = 75分  │                 │
│     │    ▼    │                 │
│     └─────────┘                 │
```

---

## データモデル変更

### 既存テーブル変更

#### `task_lists` テーブル
```sql
ALTER TABLE task_lists ADD COLUMN order_index INT DEFAULT 0;
```

#### `tasks` テーブル
```sql
-- サブタスク用
ALTER TABLE tasks ADD COLUMN parent_task_id BIGINT NULL REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN order_index INT DEFAULT 0;

-- ポモドーロ数（既存のestimatedDurationから変更）
ALTER TABLE tasks ADD COLUMN estimated_pomodoros INT DEFAULT 0;

-- 期間対応
ALTER TABLE tasks ADD COLUMN start_date DATE NULL;
ALTER TABLE tasks ADD COLUMN end_date DATE NULL; -- 既存のdue_dateと併用

-- 繰り返しタスク用
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_rule VARCHAR(255) NULL; -- JSON: {frequency, interval, daysOfWeek, endDate}
ALTER TABLE tasks ADD COLUMN recurrence_parent_id BIGINT NULL REFERENCES tasks(id);

-- 説明文（Markdown対応）
ALTER TABLE tasks ADD COLUMN description TEXT NULL;
```

### 新規テーブル

#### `subtasks` テーブル（シンプルなサブタスク）
```sql
CREATE TABLE subtasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
※ サブタスクはタイトルと完了状態のみ（日付・ポモドーロなし）

---

## フェーズ別実装計画

### Phase 1: データモデル & バックエンドAPI (目安: 2-3日)
1. Flywayマイグレーションスクリプト作成
   - `tasks` テーブル変更（ポモドーロ数、期間、説明文、繰り返し）
   - `subtasks` テーブル新規作成
2. Entity更新 (`Task`, 新規 `Subtask`)
3. Repository更新
4. Service更新
   - サブタスクCRUDロジック
   - 繰り返しタスクの生成ロジック
5. Controller/DTO更新
6. BFF層の対応

### Phase 2: フロントエンドStoreリファクタリング (目安: 1日)
1. `useTodoStore` をサブタスク対応に修正
2. 型定義更新 (`Task`, `Subtask` types)
3. サブタスク管理ロジック追加
4. 繰り返しタスク状態管理

### Phase 3: 共通コンポーネント実装 (目安: 2日)
1. `PomodoroIndicator` - 縦積みバー、ホイール操作
2. `DatePicker` - 3モード（単一/期間/繰り返し）
3. `SubtaskToggle` - └＋ / └▼
4. `SubtaskInputList` - サブタスク入力欄

### Phase 4: サイドバー実装 (目安: 1-2日)
1. `ProjectSidebar` コンポーネント作成
2. スマートリスト（今日/明日/受信トレイ/習慣）
3. プロジェクト一覧
4. プロジェクト作成/編集/削除

### Phase 5: リストビュー実装 (目安: 2-3日)
1. `TaskListView` コンポーネント作成
2. `ListHeader` - 控えめインラインヘッダー
3. `UnifiedTaskForm` - 統一タスクフォーム（└＋、ポモドーロ、日付）
4. `TaskRow` - タスク1行表示（⋮ボタン付き）
5. `SubtaskRow` - サブタスク表示
6. `CompletedSection` - 完了済みセクション

### Phase 6: 詳細パネル実装 (目安: 2日)
1. `TaskDetailPanel` コンポーネント作成
2. タイトル編集（インライン）
3. 説明文編集（Notion風、Markdown対応）
4. 日付設定（DatePicker統合）
5. ポモドーロ編集（PomodoroIndicator統合）
6. カテゴリ/リスト選択
7. サブタスク管理（追加/編集/削除/並び替え）
8. 削除ボタン

### Phase 7: 繰り返しタスク機能 (目安: 1-2日)
1. 繰り返し設定UI（DatePicker内）
   - 頻度選択（毎日/毎週/毎月）
   - 曜日選択（週次の場合）
   - 終了条件（無期限/日付）
2. バックエンド: 完了時の次タスク生成ロジック
3. 「習慣」スマートリスト表示

### Phase 8: 統合 & クリーンアップ (目安: 1日)
1. 旧 `TodoView` を新UIに置き換え
2. 旧コンポーネント削除 (`CustomTaskList`, `TaskItem` など)
3. ルーティング調整
4. テスト & バグ修正
5. レスポンシブ対応（モバイル）

---

## 画面構成案

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]   タイトル                              [User]  [Settings] │
├────────────┬─────────────────────────────────┬───────────────────┤
│            │                                 │                   │
│  SIDEBAR   │         MAIN VIEW               │   DETAIL PANEL    │
│            │                                 │   (Optional)      │
│ ─────────  │  [Project Name]  [List][Board]  │                   │
│ 📥 Inbox   │                                 │   Task Title      │
│ 📅 今日    │  ─ Section: To Do ─────────     │   ────────────    │
│ 📆 予定    │  □ Task 1           Today 🔁   │   Description     │
│ 🔄 習慣    │    └ □ Subtask 1-1             │   Due: 1/3        │
│            │    └ □ Subtask 1-2             │   Category: Work  │
│ ─────────  │  □ Task 2           1/5        │   Repeat: Daily   │
│ 📁 Work    │                                 │                   │
│   Project A│  ─ Section: Done ──────────     │   Subtasks:       │
│   Project B│  ☑ Task 3 (strikethrough)      │   □ Sub 1         │
│ 📁 Personal│                                 │   ☑ Sub 2         │
│            │  [+ Add Task]                   │                   │
│            │                                 │   [Delete]        │
│ [+ Add]    │                                 │                   │
└────────────┴─────────────────────────────────┴───────────────────┘
```

---

## 技術スタック（変更なし）
- **Frontend**: React + TypeScript + Zustand + @dnd-kit + Recharts
- **Backend**: Spring Boot (Resource Server + BFF)
- **Database**: MySQL (Flyway for migrations)
- **Styling**: Tailwind CSS (or Vanilla CSS) + shadcn/ui

---

## 優先度と推奨実装順序

1. **Phase 1 (Backend)** ← まずここから。データ構造が全ての基盤。
2. **Phase 2 (Store)** ← フロントの土台。
3. **Phase 3-4 (Sidebar + List View)** ← 基本UIの完成。
4. **Phase 5 (Kanban)** ← リストビュー完成後に着手。
5. **Phase 6-7 (Detail + Recurring)** ← 機能の肉付け。
6. **Phase 8 (Cleanup)** ← 最終仕上げ。

---

## 備考
- 既存の `HomeView`（ポモドーロ連携画面）は残す。今日のタスク表示 + タイマー起動に使用。
- 既存の `Analytics` 機能は影響を受けない（データソースは同じ `tasks` テーブル）。
- サブタスクの `focus_session` 連携は後日検討（現状は親タスクのみ対象）。
