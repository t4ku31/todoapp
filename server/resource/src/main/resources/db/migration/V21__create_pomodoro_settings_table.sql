CREATE TABLE pomodoro_settings (
    user_id VARCHAR(255) PRIMARY KEY COMMENT 'Auth0 sub claim',
    focus_duration INT NOT NULL DEFAULT 25,
    short_break_duration INT NOT NULL DEFAULT 5,
    long_break_duration INT NOT NULL DEFAULT 15,
    long_break_interval INT NOT NULL DEFAULT 4,
    is_long_break_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_goal INT NOT NULL DEFAULT 120 COMMENT 'Daily goal in minutes',
    auto_advance BOOLEAN NOT NULL DEFAULT FALSE,
    white_noise VARCHAR(50) NOT NULL DEFAULT 'none',
    volume DOUBLE NOT NULL DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);