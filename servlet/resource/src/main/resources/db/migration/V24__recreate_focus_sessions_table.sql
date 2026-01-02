-- Recreate focus_sessions table to support detailed session tracking and flow handling

DROP TABLE IF EXISTS focus_sessions;

CREATE TABLE focus_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    task_id BIGINT,

-- Session type and status
session_type VARCHAR(50) NOT NULL, -- 'FOCUS', 'SHORT_BREAK', 'LONG_BREAK'
status VARCHAR(50) NOT NULL, -- 'COMPLETED', 'INTERRUPTED'

-- Duration tracking
scheduled_duration INT NOT NULL, -- Planned duration in seconds
    actual_duration INT NOT NULL,    -- Actual duration in seconds (including overtime)
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_focus_sessions_tasks FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX idx_focus_sessions_user_id ON focus_sessions (user_id);

CREATE INDEX idx_focus_sessions_started_at ON focus_sessions (started_at);