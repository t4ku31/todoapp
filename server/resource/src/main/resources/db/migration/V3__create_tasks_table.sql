CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, -- タスクのID
    task_list_id BIGINT NOT NULL,         -- 紐づくタスクリストのID
    user_id BIGINT NOT NULL,              -- 紐づくユーザーのID
    title VARCHAR(255) NOT NULL,          -- タスクのタイトル
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING', -- タスクの状態
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新日時
    FOREIGN KEY (task_list_id) REFERENCES tasklists(id) ON DELETE CASCADE, -- 外部キー制約
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 外部キー制約
);