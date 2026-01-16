-- Phase 1: Calendar Refactor - Add time scheduling columns
-- Enable Google Calendar-like time-based scheduling

-- Scheduled start datetime (for time-based events)
ALTER TABLE tasks ADD COLUMN scheduled_start_at DATETIME NULL;

-- Scheduled end datetime (for time-based events)
ALTER TABLE tasks ADD COLUMN scheduled_end_at DATETIME NULL;

-- All-day flag (true = no specific time, displayed in all-day section)
ALTER TABLE tasks ADD COLUMN is_all_day BOOLEAN DEFAULT TRUE;

-- Index for efficient calendar queries by date range
CREATE INDEX idx_tasks_schedule ON tasks (
    scheduled_start_at,
    scheduled_end_at
);