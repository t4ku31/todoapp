-- Phase 1: Task Page Refactor - Create subtasks table
-- サブタスクはシンプル（タイトルと完了状態のみ、日付・ポモドーロなし）

CREATE TABLE subtasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- インデックス追加（タスクIDでの検索を高速化）
CREATE INDEX idx_subtasks_task_id ON subtasks (task_id);