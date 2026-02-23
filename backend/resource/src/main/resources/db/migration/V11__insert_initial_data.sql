-- Insert initial task list
INSERT INTO tasklists (user_id, name, due_date)
VALUES ('google-oauth2|105332018281562180124', 'Initial Task List', CURDATE());

-- Get the ID of the inserted task list
SET @task_list_id = LAST_INSERT_ID();

-- Insert initial tasks
INSERT INTO tasks (task_list_id, user_id, title, status)
VALUES 
(@task_list_id, 'google-oauth2|105332018281562180124', 'First Task', 'PENDING'),
(@task_list_id, 'google-oauth2|105332018281562180124', 'Second Task', 'IN_PROGRESS');
