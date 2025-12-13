-- MySQL Schema for 92HOST Deployment
-- Work Progress Tracker Database

-- Create database (run this in cPanel MySQL Databases)
-- Database name: worktracker_db
-- User: worktracker_user
-- Password: [your secure password]

-- Use the database
USE worktracker_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'main_branch', 'branch_user') NOT NULL,
    branch_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Annual plans table
CREATE TABLE annual_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Monthly plans table
CREATE TABLE monthly_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annual_plan_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (annual_plan_id) REFERENCES annual_plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_month_year (annual_plan_id, month, year)
);

-- Actions table
CREATE TABLE actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monthly_plan_id INT NOT NULL,
    action_number INT NOT NULL,
    action_title VARCHAR(500) NOT NULL,
    plan_activity DECIMAL(15,2) NOT NULL,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monthly_plan_id) REFERENCES monthly_plans(id) ON DELETE CASCADE
);

-- Monthly reports table
CREATE TABLE monthly_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monthly_plan_id INT NOT NULL,
    branch_user_id INT NOT NULL,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monthly_plan_id) REFERENCES monthly_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_report (monthly_plan_id, branch_user_id)
);

-- Action reports table
CREATE TABLE action_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_id INT NOT NULL,
    branch_user_id INT NOT NULL,
    actual_activity DECIMAL(15,2),
    notes TEXT,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_action_report (action_id, branch_user_id)
);

-- Insert admin user (password is 'password')
INSERT INTO users (username, password, role, branch_name, email) VALUES 
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPFvU5LIlG/HYduFkneXHIPjVQS..', 'admin', 'System Administration', 'admin@worktracker.com');

-- Insert main branch user (password is 'password')
INSERT INTO users (username, password, role, branch_name, email) VALUES 
('main_branch', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPFvU5LIlG/HYduFkneXHIPjVQS..', 'main_branch', 'Main Branch Office', 'main@worktracker.com');

-- Insert sample branch users (password is 'password')
INSERT INTO users (username, password, role, branch_name, email) VALUES 
('branch1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPFvU5LIlG/HYduFkneXHIPjVQS..', 'branch_user', 'Branch Office 1', 'branch1@worktracker.com'),
('branch2', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPFvU5LIlG/HYduFkneXHIPjVQS..', 'branch_user', 'Branch Office 2', 'branch2@worktracker.com'),
('branch3', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjPFvU5LIlG/HYduFkneXHIPjVQS..', 'branch_user', 'Branch Office 3', 'branch3@worktracker.com');

-- Show all users
SELECT id, username, role, branch_name, email FROM users;