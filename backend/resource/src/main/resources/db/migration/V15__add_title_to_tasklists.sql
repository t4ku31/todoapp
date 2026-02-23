DROP PROCEDURE IF EXISTS AddTitleColumnIfNotExists;

DELIMITER $$
CREATE PROCEDURE AddTitleColumnIfNotExists()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tasklists'
        AND COLUMN_NAME = 'title'
    ) THEN
        ALTER TABLE tasklists ADD COLUMN title VARCHAR(255) NOT NULL;
    END IF;
END $$
DELIMITER ;

CALL AddTitleColumnIfNotExists();

DROP PROCEDURE AddTitleColumnIfNotExists;
