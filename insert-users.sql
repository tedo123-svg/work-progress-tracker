-- Delete existing users (if any)
DELETE FROM users;

-- Insert users with correct bcrypt hash for password "admin123"
-- Hash: $2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i

-- Main Branch Admin User
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'main_branch',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'main_branch',
    'Main Branch',
    'main@workprogress.com'
);

-- Branch User 1
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch1',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 1',
    'branch1@workprogress.com'
);

-- Branch User 2
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch2',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 2',
    'branch2@workprogress.com'
);

-- Branch User 3
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch3',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 3',
    'branch3@workprogress.com'
);

-- Branch User 4
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch4',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 4',
    'branch4@workprogress.com'
);

-- Branch User 5
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch5',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 5',
    'branch5@workprogress.com'
);

-- Branch User 6
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch6',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 6',
    'branch6@workprogress.com'
);

-- Branch User 7
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch7',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 7',
    'branch7@workprogress.com'
);

-- Branch User 8
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch8',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 8',
    'branch8@workprogress.com'
);

-- Branch User 9
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch9',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 9',
    'branch9@workprogress.com'
);

-- Branch User 10
INSERT INTO users (username, password, role, branch_name, email)
VALUES (
    'branch10',
    '$2a$10$4w/YwPZ.IoJJI3HwAjieSehSYNAhQbvLW5F0gd2KzQLtMNs9LH29i',
    'branch_user',
    'Branch 10',
    'branch10@workprogress.com'
);

-- Verify users were created
SELECT id, username, role, branch_name, email FROM users ORDER BY id;
