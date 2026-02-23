-- タスクリストを管理するテーブル
CREATE TABLE tasklists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, -- タスクリストのID
    user_id BIGINT NOT NULL,              -- 紐づくユーザーのID
    name VARCHAR(255) NOT NULL,           -- タスクリストの名前
    due_date DATE,                        -- タスクリストの締切日
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新日時
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 外部キー制約
);
