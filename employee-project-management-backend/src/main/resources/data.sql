-- Smart Employee & Project Management System (EPMS) Seed Data (data.sql)

-- 1. Departments Seed Data
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES
(1, 'Engineering', 'ENG', 'Software engineering and technical development', NOW(), NOW()),
(2, 'Product', 'PRD', 'Product design, roadmap, and strategy', NOW(), NOW()),
(3, 'Design', 'DSG', 'UI/UX design and user experience research', NOW(), NOW()),
(4, 'Marketing', 'MKT', 'Brand growth and digital marketing', NOW(), NOW()),
(5, 'Human Resources', 'HR', 'Talent acquisition and employee engagement', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Default Administrator User (Email: admin@gmail.com, Password: Admin@123)
INSERT INTO users (id, first_name, last_name, email, phone, password, role, account_status, age, salary, created_at, updated_at) VALUES
(1, 'Administrator', 'User', 'admin@gmail.com', '9876543210', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymY0v86C1H47.E5uL5v5/2', 'ADMIN', 'APPROVED', 35, 120000.0, NOW(), NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email), account_status='APPROVED';

-- 3. Sample Employee Record (Alex Morgan)
INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, department, department_id, role, status, joining_date, salary, age, created_at, updated_at) VALUES
(1, 'EMP1001', 'Alex', 'Morgan', 'alex.morgan@company.com', '9876543211', 'Engineering', 1, 'Senior Full Stack Engineer', 'ACTIVE', '2023-01-15', 85000.0, 29, NOW(), NOW())
ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id);

-- 4. Sample Project (Smart Employee & Project System)
INSERT INTO projects (id, project_name, description, client, department, priority, status, start_date, end_date, created_at, updated_at) VALUES
(1, 'Smart Employee & Project System', 'Comprehensive enterprise portal for employee lifecycle, project allocations, and task tracking.', 'TechCorp Global', 'Engineering', 'HIGH', 'IN_PROGRESS', '2024-01-10', '2024-06-30', NOW(), NOW())
ON DUPLICATE KEY UPDATE project_name=VALUES(project_name);

-- 5. Assign Employee to Project
INSERT INTO project_employees (project_id, employee_id) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE project_id=VALUES(project_id);

-- 6. Sample Task (Spring Boot Security & JWT Architecture)
INSERT INTO tasks (id, task_title, description, priority, status, progress_percentage, due_date, remarks, employee_id, project_id, created_at, updated_at) VALUES
(1, 'Design Spring Boot Security & JWT Architecture', 'Implement stateless JWT token filter, password encoder, and auth controllers.', 'HIGH', 'COMPLETED', 100, CURRENT_DATE + INTERVAL 5 DAY, 'JWT authentication fully tested and verified.', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE task_title=VALUES(task_title);
