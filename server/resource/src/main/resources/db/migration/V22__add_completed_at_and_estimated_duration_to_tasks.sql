ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP DEFAULT NULL;

ALTER TABLE tasks
ADD COLUMN estimated_duration INT DEFAULT NULL COMMENT 'Estimated duration in minutes';