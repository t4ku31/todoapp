-- Phase 1: Task Page Refactor - Tasks table changes
-- Add support for: subtasks (parent_task_id), pomodoro count, date range, recurring, description

-- ポモドーロ数（既存のestimated_durationは分単位、これはポモドーロ単位）
ALTER TABLE tasks ADD COLUMN estimated_pomodoros INT DEFAULT 0;

-- 期間対応（開始日と終了日）
ALTER TABLE tasks ADD COLUMN start_date DATE NULL;

ALTER TABLE tasks ADD COLUMN end_date DATE NULL;

-- 説明文（Markdown対応）
ALTER TABLE tasks ADD COLUMN description TEXT NULL;

-- 繰り返しタスク用
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

ALTER TABLE tasks ADD COLUMN recurrence_rule VARCHAR(500) NULL;
-- JSON: {frequency, interval, daysOfWeek, endDate}
ALTER TABLE tasks ADD COLUMN recurrence_parent_id BIGINT NULL;

-- 表示順序
ALTER TABLE tasks ADD COLUMN order_index INT DEFAULT 0;

-- 外部キー制約（繰り返し親タスク）
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_recurrence_parent FOREIGN KEY (recurrence_parent_id) REFERENCES tasks (id) ON DELETE SET NULL;

-- 既存のestimated_duration（分単位）を削除
ALTER TABLE tasks DROP COLUMN estimated_duration;