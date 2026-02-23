-- Migration: Consolidate executionDate into startDate, remove endDate
-- executionDate data is migrated to start_date where start_date is NULL
-- endDate is removed as it's replaced by recurrenceRule.until

-- Step 1: Copy execution_date to start_date where start_date is null
UPDATE tasks
SET
    start_date = execution_date
WHERE
    start_date IS NULL
    AND execution_date IS NOT NULL;

-- Step 2: Drop execution_date column
ALTER TABLE tasks DROP COLUMN execution_date;

-- Step 3: Drop end_date column (replaced by recurrence_rule.until)
ALTER TABLE tasks DROP COLUMN end_date;