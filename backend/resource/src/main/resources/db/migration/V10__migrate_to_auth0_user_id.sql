-- V10: Migrate from local user table to Auth0 sub claim
-- This migration:
-- 1. Modifies tasklists.user_id to VARCHAR(255) for Auth0 sub
-- 2. Modifies tasks.user_id to VARCHAR(255) for Auth0 sub
-- 3. Drops the users table (no longer needed with Auth0)

-- Step 1: Drop foreign key constraints (ignore errors if they don't exist)
-- Note: MySQL doesn't support DROP FOREIGN KEY IF EXISTS, so we need to check manually
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- Drop tasklists foreign key (constraint name from V2__create_tasklists_table.sql)
ALTER TABLE tasklists DROP FOREIGN KEY tasklists_ibfk_1;

-- Drop tasks foreign key (constraint name from V3__create_tasks_table.sql)
ALTER TABLE tasks DROP FOREIGN KEY tasks_ibfk_1;
ALTER TABLE tasks DROP FOREIGN KEY tasks_ibfk_2;

-- Step 2: Modify user_id columns to VARCHAR(255) for Auth0 sub claim
-- Auth0 sub format: "auth0|1234567890" or "google-oauth2|1234567890"
ALTER TABLE tasklists 
    MODIFY COLUMN user_id VARCHAR(255) NOT NULL COMMENT 'Auth0 sub claim (e.g., auth0|123456)';

ALTER TABLE tasks 
    MODIFY COLUMN user_id VARCHAR(255) NOT NULL COMMENT 'Auth0 sub claim (e.g., auth0|123456)';

-- Step 3: Add indexes for performance
CREATE INDEX idx_tasklists_user_id ON tasklists(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Step 4: Drop the users table (Auth0 manages users now)
DROP TABLE IF EXISTS users;

-- Step 5: Drop the authorities table (Auth0 manages roles/permissions)
DROP TABLE IF EXISTS authorities;

-- Restore foreign key checks
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
