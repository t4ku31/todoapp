-- Create categories table
CREATE TABLE `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `color` VARCHAR(50) DEFAULT NULL
);

-- Add category_id to tasks table
ALTER TABLE `tasks` ADD COLUMN `category_id` BIGINT DEFAULT NULL;

-- Add foreign key constraint
ALTER TABLE `tasks` ADD CONSTRAINT `fk_tasks_category` 
FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

-- Insert default categories
INSERT INTO `categories` (`name`, `color`) VALUES 
('Work', '#3b82f6'), -- Blue
('Personal', '#10b981'), -- Emerald
('Shopping', '#f59e0b'), -- Amber
('Health', '#ef4444'), -- Red
('Learning', '#8b5cf6'); -- Violet
