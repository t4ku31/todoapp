-- Create focus_sessions table for tracking focus time
CREATE TABLE focus_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    task_id BIGINT,
    date DATE NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_focus_session_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT unique_user_date_task UNIQUE (user_id, date, task_id)
);

-- Index for user queries
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_user_date ON focus_sessions(user_id, date);
