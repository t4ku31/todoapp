-- Delete existing initial data as they are not associated with any user
DELETE FROM categories;

-- Add user_id column
ALTER TABLE categories ADD COLUMN user_id VARCHAR(255) NOT NULL;

-- Drop the existing unique constraint on name
-- MySQL automatically creates an index with the same name as the column for UNIQUE constraints
ALTER TABLE categories DROP INDEX name;

-- Add composite unique constraint for user_id and name
ALTER TABLE categories ADD CONSTRAINT uk_categories_user_id_name UNIQUE (user_id, name);
