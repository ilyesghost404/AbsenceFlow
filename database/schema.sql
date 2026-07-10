-- ==========================================
-- AbsenceFlow Database Schema
-- PostgreSQL 18
-- ==========================================


-- =========================
-- Employees Table
-- =========================

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- Attendance Table
-- =========================

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(30) DEFAULT 'Present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employee_attendance
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE,

    CONSTRAINT unique_attendance_per_day
    UNIQUE(employee_id, date)
);


-- =========================
-- Absences Table
-- =========================

CREATE TABLE absences (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP,

    CONSTRAINT fk_employee
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
);


-- =========================
-- Public Holidays Table
-- =========================

CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);


-- =========================
-- Constraints
-- =========================

ALTER TABLE absences
ADD CONSTRAINT valid_absence_dates
CHECK (end_date >= start_date);

ALTER TABLE absences
ADD CONSTRAINT valid_status
CHECK (
    status IN (
        'Pending',
        'Validated',
        'Rejected'
    )
);

ALTER TABLE absences
ADD CONSTRAINT valid_absence_type
CHECK (
    type IN (
        'Vacation',
        'Sick Leave',
        'Training',
        'Other'
    )
);

-- =========================
-- Users Table
-- =========================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    employee_id INTEGER UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_employee
    FOREIGN KEY(employee_id)
    REFERENCES employees(id)
    ON DELETE SET NULL,

    CONSTRAINT chk_role
    CHECK (role IN ('admin', 'manager', 'employee'))
);


-- =========================
-- Login History Table
-- =========================

CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT TRUE,
    logout_time TIMESTAMP,

    CONSTRAINT fk_login_history_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


-- =========================
-- Activity Logs Table
-- =========================

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================
-- User Settings Table
-- =========================

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    absence_notifications BOOLEAN DEFAULT TRUE,
    approval_notifications BOOLEAN DEFAULT TRUE,
    holiday_notifications BOOLEAN DEFAULT TRUE,
    report_notifications BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'system',
    compact_mode BOOLEAN DEFAULT FALSE,
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
