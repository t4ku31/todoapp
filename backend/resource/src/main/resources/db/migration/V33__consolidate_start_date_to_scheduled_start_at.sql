-- V32: Consolidate start_date into scheduled_start_at
-- Migrate existing startDate data to scheduledStartAt with isAllDay flag

-- Step 1: Migrate existing start_date to scheduled_start_at
-- Convert LocalDate to OffsetDateTime at midnight UTC
UPDATE tasks
SET
    scheduled_start_at = CONVERT_TZ(
        CONCAT(start_date, ' 00:00:00'),
        '+00:00',
        '+00:00'
    ),
    is_all_day = true
WHERE
    start_date IS NOT NULL
    AND scheduled_start_at IS NULL;

-- Step 2: Drop the start_date column
ALTER TABLE tasks DROP COLUMN start_date;

-- Step 3: Make scheduled_start_at NOT NULL (all tasks must have a start time)
-- First, set a default for any remaining NULL values (should not exist after migration)
UPDATE tasks
SET
    scheduled_start_at = NOW(),
    is_all_day = true
WHERE
    scheduled_start_at IS NULL;

-- Now make it NOT NULL
ALTER TABLE tasks MODIFY COLUMN scheduled_start_at DATETIME NOT NULL;